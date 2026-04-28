import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { ProductionTask } from './production-task.entity';
import { Location } from '../../inventory/entities/location.entity';
import { BatchConsumption } from './batch-consumption.entity';

@Entity('production_batches')
export class ProductionBatch extends BaseEntity {
  @Column({ name: 'batch_number', unique: true })
  batchNumber: string;

  @ManyToOne(() => Recipe, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @Index()
  @Column({ name: 'recipe_id' })
  recipeId: string;

  @Column({ name: 'recipe_name' })
  recipeName: string;

  @OneToOne(() => ProductionTask, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'production_task_id' })
  productionTask: ProductionTask;

  @Column({ name: 'production_task_id', nullable: true })
  productionTaskId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Index()
  @Column({ name: 'location_id' })
  locationId: string;

  @Column({ name: 'storage_condition', nullable: true })
  storageCondition: string;

  @Column({ name: 'produced_quantity', type: 'decimal', precision: 10, scale: 3 })
  producedQuantity: number;

  @Column({ name: 'remaining_quantity', type: 'decimal', precision: 10, scale: 3 })
  remainingQuantity: number;

  @Column()
  unit: string;

  @Column({ name: 'production_date', type: 'timestamp' })
  productionDate: Date;

  @Index()
  @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
  expiryDate: Date;

  @Column({ name: 'composite_expiry_date', type: 'timestamp', nullable: true })
  compositeExpiryDate: Date;

  @Column({ default: 'available' })
  status: string;

  @Column({ name: 'cost_per_unit', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPerUnit: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'produced_by_id', nullable: true })
  producedById: string;

  @OneToMany(() => BatchConsumption, bc => bc.productionBatch)
  consumptions: BatchConsumption[];
}
