import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { OnlineOrderService } from '../services/online-order.service';

@ApiTags('Admin - Online Orders')
@Controller('api/v1/admin/online-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminOnlineOrdersController {
  constructor(private onlineOrderService: OnlineOrderService) {}

  @Get()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List all online orders' })
  findAll(
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.onlineOrderService.findAllOnline({ status, locationId, page: Number(page) || 1, limit: Number(limit) || 20 });
  }

  @Get('pending-approval')
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List orders pending approval' })
  findPendingApproval() {
    return this.onlineOrderService.findAllOnline({ status: 'pending_approval' });
  }

  @Get(':id')
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Get online order details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.onlineOrderService.findOne(id);
  }

  @Post(':id/approve')
  @RequirePermissions('orders:update')
  @ApiOperation({ summary: 'Approve an online order' })
  approve(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.onlineOrderService.approveOrder(id, req.user.id);
  }

  @Post(':id/reject')
  @RequirePermissions('orders:update')
  @ApiOperation({ summary: 'Reject an online order' })
  reject(@Param('id', ParseUUIDPipe) id: string, @Request() req: any, @Body() body: { reason?: string }) {
    return this.onlineOrderService.rejectOrder(id, req.user.id, body.reason);
  }

  @Put(':id/status')
  @RequirePermissions('orders:update')
  @ApiOperation({ summary: 'Update online order status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: { status: string }) {
    return this.onlineOrderService.updateOrderStatus(id, body.status);
  }
}
