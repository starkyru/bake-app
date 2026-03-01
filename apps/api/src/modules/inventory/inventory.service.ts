import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Location } from './entities/location.entity';
import { CreateIngredientDto, UpdateIngredientDto, CreateLocationDto, UpdateLocationDto, DeliveryDto, WriteOffDto, TransferDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Ingredient) private ingredientRepo: Repository<Ingredient>,
    @InjectRepository(InventoryItem) private inventoryItemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryBatch) private batchRepo: Repository<InventoryBatch>,
    @InjectRepository(InventoryMovement) private movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Location) private locationRepo: Repository<Location>,
  ) {}

  // Ingredients
  async findAllIngredients(query: PaginationDto): Promise<PaginatedResponseDto<Ingredient>> {
    const { page, limit, search } = query;
    const qb = this.ingredientRepo.createQueryBuilder('i');
    if (search) qb.where('i.name ILIKE :search', { search: `%${search}%` });
    qb.orderBy('i.name', 'ASC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async createIngredient(dto: CreateIngredientDto): Promise<Ingredient> {
    return this.ingredientRepo.save(this.ingredientRepo.create(dto));
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findOne({ where: { id } });
    if (!ingredient) throw new NotFoundException('Ingredient not found');
    Object.assign(ingredient, dto);
    return this.ingredientRepo.save(ingredient);
  }

  async deleteIngredient(id: string): Promise<void> {
    const ingredient = await this.ingredientRepo.findOne({ where: { id } });
    if (!ingredient) throw new NotFoundException('Ingredient not found');
    await this.ingredientRepo.remove(ingredient);
  }

  // Locations
  async findAllLocations(): Promise<Location[]> {
    return this.locationRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async createLocation(dto: CreateLocationDto): Promise<Location> {
    return this.locationRepo.save(this.locationRepo.create(dto));
  }

  async updateLocation(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    Object.assign(location, dto);
    return this.locationRepo.save(location);
  }

  // Stock levels
  async getStockLevels(locationId?: string): Promise<InventoryItem[]> {
    const qb = this.inventoryItemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.ingredient', 'ingredient')
      .leftJoinAndSelect('item.location', 'location');
    if (locationId) qb.where('item.locationId = :locationId', { locationId });
    return qb.getMany();
  }

  // Delivery
  async processDelivery(dto: DeliveryDto, userId?: string): Promise<InventoryMovement> {
    let item = await this.inventoryItemRepo.findOne({
      where: { ingredientId: dto.ingredientId, locationId: dto.locationId },
    });
    if (item) {
      item.quantity = Number(item.quantity) + dto.quantity;
    } else {
      item = this.inventoryItemRepo.create({
        ingredientId: dto.ingredientId,
        locationId: dto.locationId,
        quantity: dto.quantity,
        status: 'in_stock',
      });
    }
    await this.updateItemStatus(item);
    await this.inventoryItemRepo.save(item);

    if (dto.batchNumber) {
      await this.batchRepo.save(this.batchRepo.create({
        batchNumber: dto.batchNumber,
        quantity: dto.quantity,
        ingredientId: dto.ingredientId,
        locationId: dto.locationId,
      }));
    }

    return this.movementRepo.save(this.movementRepo.create({
      type: 'delivery',
      quantity: dto.quantity,
      unitCost: dto.unitCost,
      notes: dto.notes,
      ingredientId: dto.ingredientId,
      toLocationId: dto.locationId,
      userId,
    }));
  }

  // Write-off
  async processWriteOff(dto: WriteOffDto, userId?: string): Promise<InventoryMovement> {
    const item = await this.inventoryItemRepo.findOne({
      where: { ingredientId: dto.ingredientId, locationId: dto.locationId },
    });
    if (!item || Number(item.quantity) < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }
    item.quantity = Number(item.quantity) - dto.quantity;
    await this.updateItemStatus(item);
    await this.inventoryItemRepo.save(item);

    return this.movementRepo.save(this.movementRepo.create({
      type: 'write_off',
      quantity: dto.quantity,
      notes: dto.reason,
      ingredientId: dto.ingredientId,
      fromLocationId: dto.locationId,
      userId,
    }));
  }

  // Transfer
  async processTransfer(dto: TransferDto, userId?: string): Promise<InventoryMovement> {
    const fromItem = await this.inventoryItemRepo.findOne({
      where: { ingredientId: dto.ingredientId, locationId: dto.fromLocationId },
    });
    if (!fromItem || Number(fromItem.quantity) < dto.quantity) {
      throw new BadRequestException('Insufficient stock at source location');
    }
    fromItem.quantity = Number(fromItem.quantity) - dto.quantity;
    await this.updateItemStatus(fromItem);
    await this.inventoryItemRepo.save(fromItem);

    let toItem = await this.inventoryItemRepo.findOne({
      where: { ingredientId: dto.ingredientId, locationId: dto.toLocationId },
    });
    if (toItem) {
      toItem.quantity = Number(toItem.quantity) + dto.quantity;
    } else {
      toItem = this.inventoryItemRepo.create({
        ingredientId: dto.ingredientId,
        locationId: dto.toLocationId,
        quantity: dto.quantity,
        status: 'in_stock',
      });
    }
    await this.updateItemStatus(toItem);
    await this.inventoryItemRepo.save(toItem);

    return this.movementRepo.save(this.movementRepo.create({
      type: 'transfer',
      quantity: dto.quantity,
      notes: dto.notes,
      ingredientId: dto.ingredientId,
      fromLocationId: dto.fromLocationId,
      toLocationId: dto.toLocationId,
      userId,
    }));
  }

  private async updateItemStatus(item: InventoryItem): Promise<void> {
    const ingredient = await this.ingredientRepo.findOne({ where: { id: item.ingredientId } });
    if (!ingredient) return;
    if (Number(item.quantity) <= 0) {
      item.status = 'out_of_stock';
    } else if (Number(item.quantity) <= Number(ingredient.minStockLevel)) {
      item.status = 'low_stock';
    } else {
      item.status = 'in_stock';
    }
  }
}
