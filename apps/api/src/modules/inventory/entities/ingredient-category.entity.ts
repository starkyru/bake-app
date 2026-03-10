import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Ingredient } from './ingredient.entity';

@Entity('ingredient_categories')
export class IngredientCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Ingredient, (ing) => ing.ingredientCategory)
  ingredients: Ingredient[];
}
