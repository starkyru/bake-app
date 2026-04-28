import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Recipe } from './recipe.entity';
import { StorageCondition } from '../../inventory/entities/storage-condition.entity';

@Entity('recipe_storage_lives')
@Unique(['recipeId', 'storageConditionId'])
export class RecipeStorageLife extends BaseEntity {
  @ManyToOne(() => Recipe, recipe => recipe.storageLives, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @Column({ name: 'recipe_id' })
  recipeId: string;

  @ManyToOne(() => StorageCondition, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'storage_condition_id' })
  storageCondition: StorageCondition;

  @Column({ name: 'storage_condition_id' })
  storageConditionId: string;

  @Column({ name: 'shelf_life_hours', type: 'decimal', precision: 10, scale: 2 })
  shelfLifeHours: number;
}
