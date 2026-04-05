import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { OrderItem } from '../../pos/entities/order-item.entity';

@Entity('order_item_options')
export class OrderItemOption extends BaseEntity {
  @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @Column({ name: 'order_item_id' })
  orderItemId: string;

  @Column({ name: 'option_group_name' })
  optionGroupName: string;

  @Column({ name: 'option_name' })
  optionName: string;

  @Column({ name: 'price_modifier', type: 'decimal', precision: 10, scale: 2 })
  priceModifier: number;
}
