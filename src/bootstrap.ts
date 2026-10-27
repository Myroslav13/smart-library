import { INestApplication, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
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
    app.connectMicroservice({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: runtime.transports[name] },
    });
    await app.listen(0, '127.0.0.1');
    await app.startAllMicroservices();
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

  for (const name of Object.keys(runtime.transports) as ServiceName[]) {
    const client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: runtime.transports[name] },
    });
    await client.connect();
    runtime.clients[name] = client;
  }

  const gateway = await NestFactory.create(GatewayModule, { logger });
  configureApp(gateway);
  await gateway.listen(options.gatewayPort, '127.0.0.1');
  apps.push(gateway);

  return {
    gatewayUrl: urlOf(gateway),
    close: async () => {
      for (const client of Object.values(runtime.clients)) await client?.close();
      runtime.clients = {};
      for (const app of [...apps].reverse()) await app.close();
    },
  };
}
