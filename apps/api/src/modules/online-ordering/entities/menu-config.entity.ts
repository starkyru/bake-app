import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Menu } from '../../pos/entities/menu.entity';

@Entity('menu_configs')
export class MenuConfig extends BaseEntity {
  @OneToOne(() => Menu, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @Column({ name: 'menu_id', unique: true })
  menuId: string;

  @Column({ name: 'merge_with_others', default: true })
  mergeWithOthers: boolean;

  @Column({ default: false })
  standalone: boolean;

  @Column({ name: 'preorder_enabled', default: false })
  preorderEnabled: boolean;

  @Column({ name: 'preorder_days_ahead', type: 'int', default: 0 })
  preorderDaysAhead: number;

  @Column({ name: 'requires_approval', default: false })
  requiresApproval: boolean;

  @Column({ name: 'prep_time_minutes', type: 'int', default: 30 })
  prepTimeMinutes: number;

  @Column({ name: 'lead_time_hours', type: 'int', default: 0 })
  leadTimeHours: number;
}
