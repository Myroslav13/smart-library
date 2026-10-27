import { Body, Controller, Post } from '@nestjs/common';
import type { Order } from '../domain/types';
import { NotificationService } from './notification.service';

@Controller('internal/notifications')
export class NotificationInternalController {
  constructor(private readonly notifications: NotificationService) {}

  @Post('order-success')
  success(@Body() order: Order) {
    return this.notifications.triggerOrderSuccess(order);
  }

  @Post('status')
  status(@Body() order: Order) {
    return this.notifications.notifyStatus(order);
  }
}
