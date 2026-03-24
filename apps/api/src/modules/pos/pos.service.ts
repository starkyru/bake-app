import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Menu } from './entities/menu.entity';
import { MenuProduct } from './entities/menu-product.entity';
import { CreateCategoryDto, UpdateCategoryDto, CreateProductDto, UpdateProductDto, CreateOrderDto, CreatePaymentDto, UpdateOrderStatusDto, CreateMenuDto, UpdateMenuDto, AddMenuProductDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { DOMAIN_EVENTS } from '../websocket/ws-events.constants';

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Menu) private menuRepo: Repository<Menu>,
    @InjectRepository(MenuProduct) private menuProductRepo: Repository<MenuProduct>,
    private eventEmitter: EventEmitter2,
  ) {}

  // Categories
  async findAllCategories(type?: string): Promise<Category[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (type) {
      where.type = type;
    }
    return this.categoryRepo.find({
      where,
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

    const productCount = await this.productRepo.count({
      where: { categoryId: id, isActive: true },
    });
    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete category "${cat.name}": it has ${productCount} product(s)`,
      );
    }

    cat.isActive = false;
    await this.categoryRepo.save(cat);
  }

  // Products
  async findAllProducts(query: PaginationDto): Promise<PaginatedResponseDto<Product>> {
    const { page, limit, search } = query;
    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.recipe', 'recipe')
      .leftJoinAndSelect('p.ingredient', 'ingredient');
    if (search) qb.where('p.name ILIKE :search', { search: `%${search}%` });
    qb.andWhere('p.isActive = true');
    qb.orderBy('p.name', 'ASC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOneProduct(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['category', 'recipe', 'ingredient'] });
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

    const savedOrder = await this.orderRepo.save(order);
    this.eventEmitter.emit(DOMAIN_EVENTS.ORDER_CREATED, {
      order: savedOrder,
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      type: savedOrder.type,
      total: savedOrder.total,
      items: orderItems.map(i => ({
        productName: i.productId,
        quantity: i.quantity,
      })),
    });
    return savedOrder;
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOneOrder(id);
    const previousStatus = order.status;
    order.status = dto.status;
    const savedOrder = await this.orderRepo.save(order);
    this.eventEmitter.emit(DOMAIN_EVENTS.ORDER_STATUS_CHANGED, {
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      previousStatus,
      newStatus: savedOrder.status,
    });
    return savedOrder;
  }

  async addPayment(orderId: string, dto: CreatePaymentDto): Promise<Payment> {
    const order = await this.findOneOrder(orderId);
    const payment = this.paymentRepo.create({
      amount: dto.amount,
      method: dto.method,
      orderId: order.id,
    });
    const savedPayment = await this.paymentRepo.save(payment);
    this.eventEmitter.emit(DOMAIN_EVENTS.ORDER_PAYMENT_RECEIVED, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: savedPayment.id,
      amount: savedPayment.amount,
      method: savedPayment.method,
    });
    return savedPayment;
  }

  // Menus
  async findAllMenus(): Promise<any[]> {
    const menus = await this.menuRepo
      .createQueryBuilder('menu')
      .leftJoin('menu.menuProducts', 'menuProducts')
      .addSelect('COUNT(menuProducts.id)', 'productCount')
      .where('menu.isActive = :isActive', { isActive: true })
      .groupBy('menu.id')
      .orderBy('menu.sortOrder', 'ASC')
      .addOrderBy('menu.name', 'ASC')
      .getRawAndEntities();

    return menus.entities.map((menu, index) => ({
      ...menu,
      productCount: parseInt(menus.raw[index].productCount, 10) || 0,
    }));
  }

  async findOneMenu(id: string): Promise<Menu> {
    const menu = await this.menuRepo.findOne({
      where: { id },
      relations: ['menuProducts'],
    });
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async createMenu(dto: CreateMenuDto): Promise<Menu> {
    return this.menuRepo.save(this.menuRepo.create(dto));
  }

  async updateMenu(id: string, dto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Menu not found');
    Object.assign(menu, dto);
    return this.menuRepo.save(menu);
  }

  async deleteMenu(id: string): Promise<void> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Menu not found');
    menu.isActive = false;
    await this.menuRepo.save(menu);
  }

  async addProductToMenu(menuId: string, dto: AddMenuProductDto): Promise<MenuProduct> {
    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new NotFoundException('Menu not found');

    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.menuProductRepo.findOne({
      where: { menuId, productId: dto.productId },
    });
    if (existing) throw new ConflictException('Product already exists in this menu');

    return this.menuProductRepo.save(
      this.menuProductRepo.create({
        menuId,
        productId: dto.productId,
        sortOrder: dto.sortOrder || 0,
      }),
    );
  }

  async removeProductFromMenu(menuId: string, productId: string): Promise<void> {
    const menuProduct = await this.menuProductRepo.findOne({
      where: { menuId, productId },
    });
    if (!menuProduct) throw new NotFoundException('Product not found in this menu');
    await this.menuProductRepo.remove(menuProduct);
  }
}
