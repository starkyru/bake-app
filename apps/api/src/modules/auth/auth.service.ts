import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RolePermission } from '../permissions/entities/role-permission.entity';
import { UserPermission } from '../permissions/entities/user-permission.entity';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private userPermissionRepository: Repository<UserPermission>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .leftJoinAndSelect('u.role', 'role')
      .where('u.email = :email', { email: dto.email })
      .getOne();
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

  private async computePermissions(user: User): Promise<string[]> {
    if (user.role?.isAdmin) {
      return ['*'];
    }

    const rolePerms = user.role
      ? await this.rolePermissionRepository.find({
          where: { roleId: user.role.id },
          relations: ['permission'],
        })
      : [];

    const userOverrides = await this.userPermissionRepository.find({
      where: { userId: user.id },
      relations: ['permission'],
    });

    const permissions = new Set<string>();
    for (const rp of rolePerms) {
      permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
    }
    for (const up of userOverrides) {
      const key = `${up.permission.resource}:${up.permission.action}`;
      if (up.grantType === 'grant') {
        permissions.add(key);
      } else {
        permissions.delete(key);
      }
    }
    return Array.from(permissions);
  }

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const permissions = await this.computePermissions(user);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name || '',
      name: `${user.firstName} ${user.lastName}`.trim(),
      permissions,
    };
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
