import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Settings')
@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get(':group')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get settings by group' })
  getGroup(@Param('group') group: string) {
    return this.settingsService.getGroup(group);
  }

  @Put(':group')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update settings for a group' })
  saveGroup(
    @Param('group') group: string,
    @Body() data: Record<string, string>,
  ) {
    return this.settingsService.saveGroup(group, data);
  }
}
