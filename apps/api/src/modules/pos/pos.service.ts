import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { CreateCategoryDto, UpdateCategoryDto, CreateProductDto, UpdateProductDto, CreateOrderDto, CreatePaymentDto, UpdateOrderStatusDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
  ) {}

  // Categories
  async findAllCategories(): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { isActive: true },
      relations: ['children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    return this.categoryRepo.save(this.categoryRepo.create(dto));
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    Object.assign(cat, dto);
    return this.categoryRepo.save(cat);
  }

  async deleteCategory(id: string): Promise<void> {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    cat.isActive = false;
    await this.categoryRepo.save(cat);
  }

  // Products
  async findAllProducts(query: PaginationDto): Promise<PaginatedResponseDto<Product>> {
    const { page, limit, search } = query;
    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category');
    if (search) qb.where('p.name ILIKE :search', { search: `%${search}%` });
    qb.andWhere('p.isActive = true');
    qb.orderBy('p.name', 'ASC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOneProduct(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['category'] });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    return this.productRepo.save(this.productRepo.create(dto));
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOneProduct(id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findOneProduct(id);
    product.isActive = false;
    await this.productRepo.save(product);
  }

  // Orders
  async findAllOrders(query: PaginationDto): Promise<PaginatedResponseDto<Order>> {
    const { page, limit } = query;
    const [data, total] = await this.orderRepo.findAndCount({
      relations: ['items', 'items.product', 'payments'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOneOrder(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'payments'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async createOrder(dto: CreateOrderDto, userId?: string): Promise<Order> {
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const item of dto.items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      const itemSubtotal = Number(product.price) * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        subtotal: itemSubtotal,
        notes: item.notes,
      });
    }

    const discount = dto.discount || 0;
    const taxRate = 0.12;
    const taxableAmount = subtotal - discount;
    const tax = Math.round(taxableAmount * taxRate);
    const total = taxableAmount + tax;

    const order = this.orderRepo.create({
      orderNumber,
      type: dto.type || 'dine_in',
      status: 'pending',
      subtotal,
      tax,
      total,
      discount,
      notes: dto.notes,
      userId,
      items: orderItems as OrderItem[],
    });

    return this.orderRepo.save(order);
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOneOrder(id);
    order.status = dto.status;
    return this.orderRepo.save(order);
  }

  async addPayment(orderId: string, dto: CreatePaymentDto): Promise<Payment> {
    const order = await this.findOneOrder(orderId);
    const payment = this.paymentRepo.create({
      amount: dto.amount,
      method: dto.method,
      orderId: order.id,
    });
    return this.paymentRepo.save(payment);
  }
}
