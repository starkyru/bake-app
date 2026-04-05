import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Category } from './category.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { Ingredient } from '../../inventory/entities/ingredient.entity';
import { ProductOptionGroup } from './product-option-group.entity';

@Entity('products')
export class Product extends BaseEntity {
  @OneToMany(() => ProductOptionGroup, (group) => group.product, { cascade: true })
  optionGroups: ProductOptionGroup[];

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  sku: string;

  @Column({ default: 'produced' })
  type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPrice: number;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @ManyToOne(() => Recipe, { nullable: true, eager: false })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @Column({ name: 'recipe_id', nullable: true })
  recipeId: string;

  @ManyToOne(() => Ingredient, { nullable: true, eager: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'ingredient_id', nullable: true })
  ingredientId: string;
}
