export * from './menu.dto';
export * from './product-option.dto';
import { IsString, IsNumber, IsOptional, IsArray, IsUUID, Min, ValidateNested, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Coffee' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'menu', enum: ['menu', 'ingredient'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CreateProductDto {
  @ApiProperty({ example: 'Cappuccino' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'COF-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'produced', enum: ['produced', 'bought_for_resale'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: 1500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty()
  @IsUUID()
  recipeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ingredientId?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

class OrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'dine_in' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount?: number;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 1500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'cash' })
  @IsString()
  method: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'completed' })
  @IsString()
  status: string;
}
