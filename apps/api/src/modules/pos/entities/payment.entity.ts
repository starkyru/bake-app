import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from './order.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'cash' })
  method: string;

  @Column({ default: 'completed' })
  status: string;

  @ManyToOne(() => Order, order => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ name: 'online_transaction_id', nullable: true })
  onlineTransactionId: string;

  @Column({ name: 'provider_reference', nullable: true })
  providerReference: string;
}
