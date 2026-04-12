import { IsOptional, IsInt, Min, Max, Matches, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Column name to sort by (alphanumeric and underscores only)' })
  @IsOptional()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'sortBy must be a valid column name (alphanumeric and underscores only)',
  })
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'sortOrder must be either ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
