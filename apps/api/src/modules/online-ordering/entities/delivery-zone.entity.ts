import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Location } from '../../inventory/entities/location.entity';

@Entity('delivery_zones')
export class DeliveryZone extends BaseEntity {
  @ManyToOne(() => Location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id' })
  locationId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  polygon: any;

  @Column({ name: 'radius_km', type: 'decimal', precision: 6, scale: 2, nullable: true })
  radiusKm: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ name: 'minimum_order', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrder: number;

  @Column({ name: 'estimated_minutes', type: 'int', default: 45 })
  estimatedMinutes: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
