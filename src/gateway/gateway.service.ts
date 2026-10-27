import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../common/app-error';
import { runtime, type ServiceName } from '../runtime';

@Injectable()
export class GatewayService {
  async send<T>(service: ServiceName, operation: string, payload: Record<string, unknown> = {}): Promise<T> {
    const client = runtime.clients[service];
    if (!client) throw new AppError(`Сервіс «${service}» недоступний`, 503);
    try {
      return await firstValueFrom(client.send(`${service}.request`, { operation, ...payload }));
    } catch (error) {
      const value = error as { status?: number; message?: string; error?: string | { status?: number; message?: string } };
      const nested = typeof value?.error === 'object' ? value.error : undefined;
      throw new AppError(
        value?.message || (typeof value?.error === 'string' ? value.error : nested?.message) || 'Мікросервіс недоступний',
        typeof value?.status === 'number' ? value.status : nested?.status || 502,
      );
    }
  }

  async session(token: string) {
    const client = runtime.clients.auth;
    if (!client) throw new AppError('Сервіс «auth» недоступний', 503);
    try {
      return await firstValueFrom(client.send('auth.session', { token }));
    } catch (error) {
      const value = error as { status?: number; message?: string; error?: string | { status?: number; message?: string } };
      const nested = typeof value?.error === 'object' ? value.error : undefined;
      throw new AppError(
        value?.message || (typeof value?.error === 'string' ? value.error : nested?.message) || 'Сервіс авторизації недоступний',
        typeof value?.status === 'number' ? value.status : nested?.status || 502,
      );
    }
  }
}
