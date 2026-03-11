import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InventoryItem } from './inventory-item.entity';
import { InventoryItemPackage } from './inventory-item-package.entity';
import { Location } from './location.entity';

@Entity('inventory_shipments')
export class InventoryShipment extends BaseEntity {
  @Column({ name: 'package_count', type: 'decimal', precision: 10, scale: 2 })
  packageCount: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'batch_number', nullable: true })
  batchNumber: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => InventoryItem, (item) => item.shipments)
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @Column({ name: 'inventory_item_id' })
  inventoryItemId: string;

  @ManyToOne(() => InventoryItemPackage)
  @JoinColumn({ name: 'package_id' })
  package: InventoryItemPackage;

  @Column({ name: 'package_id' })
  packageId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id' })
  locationId: string;
}
