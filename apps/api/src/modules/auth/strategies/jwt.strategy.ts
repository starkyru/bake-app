import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RolePermission } from '../../permissions/entities/role-permission.entity';
import { UserPermission } from '../../permissions/entities/user-permission.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private userPermissionRepository: Repository<UserPermission>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      relations: ['role'],
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Admin bypass — no need to compute permissions
    if (user.role?.isAdmin) {
      return user;
    }

    // Compute effective permissions
    const rolePerms = await this.rolePermissionRepository.find({
      where: { roleId: user.role?.id },
      relations: ['permission'],
    });

    const userOverrides = await this.userPermissionRepository.find({
      where: { userId: user.id },
      relations: ['permission'],
    });

    const permissions = new Set<string>();

    // Add role permissions
    for (const rp of rolePerms) {
      permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
    }

    // Apply user overrides
    for (const up of userOverrides) {
      const key = `${up.permission.resource}:${up.permission.action}`;
      if (up.grantType === 'grant') {
        permissions.add(key);
      } else {
        permissions.delete(key);
      }
    }

    user.effectivePermissions = permissions;
    return user;
  }
}
