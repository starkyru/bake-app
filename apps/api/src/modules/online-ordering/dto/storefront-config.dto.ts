import { IsOptional, IsString, IsIn, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const THEME_PRESETS = ['warm', 'modern', 'minimal'] as const;

export class UpdateStorefrontConfigDto {
  @ApiPropertyOptional({ enum: THEME_PRESETS })
  @IsOptional()
  @IsIn(THEME_PRESETS)
  themePreset?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  heroImageUrl?: string;

  @ApiPropertyOptional({ example: 'Sweet Cravings Bakery' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @ApiPropertyOptional({ example: 'Freshly baked, daily' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tagline?: string;

  @ApiPropertyOptional({ example: '#8b4513' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/, { message: 'primaryColor must be a valid hex color' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#d4a574' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/, { message: 'accentColor must be a valid hex color' })
  accentColor?: string;

  @ApiPropertyOptional({ example: 'order.mybakery.com' })
  @IsOptional()
  @IsString()
  @MaxLength(253)
  @Matches(/^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}$/, { message: 'customDomain must be a valid domain' })
  customDomain?: string;
}
