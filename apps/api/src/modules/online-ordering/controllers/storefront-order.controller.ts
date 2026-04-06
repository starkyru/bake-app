import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CustomerAuthGuard,
  OptionalCustomerAuthGuard,
} from '../guards/customer-auth.guard';
import { OnlineOrderService } from '../services/online-order.service';
import { CreateOnlineOrderDto } from '../dto';

@ApiTags('Storefront - Orders')
@Controller('api/v1/storefront/orders')
export class StorefrontOrderController {
  constructor(private readonly onlineOrderService: OnlineOrderService) {}

  @Post()
  @UseGuards(OptionalCustomerAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an online order' })
  async createOrder(@Req() req: any, @Body() dto: CreateOnlineOrderDto) {
    const customerId = req.user?.id ?? null;
    return this.onlineOrderService.createOrder(customerId, dto);
  }

  @Get(':id')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an order by ID' })
  async getOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const order = await this.onlineOrderService.findOne(id);
    if (order.customerId !== req.user.id) {
      // Return 404 rather than 403 to avoid leaking order existence
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Post(':id/cancel')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an order' })
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.onlineOrderService.cancelOrder(id, req.user.id);
  }
}
