import { IsString, IsNumber, IsOptional, IsUUID, IsArray, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Flour' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: 'All-purpose wheat flour, King Arthur brand' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiPropertyOptional({ example: 364 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  calories?: number;

  @ApiPropertyOptional({ example: 'Dry goods' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;
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

export class AddPackageDto {
  @ApiProperty({ example: 25 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  size: number;

  @ApiProperty({ example: 'lb' })
  @IsString()
  unit: string;
}

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'King Arthur Flour' })
  @IsString()
  title: string;

  @ApiProperty()
  @IsUUID()
  ingredientId: string;

  @ApiPropertyOptional({ type: [AddPackageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddPackageDto)
  packages?: AddPackageDto[];

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiPropertyOptional({ example: 'g' })
  @IsOptional()
  @IsString()
  minStockUnit?: string;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ example: 'King Arthur Flour' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  minStockUnit?: string;

  @ApiPropertyOptional({ type: [AddPackageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddPackageDto)
  packages?: AddPackageDto[];
}

export class AddShipmentDto {
  @ApiProperty()
  @IsUUID()
  packageId: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  packageCount: number;

  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WriteOffDto {
  @ApiProperty()
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty()
  @IsUUID()
  packageId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  packageCount: number;

  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty({ example: 'Expired' })
  @IsString()
  reason: string;
}

export class TransferDto {
  @ApiProperty()
  @IsUUID()
  fromInventoryItemId: string;

  @ApiProperty()
  @IsUUID()
  packageId: string;

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
  packageCount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateIngredientCategoryDto {
  @ApiProperty({ example: 'Dairy' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class UpdateIngredientCategoryDto extends PartialType(CreateIngredientCategoryDto) {}
