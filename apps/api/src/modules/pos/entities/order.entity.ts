import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string;

  @ManyToOne('Customer', { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: any;

  @Column({ name: 'fulfillment_type', nullable: true })
  fulfillmentType: string;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate: string;

  @Column({ name: 'scheduled_time_slot', nullable: true })
  scheduledTimeSlot: string;

  @Column({ name: 'delivery_address_id', type: 'uuid', nullable: true })
  deliveryAddressId: string;

  @Column({ name: 'delivery_address', type: 'jsonb', nullable: true })
  deliveryAddress: any;

  @Column({ name: 'requires_approval', default: false })
  requiresApproval: boolean;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ default: 'pos' })
  source: string;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ default: 'dine_in' })
  type: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'location_id', nullable: true })
  locationId: string;

  @OneToMany(() => OrderItem, item => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @OneToMany(() => Payment, payment => payment.order, { cascade: true })
  payments: Payment[];
}
