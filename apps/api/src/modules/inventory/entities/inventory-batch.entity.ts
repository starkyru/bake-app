import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Ingredient } from './ingredient.entity';
import { Location } from './location.entity';

@Entity('inventory_batches')
export class InventoryBatch extends BaseEntity {
  @Column({ name: 'batch_number', nullable: true })
  batchNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @ManyToOne(() => Ingredient)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'ingredient_id' })
  ingredientId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id' })
  locationId: string;
}
