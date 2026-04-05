import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsArray,
  IsUrl,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCustomOrderRequestDto {
  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiPropertyOptional({ example: 'Birthday' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occasion?: string;

  @ApiPropertyOptional({ example: '12 people' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  servingSize?: string;

  @ApiPropertyOptional({ example: 'Happy Birthday Jane!' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  inscriptionText?: string;

  @ApiPropertyOptional({ example: 'Rose pattern with gold accents' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  decorationNotes?: string;

  @ApiPropertyOptional({ example: 'Pink and gold' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  themeColors?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true, message: 'Each reference image must be a valid URL' })
  referenceImageUrls?: string[];

  @ApiPropertyOptional({ example: '2026-04-20' })
  @IsOptional()
  @IsDateString()
  requestedDate?: string;
}

export class QuoteCustomOrderDto {
  @ApiProperty({ example: 1500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000000)
  quotedPrice: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000000)
  deposit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  staffNotes?: string;
}
