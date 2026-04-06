import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CustomerAuthService } from './customer-auth.service';
import { Customer } from '../entities/customer.entity';

jest.mock('bcryptjs');

describe('CustomerAuthService', () => {
  let service: CustomerAuthService;
  let customerRepo: Record<string, jest.Mock>;
  let queryBuilder: Record<string, jest.Mock>;
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };

  const mockCustomer: Partial<Customer> = {
    id: 'cust-1',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+380501234567',
    isGuest: false,
    isActive: true,
    authProvider: 'local',
  };

  beforeEach(async () => {
    queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    customerRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => ({ id: 'cust-new', isActive: true, isGuest: false, ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerAuthService,
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<CustomerAuthService>(CustomerAuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should create a customer with hashed password and return tokens', async () => {
      customerRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(customerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          passwordHash: 'hashed-pw',
          firstName: 'Jane',
          lastName: 'Doe',
          authProvider: 'local',
        }),
      );
      expect(customerRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.customer).toHaveProperty('email', 'new@example.com');
    });

    it('should reject duplicate email with ConflictException', async () => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should succeed with correct credentials', async () => {
      queryBuilder.getOne.mockResolvedValue(mockCustomer);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct-pass',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.customer.id).toBe('cust-1');
    });

    it('should fail with wrong password', async () => {
      queryBuilder.getOne.mockResolvedValue(mockCustomer);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong-pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should fail with non-existent email', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should fail for deactivated account', async () => {
      queryBuilder.getOne.mockResolvedValue({ ...mockCustomer, isActive: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@example.com', password: 'correct-pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('socialLogin', () => {
    it('should create new customer for new social ID', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      jest.spyOn(service as any, 'verifySocialToken').mockResolvedValue({
        provider: 'google',
        subject: 'google-sub-123',
        email: 'social@example.com',
        emailVerified: true,
        firstName: 'Social',
        lastName: 'User',
      });

      const result = await service.socialLogin({
        provider: 'google',
        token: 'google-id-123',
      });

      expect(customerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          socialId: 'google-sub-123',
          authProvider: 'google',
        }),
      );
      expect(result).toHaveProperty('accessToken');
    });

    it('should return existing customer for known social ID', async () => {
      queryBuilder.getOne.mockResolvedValue(mockCustomer);
      jest.spyOn(service as any, 'verifySocialToken').mockResolvedValue({
        provider: 'google',
        subject: 'google-sub-123',
        email: 'test@example.com',
        emailVerified: true,
      });

      const result = await service.socialLogin({
        provider: 'google',
        token: 'google-id-123',
      });

      expect(customerRepo.create).not.toHaveBeenCalled();
      expect(result.customer.id).toBe('cust-1');
    });

    it('should link social account to existing email customer', async () => {
      // First call (socialId lookup) returns null, second (email lookup) returns customer
      queryBuilder.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockCustomer });
      jest.spyOn(service as any, 'verifySocialToken').mockResolvedValue({
        provider: 'google',
        subject: 'new-social-sub',
        email: 'test@example.com',
        emailVerified: true,
      });

      const result = await service.socialLogin({
        provider: 'google',
        token: 'new-social-id',
      });

      expect(customerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ socialId: 'new-social-sub', authProvider: 'google' }),
      );
      expect(result.customer.id).toBe('cust-1');
    });
  });

  describe('sendPhoneOtp', () => {
    it('should store OTP and return success message', async () => {
      const result = await service.sendPhoneOtp('+380501234567');

      expect(result).toEqual({ message: 'OTP sent successfully' });
    });
  });

  describe('verifyPhoneOtp', () => {
    it('should succeed with correct code', async () => {
      // First send OTP to populate store
      await service.sendPhoneOtp('+380501234567');

      // Access the OTP from the private map via reflection
      const otpStore = (service as any).otpStore as Map<string, { code: string; expiresAt: number }>;
      const entry = otpStore.get('+380501234567');
      expect(entry).toBeDefined();

      customerRepo.findOne.mockResolvedValue(null);

      const result = await service.verifyPhoneOtp({
        phone: '+380501234567',
        code: entry!.code,
      });

      expect(result).toHaveProperty('accessToken');
    });

    it('should fail with wrong code', async () => {
      await service.sendPhoneOtp('+380501234567');

      await expect(
        service.verifyPhoneOtp({ phone: '+380501234567', code: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail with expired OTP', async () => {
      const otpStore = (service as any).otpStore as Map<string, { code: string; expiresAt: number }>;
      otpStore.set('+380501234567', { code: '123456', expiresAt: Date.now() - 1000 });

      await expect(
        service.verifyPhoneOtp({ phone: '+380501234567', code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createGuestSession', () => {
    it('should create guest customer with isGuest=true', async () => {
      const result = await service.createGuestSession({
        email: 'guest@example.com',
        phone: '+380501234567',
      });

      expect(customerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isGuest: true,
          firstName: 'Guest',
          authProvider: 'local',
        }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result.customer.isGuest).toBe(true);
    });

    it('should create guest session without email or phone', async () => {
      const result = await service.createGuestSession({});

      expect(customerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isGuest: true }),
      );
      expect(result).toHaveProperty('accessToken');
    });
  });
});
