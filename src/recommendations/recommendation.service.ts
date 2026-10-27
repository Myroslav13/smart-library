import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { callService } from '../common/service-client';
import type { Book, RecommendationStrategyName } from '../domain/types';
import { DatabaseService } from '../infrastructure/database.service';
import { STRATEGY_NAMES, recommendationStrategies } from './recommendation.strategies';

@Injectable()
export class RecommendationService {
  constructor(private readonly db: DatabaseService) {}

  getStrategy() {
    return { strategy: this.db.recommendationStrategy, available: STRATEGY_NAMES };
  }

  setStrategy(name: string) {
    if (!STRATEGY_NAMES.includes(name as RecommendationStrategyName)) {
      throw new AppError(`Невідома стратегія. Доступні: ${STRATEGY_NAMES.join(', ')}`);
    }
    this.db.recommendationStrategy = name as RecommendationStrategyName;
    return this.getStrategy();
  }

  async getPersonalRecommendations(userId: string) {
    const list = await callService<Array<Pick<Book, 'id' | 'title' | 'author' | 'genre' | 'format' | 'price'>>>(
      'catalog',
      '/api/internal/catalog/books',
    );
    const books = new Map(
      list.map((book) => [
        book.id,
        { ...book, description: '', isbn: '', publishedYear: null, ebookContent: '' },
      ]),
    );
    const strategy = recommendationStrategies[this.db.recommendationStrategy] || recommendationStrategies.history;
    return {
      strategy: this.db.recommendationStrategy,
      items: strategy({
        userId,
        books,
        history: this.db.history,
        salesCount: this.db.salesCount,
      }),
    };
  }

  recordView(userId: string, bookId: string): void {
    const history = this.db.ensureHistory(userId);
    history.views.push(bookId);
    if (history.views.length > 50) history.views.shift();
  }

  recordPurchase(input: { userId: string; items: Array<{ bookId: string; quantity: number }> }): void {
    const history = this.db.ensureHistory(input.userId);
    for (const item of input.items) {
      history.purchases.push(item.bookId);
      this.db.salesCount.set(item.bookId, (this.db.salesCount.get(item.bookId) || 0) + item.quantity);
    }
  }
}
