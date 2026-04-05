import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Menu } from '../../pos/entities/menu.entity';

@Entity('menu_schedules')
export class MenuSchedule extends BaseEntity {
  @ManyToOne(() => Menu, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @Column({ name: 'menu_id' })
  menuId: string;

  @Column({ name: 'day_of_week', type: 'smallint', nullable: true })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'specific_date', type: 'date', nullable: true })
  specificDate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
