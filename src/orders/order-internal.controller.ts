import { Body, Controller, Post } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('internal/orders')
export class OrderInternalController {
  constructor(private readonly orders: OrderService) {}

  @Post('payment-succeeded')
  paid(@Body() body: { orderId: string }) {
    return this.orders.onPaymentSucceeded(body.orderId);
  }
}
