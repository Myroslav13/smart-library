import type { Request, Response } from 'express';
import { AppError } from '../common/app-error';
import { isRole } from '../common/roles';
import { runtime, type ServiceName } from '../runtime';

const ROUTES: Array<{ prefix: string; service: ServiceName }> = [
  { prefix: '/api/admin/users', service: 'auth' },
  { prefix: '/api/admin/analytics', service: 'orders' },
  { prefix: '/api/admin/recommendation-strategy', service: 'recommendations' },
  { prefix: '/api/auth', service: 'auth' },
  { prefix: '/api/profile', service: 'auth' },
  { prefix: '/api/books', service: 'catalog' },
  { prefix: '/api/reviews', service: 'catalog' },
  { prefix: '/api/library', service: 'catalog' },
  { prefix: '/api/cart', service: 'orders' },
  { prefix: '/api/orders', service: 'orders' },
  { prefix: '/api/payments', service: 'payments' },
  { prefix: '/api/notifications', service: 'notifications' },
  { prefix: '/api/inventory', service: 'inventory' },
  { prefix: '/api/recommendations', service: 'recommendations' },
];

const hits = new Map<string, number[]>();

function accessFor(method: string, path: string): 'public' | 'optional' | 'required' {
  if (path === '/api/health') return 'public';
  if (method === 'POST' && (path === '/api/auth/login' || path === '/api/auth/register')) return 'public';
  if (method === 'GET' && path === '/api/books') return 'public';
  if (method === 'GET' && /^\/api\/books\/[^/]+$/.test(path)) return 'optional';
  if (method === 'POST' && path === '/api/payments/webhook') return 'public';
  return 'required';
}

function serviceFor(path: string): ServiceName | null {
  const route = ROUTES.find((item) => path === item.prefix || path.startsWith(`${item.prefix}/`));
  return route?.service ?? null;
}

function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= 300) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

async function resolveUser(authorization: string | undefined): Promise<{ id: string; role: string; name: string; email: string } | null> {
  if (!authorization) return null;
  const response = await fetch(`${runtime.urls.auth}/api/internal/session`, {
    headers: { authorization, 'x-internal-token': runtime.internalToken },
  });
  if (!response.ok) return null;
  return (await response.json()) as { id: string; role: string; name: string; email: string };
}

export async function handleGateway(req: Request, res: Response): Promise<void> {
  try {
    if (tooMany(req.ip || req.socket.remoteAddress || 'local')) {
      res.status(429).json({ error: 'Забагато запитів. Спробуйте пізніше.' });
      return;
    }

    const path = req.path;
    if (req.method === 'GET' && path === '/api/health') {
      res.json({
        status: 'ok',
        service: 'smart-library',
        entry: 'api-gateway',
        paymentProvider: runtime.paymentProvider,
        upstream: runtime.urls,
        components: ['apiGateway', 'auth', 'catalog', 'recommendation', 'orders', 'inventory', 'payment', 'notification'],
      });
      return;
    }

    const service = serviceFor(path);
    if (!service) {
      res.status(404).json({ error: 'Маршрут не знайдено' });
      return;
    }

    const access = accessFor(req.method, path);
    const authorization = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined;
    const user = access === 'public' ? null : await resolveUser(authorization);
    if (access === 'required' && !user) {
      res.status(401).json({ error: 'Потрібна автентифікація' });
      return;
    }
    if (user && !isRole(user.role)) {
      res.status(401).json({ error: 'Потрібна автентифікація' });
      return;
    }

    const headers: Record<string, string> = { 'x-internal-token': runtime.internalToken };
    if (authorization) headers.authorization = authorization;
    const webhookSecret = req.headers['x-webhook-secret'];
    if (typeof webhookSecret === 'string') headers['x-webhook-secret'] = webhookSecret;
    if (user && isRole(user.role)) {
      headers['x-user-id'] = user.id;
      headers['x-user-role'] = user.role;
      headers['x-user-name'] = encodeURIComponent(user.name);
      headers['x-user-email'] = encodeURIComponent(user.email);
    }

    const method = req.method.toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';
    if (hasBody) headers['content-type'] = 'application/json';

    const upstream = await fetch(`${runtime.urls[service]}${req.originalUrl}`, {
      method,
      headers,
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    });
    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    res.status(upstream.status);
    if (upstream.status === 204 || !text) res.end();
    else res.send(text);
  } catch (error) {
    const status = error instanceof AppError ? error.getStatus() : 502;
    const message = error instanceof Error ? error.message : 'API Gateway не зміг достукатися до сервісу';
    if (!res.headersSent) res.status(status).json({ error: message });
  }
}
