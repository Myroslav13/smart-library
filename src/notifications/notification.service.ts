import { Injectable } from '@nestjs/common';
import { callService } from '../common/service-client';
import type { NotificationChannel, NotificationRecord, Order, OrderStatus, PublicUser } from '../domain/types';
import { DatabaseService } from '../infrastructure/database.service';
import { createId } from '../infrastructure/ids';

@Injectable()
export class NotificationService {
  constructor(private readonly db: DatabaseService) {}

  private send(userId: string, email: string, channel: NotificationChannel, message: string, orderId: string) {
    const record: NotificationRecord = {
      id: createId(),
      userId,
      channel,
      message,
      orderId,
      createdAt: new Date().toISOString(),
    };
    this.db.notifications.push(record);
    console.log(`[notification] ${channel} -> ${email}: ${message}`);
    return this.present(record);
  }

  private present(record: NotificationRecord) {
    return {
      id: record.id,
      channel: record.channel,
      message: record.message,
      orderId: record.orderId,
      createdAt: record.createdAt,
    };
  }

  async triggerOrderSuccess(order: Order) {
    const user = await callService<PublicUser>('auth', `/api/internal/users/${order.userId}`);
    if (!user) return [];
    const hasPhysical = order.items.some((item) => item.format !== 'ebook');
    const message = hasPhysical
      ? 'Ваше замовлення оплачено та готується до відправки'
      : 'Оплату отримано. Електронні книги вже у вашій бібліотеці';
    return [
      this.send(user.id, user.email, 'email', message, order.id),
      this.send(user.id, user.email, 'push', message, order.id),
    ];
  }

  async notifyStatus(order: Order) {
    const user = await callService<PublicUser>('auth', `/api/internal/users/${order.userId}`);
    if (!user) return null;
    const messages: Partial<Record<OrderStatus, string>> = {
      shipped: 'Замовлення передано до доставки',
      delivered: 'Замовлення доставлено',
      cancelled: 'Замовлення скасовано',
    };
    const message = messages[order.status];
    if (!message) return null;
    return this.send(user.id, user.email, 'email', message, order.id);
  }

  listForUser(userId: string) {
    return this.db.notifications
      .filter((record) => record.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((record) => this.present(record));
  }
}
