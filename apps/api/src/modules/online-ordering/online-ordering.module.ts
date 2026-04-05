import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { LocationMenu } from './entities/location-menu.entity';
import { MenuSchedule } from './entities/menu-schedule.entity';
import { MenuTag } from './entities/menu-tag.entity';
import { MenuConfig } from './entities/menu-config.entity';
import { LocationConfig } from './entities/location-config.entity';
import { OrderItemOption } from './entities/order-item-option.entity';
import { CustomOrderRequest } from './entities/custom-order-request.entity';
import { CustomerNotificationSubscription } from './entities/customer-notification-subscription.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { StorefrontConfig } from './entities/storefront-config.entity';
import { StorefrontPaymentConfig } from './entities/storefront-payment-config.entity';
import { Menu } from '../pos/entities/menu.entity';
import { Order } from '../pos/entities/order.entity';
import { OrderItem } from '../pos/entities/order-item.entity';
import { Product } from '../pos/entities/product.entity';
import { ProductOptionGroup } from '../pos/entities/product-option-group.entity';
import { ProductOption } from '../pos/entities/product-option.entity';
import { Location } from '../inventory/entities/location.entity';
import { PosModule } from '../pos/pos.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentProvidersModule } from '../payment-providers/payment-providers.module';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { CustomerAuthService } from './services/customer-auth.service';
import { OnlineOrderService } from './services/online-order.service';
import { CustomerService } from './services/customer.service';
import { CustomOrderRequestService } from './services/custom-order-request.service';
import { StorefrontConfigService } from './services/storefront-config.service';
import { DeliveryZoneService } from './services/delivery-zone.service';
import { LocationConfigService } from './services/location-config.service';
import { MenuConfigService } from './services/menu-config.service';
import { OnlineMenuService } from './services/online-menu.service';
import { CustomerAuthController } from './controllers/customer-auth.controller';
import { OnlineMenuController } from './controllers/online-menu.controller';
import { CustomerController } from './controllers/customer.controller';
import { CustomOrderRequestController } from './controllers/custom-order-request.controller';
import { StorefrontPublicController } from './controllers/storefront-public.controller';
import { AdminOnlineOrdersController } from './controllers/admin-online-orders.controller';
import { AdminLocationConfigController } from './controllers/admin-location-config.controller';
import { AdminMenuConfigController } from './controllers/admin-menu-config.controller';
import { AdminStorefrontController } from './controllers/admin-storefront.controller';
import { AdminCustomersController } from './controllers/admin-customers.controller';
import { AdminCustomOrdersController } from './controllers/admin-custom-orders.controller';
import { StorefrontOrderController } from './controllers/storefront-order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerAddress,
      LocationMenu,
      MenuSchedule,
      MenuTag,
      MenuConfig,
      LocationConfig,
      OrderItemOption,
      CustomOrderRequest,
      CustomerNotificationSubscription,
      PushSubscription,
      DeliveryZone,
      StorefrontConfig,
      StorefrontPaymentConfig,
      Menu,
      Order,
      OrderItem,
      Product,
      ProductOptionGroup,
      ProductOption,
      Location,
    ]),
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('CUSTOMER_JWT_SECRET') || config.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    PosModule,
    InventoryModule,
    PaymentProvidersModule,
  ],
  controllers: [
    CustomerAuthController,
    OnlineMenuController,
    StorefrontOrderController,
    CustomerController,
    CustomOrderRequestController,
    StorefrontPublicController,
    AdminOnlineOrdersController,
    AdminLocationConfigController,
    AdminMenuConfigController,
    AdminStorefrontController,
    AdminCustomersController,
    AdminCustomOrdersController,
  ],
  providers: [
    CustomerAuthService,
    CustomerJwtStrategy,
    OnlineOrderService,
    OnlineMenuService,
    CustomerService,
    CustomOrderRequestService,
    StorefrontConfigService,
    DeliveryZoneService,
    LocationConfigService,
    MenuConfigService,
  ],
  exports: [
    TypeOrmModule,
    CustomerAuthService,
    OnlineOrderService,
    OnlineMenuService,
    CustomerService,
    CustomOrderRequestService,
    StorefrontConfigService,
    DeliveryZoneService,
    LocationConfigService,
    MenuConfigService,
  ],
})
export class OnlineOrderingModule {}
