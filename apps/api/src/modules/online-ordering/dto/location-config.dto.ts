import { IsOptional, IsBoolean, IsInt, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateLocationConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabledForOnlineOrdering?: boolean;

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
  deliveryEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pickupEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  shippingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dineInQrEnabled?: boolean;

  @ApiPropertyOptional({ example: 0.12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxRate?: number;
}
