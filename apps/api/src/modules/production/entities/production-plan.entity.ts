import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductionTask } from './production-task.entity';

@Entity('production_plans')
export class ProductionPlan extends BaseEntity {
  @Column({ type: 'date' })
  date: Date;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'location_id', nullable: true })
  locationId: string;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: string;

  @OneToMany(() => ProductionTask, task => task.plan, { cascade: true, eager: true })
  tasks: ProductionTask[];
}
