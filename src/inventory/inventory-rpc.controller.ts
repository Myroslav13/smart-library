import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { RpcExceptionFilter } from '../common/rpc-exception.filter';

interface RpcRequest {
  operation: string;
  body?: Record<string, unknown>;
}

@Controller()
@UseFilters(RpcExceptionFilter)
export class InventoryRpcController {
  constructor(private readonly inventory: InventoryService) {}

  @MessagePattern('inventory.request')
  request(@Payload() request: RpcRequest) {
    const body = request.body || {};
    switch (request.operation) {
      case 'list': return this.inventory.listStock();
      case 'receive': return this.inventory.receiveShipment(body);
      case 'stocktake': return this.inventory.stocktake(body);
      default: throw new Error(`Unknown inventory operation: ${request.operation}`);
    }
  }
}
