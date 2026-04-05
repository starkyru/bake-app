import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StorefrontConfigService } from '../services/storefront-config.service';

@ApiTags('Storefront - Config')
@Controller('api/v1/storefront/config')
export class StorefrontPublicController {
  constructor(
    private readonly storefrontConfigService: StorefrontConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get global storefront config' })
  async getGlobalConfig() {
    return this.storefrontConfigService.getConfig(null);
  }

  @Get(':locationId')
  @ApiOperation({ summary: 'Get storefront config for a location' })
  async getLocationConfig(@Param('locationId') locationId: string) {
    return this.storefrontConfigService.getConfig(locationId);
  }
}
