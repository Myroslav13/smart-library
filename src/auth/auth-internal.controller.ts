import { Controller, Get, Param, Req } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppError } from '../common/app-error';
import type { AuthenticatedRequest } from './auth.decorators';
import { AuthService } from './auth.service';

@Controller('internal')
export class AuthInternalController {
  constructor(private readonly auth: AuthService) {}

  @Get('session')
  session(@Req() request: AuthenticatedRequest) {
    if (!request.token) throw new AppError('Потрібна автентифікація', 401);
    const user = this.auth.authenticate(request.token);
    if (!user) throw new AppError('Потрібна автентифікація', 401);
    return user;
  }

  @MessagePattern('auth.session')
  sessionRpc(@Payload() body: { token?: string }) {
    if (!body.token) throw new AppError('Потрібна автентифікація', 401);
    const user = this.auth.authenticate(body.token);
    if (!user) throw new AppError('Потрібна автентифікація', 401);
    return user;
  }

  @Get('users/:id')
  user(@Param('id') id: string) {
    return this.auth.getProfile(id);
  }
}
