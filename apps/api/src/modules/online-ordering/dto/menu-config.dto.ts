import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateMenuConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mergeWithOthers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  standalone?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  preorderEnabled?: boolean;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  preorderDaysAhead?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prepTimeMinutes?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  leadTimeHours?: number;
}
