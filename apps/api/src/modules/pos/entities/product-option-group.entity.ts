import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { ProductOption } from './product-option.entity';

@Entity('product_option_groups')
export class ProductOptionGroup extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.optionGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column()
  name: string;

  @Column({ default: 'single' })
  type: string;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'max_selections', type: 'int', nullable: true })
  maxSelections: number;

  @OneToMany(() => ProductOption, (option) => option.group, { cascade: true })
  options: ProductOption[];
}
