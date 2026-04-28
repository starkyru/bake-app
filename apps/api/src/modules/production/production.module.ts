import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionPlan } from './entities/production-plan.entity';
import { ProductionTask } from './entities/production-task.entity';
import { ProductionBatch } from './entities/production-batch.entity';
import { BatchConsumption } from './entities/batch-consumption.entity';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { ProductionBatchService } from './production-batch.service';
import { ProductionBatchController } from './production-batch.controller';
import { ExpiryCheckService } from './expiry-check.service';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionPlan, ProductionTask, ProductionBatch, BatchConsumption]),
    forwardRef(() => RecipesModule),
  ],
  controllers: [ProductionController, ProductionBatchController],
  providers: [ProductionService, ProductionBatchService, ExpiryCheckService],
  exports: [ProductionService, ProductionBatchService],
})
export class ProductionModule {}
