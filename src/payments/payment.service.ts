import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { callService } from '../common/service-client';
import type { Payment } from '../domain/types';
import { DatabaseService } from '../infrastructure/database.service';
import { createId } from '../infrastructure/ids';
import { PAYMENT_ADAPTER, type PaymentAdapter } from './payment-adapters';

@Injectable()
export class PaymentService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(PAYMENT_ADAPTER) private readonly adapter: PaymentAdapter,
  ) {}

  cancel(orderId: string): { ok: true } {
    const payment = [...this.db.payments.values()].find((item) => item.orderId === orderId);
    if (payment && payment.status === 'pending') payment.status = 'cancelled';
    return { ok: true };
  }

  get provider() {
    return this.adapter.provider;
  }

  initPayment(input: { orderId: string; amount: number }) {
    if (typeof input.amount !== 'number' || input.amount <= 0) {
      throw new AppError('Сума платежу має бути додатною');
    }
    const session = this.adapter.createSession(input);
    const payment: Payment = {
      id: createId(),
      orderId: input.orderId,
      amount: input.amount,
      provider: this.adapter.provider,
      externalId: session.externalId,
      url: session.url,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.db.payments.set(payment.id, payment);
    return { id: payment.id, url: payment.url, provider: payment.provider };
  }

  async processPaymentWebhook(body: unknown) {
    const event = this.adapter.parseWebhook(body);
    if (event.ignored) return { ignored: true, type: event.type };

    const payment = [...this.db.payments.values()].find((item) => item.orderId === event.orderId);
    if (!payment) throw new AppError('Платіж для цього замовлення не знайдено', 404);
    if (payment.status === 'succeeded') return { duplicate: true, orderId: payment.orderId };
    if (payment.status === 'cancelled') throw new AppError('Платіж скасовано', 409);

    await callService('orders', '/api/internal/orders/payment-succeeded', {
      method: 'POST',
      body: { orderId: payment.orderId },
    });
    payment.status = 'succeeded';
    payment.paidAt = new Date().toISOString();
    return { orderId: payment.orderId, status: payment.status };
  }
}
