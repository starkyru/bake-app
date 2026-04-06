import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createPublicKey, verify as verifySignature } from 'crypto';
import type { JsonWebKey as CryptoJsonWebKey } from 'crypto';
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

interface VerifiedSocialProfile {
  provider: 'google' | 'apple';
  subject: string;
  email?: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
}

interface AppleJwk {
  kid: string;
  [key: string]: unknown;
}

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
    const profile = await this.verifySocialToken(dto);

    let customer = await this.customersRepository
      .createQueryBuilder('c')
      .addSelect('c.socialId')
      .where('c.socialId = :socialId', { socialId: profile.subject })
      .andWhere('c.authProvider = :provider', { provider: profile.provider })
      .getOne();

    if (!customer && profile.email) {
      customer = await this.customersRepository
        .createQueryBuilder('c')
        .addSelect('c.socialId')
        .where('c.email = :email', { email: profile.email })
        .getOne();

      if (customer) {
        if (!profile.emailVerified) {
          throw new UnauthorizedException('Social login email is not verified');
        }

        const hasConflictingSocialLink =
          !!customer.socialId &&
          (customer.socialId !== profile.subject || customer.authProvider !== profile.provider);
        if (hasConflictingSocialLink) {
          throw new UnauthorizedException('Account is already linked to a different social login');
        }

        customer.socialId = profile.subject;
        customer.authProvider = profile.provider;
        if (!customer.email && profile.email) {
          customer.email = profile.email;
        }
        if (!customer.firstName && profile.firstName) {
          customer.firstName = profile.firstName;
        }
        if (!customer.lastName && profile.lastName) {
          customer.lastName = profile.lastName;
        }
        customer.isEmailVerified = customer.isEmailVerified || profile.emailVerified;
        await this.customersRepository.save(customer);
      }
    }

    if (!customer) {
      if (!profile.email) {
        throw new BadRequestException('Social login token did not include an email address');
      }
      if (!profile.emailVerified) {
        throw new UnauthorizedException('Social login email is not verified');
      }

      customer = this.customersRepository.create({
        email: profile.email,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        socialId: profile.subject,
        authProvider: profile.provider,
        isEmailVerified: profile.emailVerified,
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

  private async verifySocialToken(dto: SocialLoginDto): Promise<VerifiedSocialProfile> {
    switch (dto.provider) {
      case 'google':
        return this.verifyGoogleToken(dto.token);
      case 'apple':
        return this.verifyAppleToken(dto.token);
      default:
        throw new BadRequestException('Unsupported social login provider');
    }
  }

  private async verifyGoogleToken(idToken: string): Promise<VerifiedSocialProfile> {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new InternalServerErrorException('GOOGLE_CLIENT_ID is not configured');
    }

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google login token');
    }

    const payload = (await response.json()) as Record<string, string>;
    const issuer = payload.iss;
    const audience = payload.aud;
    const expiresAt = Number(payload.exp || 0) * 1000;

    if (
      (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') ||
      audience !== googleClientId ||
      !payload.sub ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      throw new UnauthorizedException('Google login token validation failed');
    }

    return {
      provider: 'google',
      subject: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === 'true',
      firstName: payload.given_name,
      lastName: payload.family_name,
    };
  }

  private async verifyAppleToken(identityToken: string): Promise<VerifiedSocialProfile> {
    const appleClientId = this.configService.get<string>('APPLE_CLIENT_ID');
    if (!appleClientId) {
      throw new InternalServerErrorException('APPLE_CLIENT_ID is not configured');
    }

    const parts = identityToken.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid Apple login token');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = JSON.parse(this.decodeBase64Url(encodedHeader)) as { alg?: string; kid?: string };
    const payload = JSON.parse(this.decodeBase64Url(encodedPayload)) as Record<string, unknown>;

    if (header.alg !== 'RS256' || !header.kid) {
      throw new UnauthorizedException('Unsupported Apple token algorithm');
    }

    const jwksResponse = await fetch('https://appleid.apple.com/auth/keys');
    if (!jwksResponse.ok) {
      throw new UnauthorizedException('Unable to verify Apple login token');
    }

    const jwks = (await jwksResponse.json()) as { keys?: AppleJwk[] };
    const jwk = jwks.keys?.find((key) => key.kid === header.kid);
    if (!jwk) {
      throw new UnauthorizedException('Unable to verify Apple login token');
    }

    const publicKey = createPublicKey({ key: jwk as CryptoJsonWebKey, format: 'jwk' });
    const signedData = `${encodedHeader}.${encodedPayload}`;
    const signature = this.base64UrlToBuffer(encodedSignature);
    const isValid = verifySignature('RSA-SHA256', Buffer.from(signedData), publicKey, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid Apple login token');
    }

    const issuer = payload.iss;
    const audience = payload.aud;
    const subject = payload.sub;
    const expiresAt = Number(payload.exp || 0) * 1000;

    if (
      issuer !== 'https://appleid.apple.com' ||
      audience !== appleClientId ||
      typeof subject !== 'string' ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      throw new UnauthorizedException('Apple login token validation failed');
    }

    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

    return {
      provider: 'apple',
      subject,
      email,
      emailVerified,
    };
  }

  private decodeBase64Url(value: string): string {
    return this.base64UrlToBuffer(value).toString('utf8');
  }

  private base64UrlToBuffer(value: string): Buffer {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return Buffer.from(padded, 'base64');
  }
}
