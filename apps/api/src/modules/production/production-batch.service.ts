import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import BigNumber from 'bignumber.js';
import { ProductionBatch } from './entities/production-batch.entity';
import { BatchConsumption } from './entities/batch-consumption.entity';
import { ProductionTask } from './entities/production-task.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { DOMAIN_EVENTS } from '../websocket/ws-events.constants';
import { CreateProductionBatchDto, DiscardBatchDto, TransferBatchDto, ConsumeBatchDto } from './dto';

@Injectable()
export class ProductionBatchService {
  constructor(
    @InjectRepository(ProductionBatch) private batchRepo: Repository<ProductionBatch>,
    @InjectRepository(BatchConsumption) private consumptionRepo: Repository<BatchConsumption>,
    @InjectRepository(ProductionTask) private taskRepo: Repository<ProductionTask>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(filters: {
    recipeId?: string;
    locationId?: string;
    status?: string;
    expiringBefore?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ProductionBatch[]; total: number }> {
    const qb = this.batchRepo.createQueryBuilder('b');
    if (filters.recipeId) qb.andWhere('b.recipeId = :recipeId', { recipeId: filters.recipeId });
    if (filters.locationId) qb.andWhere('b.locationId = :locationId', { locationId: filters.locationId });
    if (filters.status) qb.andWhere('b.status = :status', { status: filters.status });
    if (filters.expiringBefore) {
      qb.andWhere('b.expiryDate <= :before', { before: filters.expiringBefore });
      qb.andWhere('b.status IN (:...activeStatuses)', { activeStatuses: ['available', 'partially_consumed'] });
    }
    qb.orderBy('b.productionDate', 'DESC');
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<ProductionBatch> {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: ['consumptions'],
    });
    if (!batch) throw new NotFoundException('Production batch not found');
    return batch;
  }

  async create(dto: CreateProductionBatchDto, recipeEntity: Recipe, userId?: string): Promise<ProductionBatch> {
    const batchNumber = await this.generateBatchNumber();
    const productionDate = dto.productionDate ? new Date(dto.productionDate) : new Date();
    const expiryDate = this.computeExpiryDate(recipeEntity, productionDate, dto.storageCondition);

    const batch = this.batchRepo.create({
      batchNumber,
      recipeId: dto.recipeId,
      recipeName: recipeEntity.name,
      locationId: dto.locationId,
      storageCondition: dto.storageCondition,
      producedQuantity: dto.producedQuantity,
      remainingQuantity: dto.producedQuantity,
      unit: dto.unit,
      productionDate,
      expiryDate,
      compositeExpiryDate: expiryDate,
      status: 'available',
      notes: dto.notes,
      producedById: userId,
    });

    const saved = await this.batchRepo.save(batch);
    this.eventEmitter.emit(DOMAIN_EVENTS.BATCH_CREATED, {
      batchId: saved.id,
      batchNumber: saved.batchNumber,
      recipeName: saved.recipeName,
      locationId: saved.locationId,
    });
    return saved;
  }

  async createFromTask(
    task: ProductionTask,
    recipe: Recipe,
    locationId: string,
    storageCondition?: string,
    userId?: string,
  ): Promise<ProductionBatch> {
    const batchNumber = await this.generateBatchNumber();
    const productionDate = new Date();
    const expiryDate = this.computeExpiryDate(recipe, productionDate, storageCondition);

    const batch = this.batchRepo.create({
      batchNumber,
      recipeId: task.recipeId,
      recipeName: task.recipeName || recipe.name,
      productionTaskId: task.id,
      locationId,
      storageCondition,
      producedQuantity: task.actualYield || task.plannedQuantity,
      remainingQuantity: task.actualYield || task.plannedQuantity,
      unit: recipe.yieldUnit,
      productionDate,
      expiryDate,
      compositeExpiryDate: expiryDate,
      status: 'available',
      producedById: userId,
    });

    const saved = await this.batchRepo.save(batch);
    this.eventEmitter.emit(DOMAIN_EVENTS.BATCH_CREATED, {
      batchId: saved.id,
      batchNumber: saved.batchNumber,
      recipeName: saved.recipeName,
      locationId: saved.locationId,
    });
    return saved;
  }

  async autoConsumeFIFO(
    recipeId: string,
    quantityNeeded: number,
    unit: string,
    consumingTaskId: string,
    locationId: string,
  ): Promise<BatchConsumption[]> {
    const batches = await this.batchRepo.find({
      where: {
        recipeId,
        locationId,
        status: In(['available', 'partially_consumed']),
      },
      order: { productionDate: 'ASC' },
    });

    let remaining = new BigNumber(quantityNeeded);
    const consumptions: BatchConsumption[] = [];

    for (const batch of batches) {
      if (remaining.lte(0)) break;
      const available = new BigNumber(batch.remainingQuantity);
      const toConsume = BigNumber.min(remaining, available);

      batch.remainingQuantity = available.minus(toConsume).toNumber();
      batch.status = batch.remainingQuantity <= 0 ? 'fully_consumed' : 'partially_consumed';
      await this.batchRepo.save(batch);

      const consumption = await this.consumptionRepo.save(this.consumptionRepo.create({
        productionBatchId: batch.id,
        consumingTaskId,
        quantityConsumed: toConsume.toNumber(),
        unit,
        isManualOverride: false,
      }));
      consumptions.push(consumption);
      remaining = remaining.minus(toConsume);
    }

    if (remaining.gt(0)) {
      // Not enough stock - log warning but don't block production
      console.warn(`Insufficient batch stock for recipe ${recipeId}: needed ${quantityNeeded}, short by ${remaining.toNumber()}`);
    }

    return consumptions;
  }

  async manualConsume(
    batchId: string,
    quantity: number,
    consumingTaskId: string,
  ): Promise<BatchConsumption> {
    const batch = await this.findOne(batchId);
    if (batch.status === 'fully_consumed' || batch.status === 'discarded' || batch.status === 'expired') {
      throw new BadRequestException(`Cannot consume batch with status '${batch.status}'`);
    }
    if (new BigNumber(batch.remainingQuantity).lt(quantity)) {
      throw new BadRequestException(`Insufficient quantity. Available: ${batch.remainingQuantity}, requested: ${quantity}`);
    }

    batch.remainingQuantity = new BigNumber(batch.remainingQuantity).minus(quantity).toNumber();
    batch.status = batch.remainingQuantity <= 0 ? 'fully_consumed' : 'partially_consumed';
    await this.batchRepo.save(batch);

    return this.consumptionRepo.save(this.consumptionRepo.create({
      productionBatchId: batchId,
      consumingTaskId,
      quantityConsumed: quantity,
      unit: batch.unit,
      isManualOverride: true,
    }));
  }

  async consumeBatch(id: string, dto: ConsumeBatchDto): Promise<BatchConsumption> {
    const batch = await this.findOne(id);
    if (!['available', 'partially_consumed'].includes(batch.status)) {
      throw new BadRequestException(`Cannot consume batch with status '${batch.status}'`);
    }
    if (new BigNumber(batch.remainingQuantity).lt(dto.quantity)) {
      throw new BadRequestException(`Insufficient quantity. Available: ${batch.remainingQuantity}`);
    }

    batch.remainingQuantity = new BigNumber(batch.remainingQuantity).minus(dto.quantity).toNumber();
    batch.status = batch.remainingQuantity <= 0 ? 'fully_consumed' : 'partially_consumed';
    await this.batchRepo.save(batch);

    return this.consumptionRepo.save(this.consumptionRepo.create({
      productionBatchId: id,
      consumingTaskId: dto.consumingTaskId || null,
      quantityConsumed: dto.quantity,
      unit: batch.unit,
      isManualOverride: true,
    }));
  }

  async discardBatch(id: string, dto: DiscardBatchDto, userId?: string): Promise<ProductionBatch> {
    const batch = await this.findOne(id);
    if (batch.status === 'fully_consumed' || batch.status === 'discarded') {
      throw new BadRequestException(`Cannot discard batch with status '${batch.status}'`);
    }
    if (new BigNumber(dto.quantity).gt(batch.remainingQuantity)) {
      throw new BadRequestException(`Cannot discard ${dto.quantity}, only ${batch.remainingQuantity} remaining`);
    }

    batch.remainingQuantity = new BigNumber(batch.remainingQuantity).minus(dto.quantity).toNumber();
    batch.status = batch.remainingQuantity <= 0 ? 'discarded' : batch.status;
    batch.notes = [batch.notes, `Discarded ${dto.quantity} ${batch.unit}: ${dto.reason}`].filter(Boolean).join(' | ');
    const saved = await this.batchRepo.save(batch);

    this.eventEmitter.emit(DOMAIN_EVENTS.BATCH_DISCARDED, {
      batchId: saved.id,
      batchNumber: saved.batchNumber,
      recipeName: saved.recipeName,
      quantity: dto.quantity,
      reason: dto.reason,
    });

    return saved;
  }

  async transferBatch(id: string, dto: TransferBatchDto): Promise<ProductionBatch> {
    const batch = await this.findOne(id);
    if (!['available', 'partially_consumed'].includes(batch.status)) {
      throw new BadRequestException(`Cannot transfer batch with status '${batch.status}'`);
    }

    batch.locationId = dto.toLocationId;
    if (dto.storageCondition) batch.storageCondition = dto.storageCondition;
    return this.batchRepo.save(batch);
  }

  async getExpiringSoon(hours: number, locationId?: string): Promise<ProductionBatch[]> {
    const threshold = new Date(Date.now() + hours * 60 * 60 * 1000);
    const qb = this.batchRepo.createQueryBuilder('b')
      .where('b.status IN (:...statuses)', { statuses: ['available', 'partially_consumed'] })
      .andWhere('b.expiryDate IS NOT NULL')
      .andWhere('b.expiryDate <= :threshold', { threshold: threshold.toISOString() })
      .orderBy('b.expiryDate', 'ASC');
    if (locationId) qb.andWhere('b.locationId = :locationId', { locationId });
    return qb.getMany();
  }

  async getAvailableForRecipe(recipeId: string, locationId?: string): Promise<ProductionBatch[]> {
    const qb = this.batchRepo.createQueryBuilder('b')
      .where('b.recipeId = :recipeId', { recipeId })
      .andWhere('b.status IN (:...statuses)', { statuses: ['available', 'partially_consumed'] })
      .orderBy('b.productionDate', 'ASC');
    if (locationId) qb.andWhere('b.locationId = :locationId', { locationId });
    return qb.getMany();
  }

  calculateCompositeExpiry(consumedBatches: ProductionBatch[], ownExpiry: Date | null): Date | null {
    const dates: Date[] = [];
    if (ownExpiry) dates.push(ownExpiry);
    for (const batch of consumedBatches) {
      if (batch.expiryDate) dates.push(new Date(batch.expiryDate));
      if (batch.compositeExpiryDate) dates.push(new Date(batch.compositeExpiryDate));
    }
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }

  async updateCompositeExpiry(batchId: string, consumedBatchIds: string[]): Promise<void> {
    const batch = await this.findOne(batchId);
    const consumedBatches = consumedBatchIds.length > 0
      ? await this.batchRepo.find({ where: { id: In(consumedBatchIds) } })
      : [];
    batch.compositeExpiryDate = this.calculateCompositeExpiry(consumedBatches, batch.expiryDate);
    await this.batchRepo.save(batch);
  }

  async getStats(locationId?: string): Promise<{
    active: number;
    fresh: number;
    expiringSoon: number;
    expired: number;
  }> {
    const qb = this.batchRepo.createQueryBuilder('b');
    if (locationId) qb.where('b.locationId = :locationId', { locationId });

    const now = new Date();
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const all = await qb.getMany();
    const active = all.filter(b => ['available', 'partially_consumed'].includes(b.status));

    return {
      active: active.length,
      fresh: active.filter(b => !b.expiryDate || new Date(b.expiryDate) > in24h).length,
      expiringSoon: active.filter(b => b.expiryDate && new Date(b.expiryDate) <= in24h && new Date(b.expiryDate) > now).length,
      expired: all.filter(b => b.status === 'expired' || (b.expiryDate && new Date(b.expiryDate) <= now && ['available', 'partially_consumed'].includes(b.status))).length,
    };
  }

  private computeExpiryDate(
    recipe: Recipe,
    productionDate: Date,
    storageCondition?: string,
  ): Date | null {
    let shelfLifeHours: number | null = null;

    if (storageCondition === 'room_temp' && recipe.roomTempHours) {
      shelfLifeHours = Number(recipe.roomTempHours);
    } else if (storageCondition === 'refrigerated' && recipe.refrigeratedHours) {
      shelfLifeHours = Number(recipe.refrigeratedHours);
    } else if (storageCondition === 'frozen' && recipe.frozenHours) {
      shelfLifeHours = Number(recipe.frozenHours);
    } else if (recipe.refrigeratedHours) {
      shelfLifeHours = Number(recipe.refrigeratedHours);
    } else if (recipe.roomTempHours) {
      shelfLifeHours = Number(recipe.roomTempHours);
    } else if (recipe.frozenHours) {
      shelfLifeHours = Number(recipe.frozenHours);
    }

    // Check custom storage lives
    if (!shelfLifeHours && storageCondition && recipe.storageLives?.length) {
      const custom = recipe.storageLives.find(
        sl => sl.storageCondition?.name === storageCondition,
      );
      if (custom) shelfLifeHours = Number(custom.shelfLifeHours);
    }

    if (!shelfLifeHours) return null;
    return new Date(productionDate.getTime() + shelfLifeHours * 60 * 60 * 1000);
  }

  private async generateBatchNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PB-${dateStr}-`;

    const latest = await this.batchRepo
      .createQueryBuilder('b')
      .where('b.batchNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('b.batchNumber', 'DESC')
      .getOne();

    let seq = 1;
    if (latest) {
      const lastSeq = parseInt(latest.batchNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(3, '0')}`;
  }
}
