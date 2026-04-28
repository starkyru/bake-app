import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUrl,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
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

  @ApiPropertyOptional({ example: 'sifted' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Set to true to auto-create this ingredient' })
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'Category name for new ingredients' })
  @IsOptional()
  @IsString()
  ingredientCategory?: string;
}

class RecipeLinkDto {
  @ApiProperty({ example: 'https://youtube.com/watch?v=abc123' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'How to make croissants' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isYoutube?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  youtubeVideoId?: string;
}

class SubRecipeDto {
  @ApiProperty()
  @IsString()
  subRecipeId: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 'batches' })
  @IsString()
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

class RecipeStorageLifeDto {
  @ApiProperty()
  @IsString()
  storageConditionId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shelfLifeHours: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Croissant' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'pastry' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
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

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  roomTempHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  refrigeratedHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  frozenHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  thawedHours?: number;

  @ApiPropertyOptional({ type: [RecipeIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];

  @ApiPropertyOptional({ type: [RecipeLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeLinkDto)
  links?: RecipeLinkDto[];

  @ApiPropertyOptional({ type: [SubRecipeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubRecipeDto)
  subRecipes?: SubRecipeDto[];

  @ApiPropertyOptional({ type: [RecipeStorageLifeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeStorageLifeDto)
  storageLives?: RecipeStorageLifeDto[];
}

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

export class ScaleRecipeDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  scaleFactor: number;
}

export class GenerateFromUrlDto {
  @ApiProperty({ example: 'https://example.com/recipe/croissant' })
  @IsUrl()
  url: string;
}

export class GenerateFromImageDto {
  @ApiProperty({ description: 'Base64-encoded image data' })
  @IsString()
  imageBase64: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class GenerateFromTextDto {
  @ApiProperty({ description: 'Raw recipe text to parse' })
  @IsString()
  text: string;
}
