import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Ingredient } from './ingredient.entity';
import { Location } from './location.entity';

@Entity('inventory_movements')
export class InventoryMovement extends BaseEntity {
  @Column()
  type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Ingredient)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'ingredient_id' })
  ingredientId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'from_location_id' })
  fromLocation: Location;

  @Column({ name: 'from_location_id', nullable: true })
  fromLocationId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'to_location_id' })
  toLocation: Location;

  @Column({ name: 'to_location_id', nullable: true })
  toLocationId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;
}
