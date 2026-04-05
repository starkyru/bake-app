import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Location } from '../../inventory/entities/location.entity';

@Entity('location_configs')
export class LocationConfig extends BaseEntity {
  @OneToOne(() => Location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id', unique: true })
  locationId: string;

  @Column({ name: 'enabled_for_online_ordering', default: false })
  enabledForOnlineOrdering: boolean;

  @Column({ name: 'preorder_enabled', default: false })
  preorderEnabled: boolean;

  @Column({ name: 'preorder_days_ahead', type: 'int', default: 7 })
  preorderDaysAhead: number;

  @Column({ name: 'delivery_enabled', default: false })
  deliveryEnabled: boolean;

  @Column({ name: 'pickup_enabled', default: true })
  pickupEnabled: boolean;

  @Column({ name: 'shipping_enabled', default: false })
  shippingEnabled: boolean;

  @Column({ name: 'dine_in_qr_enabled', default: false })
  dineInQrEnabled: boolean;

  @Column({ name: 'fulfillment_slots', type: 'jsonb', default: '[]' })
  fulfillmentSlots: any[];

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 4, default: 0.12 })
  taxRate: number;
}
