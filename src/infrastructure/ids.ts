import { randomBytes, randomUUID } from 'node:crypto';

export function createId(): string {
  return randomUUID();
}

export function createToken(): string {
  return randomBytes(32).toString('hex');
}
