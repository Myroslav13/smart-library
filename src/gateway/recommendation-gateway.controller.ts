import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { Role } from '../common/roles';
import type { PublicUser } from '../domain/types';
import { GatewayService } from './gateway.service';

@Controller()
export class RecommendationGatewayController {
  constructor(private readonly gateway: GatewayService) {}

  @Roles(Role.CLIENT, Role.ADMIN)
  @Get('recommendations')
  list(@CurrentUser() user: PublicUser) {
    return this.gateway.send('recommendations', 'list', { user });
  }

  @Roles(Role.ADMIN)
  @Get('admin/recommendation-strategy')
  strategy() {
    return this.gateway.send('recommendations', 'strategy');
  }

  @Roles(Role.ADMIN)
  @Patch('admin/recommendation-strategy')
  setStrategy(@Body() body: { strategy: string }) {
    return this.gateway.send('recommendations', 'setStrategy', { body });
  }
}
