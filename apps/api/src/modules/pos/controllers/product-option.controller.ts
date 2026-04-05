import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { ProductOptionService } from '../services/product-option.service';
import {
  CreateProductOptionGroupDto,
  UpdateProductOptionGroupDto,
  CreateProductOptionDto,
  UpdateProductOptionDto,
} from '../dto/product-option.dto';

@ApiTags('Product Options')
@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductOptionController {
  constructor(private productOptionService: ProductOptionService) {}

  @Get(':id/option-groups')
  @RequirePermissions('products:read')
  @ApiOperation({ summary: 'Get option groups for a product' })
  getGroups(@Param('id') id: string) {
    return this.productOptionService.getGroups(id);
  }

  @Post(':id/option-groups')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Create option group for a product' })
  createGroup(@Param('id') id: string, @Body() dto: CreateProductOptionGroupDto) {
    return this.productOptionService.createGroup(id, dto);
  }

  @Put(':id/option-groups/:groupId')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Update option group' })
  updateGroup(@Param('groupId') groupId: string, @Body() dto: UpdateProductOptionGroupDto) {
    return this.productOptionService.updateGroup(groupId, dto);
  }

  @Delete(':id/option-groups/:groupId')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Delete option group' })
  deleteGroup(@Param('groupId') groupId: string) {
    return this.productOptionService.deleteGroup(groupId);
  }

  @Post(':id/option-groups/:groupId/options')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Create option in group' })
  createOption(@Param('groupId') groupId: string, @Body() dto: CreateProductOptionDto) {
    return this.productOptionService.createOption(groupId, dto);
  }

  @Put(':id/option-groups/:groupId/options/:optionId')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Update option' })
  updateOption(@Param('optionId') optionId: string, @Body() dto: UpdateProductOptionDto) {
    return this.productOptionService.updateOption(optionId, dto);
  }

  @Delete(':id/option-groups/:groupId/options/:optionId')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Delete option' })
  deleteOption(@Param('optionId') optionId: string) {
    return this.productOptionService.deleteOption(optionId);
  }
}
