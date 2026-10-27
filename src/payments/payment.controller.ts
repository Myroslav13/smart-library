import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { AppConfig } from '../infrastructure/app-config.service';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(
    private readonly payment: PaymentService,
    private readonly config: AppConfig,
  ) {}

  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Headers('x-webhook-secret') secret: string | undefined, @Body() body: unknown) {
    if (secret !== this.config.webhookSecret) throw new AppError('Невірний секрет webhook', 401);
    return this.payment.processPaymentWebhook(body);
  }
}
