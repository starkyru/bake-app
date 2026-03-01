import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_ingredients')
export class RecipeIngredient extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ default: 'g' })
  unit: string;

  @Column({ name: 'ingredient_id' })
  ingredientId: string;

  @Column({ name: 'ingredient_name', nullable: true })
  ingredientName: string;

  @Column({ name: 'cost_per_unit', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPerUnit: number;

  @ManyToOne(() => Recipe, recipe => recipe.ingredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @Column({ name: 'recipe_id' })
  recipeId: string;
}
