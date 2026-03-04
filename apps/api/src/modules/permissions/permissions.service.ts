import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignRolePermissionsDto,
  AssignUserPermissionDto,
} from './dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private userPermissionRepository: Repository<UserPermission>,
  ) {}

  // --- Permission CRUD ---

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({ order: { resource: 'ASC', action: 'ASC' } });
  }

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const existing = await this.permissionRepository.findOne({
      where: { resource: dto.resource, action: dto.action },
    });
    if (existing) {
      throw new ConflictException(
        `Permission ${dto.resource}:${dto.action} already exists`,
      );
    }
    const permission = this.permissionRepository.create(dto);
    return this.permissionRepository.save(permission);
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    Object.assign(permission, dto);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const result = await this.permissionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Permission not found');
    }
  }

  // --- Role Permissions ---

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rolePerms = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });
    return rolePerms.map((rp) => rp.permission);
  }

  async setRolePermissions(
    roleId: string,
    dto: AssignRolePermissionsDto,
  ): Promise<Permission[]> {
    // Remove existing
    await this.rolePermissionRepository.delete({ roleId });

    // Insert new
    if (dto.permissionIds.length > 0) {
      const entities = dto.permissionIds.map((permissionId) =>
        this.rolePermissionRepository.create({ roleId, permissionId }),
      );
      await this.rolePermissionRepository.save(entities);
    }

    return this.getRolePermissions(roleId);
  }

  // --- User Permission Overrides ---

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return this.userPermissionRepository.find({
      where: { userId },
      relations: ['permission'],
    });
  }

  async addUserPermission(
    userId: string,
    dto: AssignUserPermissionDto,
  ): Promise<UserPermission> {
    const existing = await this.userPermissionRepository.findOne({
      where: { userId, permissionId: dto.permissionId },
    });
    if (existing) {
      existing.grantType = dto.grantType;
      return this.userPermissionRepository.save(existing);
    }
    const entity = this.userPermissionRepository.create({
      userId,
      permissionId: dto.permissionId,
      grantType: dto.grantType,
    });
    return this.userPermissionRepository.save(entity);
  }

  async removeUserPermission(userId: string, permissionId: string): Promise<void> {
    const result = await this.userPermissionRepository.delete({
      userId,
      permissionId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('User permission override not found');
    }
  }

  // --- Effective Permissions ---

  async getEffectivePermissions(
    userId: string,
    roleId?: string,
  ): Promise<Set<string>> {
    const rolePerms = roleId
      ? await this.rolePermissionRepository.find({
          where: { roleId },
          relations: ['permission'],
        })
      : [];

    const userOverrides = await this.userPermissionRepository.find({
      where: { userId },
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
    return permissions;
  }
}
