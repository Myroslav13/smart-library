import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../common/app-error';
import { isRole } from '../common/roles';
import { AuthenticatedRequest, IS_PUBLIC_KEY } from '../auth/auth.decorators';
import { GatewayService } from './gateway.service';
import type { PublicUser } from '../domain/types';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly gateway: GatewayService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      const token = authorization.slice(7).trim();
      try {
        const user = await this.gateway.session(token) as PublicUser;
        if (isRole(user.role)) {
          request.token = token;
          request.user = user;
        }
      } catch {
        request.user = undefined;
      }
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    if (!request.user) throw new AppError('Потрібна автентифікація', 401);
    return true;
  }
}
