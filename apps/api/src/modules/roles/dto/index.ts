import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'manager' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Store manager with full access' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['users:read', 'users:write', 'orders:read'] })
  @IsOptional()
  @IsArray()
  permissions?: string[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
