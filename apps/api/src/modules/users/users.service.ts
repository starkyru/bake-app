import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private rolesService: RolesService,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResponseDto<User>> {
    const { page, limit, search, sortBy, sortOrder } = query;
    const qb = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    if (search) {
      qb.where('user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search',
        { search: `%${search}%` });
    }
    if (sortBy) {
      qb.orderBy(`user.${sortBy}`, sortOrder || 'ASC');
    } else {
      qb.orderBy('user.createdAt', 'DESC');
    }
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['role'] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.roleId);
    const role = isUuid
      ? await this.rolesService.findOne(dto.roleId)
      : await this.rolesService.findByName(dto.roleId);
    if (!role) throw new NotFoundException(`Role "${dto.roleId}" not found`);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role,
      locationId: dto.locationId,
    });
    return this.usersRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already exists');
    }

    // Build update fields — passwordHash requires special handling since select: false
    const updates: Partial<User> = {};
    if (dto.password) {
      updates.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.firstName) updates.firstName = dto.firstName;
    if (dto.lastName) updates.lastName = dto.lastName;
    if (dto.email) updates.email = dto.email;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.locationId !== undefined) updates.locationId = dto.locationId;
    if (dto.isActive !== undefined) updates.isActive = dto.isActive;
    if (dto.roleId) {
      updates.role = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.roleId)
        ? await this.rolesService.findOne(dto.roleId)
        : await this.rolesService.findByName(dto.roleId);
    }

    Object.assign(user, updates);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (user.role?.name === 'owner') {
      const ownerCount = await this.usersRepository.count({
        where: { role: { name: 'owner' } },
      });
      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot delete the last owner user');
      }
    }
    await this.usersRepository.remove(user);
  }
}
