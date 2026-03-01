import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Category } from './category.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  sku: string;

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

  @Column({ name: 'recipe_id', nullable: true })
  recipeId: string;
}
