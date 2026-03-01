import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Flour' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiPropertyOptional({ example: 'Dry goods' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}

export class CreateLocationDto {
  @ApiProperty({ example: 'Main Bakery' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '123 Baker St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'production' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}

export class DeliveryDto {
  @ApiProperty()
  @IsUUID()
  ingredientId: string;

  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WriteOffDto {
  @ApiProperty()
  @IsUUID()
  ingredientId: string;

  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 'Expired' })
  @IsString()
  reason: string;
}

export class TransferDto {
  @ApiProperty()
  @IsUUID()
  ingredientId: string;

  @ApiProperty()
  @IsUUID()
  fromLocationId: string;

  @ApiProperty()
  @IsUUID()
  toLocationId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
