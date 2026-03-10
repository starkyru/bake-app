import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { IngredientPackage } from './ingredient-package.entity';
import { IngredientCategory } from './ingredient-category.entity';

@Entity('ingredients')
export class Ingredient extends BaseEntity {
  @Column()
  name: string;

  @Column()
  unit: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'cost_per_unit', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPerUnit: number;

  @Column({ name: 'min_stock_level', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minStockLevel: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  calories: number;

  @Column({ nullable: true })
  category: string;

  @ManyToOne(() => IngredientCategory, (cat) => cat.ingredients, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  ingredientCategory: IngredientCategory;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => IngredientPackage, (pkg) => pkg.ingredient, { cascade: true, eager: true })
  packages: IngredientPackage[];
}
