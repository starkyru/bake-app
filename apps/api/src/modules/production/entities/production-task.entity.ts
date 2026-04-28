import { Entity, Column, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductionPlan } from './production-plan.entity';
import { ProductionBatch } from './production-batch.entity';
import { BatchConsumption } from './batch-consumption.entity';

@Entity('production_tasks')
export class ProductionTask extends BaseEntity {
  @Column({ name: 'planned_quantity', type: 'int' })
  plannedQuantity: number;

  @Column({ name: 'actual_yield', type: 'int', nullable: true })
  actualYield: number;

  @Column({ name: 'waste_quantity', type: 'int', default: 0 })
  wasteQuantity: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'scheduled_start', nullable: true })
  scheduledStart: Date;

  @Column({ name: 'scheduled_end', nullable: true })
  scheduledEnd: Date;

  @Column({ name: 'actual_start', nullable: true })
  actualStart: Date;

  @Column({ name: 'actual_end', nullable: true })
  actualEnd: Date;

  @Column({ name: 'recipe_id' })
  recipeId: string;

  @Column({ name: 'recipe_name', nullable: true })
  recipeName: string;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @Column({ name: 'assignee_name', nullable: true })
  assigneeName: string;

  @ManyToOne(() => ProductionPlan, plan => plan.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: ProductionPlan;

  @Column({ name: 'plan_id' })
  planId: string;

  @OneToOne(() => ProductionBatch, batch => batch.productionTask)
  producedBatch: ProductionBatch;

  @OneToMany(() => BatchConsumption, bc => bc.consumingTask)
  consumedBatches: BatchConsumption[];
}
