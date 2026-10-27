import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ServiceBoundaryModule } from './common/service-boundary';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationModule } from './notifications/notification.module';
import { OrderModule } from './orders/order.module';
import { PaymentModule } from './payments/payment.module';
import { RecommendationModule } from './recommendations/recommendation.module';
import { AuthSeed, CatalogSeed, InventorySeed, OrderSeed, RecommendationSeed } from './shared/local-seeds';
import { GatewayModule } from './gateway/gateway.module';
export { GatewayModule };

@Module({
  imports: [InfrastructureModule, ServiceBoundaryModule, AuthModule],
  providers: [AuthSeed],
})
export class AuthAppModule {}

@Module({
  imports: [InfrastructureModule, ServiceBoundaryModule, CatalogModule],
  providers: [CatalogSeed],
})
export class CatalogAppModule {}

@Module({
  imports: [InfrastructureModule, ServiceBoundaryModule, InventoryModule],
  providers: [InventorySeed],
})
export class InventoryAppModule {}

@Module({
  imports: [InfrastructureModule, ServiceBoundaryModule, OrderModule],
  providers: [OrderSeed],
})
export class OrderAppModule {}

@Module({
  imports: [InfrastructureModule, ServiceBoundaryModule, PaymentModule],
})
export class PaymentAppModule {}

@Module({
  imports: [InfrastructureModule, ServiceBoundaryModule, NotificationModule],
})
export class NotificationAppModule {}

@Module({
  imports: [InfrastructureModule, ServiceBoundaryModule, RecommendationModule],
  providers: [RecommendationSeed],
})
export class RecommendationAppModule {}
