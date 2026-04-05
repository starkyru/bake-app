import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomOrderRequestService } from './custom-order-request.service';
import { CustomOrderRequest } from '../entities/custom-order-request.entity';

describe('CustomOrderRequestService', () => {
  let service: CustomOrderRequestService;
  let requestRepo: Record<string, jest.Mock>;

  const mockRequest: Partial<CustomOrderRequest> = {
    id: 'req-1',
    customerId: 'cust-1',
    locationId: 'loc-1',
    status: 'submitted',
    occasion: 'Birthday',
    servingSize: '12 people',
    inscriptionText: 'Happy Birthday!',
    quotedPrice: null as any,
    deposit: null as any,
    staffNotes: null as any,
  };

  beforeEach(async () => {
    requestRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => ({ id: 'req-new', status: 'submitted', ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomOrderRequestService,
        { provide: getRepositoryToken(CustomOrderRequest), useValue: requestRepo },
      ],
    }).compile();

    service = module.get<CustomOrderRequestService>(CustomOrderRequestService);
  });

  describe('create', () => {
    it('should create request with customerId', async () => {
      const result = await service.create('cust-1', {
        locationId: 'loc-1',
        occasion: 'Wedding',
        servingSize: '50 people',
      });

      expect(requestRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          locationId: 'loc-1',
          occasion: 'Wedding',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('quote', () => {
    it('should set quotedPrice and status=quoted', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest });

      const result = await service.quote('req-1', {
        quotedPrice: 1500,
        deposit: 500,
        staffNotes: 'Confirmed ingredients availability',
      });

      expect(result.quotedPrice).toBe(1500);
      expect(result.deposit).toBe(500);
      expect(result.status).toBe('quoted');
      expect(result.staffNotes).toBe('Confirmed ingredients availability');
    });

    it('should reject quoting a request in wrong status', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'approved' });

      await expect(
        service.quote('req-1', { quotedPrice: 1500 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow quoting a reviewed request', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'reviewed' });

      const result = await service.quote('req-1', { quotedPrice: 2000 });

      expect(result.status).toBe('quoted');
    });
  });

  describe('customerApprove', () => {
    it('should set status=approved for owned request', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'quoted' });

      const result = await service.customerApprove('req-1', 'cust-1');

      expect(result.status).toBe('approved');
    });

    it('should reject if customer does not own request', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'quoted' });

      await expect(
        service.customerApprove('req-1', 'cust-other'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if request is not quoted', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'submitted' });

      await expect(
        service.customerApprove('req-1', 'cust-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('customerReject', () => {
    it('should set status=rejected for owned quoted request', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'quoted' });

      const result = await service.customerReject('req-1', 'cust-1');

      expect(result.status).toBe('rejected');
    });

    it('should reject if customer does not own request', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'quoted' });

      await expect(
        service.customerReject('req-1', 'cust-other'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if request is not quoted', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'submitted' });

      await expect(
        service.customerReject('req-1', 'cust-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return request with relations', async () => {
      requestRepo.findOne.mockResolvedValue(mockRequest);

      const result = await service.findOne('req-1');

      expect(requestRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        relations: ['customer', 'location'],
      });
      expect(result.id).toBe('req-1');
    });

    it('should throw NotFoundException when not found', async () => {
      requestRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('req-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCustomer', () => {
    it('should return requests ordered by createdAt DESC', async () => {
      requestRepo.find.mockResolvedValue([mockRequest]);

      const result = await service.findByCustomer('cust-1');

      expect(requestRepo.find).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        relations: ['location'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });
});
