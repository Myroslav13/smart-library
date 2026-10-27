import { AppError } from './app-error';
import { runtime, type ServiceName } from '../runtime';

export async function callService<T>(
  service: ServiceName,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const base = runtime.urls[service];
  if (!base) throw new AppError(`Сервіс «${service}» ще не запущений`, 503);

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'content-type': 'application/json',
        'x-internal-token': runtime.internalToken,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new AppError(`Сервіс «${service}» недоступний`, 502);
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as { error?: string }) : null;
  if (!response.ok) {
    throw new AppError(data?.error || `Помилка сервісу «${service}»`, response.status);
  }
  return data as T;
}
