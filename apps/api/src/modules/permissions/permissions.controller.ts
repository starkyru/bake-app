import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignRolePermissionsDto,
  AssignUserPermissionDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Permissions')
@Controller('api/v1/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'List all permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Post()
  @RequirePermissions('permissions:create')
  @ApiOperation({ summary: 'Create a permission' })
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('permissions:update')
  @ApiOperation({ summary: 'Update a permission' })
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('permissions:delete')
  @ApiOperation({ summary: 'Delete a permission' })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }

  // --- Role Permissions ---

  @Get('roles/:roleId')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: "Get role's permissions" })
  getRolePermissions(@Param('roleId') roleId: string) {
    return this.permissionsService.getRolePermissions(roleId);
  }

  @Put('roles/:roleId')
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: "Set role's permissions" })
  setRolePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignRolePermissionsDto,
  ) {
    return this.permissionsService.setRolePermissions(roleId, dto);
  }

  // --- User Permission Overrides ---

  @Get('users/:userId')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: "Get user's permission overrides" })
  getUserPermissions(@Param('userId') userId: string) {
    return this.permissionsService.getUserPermissions(userId);
  }

  @Post('users/:userId')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Add user permission override' })
  addUserPermission(
    @Param('userId') userId: string,
    @Body() dto: AssignUserPermissionDto,
  ) {
    return this.permissionsService.addUserPermission(userId, dto);
  }

  @Delete('users/:userId/:permissionId')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Remove user permission override' })
  removeUserPermission(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.permissionsService.removeUserPermission(userId, permissionId);
  }
}
