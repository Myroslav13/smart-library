import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { RpcExceptionFilter } from '../common/rpc-exception.filter';

interface RpcRequest {
  operation: string;
  user?: { id: string };
}

@Controller()
@UseFilters(RpcExceptionFilter)
export class NotificationRpcController {
  constructor(private readonly notifications: NotificationService) {}

  @MessagePattern('notifications.request')
  request(@Payload() request: RpcRequest) {
    if (request.operation === 'list') return this.notifications.listForUser(request.user!.id);
    throw new Error(`Unknown notifications operation: ${request.operation}`);
  }
}
