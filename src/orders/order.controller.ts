import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { Role } from '../common/roles';
import type { PublicUser } from '../domain/types';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { AddCartItemDto, CheckoutDto, UpdateCartItemDto, UpdateOrderStatusDto } from './dto';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Roles(Role.CLIENT, Role.ADMIN)
  @Get('cart')
  cart(@CurrentUser() user: PublicUser) {
    return this.orders.getCart(user.id);
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Post('cart/items')
  @HttpCode(HttpStatus.CREATED)
  addItem(@CurrentUser() user: PublicUser, @Body() body: AddCartItemDto) {
    return this.orders.addToCart(user.id, body);
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Patch('cart/items/:bookId')
  updateItem(
    @CurrentUser() user: PublicUser,
    @Param('bookId') bookId: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return this.orders.updateCartItem(user.id, bookId, body.quantity);
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Delete('cart/items/:bookId')
  removeItem(@CurrentUser() user: PublicUser, @Param('bookId') bookId: string) {
    return this.orders.removeCartItem(user.id, bookId);
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Post('orders/checkout')
  @HttpCode(HttpStatus.CREATED)
  checkout(@CurrentUser() user: PublicUser, @Body() body: CheckoutDto) {
    const cartId = body.cartId || body.cart_id;
    if (!cartId) throw new AppError('Потрібен ідентифікатор кошика cartId');
    return this.orders.checkout(user.id, cartId);
  }

  @Get('orders')
  list(@CurrentUser() user: PublicUser) {
    return this.orders.listOrders(user);
  }

  @Get('orders/:id')
  get(@CurrentUser() user: PublicUser, @Param('id') id: string) {
    return this.orders.getOrder(user, id);
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Post('orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser() user: PublicUser, @Param('id') id: string) {
    return this.orders.cancelOrder(user.id, id);
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Patch('orders/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.orders.updateOrderStatus(id, body.status);
  }

  @Roles(Role.ADMIN)
  @Get('admin/analytics')
  analytics() {
    return this.orders.getAnalytics();
  }
}
