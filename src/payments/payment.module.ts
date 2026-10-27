import { Module } from '@nestjs/common';
import { AppConfig } from '../infrastructure/app-config.service';
import { LiqPayAdapter, PAYMENT_ADAPTER, StripeAdapter } from './payment-adapters';
import { PaymentInternalController } from './payment-internal.controller';
import { PaymentService } from './payment.service';
import { PaymentRpcController } from './payment-rpc.controller';

@Module({
  controllers: [PaymentInternalController, PaymentRpcController],
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
