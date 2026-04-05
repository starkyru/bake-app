import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Customer } from './customer.entity';
import { Location } from '../../inventory/entities/location.entity';

@Entity('custom_order_requests')
export class CustomOrderRequest extends BaseEntity {
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id' })
  locationId: string;

  @Column({ nullable: true })
  occasion: string;

  @Column({ name: 'serving_size', nullable: true })
  servingSize: string;

  @Column({ name: 'inscription_text', nullable: true })
  inscriptionText: string;

  @Column({ name: 'decoration_notes', type: 'text', nullable: true })
  decorationNotes: string;

  @Column({ name: 'theme_colors', nullable: true })
  themeColors: string;

  @Column({ name: 'reference_image_urls', type: 'jsonb', default: '[]' })
  referenceImageUrls: string[];

  @Column({ default: 'submitted' })
  status: string;

  @Column({ name: 'quoted_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  quotedPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  deposit: number;

  @Column({ name: 'staff_notes', type: 'text', nullable: true })
  staffNotes: string;

  @Column({ name: 'requested_date', type: 'date', nullable: true })
  requestedDate: string;

  @Column({ name: 'assigned_user_id', type: 'uuid', nullable: true })
  assignedUserId: string;
}
