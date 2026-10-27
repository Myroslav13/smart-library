import { Injectable } from '@nestjs/common';
import type { Cart, Session } from '../domain/types';

@Injectable()
export class CacheService {
  private readonly sessions = new Map<string, Session>();
  private readonly carts = new Map<string, Cart>();
  private readonly cartsByUser = new Map<string, string>();

  saveSession(token: string, session: Session): void {
    this.sessions.set(token, session);
  }

  getSession(token: string): Session | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  deleteSession(token: string): void {
    this.sessions.delete(token);
  }

  getCart(cartId: string): Cart | null {
    return this.carts.get(cartId) || null;
  }

  getCartByUser(userId: string): Cart | null {
    const cartId = this.cartsByUser.get(userId);
    return cartId ? this.carts.get(cartId) || null : null;
  }

  saveCart(cart: Cart): void {
    this.carts.set(cart.id, cart);
    this.cartsByUser.set(cart.userId, cart.id);
  }
}
