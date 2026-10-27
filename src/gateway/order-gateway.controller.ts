import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { Role } from '../common/roles';
import type { PublicUser } from '../domain/types';
import { AddCartItemDto, CheckoutDto, UpdateCartItemDto, UpdateOrderStatusDto } from '../orders/dto';
import { GatewayService } from './gateway.service';

@Controller()
export class OrderGatewayController {
  constructor(private readonly gateway: GatewayService) {}

  @Roles(Role.CLIENT, Role.ADMIN)
  @Get('cart')
  cart(@CurrentUser() user: PublicUser) {
    return this.gateway.send('orders', 'cart', { user });
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Post('cart/items')
  @HttpCode(HttpStatus.CREATED)
  addItem(@CurrentUser() user: PublicUser, @Body() body: AddCartItemDto) {
    return this.gateway.send('orders', 'addItem', { user, body });
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Patch('cart/items/:bookId')
  updateItem(@CurrentUser() user: PublicUser, @Param('bookId') bookId: string, @Body() body: UpdateCartItemDto) {
    return this.gateway.send('orders', 'updateItem', { user, params: { bookId }, body });
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Delete('cart/items/:bookId')
  removeItem(@CurrentUser() user: PublicUser, @Param('bookId') bookId: string) {
    return this.gateway.send('orders', 'removeItem', { user, params: { bookId } });
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Post('orders/checkout')
  @HttpCode(HttpStatus.CREATED)
  checkout(@CurrentUser() user: PublicUser, @Body() body: CheckoutDto) {
    return this.gateway.send('orders', 'checkout', { user, body });
  }

  @Get('orders')
  list(@CurrentUser() user: PublicUser) {
    return this.gateway.send('orders', 'list', { user });
  }

  @Get('orders/:id')
  get(@CurrentUser() user: PublicUser, @Param('id') id: string) {
    return this.gateway.send('orders', 'get', { user, params: { id } });
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Post('orders/:id/cancel')
  cancel(@CurrentUser() user: PublicUser, @Param('id') id: string) {
    return this.gateway.send('orders', 'cancel', { user, params: { id } });
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Patch('orders/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.gateway.send('orders', 'updateStatus', { params: { id }, body });
  }

  @Roles(Role.ADMIN)
  @Get('admin/analytics')
  analytics() {
    return this.gateway.send('orders', 'analytics');
  }
}
