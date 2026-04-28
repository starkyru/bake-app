import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_sub_recipes')
@Unique(['parentRecipeId', 'subRecipeId'])
export class RecipeSubRecipe extends BaseEntity {
  @ManyToOne(() => Recipe, recipe => recipe.subRecipes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_recipe_id' })
  parentRecipe: Recipe;

  @Column({ name: 'parent_recipe_id' })
  parentRecipeId: string;

  @ManyToOne(() => Recipe, recipe => recipe.usedInRecipes, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'sub_recipe_id' })
  subRecipe: Recipe;

  @Index()
  @Column({ name: 'sub_recipe_id' })
  subRecipeId: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ default: 'batches' })
  unit: string;

  @Column({ nullable: true })
  note: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
