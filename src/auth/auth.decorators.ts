import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../common/app-error';
import type { Role } from '../common/roles';
import type { PublicUser } from '../domain/types';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
  token?: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): PublicUser => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.user) throw new AppError('Потрібна автентифікація', 401);
  return request.user;
});

export const OptionalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser | undefined => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
  },
);

export const AccessToken = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.token) throw new AppError('Потрібна автентифікація', 401);
  return request.token;
});
