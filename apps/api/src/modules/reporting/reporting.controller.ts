import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import {
  SalesReportQueryDto,
  DateRangeQueryDto,
  InventoryReportQueryDto,
  ProductionReportQueryDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Get('sales/summary')
  @Roles('owner', 'manager', 'accountant')
  @ApiOperation({ summary: 'Sales summary by period' })
  getSalesSummary(@Query() query: SalesReportQueryDto) {
    return this.reportingService.getSalesSummary(query);
  }

  @Get('sales/top-products')
  @Roles('owner', 'manager')
  @ApiOperation({ summary: 'Top 20 products by revenue' })
  getTopProducts(@Query() query: DateRangeQueryDto) {
    return this.reportingService.getTopProducts(query);
  }

  @Get('sales/by-category')
  @Roles('owner', 'manager')
  @ApiOperation({ summary: 'Revenue breakdown by category' })
  getSalesByCategory(@Query() query: DateRangeQueryDto) {
    return this.reportingService.getSalesByCategory(query);
  }

  @Get('sales/payment-methods')
  @Roles('owner', 'manager', 'accountant')
  @ApiOperation({ summary: 'Payment method distribution' })
  getPaymentMethods(@Query() query: DateRangeQueryDto) {
    return this.reportingService.getPaymentMethods(query);
  }

  @Get('finance/summary')
  @Roles('owner', 'accountant')
  @ApiOperation({ summary: 'Financial P&L summary' })
  getFinanceSummary(@Query() query: DateRangeQueryDto) {
    return this.reportingService.getFinanceSummary(query);
  }

  @Get('inventory/status')
  @Roles('owner', 'manager', 'chef', 'warehouse')
  @ApiOperation({ summary: 'Inventory stock levels and alerts' })
  getInventoryStatus(@Query() query: InventoryReportQueryDto) {
    return this.reportingService.getInventoryStatus(query);
  }

  @Get('inventory/movements')
  @Roles('owner', 'manager', 'chef', 'warehouse')
  @ApiOperation({ summary: 'Inventory movement summary' })
  getInventoryMovements(@Query() query: InventoryReportQueryDto) {
    return this.reportingService.getInventoryMovements(query);
  }

  @Get('production/summary')
  @Roles('owner', 'manager', 'chef')
  @ApiOperation({ summary: 'Production plan execution summary' })
  getProductionSummary(@Query() query: ProductionReportQueryDto) {
    return this.reportingService.getProductionSummary(query);
  }
}
