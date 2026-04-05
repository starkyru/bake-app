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
import { PaymentConfigService } from '../services/payment-config.service';
import { CreatePaymentConfigDto, UpdatePaymentConfigDto } from '../../online-ordering/dto';

@ApiTags('Admin - Payment Providers')
@Controller('api/v1/admin/payment-providers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminPaymentConfigController {
  constructor(private paymentConfigService: PaymentConfigService) {}

  @Get()
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'List payment configs' })
  findAll() {
    return this.paymentConfigService.findAll();
  }

  @Post()
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Create payment config' })
  create(@Body() dto: CreatePaymentConfigDto) {
    return this.paymentConfigService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update payment config' })
  update(@Param('id') id: string, @Body() dto: UpdatePaymentConfigDto) {
    return this.paymentConfigService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Delete payment config' })
  delete(@Param('id') id: string) {
    return this.paymentConfigService.delete(id);
  }

  @Post(':id/activate')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Activate payment config' })
  activate(@Param('id') id: string) {
    return this.paymentConfigService.activate(id);
  }

  @Post(':id/deactivate')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Deactivate payment config' })
  deactivate(@Param('id') id: string) {
    return this.paymentConfigService.deactivate(id);
  }
}
