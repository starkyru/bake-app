import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsUUID,
  IsIn,
  IsArray,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
const FULFILLMENT_TYPES = ['pickup', 'delivery', 'shipping', 'dine_in_qr'] as const;

export class OrderItemOptionDto {
  @ApiProperty()
  @IsUUID()
  optionGroupId: string;

  @ApiProperty()
  @IsUUID()
  optionId: string;
}

export class OnlineOrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Custom text (e.g. inscription on cake)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customText?: string;

  @ApiPropertyOptional({ type: [OrderItemOptionDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(20)
  @Type(() => OrderItemOptionDto)
  options?: OrderItemOptionDto[];
}

export class CreateOnlineOrderDto {
  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty({ enum: FULFILLMENT_TYPES })
  @IsIn(FULFILLMENT_TYPES)
  fulfillmentType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '10:00-11:00' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  scheduledTimeSlot?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deliveryAddressId?: string;

  @ApiProperty({ type: [OnlineOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Type(() => OnlineOrderItemDto)
  items: OnlineOrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100000)
  tip?: number;
}
