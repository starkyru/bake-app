import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { IngredientPackage } from './ingredient-package.entity';

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

  @Column({ nullable: true })
  category: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => IngredientPackage, (pkg) => pkg.ingredient, { cascade: true, eager: true })
  packages: IngredientPackage[];
}
