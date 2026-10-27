import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.decorators';
import type { PublicUser } from '../domain/types';
import { GatewayService } from './gateway.service';

@Controller()
export class NotificationGatewayController {
  constructor(private readonly gateway: GatewayService) {}

  @Get('notifications')
  list(@CurrentUser() user: PublicUser) {
    return this.gateway.send('notifications', 'list', { user });
  }
}
