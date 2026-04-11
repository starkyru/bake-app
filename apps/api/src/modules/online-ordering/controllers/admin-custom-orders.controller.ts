import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CustomOrderRequestService } from '../services/custom-order-request.service';
import { QuoteCustomOrderDto } from '../dto';

@ApiTags('Admin - Custom Orders')
@Controller('api/v1/admin/custom-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminCustomOrdersController {
  constructor(private customOrderRequestService: CustomOrderRequestService) {}

  @Get()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List custom order requests' })
  findAll(
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customOrderRequestService.findAll({ status, locationId, page: Number(page) || 1, limit: Number(limit) || 20 });
  }

  @Get(':id')
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Get custom order request details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customOrderRequestService.findOne(id);
  }

  @Post(':id/quote')
  @RequirePermissions('orders:update')
  @ApiOperation({ summary: 'Provide quote for custom order' })
  quote(@Param('id', ParseUUIDPipe) id: string, @Body() dto: QuoteCustomOrderDto) {
    return this.customOrderRequestService.quote(id, dto);
  }

  @Post(':id/assign')
  @RequirePermissions('orders:update')
  @ApiOperation({ summary: 'Assign staff to custom order' })
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() body: { userId: string }) {
    return this.customOrderRequestService.assignStaff(id, body.userId);
  }

  @Put(':id/status')
  @RequirePermissions('orders:update')
  @ApiOperation({ summary: 'Update custom order status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: { status: string }) {
    return this.customOrderRequestService.updateStatus(id, body.status);
  }
}
