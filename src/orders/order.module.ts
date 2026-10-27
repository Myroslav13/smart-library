import { Module } from '@nestjs/common';
import { OrderInternalController } from './order-internal.controller';
import { OrderService } from './order.service';
import { OrderRpcController } from './order-rpc.controller';

@Module({
  controllers: [OrderInternalController, OrderRpcController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
