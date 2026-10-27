import { Injectable } from '@nestjs/common';
import type { PaymentProvider } from '../domain/types';

@Injectable()
export class AppConfig {
  readonly port = Number(process.env.PORT) || 3000;
  readonly paymentProvider: PaymentProvider = process.env.PAYMENT_PROVIDER === 'liqpay' ? 'liqpay' : 'stripe';
  readonly webhookSecret = process.env.WEBHOOK_SECRET || 'dev-webhook-secret';
  readonly tokenTtlMs = 24 * 60 * 60 * 1000;
}
