import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import type { BookFormat, Stock } from '../domain/types';
import { DatabaseService } from '../infrastructure/database.service';

export interface StockView {
  bookId: string;
  title: string;
  available: number;
  reserved: number;
  onHand: number;
}

@Injectable()
export class InventoryService {
  constructor(private readonly db: DatabaseService) {}

  private requireStock(bookId: string): Stock {
    const stock = this.db.stock.get(bookId);
    if (!stock) throw new AppError('Книгу не знайдено на складі', 404);
    return stock;
  }

  private present(bookId: string): StockView {
    const stock = this.requireStock(bookId);
    return {
      bookId,
      title: stock.title,
      available: stock.available,
      reserved: stock.reserved,
      onHand: stock.available + stock.reserved,
    };
  }

  getAvailable(bookId: string): number {
    return this.db.stock.get(bookId)?.available ?? 0;
  }

  listInternal() {
    return [...this.db.stock.entries()].map(([bookId, stock]) => ({
      bookId,
      title: stock.title,
      available: stock.available,
      reserved: stock.reserved,
    }));
  }

  register(input: { bookId: string; title: string; format: BookFormat | string; quantity: number }): StockView | { skipped: true } {
    if (input.format === 'ebook') return { skipped: true };
    if (!this.db.stock.has(input.bookId)) {
      this.db.stock.set(input.bookId, {
        available: 0,
        reserved: 0,
        title: input.title,
        format: input.format as BookFormat,
      });
    }
    if (input.quantity > 0) return this.receiveShipment({ bookId: input.bookId, quantity: input.quantity });
    return this.present(input.bookId);
  }

  reserveBooks(items: Array<{ bookId: string; quantity: number }>): void {
    const reserved: Array<{ bookId: string; quantity: number }> = [];
    try {
      for (const item of items) {
        const stock = this.db.stock.get(item.bookId);
        if (!stock || stock.available < item.quantity) {
          throw new AppError(`Недостатньо примірників: ${stock?.title || item.bookId}`, 409);
        }
        stock.available -= item.quantity;
        stock.reserved += item.quantity;
        reserved.push(item);
      }
    } catch (error) {
      for (const item of reserved) {
        const stock = this.db.stock.get(item.bookId);
        if (!stock) continue;
        stock.available += item.quantity;
        stock.reserved -= item.quantity;
      }
      throw error;
    }
  }

  releaseReservation(items: Array<{ bookId: string; format: string; quantity: number }>): void {
    for (const item of items) {
      if (item.format === 'ebook') continue;
      const stock = this.db.stock.get(item.bookId);
      if (!stock) continue;
      stock.reserved -= item.quantity;
      stock.available += item.quantity;
    }
  }

  confirmStockDeduction(items: Array<{ bookId: string; format: string; quantity: number }>): void {
    for (const item of items) {
      if (item.format === 'ebook') continue;
      const stock = this.db.stock.get(item.bookId);
      if (!stock || stock.reserved < item.quantity) {
        throw new AppError('Неможливо списати зарезервований товар', 409);
      }
      stock.reserved -= item.quantity;
    }
  }

  receiveShipment(input: { bookId?: string; quantity?: number }): StockView {
    const quantity = input.quantity;
    if (!Number.isInteger(quantity) || quantity === undefined || quantity < 1) {
      throw new AppError('Кількість поставки має бути цілим числом від 1');
    }
    this.requireStock(String(input.bookId || ''));
    const stock = this.db.stock.get(String(input.bookId));
    if (!stock) throw new AppError('Складський запис не знайдено', 500);
    stock.available += quantity;
    return this.present(String(input.bookId));
  }

  stocktake(input: { bookId?: string; actualQuantity?: number }): StockView {
    const actualQuantity = input.actualQuantity;
    if (!Number.isInteger(actualQuantity) || actualQuantity === undefined || actualQuantity < 0) {
      throw new AppError("Фактична кількість має бути цілим невід'ємним числом");
    }
    const bookId = String(input.bookId || '');
    const stock = this.requireStock(bookId);
    if (actualQuantity < stock.reserved) {
      throw new AppError('Фактична кількість менша за вже зарезервовані примірники', 409);
    }
    stock.available = actualQuantity - stock.reserved;
    return this.present(bookId);
  }

  listStock(): StockView[] {
    return [...this.db.stock.keys()]
      .map((bookId) => this.present(bookId))
      .sort((a, b) => a.title.localeCompare(b.title, 'uk'));
  }
}
