import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InventoryItem } from './inventory-item.entity';

@Entity('inventory_item_packages')
export class InventoryItemPackage extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  size: number;

  @Column()
  unit: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => InventoryItem, (item) => item.packages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @Column({ name: 'inventory_item_id' })
  inventoryItemId: string;
}
