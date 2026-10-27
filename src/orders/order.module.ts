import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderInternalController } from './order-internal.controller';
import { OrderService } from './order.service';

@Module({
  controllers: [OrderController, OrderInternalController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
