import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../pos/entities/order.entity';
import { OrderItem } from '../pos/entities/order-item.entity';
import { Product } from '../pos/entities/product.entity';
import { Category } from '../pos/entities/category.entity';
import { Payment } from '../pos/entities/payment.entity';
import { FinanceTransaction } from '../finance/entities/finance-transaction.entity';
import { ExpenseRecord } from '../finance/entities/expense-record.entity';
import { Ingredient } from '../inventory/entities/ingredient.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { InventoryBatch } from '../inventory/entities/inventory-batch.entity';
import { ProductionPlan } from '../production/entities/production-plan.entity';
import { ProductionTask } from '../production/entities/production-task.entity';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      Category,
      Payment,
      FinanceTransaction,
      ExpenseRecord,
      Ingredient,
      InventoryItem,
      InventoryMovement,
      InventoryBatch,
      ProductionPlan,
      ProductionTask,
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
