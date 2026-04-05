import { IsEmail, IsString, IsOptional, IsIn, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterCustomerDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePass123' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: '+380501234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'Invalid phone number format' })
  phone?: string;
}

export class LoginCustomerDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePass123' })
  @IsString()
  password: string;
}

export class SocialLoginDto {
  @ApiProperty({ enum: ['google', 'apple'] })
  @IsIn(['google', 'apple'], { message: 'Provider must be google or apple' })
  provider: string;

  @ApiProperty({ description: 'Social provider token/ID' })
  @IsString()
  @MaxLength(2048)
  token: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class SendPhoneOtpDto {
  @ApiProperty({ example: '+380501234567' })
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'Invalid phone number format' })
  phone: string;
}

export class VerifyPhoneOtpDto {
  @ApiProperty({ example: '+380501234567' })
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MaxLength(6)
  code: string;
}

export class GuestSessionDto {
  @ApiPropertyOptional({ example: 'guest@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+380501234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}
