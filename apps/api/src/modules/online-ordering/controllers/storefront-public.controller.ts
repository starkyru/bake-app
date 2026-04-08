import { Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StorefrontConfigService } from '../services/storefront-config.service';

@ApiTags('Storefront - Config')
@Controller('api/v1/storefront/config')
export class StorefrontPublicController {
  constructor(
    private readonly storefrontConfigService: StorefrontConfigService,
    private readonly configService: ConfigService,
  ) {}

  private addAuthMethods(config: Record<string, any>) {
    return {
      ...config,
      googleAuthEnabled: !!this.configService.get<string>('GOOGLE_CLIENT_ID'),
      appleAuthEnabled: !!this.configService.get<string>('APPLE_CLIENT_ID'),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get global storefront config' })
  async getGlobalConfig() {
    const config = await this.storefrontConfigService.getConfig(null);
    return this.addAuthMethods(config);
  }

  @Get(':locationId')
  @ApiOperation({ summary: 'Get storefront config for a location' })
  async getLocationConfig(@Param('locationId') locationId: string) {
    const config = await this.storefrontConfigService.getConfig(locationId);
    return this.addAuthMethods(config);
  }
}
