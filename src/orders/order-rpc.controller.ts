import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppError } from '../common/app-error';
import { OrderService } from './order.service';
import type { PublicUser } from '../domain/types';
import { RpcExceptionFilter } from '../common/rpc-exception.filter';

interface RpcRequest {
  operation: string;
  body?: Record<string, unknown>;
  user?: PublicUser;
  params?: Record<string, string>;
}

@Controller()
@UseFilters(RpcExceptionFilter)
export class OrderRpcController {
  constructor(private readonly orders: OrderService) {}

  @MessagePattern('orders.request')
  request(@Payload() request: RpcRequest) {
    const body = request.body || {};
    const user = request.user!;
    const params = request.params || {};
    switch (request.operation) {
      case 'cart': return this.orders.getCart(user.id);
      case 'addItem': return this.orders.addToCart(user.id, body);
      case 'updateItem': return this.orders.updateCartItem(user.id, params.bookId, Number(body.quantity));
      case 'removeItem': return this.orders.removeCartItem(user.id, params.bookId);
      case 'checkout': {
        const cartId = body.cartId || body.cart_id;
        if (!cartId) throw new AppError('Потрібен ідентифікатор кошика cartId');
        return this.orders.checkout(user.id, String(cartId));
      }
      case 'list': return this.orders.listOrders(user);
      case 'get': return this.orders.getOrder(user, params.id);
      case 'cancel': return this.orders.cancelOrder(user.id, params.id);
      case 'updateStatus': return this.orders.updateOrderStatus(params.id, String(body.status || ''));
      case 'analytics': return this.orders.getAnalytics();
      default: throw new Error(`Unknown orders operation: ${request.operation}`);
    }
  }
}
