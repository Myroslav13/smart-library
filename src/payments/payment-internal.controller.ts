import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('internal/payments')
export class PaymentInternalController {
  constructor(private readonly payment: PaymentService) {}

  @Post()
  init(@Body() body: { orderId: string; amount: number }) {
    return this.payment.initPayment(body);
  }

  @Post('cancel')
  cancel(@Body() body: { orderId: string }) {
    return this.payment.cancel(body.orderId);
  }
}
