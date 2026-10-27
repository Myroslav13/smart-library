import { Controller, Get } from '@nestjs/common';
import type { PublicUser } from '../domain/types';
import { CurrentUser } from '../auth/auth.decorators';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get('notifications')
  list(@CurrentUser() user: PublicUser) {
    return this.notifications.listForUser(user.id);
  }
}
