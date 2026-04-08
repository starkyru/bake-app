import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order } from '../../pos/entities/order.entity';
import { OrderItem } from '../../pos/entities/order-item.entity';
import { Product } from '../../pos/entities/product.entity';
import { ProductOptionGroup } from '../../pos/entities/product-option-group.entity';
import { ProductOption } from '../../pos/entities/product-option.entity';
import { OrderItemOption } from '../entities/order-item-option.entity';
import { LocationConfig } from '../entities/location-config.entity';
import { MenuConfig } from '../entities/menu-config.entity';
import { DeliveryZone } from '../entities/delivery-zone.entity';
import { CustomerAddress } from '../entities/customer-address.entity';
import { LocationMenu } from '../entities/location-menu.entity';
import { CreateOnlineOrderDto } from '../dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { DOMAIN_EVENTS } from '../../websocket/ws-events.constants';
import BigNumber from 'bignumber.js';

const FULFILLMENT_CONFIG_MAP: Record<string, string> = {
  pickup: 'pickupEnabled',
  delivery: 'deliveryEnabled',
  shipping: 'shippingEnabled',
  dine_in_qr: 'dineInQrEnabled',
};

@Injectable()
export class OnlineOrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(OrderItemOption) private orderItemOptionRepo: Repository<OrderItemOption>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductOptionGroup) private optionGroupRepo: Repository<ProductOptionGroup>,
    @InjectRepository(ProductOption) private optionRepo: Repository<ProductOption>,
    @InjectRepository(LocationConfig) private locationConfigRepo: Repository<LocationConfig>,
    @InjectRepository(MenuConfig) private menuConfigRepo: Repository<MenuConfig>,
    @InjectRepository(DeliveryZone) private deliveryZoneRepo: Repository<DeliveryZone>,
    @InjectRepository(CustomerAddress) private addressRepo: Repository<CustomerAddress>,
    @InjectRepository(LocationMenu) private locationMenuRepo: Repository<LocationMenu>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createOrder(customerId: string | null, dto: CreateOnlineOrderDto): Promise<Order> {
    const locationConfig = await this.locationConfigRepo.findOne({
      where: { locationId: dto.locationId },
    });
    if (!locationConfig || !locationConfig.enabledForOnlineOrdering) {
      throw new BadRequestException('This location is not available for online ordering');
    }

    const fulfillmentField = FULFILLMENT_CONFIG_MAP[dto.fulfillmentType];
    if (!fulfillmentField || !locationConfig[fulfillmentField]) {
      throw new BadRequestException(
        `Fulfillment type "${dto.fulfillmentType}" is not enabled for this location`,
      );
    }

    let subtotal = new BigNumber(0);
    const orderItems: Partial<OrderItem>[] = [];
    const itemOptionsMap: Map<number, Partial<OrderItemOption>[]> = new Map();
    const menuIdsInvolved = new Set<string>();

    const locationMenus = await this.locationMenuRepo.find({
      where: { locationId: dto.locationId },
    });
    const locationMenuIds = new Set(locationMenus.map((lm) => lm.menuId));

    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i];
      const product = await this.productRepo.findOne({
        where: { id: item.productId, isActive: true },
        relations: ['optionGroups', 'optionGroups.options'],
      });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found or inactive`);
      }

      let optionPriceTotal = new BigNumber(0);
      const itemOptions: Partial<OrderItemOption>[] = [];

      if (item.options && item.options.length > 0) {
        const groupSelections = new Map<string, number>();

        for (const optDto of item.options) {
          const group = product.optionGroups?.find((g) => g.id === optDto.optionGroupId);
          if (!group) {
            throw new BadRequestException(
              `Option group ${optDto.optionGroupId} not found for product ${product.name}`,
            );
          }

          const option = group.options?.find((o) => o.id === optDto.optionId && o.isActive);
          if (!option) {
            throw new BadRequestException(
              `Option ${optDto.optionId} not found in group ${group.name}`,
            );
          }

          const count = (groupSelections.get(group.id) || 0) + 1;
          groupSelections.set(group.id, count);

          if (group.maxSelections && count > group.maxSelections) {
            throw new BadRequestException(
              `Maximum ${group.maxSelections} selections allowed for "${group.name}"`,
            );
          }

          optionPriceTotal = optionPriceTotal.plus(option.priceModifier);
          itemOptions.push({
            optionGroupName: group.name,
            optionName: option.name,
            priceModifier: Number(option.priceModifier),
          });
        }

        for (const group of product.optionGroups || []) {
          if (group.isRequired && !groupSelections.has(group.id)) {
            throw new BadRequestException(
              `Required option group "${group.name}" must have a selection`,
            );
          }
        }
      } else {
        for (const group of product.optionGroups || []) {
          if (group.isRequired) {
            throw new BadRequestException(
              `Required option group "${group.name}" must have a selection`,
            );
          }
        }
      }

      const unitPrice = new BigNumber(product.price).plus(optionPriceTotal);
      const itemSubtotal = unitPrice.times(item.quantity);
      subtotal = subtotal.plus(itemSubtotal);

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice.toNumber(),
        subtotal: itemSubtotal.toNumber(),
        notes: item.notes || item.customText,
      });
      itemOptionsMap.set(i, itemOptions);
    }

    let deliveryFee = new BigNumber(0);
    if (dto.fulfillmentType === 'delivery') {
      if (!dto.deliveryAddressId) {
        throw new BadRequestException('Delivery address is required for delivery orders');
      }
      if (!customerId) {
        throw new BadRequestException(
          'Delivery requires an authenticated customer with a saved address',
        );
      }
      const address = await this.addressRepo.findOne({
        where: { id: dto.deliveryAddressId, customerId },
      });
      if (!address) {
        throw new NotFoundException('Delivery address not found');
      }

      const zones = await this.deliveryZoneRepo.find({
        where: { locationId: dto.locationId, isActive: true },
      });
      if (zones.length > 0) {
        deliveryFee = new BigNumber(zones[0].deliveryFee);
        const minOrder = new BigNumber(zones[0].minimumOrder);
        if (minOrder.gt(0) && subtotal.lt(minOrder)) {
          throw new BadRequestException(
            `Minimum order amount for delivery is ${minOrder.toNumber()}`,
          );
        }
      }
    }

    const taxRate = new BigNumber(locationConfig.taxRate || 0.12);
    const taxableAmount = subtotal.plus(deliveryFee);
    const tax = taxableAmount.times(taxRate).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber();
    const tip = new BigNumber(dto.tip || 0);
    const total = taxableAmount.plus(tax).plus(tip).toNumber();

    const menuConfigs = await this.menuConfigRepo
      .createQueryBuilder('mc')
      .where('mc.menuId IN (:...menuIds)', {
        menuIds: locationMenuIds.size > 0 ? [...locationMenuIds] : ['00000000-0000-0000-0000-000000000000'],
      })
      .getMany();

    const requiresApproval = menuConfigs.some((mc) => mc.requiresApproval);
    const status = requiresApproval ? 'pending_approval' : 'pending';

    if (dto.scheduledDate && locationConfig.preorderEnabled) {
      const scheduledDate = new Date(dto.scheduledDate);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + locationConfig.preorderDaysAhead);
      if (scheduledDate > maxDate) {
        throw new BadRequestException(
          `Scheduled date cannot be more than ${locationConfig.preorderDaysAhead} days ahead`,
        );
      }
    }

    const orderNumber = `ONL-${Date.now().toString(36).toUpperCase()}`;

    const order = this.orderRepo.create({
      orderNumber,
      type: dto.fulfillmentType,
      fulfillmentType: dto.fulfillmentType,
      source: 'online',
      status,
      subtotal: subtotal.toNumber(),
      tax,
      total,
      discount: 0,
      notes: dto.notes,
      customerId: customerId || undefined,
      locationId: dto.locationId,
      requiresApproval,
      scheduledDate: dto.scheduledDate,
      scheduledTimeSlot: dto.scheduledTimeSlot,
      deliveryAddressId: dto.deliveryAddressId,
    });

    const savedOrder = await this.orderRepo.save(order);

    const savedItems: OrderItem[] = [];
    for (let i = 0; i < orderItems.length; i++) {
      const itemData = orderItems[i];
      const savedItem = await this.orderItemRepo.save(
        this.orderItemRepo.create({ ...itemData, orderId: savedOrder.id }),
      );
      savedItems.push(savedItem);

      const options = itemOptionsMap.get(i) || [];
      for (const optData of options) {
        await this.orderItemOptionRepo.save(
          this.orderItemOptionRepo.create({ ...optData, orderItemId: savedItem.id }),
        );
      }
    }

    this.eventEmitter.emit(DOMAIN_EVENTS.ONLINE_ORDER_CREATED, {
      order: savedOrder,
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      fulfillmentType: savedOrder.fulfillmentType,
      total: savedOrder.total,
      items: savedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    if (requiresApproval) {
      this.eventEmitter.emit(DOMAIN_EVENTS.ONLINE_ORDER_APPROVAL_NEEDED, {
        orderId: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        total: savedOrder.total,
      });
    }

    return this.findOne(savedOrder.id);
  }

  async findByCustomer(
    customerId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponseDto<Order>> {
    const [data, total] = await this.orderRepo.findAndCount({
      where: { customerId, source: 'online' },
      relations: ['items', 'items.product', 'items.options'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'items.options'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async cancelOrder(orderId: string, customerId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customerId) {
      throw new BadRequestException('You can only cancel your own orders');
    }
    if (order.status !== 'pending' && order.status !== 'pending_approval') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    const previousStatus = order.status;
    order.status = 'cancelled';
    const saved = await this.orderRepo.save(order);
    this.eventEmitter.emit(DOMAIN_EVENTS.ONLINE_ORDER_STATUS_CHANGED, {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      previousStatus,
      newStatus: 'cancelled',
    });
    return saved;
  }

  async findAllOnline(query: {
    status?: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponseDto<Order>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.options', 'options')
      .where('order.source = :source', { source: 'online' });

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }
    if (query.locationId) {
      qb.andWhere('order.locationId = :locationId', { locationId: query.locationId });
    }

    qb.orderBy('order.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async approveOrder(orderId: string, staffUserId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'pending_approval') {
      throw new BadRequestException('Order is not awaiting approval');
    }
    order.status = 'confirmed';
    order.approvedAt = new Date();
    order.approvedBy = staffUserId;
    const saved = await this.orderRepo.save(order);

    this.eventEmitter.emit(DOMAIN_EVENTS.ONLINE_ORDER_APPROVED, {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      approvedBy: staffUserId,
    });
    return saved;
  }

  async rejectOrder(orderId: string, staffUserId: string, reason?: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'pending_approval' && order.status !== 'pending') {
      throw new BadRequestException('Order cannot be rejected in current status');
    }
    const previousStatus = order.status;
    order.status = 'cancelled';
    const saved = await this.orderRepo.save(order);

    this.eventEmitter.emit(DOMAIN_EVENTS.ONLINE_ORDER_STATUS_CHANGED, {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      previousStatus,
      newStatus: 'cancelled',
      reason,
      rejectedBy: staffUserId,
    });
    return saved;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const previousStatus = order.status;
    order.status = status;
    const saved = await this.orderRepo.save(order);

    this.eventEmitter.emit(DOMAIN_EVENTS.ONLINE_ORDER_STATUS_CHANGED, {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      previousStatus,
      newStatus: status,
    });
    return saved;
  }
}
