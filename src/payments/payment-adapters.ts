import { AppError } from '../common/app-error';
import type { PaymentProvider } from '../domain/types';
import { createId } from '../infrastructure/ids';

export interface PaymentSession {
  externalId: string;
  url: string;
}

export type WebhookResult = { ignored: true; type: string } | { ignored: false; type: string; orderId: string };

export interface PaymentAdapter {
  readonly provider: PaymentProvider;
  createSession(input: { orderId: string; amount: number }): PaymentSession;
  parseWebhook(body: unknown): WebhookResult;
}

export const PAYMENT_ADAPTER = Symbol('PAYMENT_ADAPTER');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sessionUrl(provider: PaymentProvider, externalId: string): string {
  if (provider === 'liqpay') return `https://www.liqpay.ua/checkout/${externalId}`;
  return `https://checkout.stripe.test/c/${externalId}`;
}

export class StripeAdapter implements PaymentAdapter {
  readonly provider = 'stripe' as const;

  createSession(input: { orderId: string; amount: number }): PaymentSession {
    const externalId = `cs_${createId().replace(/-/g, '').slice(0, 16)}`;
    return { externalId, url: sessionUrl(this.provider, externalId) };
  }

  parseWebhook(body: unknown): WebhookResult {
    if (!isRecord(body)) return { ignored: true, type: 'unknown' };
    const type = typeof body.type === 'string' ? body.type : 'unknown';
    if (type !== 'payment_intent.succeeded') return { ignored: true, type };
    const data = isRecord(body.data) ? body.data : undefined;
    const object = data && isRecord(data.object) ? data.object : undefined;
    const metadata = object && isRecord(object.metadata) ? object.metadata : undefined;
    const orderId = metadata && typeof metadata.order_id === 'string' ? metadata.order_id : '';
    if (!orderId) throw new AppError('У webhook відсутній order_id');
    return { ignored: false, type, orderId };
  }
}

export class LiqPayAdapter implements PaymentAdapter {
  readonly provider = 'liqpay' as const;

  createSession(): PaymentSession {
    const externalId = `lp_${createId().replace(/-/g, '').slice(0, 16)}`;
    return { externalId, url: sessionUrl(this.provider, externalId) };
  }

  parseWebhook(body: unknown): WebhookResult {
    if (!isRecord(body)) return { ignored: true, type: 'unknown' };
    const status = typeof body.status === 'string' ? body.status : 'unknown';
    if (status !== 'success') return { ignored: true, type: status };
    const orderId = typeof body.order_id === 'string' ? body.order_id : '';
    if (!orderId) throw new AppError('У webhook відсутній order_id');
    return { ignored: false, type: 'payment_intent.succeeded', orderId };
  }
}
