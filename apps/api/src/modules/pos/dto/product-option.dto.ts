import { IsString, IsOptional, IsNumber, IsBoolean, IsInt, IsIn, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

const OPTION_GROUP_TYPES = ['single', 'multiple'] as const;

export class CreateProductOptionGroupDto {
  @ApiProperty({ example: 'Milk Type' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ enum: OPTION_GROUP_TYPES })
  @IsOptional()
  @IsIn(OPTION_GROUP_TYPES)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSelections?: number;
}

export class UpdateProductOptionGroupDto extends PartialType(CreateProductOptionGroupDto) {}

export class CreateProductOptionDto {
  @ApiProperty({ example: 'Oat Milk' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-100000)
  @Max(100000)
  priceModifier?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateProductOptionDto extends PartialType(CreateProductOptionDto) {}
