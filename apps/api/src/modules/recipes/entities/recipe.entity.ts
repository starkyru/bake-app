import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeImage } from './recipe-image.entity';
import { RecipeLink } from './recipe-link.entity';
import { RecipeVersion } from './recipe-version.entity';
import { RecipeSubRecipe } from './recipe-sub-recipe.entity';
import { RecipeStorageLife } from './recipe-storage-life.entity';

@Entity('recipes')
export class Recipe extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ name: 'yield_quantity', type: 'decimal', precision: 10, scale: 2, default: 1 })
  yieldQuantity: number;

  @Column({ name: 'yield_unit', default: 'pcs' })
  yieldUnit: string;

  @Column({ name: 'current_version', default: 1 })
  currentVersion: number;

  @Column({ nullable: true })
  instructions: string;

  @Column({ name: 'product_id', nullable: true })
  productId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'room_temp_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  roomTempHours: number;

  @Column({ name: 'refrigerated_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refrigeratedHours: number;

  @Column({ name: 'frozen_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  frozenHours: number;

  @Column({ name: 'thawed_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  thawedHours: number;

  @OneToMany(() => RecipeIngredient, ri => ri.recipe, { cascade: true, eager: true })
  ingredients: RecipeIngredient[];

  @OneToMany(() => RecipeImage, img => img.recipe, { cascade: true, eager: true })
  images: RecipeImage[];

  @OneToMany(() => RecipeLink, rl => rl.recipe, { cascade: true, eager: true })
  links: RecipeLink[];

  @OneToMany(() => RecipeVersion, rv => rv.recipe)
  versions: RecipeVersion[];

  @OneToMany(() => RecipeSubRecipe, rsr => rsr.parentRecipe, { cascade: true })
  subRecipes: RecipeSubRecipe[];

  @OneToMany(() => RecipeSubRecipe, rsr => rsr.subRecipe)
  usedInRecipes: RecipeSubRecipe[];

  @OneToMany(() => RecipeStorageLife, rsl => rsl.recipe, { cascade: true })
  storageLives: RecipeStorageLife[];
}
