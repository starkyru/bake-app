import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductionBatch } from './production-batch.entity';
import { ProductionTask } from './production-task.entity';

@Entity('batch_consumptions')
export class BatchConsumption extends BaseEntity {
  @ManyToOne(() => ProductionBatch, batch => batch.consumptions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'production_batch_id' })
  productionBatch: ProductionBatch;

  @Index()
  @Column({ name: 'production_batch_id' })
  productionBatchId: string;

  @ManyToOne(() => ProductionTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consuming_task_id' })
  consumingTask: ProductionTask;

  @Index()
  @Column({ name: 'consuming_task_id' })
  consumingTaskId: string;

  @Column({ name: 'quantity_consumed', type: 'decimal', precision: 10, scale: 3 })
  quantityConsumed: number;

  @Column()
  unit: string;

  @Column({ name: 'is_manual_override', default: false })
  isManualOverride: boolean;
}
