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
    const role = await this.rolesService.findOne(dto.roleId);
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
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.email && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.roleId && { role: await this.rolesService.findOne(dto.roleId) }),
      ...(dto.locationId !== undefined && { locationId: dto.locationId }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
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
