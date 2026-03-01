import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeVersion } from './recipe-version.entity';

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

  @Column({ name: 'cost_per_unit', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPerUnit: number;

  @Column({ name: 'current_version', default: 1 })
  currentVersion: number;

  @Column({ nullable: true })
  instructions: string;

  @Column({ name: 'product_id', nullable: true })
  productId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => RecipeIngredient, ri => ri.recipe, { cascade: true, eager: true })
  ingredients: RecipeIngredient[];

  @OneToMany(() => RecipeVersion, rv => rv.recipe)
  versions: RecipeVersion[];
}
