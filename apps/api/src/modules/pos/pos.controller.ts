import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateProductDto, UpdateProductDto, CreateOrderDto, CreatePaymentDto, UpdateOrderStatusDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('POS')
@Controller('api/v1')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PosController {
  constructor(private posService: PosService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  findAllCategories() { return this.posService.findAllCategories(); }

  @Post('categories')
  @ApiOperation({ summary: 'Create category' })
  createCategory(@Body() dto: CreateCategoryDto) { return this.posService.createCategory(dto); }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.posService.updateCategory(id, dto); }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  deleteCategory(@Param('id') id: string) { return this.posService.deleteCategory(id); }

  @Get('products')
  @ApiOperation({ summary: 'Get all products' })
  findAllProducts(@Query() query: PaginationDto) { return this.posService.findAllProducts(query); }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOneProduct(@Param('id') id: string) { return this.posService.findOneProduct(id); }

  @Post('products')
  @ApiOperation({ summary: 'Create product' })
  createProduct(@Body() dto: CreateProductDto) { return this.posService.createProduct(dto); }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.posService.updateProduct(id, dto); }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product' })
  deleteProduct(@Param('id') id: string) { return this.posService.deleteProduct(id); }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders' })
  findAllOrders(@Query() query: PaginationDto) { return this.posService.findAllOrders(query); }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOneOrder(@Param('id') id: string) { return this.posService.findOneOrder(id); }

  @Post('orders')
  @ApiOperation({ summary: 'Create order' })
  createOrder(@Body() dto: CreateOrderDto, @Request() req: any) { return this.posService.createOrder(dto, req.user?.id); }

  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) { return this.posService.updateOrderStatus(id, dto); }

  @Post('orders/:id/payments')
  @ApiOperation({ summary: 'Add payment to order' })
  addPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) { return this.posService.addPayment(id, dto); }
}
