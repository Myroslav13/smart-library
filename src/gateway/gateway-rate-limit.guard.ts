import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../common/app-error';

@Injectable()
export class GatewayRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip || request.socket.remoteAddress || 'local';
    const now = Date.now();
    const recent = (this.hits.get(key) || []).filter((timestamp) => now - timestamp < 60_000);
    if (recent.length >= 300) {
      this.hits.set(key, recent);
      throw new AppError('Забагато запитів. Спробуйте пізніше.', 429);
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
