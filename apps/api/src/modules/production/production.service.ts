import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductionPlan } from './entities/production-plan.entity';
import { ProductionTask } from './entities/production-task.entity';
import { CreateProductionPlanDto, UpdateProductionPlanDto, UpdateTaskStatusDto } from './dto';
import { DOMAIN_EVENTS } from '../websocket/ws-events.constants';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
    @InjectRepository(ProductionTask) private taskRepo: Repository<ProductionTask>,
    private eventEmitter: EventEmitter2,
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

  async updateTaskStatus(taskId: string, dto: UpdateTaskStatusDto): Promise<ProductionTask> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    task.status = dto.status;
    if (dto.status === 'in_progress' && !task.actualStart) task.actualStart = new Date();
    if (dto.status === 'completed') task.actualEnd = new Date();
    if (dto.actualYield !== undefined) task.actualYield = dto.actualYield;
    if (dto.wasteQuantity !== undefined) task.wasteQuantity = dto.wasteQuantity;
    const savedTask = await this.taskRepo.save(task);
    this.eventEmitter.emit(DOMAIN_EVENTS.PRODUCTION_TASK_UPDATED, {
      taskId: savedTask.id,
      planId: savedTask.planId,
      recipeName: savedTask.recipeName,
      status: savedTask.status,
      actualYield: savedTask.actualYield,
      wasteQuantity: savedTask.wasteQuantity,
    });
    return savedTask;
  }
}
