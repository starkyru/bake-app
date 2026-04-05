import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductOptionGroup } from './product-option-group.entity';

@Entity('product_options')
export class ProductOption extends BaseEntity {
  @ManyToOne(() => ProductOptionGroup, (group) => group.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: ProductOptionGroup;

  @Column({ name: 'group_id' })
  groupId: string;

  @Column()
  name: string;

  @Column({ name: 'price_modifier', type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceModifier: number;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
