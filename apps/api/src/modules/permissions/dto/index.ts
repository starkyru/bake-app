import { IsString, IsOptional, IsArray, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty()
  @IsString()
  resource: string;

  @ApiProperty()
  @IsString()
  action: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignRolePermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

export class AssignUserPermissionDto {
  @ApiProperty()
  @IsUUID()
  permissionId: string;

  @ApiProperty({ enum: ['grant', 'deny'] })
  @IsIn(['grant', 'deny'])
  grantType: 'grant' | 'deny';
}
