import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateProductDto, UpdateProductDto, CreateOrderDto, CreatePaymentDto, UpdateOrderStatusDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('POS')
@Controller('api/v1')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PosController {
  constructor(private posService: PosService) {}

  @Get('categories')
  @RequirePermissions('categories:read')
  @ApiOperation({ summary: 'Get all categories' })
  findAllCategories(@Query('type') type?: string) { return this.posService.findAllCategories(type); }

  @Post('categories')
  @RequirePermissions('categories:create')
  @ApiOperation({ summary: 'Create category' })
  createCategory(@Body() dto: CreateCategoryDto) { return this.posService.createCategory(dto); }

  @Put('categories/:id')
  @RequirePermissions('categories:update')
  @ApiOperation({ summary: 'Update category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.posService.updateCategory(id, dto); }

  @Delete('categories/:id')
  @RequirePermissions('categories:delete')
  @ApiOperation({ summary: 'Delete category' })
  deleteCategory(@Param('id') id: string) { return this.posService.deleteCategory(id); }

  @Get('products')
  @RequirePermissions('products:read')
  @ApiOperation({ summary: 'Get all products' })
  findAllProducts(@Query() query: PaginationDto) { return this.posService.findAllProducts(query); }

  @Get('products/:id')
  @RequirePermissions('products:read')
  @ApiOperation({ summary: 'Get product by ID' })
  findOneProduct(@Param('id') id: string) { return this.posService.findOneProduct(id); }

  @Post('products')
  @RequirePermissions('products:create')
  @ApiOperation({ summary: 'Create product' })
  createProduct(@Body() dto: CreateProductDto) { return this.posService.createProduct(dto); }

  @Put('products/:id')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Update product' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.posService.updateProduct(id, dto); }

  @Delete('products/:id')
  @RequirePermissions('products:delete')
  @ApiOperation({ summary: 'Delete product' })
  deleteProduct(@Param('id') id: string) { return this.posService.deleteProduct(id); }

  @Get('orders')
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Get all orders' })
  findAllOrders(@Query() query: PaginationDto) { return this.posService.findAllOrders(query); }

  @Get('orders/:id')
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Get order by ID' })
  findOneOrder(@Param('id') id: string) { return this.posService.findOneOrder(id); }

  @Post('orders')
  @RequirePermissions('orders:create')
  @ApiOperation({ summary: 'Create order' })
  createOrder(@Body() dto: CreateOrderDto, @Request() req: any) { return this.posService.createOrder(dto, req.user?.id); }

  @Put('orders/:id/status')
  @RequirePermissions('orders:update')
  @ApiOperation({ summary: 'Update order status' })
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) { return this.posService.updateOrderStatus(id, dto); }

  @Post('orders/:id/payments')
  @RequirePermissions('orders:update')
  @ApiOperation({ summary: 'Add payment to order' })
  addPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) { return this.posService.addPayment(id, dto); }
}
