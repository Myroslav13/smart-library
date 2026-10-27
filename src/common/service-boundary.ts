import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppError } from './app-error';
import { isRole } from './roles';
import { runtime } from '../runtime';
import type { AuthenticatedRequest } from '../auth/auth.decorators';
import { RolesGuard } from '../auth/roles.guard';

function header(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

@Injectable()
export class TrustedGatewayGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (header(request.headers['x-internal-token']) !== runtime.internalToken) {
      throw new AppError('Доступ лише через API Gateway', 401);
    }

    const authorization = header(request.headers.authorization);
    if (authorization.startsWith('Bearer ')) request.token = authorization.slice(7).trim();

    const id = header(request.headers['x-user-id']);
    const role = header(request.headers['x-user-role']);
    if (id && isRole(role)) {
      request.user = {
        id,
        role,
        name: safeDecode(header(request.headers['x-user-name'])),
        email: safeDecode(header(request.headers['x-user-email'])),
      };
    }
    return true;
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

@Module({
  providers: [
    { provide: APP_GUARD, useClass: TrustedGatewayGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class ServiceBoundaryModule {}
