import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import { AppConfig } from '../infrastructure/app-config.service';
import { AppError } from '../common/app-error';
import { RpcExceptionFilter } from '../common/rpc-exception.filter';

interface RpcRequest {
  operation: string;
  body?: Record<string, unknown>;
  webhookSecret?: string;
}

@Controller()
@UseFilters(RpcExceptionFilter)
export class PaymentRpcController {
  constructor(
    private readonly payment: PaymentService,
    private readonly config: AppConfig,
  ) {}

  @MessagePattern('payments.request')
  request(@Payload() request: RpcRequest) {
    const body = request.body || {};
    switch (request.operation) {
      case 'webhook':
        if (request.webhookSecret !== this.config.webhookSecret) {
          throw new AppError('Невірний секрет webhook', 401);
        }
        return this.payment.processPaymentWebhook(body);
      default: throw new Error(`Unknown payments operation: ${request.operation}`);
    }
  }
}
