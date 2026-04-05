import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Menu } from './entities/menu.entity';
import { MenuProduct } from './entities/menu-product.entity';
import { ProductOptionGroup } from './entities/product-option-group.entity';
import { ProductOption } from './entities/product-option.entity';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { ProductOptionService } from './services/product-option.service';
import { ProductOptionController } from './controllers/product-option.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, Order, OrderItem, Payment, Menu, MenuProduct, ProductOptionGroup, ProductOption])],
  controllers: [PosController, ProductOptionController],
  providers: [PosService, ProductOptionService],
  exports: [PosService, TypeOrmModule],
})
export class PosModule {}
