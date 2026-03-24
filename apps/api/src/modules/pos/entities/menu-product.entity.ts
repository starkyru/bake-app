import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Menu } from './menu.entity';
import { Product } from './product.entity';

@Entity('menu_products')
@Unique(['menuId', 'productId'])
export class MenuProduct extends BaseEntity {
  @ManyToOne(() => Menu, menu => menu.menuProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @Column({ name: 'menu_id' })
  menuId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
