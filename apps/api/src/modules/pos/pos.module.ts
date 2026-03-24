import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Menu } from './entities/menu.entity';
import { MenuProduct } from './entities/menu-product.entity';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, Order, OrderItem, Payment, Menu, MenuProduct])],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
