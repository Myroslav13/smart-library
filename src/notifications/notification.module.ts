import { Module } from '@nestjs/common';
import { NotificationInternalController } from './notification-internal.controller';
import { NotificationService } from './notification.service';
import { NotificationRpcController } from './notification-rpc.controller';

@Module({
  controllers: [NotificationInternalController, NotificationRpcController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
