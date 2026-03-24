import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MenuProduct } from './menu-product.entity';

@Entity('menus')
export class Menu extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => MenuProduct, mp => mp.menu, { cascade: true })
  menuProducts: MenuProduct[];
}
