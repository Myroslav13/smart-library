import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CatalogService } from '../catalog/catalog.service';
import { DatabaseService } from '../infrastructure/database.service';
import { IDS, SEED_BOOKS, SEED_USERS, ebookText } from './seed-data';

@Injectable()
export class AuthSeed implements OnModuleInit {
  constructor(private readonly auth: AuthService) {}

  onModuleInit(): void {
    for (const user of SEED_USERS) this.auth.createUser(user);
  }
}

@Injectable()
export class CatalogSeed implements OnModuleInit {
  constructor(
    private readonly catalog: CatalogService,
    private readonly db: DatabaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const book of SEED_BOOKS) {
      await this.catalog.addBook(
        {
          ...book,
          ebookContent: book.format === 'physical' ? '' : ebookText(book.title, book.author),
        },
        { syncStock: false },
      );
    }

    this.db.reviews.set(IDS.approvedReview, {
      id: IDS.approvedReview,
      bookId: IDS.kobzar,
      userId: IDS.client,
      authorName: 'Марія Коваль',
      rating: 5,
      text: 'Поезія, до якої повертаєшся.',
      status: 'approved',
      createdAt: '2026-09-02T10:00:00.000Z',
    });
    this.db.reviews.set(IDS.pendingReview, {
      id: IDS.pendingReview,
      bookId: IDS.dune,
      userId: IDS.client,
      authorName: 'Марія Коваль',
      rating: 4,
      text: 'Довго, але тримає до кінця.',
      status: 'pending',
      createdAt: '2026-09-03T10:00:00.000Z',
    });
    this.catalog.grantAccess(IDS.client, [IDS.kobzar]);
  }
}

@Injectable()
export class InventorySeed implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  onModuleInit(): void {
    for (const book of SEED_BOOKS) {
      if (book.format === 'ebook' || book.initialStock === undefined) continue;
      const sold = book.id === IDS.kobzar ? 1 : 0;
      this.db.stock.set(book.id, {
        available: book.initialStock - sold,
        reserved: 0,
        title: book.title,
        format: book.format,
      });
    }
  }
}

@Injectable()
export class OrderSeed implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  onModuleInit(): void {
    const kobzar = SEED_BOOKS.find((book) => book.id === IDS.kobzar);
    if (!kobzar) return;
    this.db.orders.set(IDS.pastOrder, {
      id: IDS.pastOrder,
      userId: IDS.client,
      items: [
        {
          bookId: kobzar.id,
          title: kobzar.title,
          format: kobzar.format,
          quantity: 1,
          unitPrice: kobzar.price,
          lineTotal: kobzar.price,
        },
      ],
      total: kobzar.price,
      status: 'delivered',
      stockConfirmed: true,
      createdAt: '2026-09-01T10:00:00.000Z',
      paidAt: '2026-09-01T10:05:00.000Z',
      paymentUrl: null,
      paymentId: null,
    });
  }
}

@Injectable()
export class RecommendationSeed implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  onModuleInit(): void {
    const history = this.db.ensureHistory(IDS.client);
    history.views.push(IDS.dune);
    history.purchases.push(IDS.kobzar);
    this.db.salesCount.set(IDS.kobzar, 4);
    this.db.salesCount.set(IDS.orwell, 2);
    this.db.recommendationStrategy = 'history';
  }
}
