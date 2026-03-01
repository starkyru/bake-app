import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_versions')
export class RecipeVersion extends BaseEntity {
  @Column({ name: 'version_number' })
  versionNumber: number;

  @Column({ name: 'ingredients_snapshot', type: 'jsonb', default: [] })
  ingredientsSnapshot: any[];

  @Column({ name: 'instructions_snapshot', type: 'text', nullable: true })
  instructionsSnapshot: string;

  @Column({ name: 'changed_by_id', nullable: true })
  changedById: string;

  @Column({ name: 'change_notes', nullable: true })
  changeNotes: string;

  @ManyToOne(() => Recipe, recipe => recipe.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @Column({ name: 'recipe_id' })
  recipeId: string;
}
