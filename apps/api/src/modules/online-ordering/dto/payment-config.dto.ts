import { IsString, IsOptional, IsUUID, IsBoolean, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

const PAYMENT_PROVIDERS = ['stripe', 'paypal'] as const;

export class CreatePaymentConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ enum: PAYMENT_PROVIDERS })
  @IsIn(PAYMENT_PROVIDERS)
  provider: string;

  @ApiProperty({ description: 'Payment provider public/publishable key' })
  @IsString()
  @MaxLength(500)
  publicKey: string;

  @ApiProperty({ description: 'Payment provider secret key' })
  @IsString()
  @MaxLength(500)
  secretKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  webhookSecret?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isSandbox?: boolean;
}

export class UpdatePaymentConfigDto extends PartialType(CreatePaymentConfigDto) {}
