import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PosModule } from './modules/pos/pos.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ProductionModule } from './modules/production/production.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'bake_app'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
        retryAttempts: 3,
      }),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PosModule,
    InventoryModule,
    RecipesModule,
    ProductionModule,
    FinanceModule,
    ReportingModule,
    NotificationsModule,
    PermissionsModule,
    WebsocketModule,
    SettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
