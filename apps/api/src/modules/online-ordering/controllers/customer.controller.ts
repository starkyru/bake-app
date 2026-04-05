import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CustomerService } from '../services/customer.service';
import {
  UpdateCustomerDto,
  CreateCustomerAddressDto,
  UpdateCustomerAddressDto,
} from '../dto';
import { Order } from '../../pos/entities/order.entity';

@ApiTags('Storefront - Customer')
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller('api/v1/storefront/me')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get customer profile' })
  async getProfile(@Req() req: any) {
    return this.customerService.getProfile(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update customer profile' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateCustomerDto) {
    return this.customerService.updateProfile(req.user.id, dto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get customer addresses' })
  async getAddresses(@Req() req: any) {
    return this.customerService.getAddresses(req.user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create a new address' })
  async createAddress(@Req() req: any, @Body() dto: CreateCustomerAddressDto) {
    return this.customerService.createAddress(req.user.id, dto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  async updateAddress(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
    return this.customerService.updateAddress(req.user.id, id, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete an address' })
  async deleteAddress(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    await this.customerService.deleteAddress(req.user.id, id);
    return { success: true };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get customer orders' })
  async getCustomerOrders(@Req() req: any) {
    return this.orderRepo.find({
      where: { customerId: req.user.id },
      relations: ['items', 'items.product', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }
}
