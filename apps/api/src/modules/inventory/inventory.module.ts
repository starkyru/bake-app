import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { IngredientCategory } from './entities/ingredient-category.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryItemPackage } from './entities/inventory-item-package.entity';
import { InventoryShipment } from './entities/inventory-shipment.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Location } from './entities/location.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ingredient,
      IngredientCategory,
      InventoryItem,
      InventoryItemPackage,
      InventoryShipment,
      InventoryMovement,
      Location,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
