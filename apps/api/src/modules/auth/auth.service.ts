import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
      relations: ['role'],
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    return this.generateTokens(user);
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.roleId ? { id: dto.roleId } as any : undefined,
    });
    await this.usersRepository.save(user);
    const savedUser = await this.usersRepository.findOne({
      where: { id: user.id },
      relations: ['role'],
    });
    return this.generateTokens(savedUser!);
  }

  async refreshToken(token: string): Promise<AuthResponseDto> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash, revoked: false },
      relations: ['user', 'user.role'],
    });
    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    refreshToken.revoked = true;
    await this.refreshTokenRepository.save(refreshToken);
    return this.generateTokens(refreshToken.user);
  }

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshTokenStr = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(refreshTokenStr).digest('hex');
    const refreshToken = this.refreshTokenRepository.create({
      tokenHash,
      user,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.refreshTokenRepository.save(refreshToken);
    return {
      accessToken,
      refreshToken: refreshTokenStr,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name || '',
      },
    };
  }
}
