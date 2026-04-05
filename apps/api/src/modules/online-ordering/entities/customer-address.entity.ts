import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Customer } from './customer.entity';

@Entity('customer_addresses')
export class CustomerAddress extends BaseEntity {
  @ManyToOne(() => Customer, (customer) => customer.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column()
  label: string;

  @Column()
  street: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column()
  zip: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: number;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}
