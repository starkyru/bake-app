import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionPlan } from './entities/production-plan.entity';
import { ProductionTask } from './entities/production-task.entity';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionPlan, ProductionTask])],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
