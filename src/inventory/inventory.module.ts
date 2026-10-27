import { Module } from '@nestjs/common';
import { InventoryInternalController, StockInternalController } from './inventory-internal.controller';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [InventoryController, InventoryInternalController, StockInternalController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
