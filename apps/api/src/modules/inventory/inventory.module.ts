import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Location } from './entities/location.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, InventoryItem, InventoryBatch, InventoryMovement, Location])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
