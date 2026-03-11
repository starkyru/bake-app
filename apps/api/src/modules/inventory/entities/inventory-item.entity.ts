import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Ingredient } from './ingredient.entity';
import { InventoryItemPackage } from './inventory-item-package.entity';
import { InventoryShipment } from './inventory-shipment.entity';

@Entity('inventory_items')
export class InventoryItem extends BaseEntity {
  @Column()
  title: string;

  @Column({ name: 'in_stock', default: true })
  inStock: boolean;

  @Column({ name: 'min_stock_level', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minStockLevel: number;

  @Column({ name: 'min_stock_unit', nullable: true })
  minStockUnit: string;

  @ManyToOne(() => Ingredient, { eager: true })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'ingredient_id' })
  ingredientId: string;

  @OneToMany(() => InventoryItemPackage, (pkg) => pkg.inventoryItem, { cascade: true })
  packages: InventoryItemPackage[];

  @OneToMany(() => InventoryShipment, (shipment) => shipment.inventoryItem, { cascade: true })
  shipments: InventoryShipment[];
}
