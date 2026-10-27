import type { PaymentProvider } from './domain/types';
import type { ClientProxy } from '@nestjs/microservices';

export type ServiceName =
  | 'auth'
  | 'catalog'
  | 'orders'
  | 'inventory'
  | 'payments'
  | 'notifications'
  | 'recommendations';

export const runtime = {
  internalToken: process.env.INTERNAL_TOKEN || 'lab-internal-token',
  webhookSecret: process.env.WEBHOOK_SECRET || 'dev-webhook-secret',
  paymentProvider: (process.env.PAYMENT_PROVIDER === 'liqpay' ? 'liqpay' : 'stripe') as PaymentProvider,
  urls: {
    auth: '',
    catalog: '',
    orders: '',
    inventory: '',
    payments: '',
    notifications: '',
    recommendations: '',
  } as Record<ServiceName, string>,
  transports: {
    auth: Number(process.env.AUTH_SERVICE_PORT) || 4101,
    catalog: Number(process.env.CATALOG_SERVICE_PORT) || 4102,
    inventory: Number(process.env.INVENTORY_SERVICE_PORT) || 4103,
    orders: Number(process.env.ORDERS_SERVICE_PORT) || 4104,
    payments: Number(process.env.PAYMENTS_SERVICE_PORT) || 4105,
    notifications: Number(process.env.NOTIFICATIONS_SERVICE_PORT) || 4106,
    recommendations: Number(process.env.RECOMMENDATIONS_SERVICE_PORT) || 4107,
  } as Record<ServiceName, number>,
  clients: {} as Partial<Record<ServiceName, ClientProxy>>,
};
