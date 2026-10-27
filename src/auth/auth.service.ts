import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { isRole, Role, ROLE_LIST } from '../common/roles';
import type { PublicUser, User } from '../domain/types';
import { AppConfig } from '../infrastructure/app-config.service';
import { CacheService } from '../infrastructure/cache.service';
import { DatabaseService } from '../infrastructure/database.service';
import { createId, createToken } from '../infrastructure/ids';
import { hashPassword, verifyPassword } from '../infrastructure/password';

export interface AuthSession {
  token: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cache: CacheService,
    private readonly config: AppConfig,
  ) {}

  private toPublic(user: User): PublicUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  private issueSession(user: User): AuthSession {
    const token = createToken();
    this.cache.saveSession(token, {
      userId: user.id,
      expiresAt: Date.now() + this.config.tokenTtlMs,
    });
    return { token, user: this.toPublic(user) };
  }

  createUser(input: { id?: string; name?: string; email?: string; password?: string; role?: string }): PublicUser {
    const name = String(input.name || '').trim();
    const email = String(input.email || '').trim().toLowerCase();
    const password = input.password;
    const role = input.role ?? Role.CLIENT;
    if (name.length < 2) throw new AppError("Ім'я має містити щонайменше 2 символи");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Некоректна електронна пошта');
    if (typeof password !== 'string' || password.length < 6) {
      throw new AppError('Пароль має містити щонайменше 6 символів');
    }
    if (!isRole(role)) throw new AppError('Невідома роль');

    for (const user of this.db.users.values()) {
      if (user.email === email) throw new AppError('Користувач із такою поштою вже існує', 409);
    }

    const user: User = {
      id: input.id || createId(),
      name,
      email,
      passwordHash: hashPassword(password),
      role,
      createdAt: new Date().toISOString(),
    };
    this.db.users.set(user.id, user);
    return this.toPublic(user);
  }

  register(input: { name?: string; email?: string; password?: string }): AuthSession {
    const created = this.createUser({ ...input, role: Role.CLIENT });
    const user = this.db.users.get(created.id);
    if (!user) throw new AppError('Користувача не знайдено', 500);
    return this.issueSession(user);
  }

  login(input: { email?: string; password?: string }): AuthSession {
    const email = String(input.email || '').trim().toLowerCase();
    const user = [...this.db.users.values()].find((item) => item.email === email);
    if (!user || !verifyPassword(input.password || '', user.passwordHash)) {
      throw new AppError('Невірна пошта або пароль', 401);
    }
    return this.issueSession(user);
  }

  logout(token: string): void {
    this.cache.deleteSession(token);
  }

  authenticate(token: string): PublicUser | null {
    const session = this.cache.getSession(token);
    if (!session) return null;
    const user = this.db.users.get(session.userId);
    return user ? this.toPublic(user) : null;
  }

  getProfile(userId: string): PublicUser {
    const user = this.db.users.get(userId);
    if (!user) throw new AppError('Користувача не знайдено', 404);
    return this.toPublic(user);
  }

  updateProfile(userId: string, input: { name?: string }): PublicUser {
    const user = this.db.users.get(userId);
    if (!user) throw new AppError('Користувача не знайдено', 404);
    const name = String(input.name || '').trim();
    if (name.length < 2) throw new AppError("Ім'я має містити щонайменше 2 символи");
    user.name = name;
    return this.toPublic(user);
  }

  listUsers(): PublicUser[] {
    return [...this.db.users.values()].map((user) => this.toPublic(user));
  }

  setRole(actorId: string, userId: string, role: string): PublicUser {
    if (actorId === userId) throw new AppError('Не можна змінити власну роль', 409);
    if (!isRole(role)) throw new AppError('Невідома роль');
    if (!ROLE_LIST.includes(role)) throw new AppError('Невідома роль');
    const user = this.db.users.get(userId);
    if (!user) throw new AppError('Користувача не знайдено', 404);
    user.role = role;
    return this.toPublic(user);
  }
}
