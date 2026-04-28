import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductionPlan } from './entities/production-plan.entity';
import { ProductionTask } from './entities/production-task.entity';
import { CreateProductionPlanDto, UpdateProductionPlanDto, UpdateTaskStatusDto } from './dto';
import { DOMAIN_EVENTS } from '../websocket/ws-events.constants';
import { ProductionBatchService } from './production-batch.service';
import { RecipesService } from '../recipes/recipes.service';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
    @InjectRepository(ProductionTask) private taskRepo: Repository<ProductionTask>,
    private eventEmitter: EventEmitter2,
    private batchService: ProductionBatchService,
    private recipesService: RecipesService,
  ) {}

  async findAll(date?: string, locationId?: string): Promise<ProductionPlan[]> {
    const qb = this.planRepo.createQueryBuilder('plan')
      .leftJoinAndSelect('plan.tasks', 'tasks');
    if (date) qb.where('plan.date = :date', { date });
    if (locationId) qb.andWhere('plan.locationId = :locationId', { locationId });
    qb.orderBy('plan.date', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<ProductionPlan> {
    const plan = await this.planRepo.findOne({ where: { id }, relations: ['tasks'] });
    if (!plan) throw new NotFoundException('Production plan not found');
    return plan;
  }

  async create(dto: CreateProductionPlanDto, userId?: string): Promise<ProductionPlan> {
    const plan = this.planRepo.create({
      date: new Date(dto.date),
      locationId: dto.locationId,
      notes: dto.notes,
      createdById: userId,
      tasks: dto.tasks?.map(t => this.taskRepo.create(t)),
    });
    return this.planRepo.save(plan);
  }

  async update(id: string, dto: UpdateProductionPlanDto): Promise<ProductionPlan> {
    const plan = await this.findOne(id);
    Object.assign(plan, {
      ...(dto.date && { date: new Date(dto.date) }),
      ...(dto.status && { status: dto.status }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });
    return this.planRepo.save(plan);
  }

  async delete(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }

  async updateTaskStatus(taskId: string, dto: UpdateTaskStatusDto): Promise<ProductionTask & { producedBatch?: any }> {
    const task = await this.taskRepo.findOne({ where: { id: taskId }, relations: ['plan'] });
    if (!task) throw new NotFoundException('Task not found');
    task.status = dto.status;
    if (dto.status === 'in_progress' && !task.actualStart) task.actualStart = new Date();
    if (dto.status === 'completed') task.actualEnd = new Date();
    if (dto.actualYield !== undefined) task.actualYield = dto.actualYield;
    if (dto.wasteQuantity !== undefined) task.wasteQuantity = dto.wasteQuantity;
    const savedTask = await this.taskRepo.save(task);

    let producedBatch = null;

    // Create production batch when task completes with actual yield
    if (dto.status === 'completed' && (task.actualYield || task.plannedQuantity) > 0) {
      try {
        const recipe = await this.recipesService.findOne(task.recipeId, true);
        const locationId = dto.locationId || task.plan?.locationId;

        if (locationId) {
          producedBatch = await this.batchService.createFromTask(
            savedTask,
            recipe,
            locationId,
            dto.storageCondition,
          );

          // Auto-consume sub-recipe batches
          if (recipe.subRecipes?.length) {
            const consumedBatchIds: string[] = [];
            for (const sr of recipe.subRecipes) {
              const scale = (task.actualYield || task.plannedQuantity) / Number(recipe.yieldQuantity || 1);
              const quantityNeeded = Number(sr.quantity) * scale;
              const consumptions = dto.batchConsumptions
                ? await this.handleManualConsumptions(dto.batchConsumptions, savedTask.id)
                : await this.batchService.autoConsumeFIFO(
                    sr.subRecipeId,
                    quantityNeeded,
                    sr.unit,
                    savedTask.id,
                    locationId,
                  );
              for (const c of consumptions) {
                consumedBatchIds.push(c.productionBatchId);
              }
            }

            // Update composite expiry based on consumed batches
            if (consumedBatchIds.length > 0) {
              await this.batchService.updateCompositeExpiry(producedBatch.id, consumedBatchIds);
            }
          }
        }
      } catch (error) {
        console.error('Failed to create production batch:', error.message);
      }
    }

    this.eventEmitter.emit(DOMAIN_EVENTS.PRODUCTION_TASK_UPDATED, {
      taskId: savedTask.id,
      planId: savedTask.planId,
      recipeName: savedTask.recipeName,
      status: savedTask.status,
      actualYield: savedTask.actualYield,
      wasteQuantity: savedTask.wasteQuantity,
      batchId: producedBatch?.id,
    });

    return { ...savedTask, producedBatch };
  }

  private async handleManualConsumptions(
    consumptions: { batchId: string; quantity: number }[],
    taskId: string,
  ) {
    const results = [];
    for (const c of consumptions) {
      const result = await this.batchService.manualConsume(c.batchId, c.quantity, taskId);
      results.push(result);
    }
    return results;
  }
}
