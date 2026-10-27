import { Module } from '@nestjs/common';
import { InventoryInternalController, StockInternalController } from './inventory-internal.controller';
import { InventoryService } from './inventory.service';
import { InventoryRpcController } from './inventory-rpc.controller';

@Module({
  controllers: [InventoryInternalController, StockInternalController, InventoryRpcController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
