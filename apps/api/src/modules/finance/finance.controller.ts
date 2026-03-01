import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateExpenseDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Finance')
@Controller('api/v1/finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get financial transactions' })
  getTransactions(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Query('locationId') locationId?: string) {
    return this.financeService.getTransactions(startDate, endDate, locationId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary' })
  getSummary(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('locationId') locationId?: string) {
    return this.financeService.getSummary(startDate, endDate, locationId);
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Create expense record' })
  createExpense(@Body() dto: CreateExpenseDto) { return this.financeService.createExpense(dto); }

  @Get('expenses')
  @ApiOperation({ summary: 'Get expense records' })
  getExpenses(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.financeService.getExpenses(startDate, endDate);
  }
}
