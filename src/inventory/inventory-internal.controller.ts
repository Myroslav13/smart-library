import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { BookFormat } from '../domain/types';
import { InventoryService } from './inventory.service';

@Controller('internal/inventory')
export class InventoryInternalController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('available/:bookId')
  available(@Param('bookId') bookId: string) {
    return { available: this.inventory.getAvailable(bookId) };
  }
}

@Controller('internal')
export class StockInternalController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('stock')
  list() {
    return this.inventory.listInternal();
  }

  @Post('stock')
  register(@Body() body: { bookId: string; title: string; format: BookFormat; quantity: number }) {
    return this.inventory.register(body);
  }

  @Post('inventory/reserve')
  reserve(@Body() body: { items: Array<{ bookId: string; quantity: number }> }) {
    this.inventory.reserveBooks(body.items ?? []);
    return { ok: true };
  }

  @Post('inventory/release')
  release(@Body() body: { items: Array<{ bookId: string; format: string; quantity: number }> }) {
    this.inventory.releaseReservation(body.items ?? []);
    return { ok: true };
  }

  @Post('inventory/confirm')
  confirm(@Body() body: { items: Array<{ bookId: string; format: string; quantity: number }> }) {
    this.inventory.confirmStockDeduction(body.items ?? []);
    return { ok: true };
  }
}
