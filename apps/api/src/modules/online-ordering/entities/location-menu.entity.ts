import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Location } from '../../inventory/entities/location.entity';
import { Menu } from '../../pos/entities/menu.entity';

@Entity('location_menus')
@Unique(['locationId', 'menuId'])
export class LocationMenu extends BaseEntity {
  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id' })
  locationId: string;

  @ManyToOne(() => Menu)
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @Column({ name: 'menu_id' })
  menuId: string;
}
