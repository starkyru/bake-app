import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Customer } from '../entities/customer.entity';
import {
  RegisterCustomerDto,
  LoginCustomerDto,
  SocialLoginDto,
  VerifyPhoneOtpDto,
  GuestSessionDto,
} from '../dto/customer-auth.dto';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const MAX_OTP_ATTEMPTS = 3;

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name);
  private readonly otpStore = new Map<string, OtpEntry>();
  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterCustomerDto) {
    const existing = await this.customersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const customer = this.customersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      authProvider: 'local',
    });
    await this.customersRepository.save(customer);

    return this.generateTokens(customer);
  }

  async login(dto: LoginCustomerDto) {
    const customer = await this.customersRepository
      .createQueryBuilder('c')
      .addSelect('c.passwordHash')
      .where('c.email = :email', { email: dto.email })
      .getOne();

    if (!customer || !customer.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.generateTokens(customer);
  }

  async socialLogin(dto: SocialLoginDto) {
    let customer = await this.customersRepository.findOne({
      where: { socialId: dto.token, authProvider: dto.provider },
    });

    if (!customer && dto.email) {
      customer = await this.customersRepository.findOne({
        where: { email: dto.email },
      });

      if (customer) {
        customer.socialId = dto.token;
        customer.authProvider = dto.provider;
        await this.customersRepository.save(customer);
      }
    }

    if (!customer) {
      customer = this.customersRepository.create({
        email: dto.email,
        firstName: dto.firstName || '',
        lastName: dto.lastName || '',
        socialId: dto.token,
        authProvider: dto.provider,
      });
      await this.customersRepository.save(customer);
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.generateTokens(customer);
  }

  async sendPhoneOtp(phone: string) {
    this.cleanExpiredOtps();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(phone, {
      code,
      expiresAt: Date.now() + this.OTP_TTL_MS,
      attempts: 0,
    });

    // TODO: Replace with actual SMS provider integration
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`OTP for ${phone}: ${code}`);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyPhoneOtp(dto: VerifyPhoneOtpDto) {
    const entry = this.otpStore.get(dto.phone);
    if (!entry || entry.expiresAt < Date.now()) {
      this.otpStore.delete(dto.phone);
      throw new BadRequestException('OTP expired or not found');
    }

    if (entry.code !== dto.code) {
      entry.attempts += 1;
      if (entry.attempts >= MAX_OTP_ATTEMPTS) {
        this.otpStore.delete(dto.phone);
        throw new BadRequestException('Too many failed attempts. Please request a new OTP');
      }
      throw new BadRequestException('Invalid OTP code');
    }

    this.otpStore.delete(dto.phone);

    let customer = await this.customersRepository.findOne({
      where: { phone: dto.phone },
    });

    if (!customer) {
      customer = this.customersRepository.create({
        phone: dto.phone,
        firstName: '',
        lastName: '',
        authProvider: 'phone',
        isPhoneVerified: true,
      });
      await this.customersRepository.save(customer);
    } else {
      customer.isPhoneVerified = true;
      await this.customersRepository.save(customer);
    }

    return this.generateTokens(customer);
  }

  async createGuestSession(dto: GuestSessionDto) {
    const customer = this.customersRepository.create({
      email: dto.email,
      phone: dto.phone,
      firstName: 'Guest',
      lastName: '',
      isGuest: true,
      authProvider: 'local',
    });
    await this.customersRepository.save(customer);

    return this.generateTokens(customer);
  }

  private generateTokens(customer: Customer) {
    const payload = {
      sub: customer.id,
      email: customer.email,
      phone: customer.phone,
      firstName: customer.firstName,
      lastName: customer.lastName,
      isGuest: customer.isGuest,
      type: 'customer',
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        isGuest: customer.isGuest,
      },
    };
  }

  private cleanExpiredOtps() {
    const now = Date.now();
    for (const [phone, entry] of this.otpStore.entries()) {
      if (entry.expiresAt < now) {
        this.otpStore.delete(phone);
      }
    }
  }
}
