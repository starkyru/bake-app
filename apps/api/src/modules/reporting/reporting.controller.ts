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
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Reports')
@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Get('sales/today')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Today sales snapshot with week-over-week trend' })
  getSalesToday() {
    return this.reportingService.getSalesToday();
  }

  @Get('sales/summary')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Sales summary by period' })
  getSalesSummary(@Query() query: SalesReportQueryDto) {
    return this.reportingService.getSalesSummary(query);
  }

  @Get('sales/top-products')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Top 20 products by revenue' })
  getTopProducts(@Query() query: DateRangeQueryDto) {
    return this.reportingService.getTopProducts(query);
  }

  @Get('sales/by-category')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Revenue breakdown by category' })
  getSalesByCategory(@Query() query: DateRangeQueryDto) {
    return this.reportingService.getSalesByCategory(query);
  }

  @Get('sales/payment-methods')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Payment method distribution' })
  getPaymentMethods(@Query() query: DateRangeQueryDto) {
    return this.reportingService.getPaymentMethods(query);
  }

  @Get('finance/summary')
  @RequirePermissions('reports:read', 'finance:read')
  @ApiOperation({ summary: 'Financial P&L summary' })
  getFinanceSummary(@Query() query: DateRangeQueryDto) {
    return this.reportingService.getFinanceSummary(query);
  }

  @Get('inventory/status')
  @RequirePermissions('reports:read', 'inventory:read')
  @ApiOperation({ summary: 'Inventory stock levels and alerts' })
  getInventoryStatus(@Query() query: InventoryReportQueryDto) {
    return this.reportingService.getInventoryStatus(query);
  }

  @Get('inventory/movements')
  @RequirePermissions('reports:read', 'inventory:read')
  @ApiOperation({ summary: 'Inventory movement summary' })
  getInventoryMovements(@Query() query: InventoryReportQueryDto) {
    return this.reportingService.getInventoryMovements(query);
  }

  @Get('production/summary')
  @RequirePermissions('reports:read', 'production:read')
  @ApiOperation({ summary: 'Production plan execution summary' })
  getProductionSummary(@Query() query: ProductionReportQueryDto) {
    return this.reportingService.getProductionSummary(query);
  }
}
