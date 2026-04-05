import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { StorefrontConfigService } from '../services/storefront-config.service';
import { UpdateStorefrontConfigDto } from '../dto';

@ApiTags('Admin - Storefront')
@Controller('api/v1/admin/storefront')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminStorefrontController {
  constructor(private storefrontConfigService: StorefrontConfigService) {}

  @Get('config')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get global storefront config' })
  getGlobalConfig() {
    return this.storefrontConfigService.getConfig(null);
  }

  @Put('config')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update global storefront config' })
  updateGlobalConfig(@Body() dto: UpdateStorefrontConfigDto) {
    return this.storefrontConfigService.updateConfig(null, dto);
  }

  @Get('config/:locationId')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get location storefront config' })
  getLocationConfig(@Param('locationId') locationId: string) {
    return this.storefrontConfigService.getConfig(locationId);
  }

  @Put('config/:locationId')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update location storefront config' })
  updateLocationConfig(
    @Param('locationId') locationId: string,
    @Body() dto: UpdateStorefrontConfigDto,
  ) {
    return this.storefrontConfigService.updateConfig(locationId, dto);
  }
}
