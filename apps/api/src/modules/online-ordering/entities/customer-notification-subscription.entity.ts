import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Customer } from './customer.entity';

@Entity('customer_notification_subscriptions')
export class CustomerNotificationSubscription extends BaseEntity {
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'menu_id', type: 'uuid', nullable: true })
  menuId: string;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb', default: '{"email":true,"sms":false,"push":false}' })
  channels: { email: boolean; sms: boolean; push: boolean };
}
