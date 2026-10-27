import type { PaymentProvider } from './domain/types';

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
};
