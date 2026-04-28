import { IsString, IsNumber, IsOptional, IsArray, IsDateString, ValidateNested, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ProductionTaskDto {
  @ApiProperty()
  @IsString()
  recipeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipeName?: string;

  @ApiProperty({ example: 24 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  plannedQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;
}

export class CreateProductionPlanDto {
  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [ProductionTaskDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionTaskDto)
  tasks?: ProductionTaskDto[];
}

export class UpdateProductionPlanDto extends PartialType(CreateProductionPlanDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

class BatchConsumptionOverrideDto {
  @ApiProperty()
  @IsString()
  batchId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ example: 'in_progress' })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualYield?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  wasteQuantity?: number;

  @ApiPropertyOptional({ description: 'Storage condition for the produced batch' })
  @IsOptional()
  @IsString()
  storageCondition?: string;

  @ApiPropertyOptional({ description: 'Location for the produced batch' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Manual batch consumption overrides (instead of auto FIFO)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchConsumptionOverrideDto)
  batchConsumptions?: BatchConsumptionOverrideDto[];
}

export class CreateProductionBatchDto {
  @ApiProperty()
  @IsString()
  recipeId: string;

  @ApiProperty()
  @IsString()
  locationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageCondition?: string;

  @ApiProperty({ example: 24 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  producedQuantity: number;

  @ApiProperty({ example: 'pcs' })
  @IsString()
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  productionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DiscardBatchDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 'Expired' })
  @IsString()
  reason: string;
}

export class TransferBatchDto {
  @ApiProperty()
  @IsString()
  toLocationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageCondition?: string;
}

export class ConsumeBatchDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consumingTaskId?: string;
}
