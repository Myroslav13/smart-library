import { Injectable } from '@nestjs/common';
import type {
  Book,
  NotificationRecord,
  Order,
  Payment,
  RecommendationStrategyName,
  Review,
  Stock,
  User,
  UserHistory,
} from '../domain/types';

@Injectable()
export class DatabaseService {
  readonly users = new Map<string, User>();
  readonly books = new Map<string, Book>();
  readonly reviews = new Map<string, Review>();
  readonly orders = new Map<string, Order>();
  readonly stock = new Map<string, Stock>();
  readonly ebookAccess = new Map<string, Set<string>>();
  readonly notifications: NotificationRecord[] = [];
  readonly payments = new Map<string, Payment>();
  readonly history = new Map<string, UserHistory>();
  readonly salesCount = new Map<string, number>();
  recommendationStrategy: RecommendationStrategyName = 'history';

  ensureHistory(userId: string): UserHistory {
    let history = this.history.get(userId);
    if (!history) {
      history = { views: [], purchases: [] };
      this.history.set(userId, history);
    }
    return history;
  }
}
