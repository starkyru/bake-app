import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { LocationConfigService } from '../services/location-config.service';
import { MenuConfigService } from '../services/menu-config.service';
import { DeliveryZoneService } from '../services/delivery-zone.service';
import { UpdateLocationConfigDto, CreateDeliveryZoneDto, UpdateDeliveryZoneDto } from '../dto';

@ApiTags('Admin - Location Config')
@Controller('api/v1/admin/locations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminLocationConfigController {
  constructor(
    private locationConfigService: LocationConfigService,
    private menuConfigService: MenuConfigService,
    private deliveryZoneService: DeliveryZoneService,
  ) {}

  @Get(':id/config')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get location online ordering config' })
  getConfig(@Param('id') id: string) {
    return this.locationConfigService.getConfig(id);
  }

  @Put(':id/config')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update location online ordering config' })
  updateConfig(@Param('id') id: string, @Body() dto: UpdateLocationConfigDto) {
    return this.locationConfigService.updateConfig(id, dto);
  }

  @Get(':id/menus')
  @RequirePermissions('products:read')
  @ApiOperation({ summary: 'Get menus assigned to location' })
  getLocationMenus(@Param('id') id: string) {
    return this.menuConfigService.getLocationMenus(id);
  }

  @Post(':id/menus')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Assign menu to location' })
  assignMenu(@Param('id') id: string, @Body() body: { menuId: string }) {
    return this.menuConfigService.assignMenuToLocation(id, body.menuId);
  }

  @Delete(':id/menus/:menuId')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Unassign menu from location' })
  unassignMenu(@Param('id') id: string, @Param('menuId') menuId: string) {
    return this.menuConfigService.unassignMenuFromLocation(id, menuId);
  }

  @Get(':id/delivery-zones')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get delivery zones for location' })
  getDeliveryZones(@Param('id') id: string) {
    return this.deliveryZoneService.findByLocation(id);
  }

  @Post(':id/delivery-zones')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Create delivery zone' })
  createDeliveryZone(@Param('id') id: string, @Body() dto: CreateDeliveryZoneDto) {
    return this.deliveryZoneService.create(id, dto);
  }

  @Put(':id/delivery-zones/:zoneId')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update delivery zone' })
  updateDeliveryZone(@Param('zoneId') zoneId: string, @Body() dto: UpdateDeliveryZoneDto) {
    return this.deliveryZoneService.update(zoneId, dto);
  }

  @Delete(':id/delivery-zones/:zoneId')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Delete delivery zone' })
  deleteDeliveryZone(@Param('zoneId') zoneId: string) {
    return this.deliveryZoneService.delete(zoneId);
  }
}
