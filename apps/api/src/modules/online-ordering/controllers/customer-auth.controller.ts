import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomerAuthService } from '../services/customer-auth.service';
import {
  RegisterCustomerDto,
  LoginCustomerDto,
  SocialLoginDto,
  VerifyPhoneOtpDto,
  GuestSessionDto,
  SendPhoneOtpDto,
} from '../dto/customer-auth.dto';

@ApiTags('Storefront Auth')
@Controller('api/v1/storefront/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new customer' })
  async register(@Body() dto: RegisterCustomerDto) {
    return this.customerAuthService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Customer login' })
  async login(@Body() dto: LoginCustomerDto) {
    return this.customerAuthService.login(dto);
  }

  @Post('social-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Social login (Google/Apple)' })
  async socialLogin(@Body() dto: SocialLoginDto) {
    return this.customerAuthService.socialLogin(dto);
  }

  @Post('phone-verify/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Send OTP to phone number' })
  async sendPhoneOtp(@Body() dto: SendPhoneOtpDto) {
    return this.customerAuthService.sendPhoneOtp(dto.phone);
  }

  @Post('phone-verify/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify phone OTP' })
  async verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto) {
    return this.customerAuthService.verifyPhoneOtp(dto);
  }

  @Post('guest')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create guest session' })
  async createGuestSession(@Body() dto: GuestSessionDto) {
    return this.customerAuthService.createGuestSession(dto);
  }
}
