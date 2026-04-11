import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CustomerService } from '../services/customer.service';

@ApiTags('Admin - Customers')
@Controller('api/v1/admin/customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminCustomersController {
  constructor(private customerService: CustomerService) {}

  @Get()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List customers' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.customerService.findAll({ page: Number(page) || 1, limit: Number(limit) || 20, search });
  }

  @Get('lookup')
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Lookup customer by phone or email' })
  lookup(@Query('phone') phone?: string, @Query('email') email?: string) {
    return this.customerService.lookupByPhoneOrEmail({ phone, email });
  }

  @Get(':id')
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Get customer detail with recent orders' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.findOne(id);
  }
}
