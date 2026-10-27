import { Body, Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Roles } from '../auth/auth.decorators';
import { Role } from '../common/roles';
import { GatewayService } from './gateway.service';

@Controller()
export class InventoryGatewayController {
  constructor(private readonly gateway: GatewayService) {}

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Get('inventory')
  list() {
    return this.gateway.send('inventory', 'list');
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Post('inventory/shipments')
  @HttpCode(HttpStatus.CREATED)
  receive(@Body() body: { bookId: string; quantity: number }) {
    return this.gateway.send('inventory', 'receive', { body });
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Post('inventory/stocktake')
  stocktake(@Body() body: { bookId: string; actualQuantity: number }) {
    return this.gateway.send('inventory', 'stocktake', { body });
  }
}
