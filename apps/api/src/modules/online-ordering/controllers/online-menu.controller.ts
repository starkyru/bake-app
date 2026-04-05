import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OnlineMenuService } from '../services/online-menu.service';
import { DeliveryZoneService } from '../services/delivery-zone.service';

@ApiTags('Storefront - Menu')
@Controller('api/v1/storefront/locations')
export class OnlineMenuController {
  constructor(
    private readonly onlineMenuService: OnlineMenuService,
    private readonly deliveryZoneService: DeliveryZoneService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get locations enabled for online ordering' })
  async getOnlineLocations() {
    return this.onlineMenuService.getOnlineLocations();
  }

  @Get(':locationId')
  @ApiOperation({ summary: 'Get location detail with config' })
  async getLocationDetail(@Param('locationId') locationId: string) {
    return this.onlineMenuService.getLocationDetail(locationId);
  }

  @Get(':locationId/menus/available-dates')
  @ApiOperation({ summary: 'Get available dates for preorder' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  async getAvailableDates(
    @Param('locationId') locationId: string,
    @Query('daysAhead') daysAhead?: string,
  ) {
    return this.onlineMenuService.getAvailableDates(
      locationId,
      daysAhead ? parseInt(daysAhead, 10) : undefined,
    );
  }

  @Get(':locationId/menus')
  @ApiOperation({ summary: 'Get menus for a location at a given date/time' })
  @ApiQuery({ name: 'date', required: false, example: '2026-04-10' })
  @ApiQuery({ name: 'time', required: false, example: '12:00' })
  async getMenusForLocation(
    @Param('locationId') locationId: string,
    @Query('date') date?: string,
    @Query('time') time?: string,
  ) {
    return this.onlineMenuService.getMenusForLocation(locationId, date, time);
  }

  @Get(':locationId/delivery-zones/check')
  @ApiOperation({ summary: 'Check if address is within a delivery zone' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  async checkAddress(
    @Param('locationId') locationId: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const zone = await this.deliveryZoneService.checkAddress(
      locationId,
      parseFloat(lat),
      parseFloat(lng),
    );
    return {
      deliverable: !!zone,
      zone: zone
        ? {
            id: zone.id,
            name: zone.name,
            deliveryFee: zone.deliveryFee,
            minimumOrder: zone.minimumOrder,
            estimatedMinutes: zone.estimatedMinutes,
          }
        : null,
    };
  }

  @Get(':locationId/delivery-zones')
  @ApiOperation({ summary: 'Get delivery zones for a location' })
  async getDeliveryZones(@Param('locationId') locationId: string) {
    return this.deliveryZoneService.findByLocation(locationId);
  }
}
