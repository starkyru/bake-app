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
}
