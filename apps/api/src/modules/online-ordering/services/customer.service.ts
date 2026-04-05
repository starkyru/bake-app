import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerAddress } from '../entities/customer-address.entity';
import { Order } from '../../pos/entities/order.entity';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import {
  UpdateCustomerDto,
  CreateCustomerAddressDto,
  UpdateCustomerAddressDto,
} from '../dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(CustomerAddress) private addressRepo: Repository<CustomerAddress>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponseDto<Customer>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.customerRepo
      .createQueryBuilder('c')
      .where('c.isActive = true');

    if (query.search) {
      qb.andWhere(
        '(c.firstName ILIKE :s OR c.lastName ILIKE :s OR c.email ILIKE :s OR c.phone ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }

    qb.orderBy('c.createdAt', 'DESC');
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Customer & { recentOrders?: Order[] }> {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['addresses'],
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const recentOrders = await this.orderRepo.find({
      where: { customerId: id },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return { ...customer, recentOrders };
  }

  async lookupByPhoneOrEmail(query: {
    phone?: string;
    email?: string;
  }): Promise<Customer[]> {
    const qb = this.customerRepo.createQueryBuilder('c').where('c.isActive = true');

    if (query.phone) {
      qb.andWhere('c.phone = :phone', { phone: query.phone });
    }
    if (query.email) {
      qb.andWhere('c.email = :email', { email: query.email });
    }
    if (!query.phone && !query.email) {
      return [];
    }

    return qb.getMany();
  }

  async getProfile(customerId: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
      relations: ['addresses'],
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateProfile(customerId: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }

  async getAddresses(customerId: string): Promise<CustomerAddress[]> {
    return this.addressRepo.find({
      where: { customerId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async createAddress(
    customerId: string,
    dto: CreateCustomerAddressDto,
  ): Promise<CustomerAddress> {
    if (dto.isDefault) {
      await this.addressRepo.update({ customerId }, { isDefault: false });
    }
    return this.addressRepo.save(
      this.addressRepo.create({ ...dto, customerId }),
    );
  }

  async updateAddress(
    customerId: string,
    addressId: string,
    dto: UpdateCustomerAddressDto,
  ): Promise<CustomerAddress> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, customerId },
    });
    if (!address) throw new NotFoundException('Address not found');
    if (dto.isDefault) {
      await this.addressRepo.update({ customerId }, { isDefault: false });
    }
    Object.assign(address, dto);
    return this.addressRepo.save(address);
  }

  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, customerId },
    });
    if (!address) throw new NotFoundException('Address not found');
    await this.addressRepo.remove(address);
  }
}
