import { Module } from '@nestjs/common';
import { AppConfig } from '../infrastructure/app-config.service';
import { LiqPayAdapter, PAYMENT_ADAPTER, StripeAdapter } from './payment-adapters';
import { PaymentController } from './payment.controller';
import { PaymentInternalController } from './payment-internal.controller';
import { PaymentService } from './payment.service';

@Module({
  controllers: [PaymentController, PaymentInternalController],
  providers: [
    PaymentService,
    {
      provide: PAYMENT_ADAPTER,
      inject: [AppConfig],
      useFactory: (config: AppConfig) => (config.paymentProvider === 'liqpay' ? new LiqPayAdapter() : new StripeAdapter()),
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
