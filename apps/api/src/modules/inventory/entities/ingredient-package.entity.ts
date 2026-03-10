import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Ingredient } from './ingredient.entity';

@Entity('ingredient_packages')
export class IngredientPackage extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  size: number;

  @Column()
  unit: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'ingredient_id' })
  ingredientId: string;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.packages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;
}
