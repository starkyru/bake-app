import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({ example: 'ingredients' })
  @IsString()
  category: string;

  @ApiProperty({ example: 50000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'Flour delivery' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;
}
