import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../auth/auth.decorators';
import { GatewayService } from './gateway.service';

@Controller()
export class PaymentGatewayController {
  constructor(private readonly gateway: GatewayService) {}

  @Public()
  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Headers('x-webhook-secret') webhookSecret: string | undefined, @Body() body: unknown) {
    return this.gateway.send('payments', 'webhook', { body: body as Record<string, unknown>, webhookSecret });
  }
}
