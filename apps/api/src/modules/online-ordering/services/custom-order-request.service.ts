import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomOrderRequest } from '../entities/custom-order-request.entity';
import { CreateCustomOrderRequestDto, QuoteCustomOrderDto } from '../dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class CustomOrderRequestService {
  constructor(
    @InjectRepository(CustomOrderRequest) private requestRepo: Repository<CustomOrderRequest>,
  ) {}

  async findAll(query: {
    status?: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponseDto<CustomOrderRequest>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.requestRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.customer', 'customer')
      .leftJoinAndSelect('r.location', 'location');

    if (query.status) {
      qb.andWhere('r.status = :status', { status: query.status });
    }
    if (query.locationId) {
      qb.andWhere('r.locationId = :locationId', { locationId: query.locationId });
    }

    qb.orderBy('r.createdAt', 'DESC');
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<CustomOrderRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['customer', 'location'],
    });
    if (!request) throw new NotFoundException('Custom order request not found');
    return request;
  }

  async quote(id: string, dto: QuoteCustomOrderDto): Promise<CustomOrderRequest> {
    const request = await this.findOne(id);
    if (request.status !== 'submitted' && request.status !== 'reviewed') {
      throw new BadRequestException('Request cannot be quoted in current status');
    }
    request.quotedPrice = dto.quotedPrice;
    request.deposit = dto.deposit ?? null;
    request.staffNotes = dto.staffNotes ?? request.staffNotes;
    request.status = 'quoted';
    return this.requestRepo.save(request);
  }

  async assignStaff(id: string, userId: string): Promise<CustomOrderRequest> {
    const request = await this.findOne(id);
    request.assignedUserId = userId;
    request.status = 'reviewed';
    return this.requestRepo.save(request);
  }

  async updateStatus(id: string, status: string): Promise<CustomOrderRequest> {
    const request = await this.findOne(id);
    request.status = status;
    return this.requestRepo.save(request);
  }

  async create(
    customerId: string,
    dto: CreateCustomOrderRequestDto,
  ): Promise<CustomOrderRequest> {
    return this.requestRepo.save(
      this.requestRepo.create({ ...dto, customerId }),
    );
  }

  async findByCustomer(customerId: string): Promise<CustomOrderRequest[]> {
    return this.requestRepo.find({
      where: { customerId },
      relations: ['location'],
      order: { createdAt: 'DESC' },
    });
  }

  async customerApprove(id: string, customerId: string): Promise<CustomOrderRequest> {
    const request = await this.findOne(id);
    if (request.customerId !== customerId) {
      throw new BadRequestException('You can only manage your own requests');
    }
    if (request.status !== 'quoted') {
      throw new BadRequestException('Only quoted requests can be approved');
    }
    request.status = 'approved';
    return this.requestRepo.save(request);
  }

  async customerReject(id: string, customerId: string): Promise<CustomOrderRequest> {
    const request = await this.findOne(id);
    if (request.customerId !== customerId) {
      throw new BadRequestException('You can only manage your own requests');
    }
    if (request.status !== 'quoted') {
      throw new BadRequestException('Only quoted requests can be rejected');
    }
    request.status = 'rejected';
    return this.requestRepo.save(request);
  }
}
