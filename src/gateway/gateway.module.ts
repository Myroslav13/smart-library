import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../auth/roles.guard';
import { GatewayAuthGuard } from './gateway-auth.guard';
import { GatewayService } from './gateway.service';
import { AuthGatewayController } from './auth-gateway.controller';
import { CatalogGatewayController } from './catalog-gateway.controller';
import { OrderGatewayController } from './order-gateway.controller';
import { InventoryGatewayController } from './inventory-gateway.controller';
import { PaymentGatewayController } from './payment-gateway.controller';
import { NotificationGatewayController } from './notification-gateway.controller';
import { RecommendationGatewayController } from './recommendation-gateway.controller';
import { HealthGatewayController } from './health-gateway.controller';
import { GatewayRateLimitGuard } from './gateway-rate-limit.guard';

@Module({
  controllers: [
    AuthGatewayController,
    CatalogGatewayController,
    OrderGatewayController,
    InventoryGatewayController,
    PaymentGatewayController,
    NotificationGatewayController,
    RecommendationGatewayController,
    HealthGatewayController,
  ],
  providers: [
    GatewayService,
    { provide: APP_GUARD, useClass: GatewayRateLimitGuard },
    { provide: APP_GUARD, useClass: GatewayAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class GatewayModule {}
