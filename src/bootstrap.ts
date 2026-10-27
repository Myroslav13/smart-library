import { INestApplication, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import {
  AuthAppModule,
  CatalogAppModule,
  GatewayModule,
  InventoryAppModule,
  NotificationAppModule,
  OrderAppModule,
  PaymentAppModule,
  RecommendationAppModule,
} from './apps';
import { configureApp } from './configure-app';
import { handleGateway } from './gateway/api-gateway';
import { runtime, type ServiceName } from './runtime';

export interface RunningSystem {
  gatewayUrl: string;
  close(): Promise<void>;
}

function urlOf(app: INestApplication): string {
  const address = (app.getHttpServer() as Server).address() as AddressInfo | string | null;
  if (!address || typeof address === 'string') throw new Error('Не вдалося визначити порт сервісу');
  return `http://127.0.0.1:${address.port}`;
}

export async function startSystem(options: { gatewayPort: number; logger?: LogLevel[] | false }): Promise<RunningSystem> {
  const logger = options.logger ?? ['error', 'warn', 'log'];
  const apps: INestApplication[] = [];

  const boot = async (module: Parameters<typeof NestFactory.create>[0], name: ServiceName) => {
    const app = await NestFactory.create(module, { logger });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    runtime.urls[name] = urlOf(app);
    apps.push(app);
  };

  await boot(AuthAppModule, 'auth');
  await boot(CatalogAppModule, 'catalog');
  await boot(InventoryAppModule, 'inventory');
  await boot(OrderAppModule, 'orders');
  await boot(PaymentAppModule, 'payments');
  await boot(NotificationAppModule, 'notifications');
  await boot(RecommendationAppModule, 'recommendations');

  const gateway = await NestFactory.create(GatewayModule, { logger, bodyParser: false });
  const expressApp = gateway.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');
  expressApp.use(json());
  expressApp.use((req: Parameters<typeof handleGateway>[0], res: Parameters<typeof handleGateway>[1]) => {
    void handleGateway(req, res);
  });
  await gateway.listen(options.gatewayPort, '127.0.0.1');
  apps.push(gateway);

  return {
    gatewayUrl: urlOf(gateway),
    close: async () => {
      for (const app of [...apps].reverse()) await app.close();
    },
  };
}
