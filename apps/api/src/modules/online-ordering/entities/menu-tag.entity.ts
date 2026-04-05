import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Menu } from '../../pos/entities/menu.entity';

@Entity('menu_tags')
export class MenuTag extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Menu)
  @JoinTable({
    name: 'menu_menu_tags',
    joinColumn: { name: 'tag_id' },
    inverseJoinColumn: { name: 'menu_id' },
  })
  menus: Menu[];
}
