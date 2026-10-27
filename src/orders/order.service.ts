import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { roundMoney } from '../common/money';
import { callService } from '../common/service-client';
import { Role } from '../common/roles';
import type { BookFormat, Cart, Order, OrderItem, OrderStatus, PublicUser } from '../domain/types';
import { CacheService } from '../infrastructure/cache.service';
import { DatabaseService } from '../infrastructure/database.service';
import { createId } from '../infrastructure/ids';

const STAFF = new Set<string>([Role.WAREHOUSE, Role.ADMIN]);

interface RemoteBook {
  id: string;
  title: string;
  format: BookFormat;
  price: number;
}

export interface OrderView {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  paymentUrl?: string | null;
  createdAt: string;
  paidAt?: string;
  customer?: { id: string; name: string; email: string };
}

@Injectable()
export class OrderService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cache: CacheService,
  ) {}

  private getOrCreateCart(userId: string): Cart {
    let cart = this.cache.getCartByUser(userId);
    if (!cart) {
      cart = { id: createId(), userId, items: [] };
      this.cache.saveCart(cart);
    }
    return cart;
  }

  private async bookOf(bookId: string): Promise<RemoteBook> {
    return callService<RemoteBook>('catalog', `/api/internal/catalog/books/${bookId}`);
  }

  private async presentCart(cart: Cart) {
    const items = [];
    for (const item of cart.items) {
      const book = await this.bookOf(item.bookId);
      const lineTotal = roundMoney(book.price * item.quantity);
      items.push({
        bookId: book.id,
        title: book.title,
        format: book.format,
        quantity: item.quantity,
        unitPrice: book.price,
        lineTotal,
      });
    }
    return {
      id: cart.id,
      items,
      total: roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0)),
    };
  }

  private assertQuantity(quantity: number, allowZero = false): void {
    const min = allowZero ? 0 : 1;
    if (!Number.isInteger(quantity) || quantity < min) {
      throw new AppError(
        allowZero ? "Кількість має бути цілим невід'ємним числом" : 'Кількість має бути цілим числом від 1',
      );
    }
  }

  private async assertStock(book: RemoteBook, quantity: number): Promise<void> {
    if (book.format === 'ebook') return;
    const stock = await callService<{ available: number }>('inventory', `/api/internal/inventory/available/${book.id}`);
    if (quantity > stock.available) throw new AppError(`Недостатньо примірників: ${book.title}`, 409);
  }

  private async presentOrder(order: Order, staff: boolean): Promise<OrderView> {
    const customer = staff ? await callService<PublicUser>('auth', `/api/internal/users/${order.userId}`) : undefined;
    return {
      id: order.id,
      status: order.status,
      items: order.items,
      total: order.total,
      paymentUrl: order.status === 'pending_payment' ? order.paymentUrl : undefined,
      createdAt: order.createdAt,
      paidAt: order.paidAt || undefined,
      ...(customer ? { customer: { id: customer.id, name: customer.name, email: customer.email } } : {}),
    };
  }

  private requireOrder(orderId: string): Order {
    const order = this.db.orders.get(orderId);
    if (!order) throw new AppError('Замовлення не знайдено', 404);
    return order;
  }

  getCart(userId: string) {
    return this.presentCart(this.getOrCreateCart(userId));
  }

  async addToCart(userId: string, input: { bookId?: string; quantity?: number }) {
    const quantity = input.quantity ?? NaN;
    this.assertQuantity(quantity);
    const book = await this.bookOf(String(input.bookId || ''));
    const cart = this.getOrCreateCart(userId);
    const existing = cart.items.find((item) => item.bookId === book.id);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    await this.assertStock(book, nextQuantity);
    if (existing) existing.quantity = nextQuantity;
    else cart.items.push({ bookId: book.id, quantity });
    this.cache.saveCart(cart);
    return this.presentCart(cart);
  }

  async updateCartItem(userId: string, bookId: string, quantity: number) {
    this.assertQuantity(quantity, true);
    if (quantity === 0) return this.removeCartItem(userId, bookId);
    const book = await this.bookOf(bookId);
    await this.assertStock(book, quantity);
    const cart = this.getOrCreateCart(userId);
    const existing = cart.items.find((item) => item.bookId === bookId);
    if (!existing) throw new AppError('Цієї книги немає в кошику', 404);
    existing.quantity = quantity;
    this.cache.saveCart(cart);
    return this.presentCart(cart);
  }

  removeCartItem(userId: string, bookId: string) {
    const cart = this.getOrCreateCart(userId);
    const before = cart.items.length;
    cart.items = cart.items.filter((item) => item.bookId !== bookId);
    if (cart.items.length === before) throw new AppError('Цієї книги немає в кошику', 404);
    this.cache.saveCart(cart);
    return this.presentCart(cart);
  }

  async checkout(userId: string, cartId: string) {
    const cart = this.cache.getCart(cartId);
    if (!cart || cart.userId !== userId) throw new AppError('Кошик не знайдено', 404);
    if (!cart.items.length) throw new AppError('Кошик порожній');

    const items: OrderItem[] = [];
    for (const item of cart.items) {
      const book = await this.bookOf(item.bookId);
      items.push({
        bookId: book.id,
        title: book.title,
        format: book.format,
        quantity: item.quantity,
        unitPrice: book.price,
        lineTotal: roundMoney(book.price * item.quantity),
      });
    }

    const physical = items
      .filter((item) => item.format !== 'ebook')
      .map((item) => ({ bookId: item.bookId, quantity: item.quantity }));
    await callService('inventory', '/api/internal/inventory/reserve', { method: 'POST', body: { items: physical } });

    const order: Order = {
      id: createId(),
      userId,
      items,
      total: roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0)),
      status: 'pending_payment',
      stockConfirmed: false,
      createdAt: new Date().toISOString(),
      paidAt: null,
      paymentUrl: null,
      paymentId: null,
    };
    this.db.orders.set(order.id, order);

    try {
      const session = await callService<{ id: string; url: string }>('payments', '/api/internal/payments', {
        method: 'POST',
        body: { orderId: order.id, amount: order.total },
      });
      order.paymentId = session.id;
      order.paymentUrl = session.url;
      cart.items = [];
      this.cache.saveCart(cart);
    } catch (error) {
      this.db.orders.delete(order.id);
      await callService('inventory', '/api/internal/inventory/release', { method: 'POST', body: { items } }).catch(() => undefined);
      throw error;
    }

    return {
      orderId: order.id,
      paymentUrl: order.paymentUrl,
      totalAmount: order.total,
      status: order.status,
    };
  }

  async markOrderAsPaid(orderId: string): Promise<{ order: Order; alreadyProcessed: boolean }> {
    const order = this.requireOrder(orderId);
    if (order.status !== 'pending_payment') return { order, alreadyProcessed: true };
    const bookIds = order.items.filter((item) => item.format !== 'physical').map((item) => item.bookId);
    if (bookIds.length) {
      await callService('catalog', '/api/internal/catalog/access', {
        method: 'POST',
        body: { userId: order.userId, bookIds },
      });
    }
    const hasPhysical = order.items.some((item) => item.format !== 'ebook');
    order.status = hasPhysical ? 'preparing_shipment' : 'completed';
    order.paidAt = new Date().toISOString();
    return { order, alreadyProcessed: false };
  }

  async onPaymentSucceeded(orderId: string) {
    const { order, alreadyProcessed } = await this.markOrderAsPaid(orderId);
    if (alreadyProcessed) return { alreadyProcessed: true };
    await callService('inventory', '/api/internal/inventory/confirm', { method: 'POST', body: { items: order.items } });
    order.stockConfirmed = true;
    await callService('recommendations', '/api/internal/recommendations/purchases', {
      method: 'POST',
      body: { userId: order.userId, items: order.items },
    });
    await callService('notifications', '/api/internal/notifications/order-success', { method: 'POST', body: order });
    return { alreadyProcessed: false };
  }

  async cancelOrder(userId: string, orderId: string): Promise<OrderView> {
    const order = this.requireOrder(orderId);
    if (order.userId !== userId) throw new AppError('Недостатньо прав', 403);
    if (order.status !== 'pending_payment') throw new AppError('Скасувати можна лише неоплачене замовлення', 409);
    await callService('inventory', '/api/internal/inventory/release', { method: 'POST', body: { items: order.items } });
    order.status = 'cancelled';
    if (order.paymentId) {
      await callService('payments', '/api/internal/payments/cancel', { method: 'POST', body: { orderId: order.id } });
    }
    await callService('notifications', '/api/internal/notifications/status', { method: 'POST', body: order });
    return this.presentOrder(order, false);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<OrderView> {
    const order = this.requireOrder(orderId);
    const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
      preparing_shipment: ['shipped'],
      shipped: ['delivered'],
    };
    if (status !== 'shipped' && status !== 'delivered') {
      throw new AppError('Недопустима зміна статусу замовлення', 409);
    }
    if (!allowed[order.status]?.includes(status)) {
      throw new AppError('Недопустима зміна статусу замовлення', 409);
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    await callService('notifications', '/api/internal/notifications/status', { method: 'POST', body: order });
    return this.presentOrder(order, true);
  }

  async listOrders(actor: PublicUser): Promise<OrderView[]> {
    const staff = STAFF.has(actor.role);
    const source = staff
      ? [...this.db.orders.values()]
      : [...this.db.orders.values()].filter((order) => order.userId === actor.id);
    const views = await Promise.all(
      source.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((order) => this.presentOrder(order, staff)),
    );
    return views;
  }

  async getOrder(actor: PublicUser, orderId: string): Promise<OrderView> {
    const order = this.requireOrder(orderId);
    const staff = STAFF.has(actor.role);
    if (!staff && order.userId !== actor.id) throw new AppError('Недостатньо прав', 403);
    return this.presentOrder(order, staff);
  }

  getAnalytics() {
    const paid = [...this.db.orders.values()].filter(
      (order) => order.status !== 'pending_payment' && order.status !== 'cancelled',
    );
    const byBook = new Map<string, { title: string; quantity: number; revenue: number }>();
    for (const order of paid) {
      for (const item of order.items) {
        const current = byBook.get(item.bookId) || { title: item.title, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue = roundMoney(current.revenue + item.lineTotal);
        byBook.set(item.bookId, current);
      }
    }
    return {
      ordersCount: paid.length,
      revenue: roundMoney(paid.reduce((sum, order) => sum + order.total, 0)),
      topBooks: [...byBook.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    };
  }
}
