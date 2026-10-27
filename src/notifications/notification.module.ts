import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationInternalController } from './notification-internal.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController, NotificationInternalController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
