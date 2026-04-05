import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOptionGroup } from '../entities/product-option-group.entity';
import { ProductOption } from '../entities/product-option.entity';

@Injectable()
export class ProductOptionService {
  constructor(
    @InjectRepository(ProductOptionGroup) private groupRepo: Repository<ProductOptionGroup>,
    @InjectRepository(ProductOption) private optionRepo: Repository<ProductOption>,
  ) {}

  async getGroups(productId: string): Promise<ProductOptionGroup[]> {
    return this.groupRepo.find({
      where: { productId },
      relations: ['options'],
      order: { sortOrder: 'ASC' },
    });
  }

  async createGroup(
    productId: string,
    dto: { name: string; type?: string; isRequired?: boolean; sortOrder?: number; maxSelections?: number },
  ): Promise<ProductOptionGroup> {
    return this.groupRepo.save(
      this.groupRepo.create({ productId, ...dto }),
    );
  }

  async updateGroup(
    groupId: string,
    dto: { name?: string; type?: string; isRequired?: boolean; sortOrder?: number; maxSelections?: number },
  ): Promise<ProductOptionGroup> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Option group not found');
    Object.assign(group, dto);
    return this.groupRepo.save(group);
  }

  async deleteGroup(groupId: string): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Option group not found');
    await this.groupRepo.remove(group);
  }

  async createOption(
    groupId: string,
    dto: { name: string; priceModifier?: number; isDefault?: boolean; sortOrder?: number },
  ): Promise<ProductOption> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Option group not found');
    return this.optionRepo.save(
      this.optionRepo.create({ groupId, ...dto }),
    );
  }

  async updateOption(
    optionId: string,
    dto: { name?: string; priceModifier?: number; isDefault?: boolean; isActive?: boolean; sortOrder?: number },
  ): Promise<ProductOption> {
    const option = await this.optionRepo.findOne({ where: { id: optionId } });
    if (!option) throw new NotFoundException('Option not found');
    Object.assign(option, dto);
    return this.optionRepo.save(option);
  }

  async deleteOption(optionId: string): Promise<void> {
    const option = await this.optionRepo.findOne({ where: { id: optionId } });
    if (!option) throw new NotFoundException('Option not found');
    await this.optionRepo.remove(option);
  }
}
