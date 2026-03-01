import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class RecipeIngredientDto {
  @ApiProperty()
  @IsString()
  ingredientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ingredientName?: string;

  @ApiProperty({ example: 250 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'g' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costPerUnit?: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Croissant' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'pastry' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yieldQuantity?: number;

  @ApiPropertyOptional({ example: 'pcs' })
  @IsOptional()
  @IsString()
  yieldUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ type: [RecipeIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];
}

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

export class ScaleRecipeDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  scaleFactor: number;
}
