import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { roundMoney } from '../common/money';
import type { Book, BookFormat, BookSearchFilters, ReviewStatus, StockStatus } from '../domain/types';
import { isBookFormat } from '../domain/types';
import { callService } from '../common/service-client';
import { DatabaseService } from '../infrastructure/database.service';
import { SearchIndexService } from '../infrastructure/search-index.service';
import { createId } from '../infrastructure/ids';

export interface BookView extends StockStatus {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  format: BookFormat;
  price: number;
  isbn: string;
  publishedYear: number | null;
  rating: number | null;
}

export interface PublicReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
  status?: ReviewStatus;
}

export interface AddBookInput {
  title?: string;
  author?: string;
  genre?: string;
  description?: string;
  format?: string;
  price?: number;
  id?: string;
  isbn?: string;
  publishedYear?: number | null;
  initialStock?: number;
  ebookContent?: string;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  genre?: string;
  description?: string;
  price?: number;
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly db: DatabaseService,
    private readonly searchIndex: SearchIndexService,
  ) {}

  private stockOf(book: Book, available: number | null | undefined): StockStatus {
    if (book.format === 'ebook') return { inStock: true, available: null };
    const copies = available ?? 0;
    return { inStock: copies > 0, available: copies };
  }

  private async stockMap(): Promise<Map<string, number>> {
    const rows = await callService<Array<{ bookId: string; available: number }>>('inventory', '/api/internal/stock');
    return new Map(rows.map((row) => [row.bookId, row.available]));
  }

  requireBook(bookId: string): Book {
    const book = this.db.books.get(bookId);
    if (!book) throw new AppError('Книгу не знайдено', 404);
    return book;
  }

  private ratingOf(bookId: string): number | null {
    const approved = [...this.db.reviews.values()].filter(
      (review) => review.bookId === bookId && review.status === 'approved',
    );
    if (!approved.length) return null;
    const average = approved.reduce((sum, review) => sum + review.rating, 0) / approved.length;
    return Math.round(average * 10) / 10;
  }

  present(book: Book, available?: number | null): BookView {
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      description: book.description,
      format: book.format,
      price: book.price,
      isbn: book.isbn,
      publishedYear: book.publishedYear,
      rating: this.ratingOf(book.id),
      ...this.stockOf(book, available),
    };
  }

  private publicReviews(bookId: string, includePending: boolean): PublicReview[] {
    return [...this.db.reviews.values()]
      .filter((review) => review.bookId === bookId && (includePending || review.status === 'approved'))
      .map((review) => ({
        id: review.id,
        authorName: review.authorName || 'Читач',
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
        ...(includePending ? { status: review.status } : {}),
      }));
  }

  async search(filters: BookSearchFilters): Promise<BookView[]> {
    const stock = await this.stockMap();
    return this.searchIndex.findIds(filters).map((id) => this.present(this.requireBook(id), stock.get(id)));
  }

  async getBookDetails(bookId: string, userId?: string, options?: { includePending?: boolean }) {
    const book = this.requireBook(bookId);
    if (userId) {
      await callService('recommendations', '/api/internal/recommendations/views', {
        method: 'POST',
        body: { userId, bookId },
      });
    }
    const stock = await this.stockMap();
    return {
      ...this.present(book, stock.get(bookId)),
      reviews: this.publicReviews(bookId, options?.includePending ?? false),
    };
  }

  async updateStockStatus(bookId: string) {
    const book = this.requireBook(bookId);
    const stock = await this.stockMap();
    return { bookId, ...this.stockOf(book, stock.get(bookId)) };
  }

  summary(bookId: string) {
    const book = this.requireBook(bookId);
    return { id: book.id, title: book.title, author: book.author, genre: book.genre, format: book.format, price: book.price };
  }

  listSummaries() {
    return [...this.db.books.values()].map((book) => this.summary(book.id));
  }

  grantAccess(userId: string, bookIds: string[]): void {
    let access = this.db.ebookAccess.get(userId);
    if (!access) {
      access = new Set<string>();
      this.db.ebookAccess.set(userId, access);
    }
    for (const bookId of bookIds) access.add(bookId);
  }

  async addBook(input: AddBookInput, options?: { syncStock?: boolean }): Promise<BookView> {
    const title = String(input.title || '').trim();
    const author = String(input.author || '').trim();
    const genre = String(input.genre || '').trim();
    const description = String(input.description || '').trim();
    const formatValue = String(input.format || '').trim();
    if (!title || !author || !genre) throw new AppError("Назва, автор і жанр є обов'язковими");
    if (!isBookFormat(formatValue)) {
      throw new AppError('Невідомий формат. Допустимі значення: physical, ebook, both');
    }
    const price = input.price;
    if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
      throw new AppError('Ціна має бути додатним числом');
    }
    const isbn = String(input.isbn || '').trim();
    if (isbn && [...this.db.books.values()].some((book) => book.isbn === isbn)) {
      throw new AppError('Книга з таким ISBN вже є в каталозі', 409);
    }

    const book: Book = {
      id: input.id || createId(),
      title,
      author,
      genre,
      description,
      format: formatValue,
      price: roundMoney(price),
      isbn,
      publishedYear: Number(input.publishedYear) || null,
      ebookContent: formatValue === 'physical' ? '' : String(input.ebookContent || `Електронне видання «${title}».`),
    };
    this.db.books.set(book.id, book);
    const initialStock = input.initialStock ?? 0;
    if (options?.syncStock && formatValue !== 'ebook') {
      await callService('inventory', '/api/internal/stock', {
        method: 'POST',
        body: { bookId: book.id, title: book.title, format: book.format, quantity: initialStock },
      });
    }
    this.searchIndex.upsert(book);
    if (!options?.syncStock) return this.present(book, formatValue === 'ebook' ? null : initialStock);
    const stock = await this.stockMap();
    return this.present(book, stock.get(book.id));
  }

  async updateBook(bookId: string, input: UpdateBookInput): Promise<BookView> {
    const book = this.requireBook(bookId);
    if (input.title !== undefined) {
      const title = String(input.title).trim();
      if (!title) throw new AppError('Назва не може бути порожньою');
      book.title = title;
    }
    if (input.author !== undefined) {
      const author = String(input.author).trim();
      if (!author) throw new AppError('Автор не може бути порожнім');
      book.author = author;
    }
    if (input.genre !== undefined) {
      const genre = String(input.genre).trim();
      if (!genre) throw new AppError('Жанр не може бути порожнім');
      book.genre = genre;
    }
    if (input.description !== undefined) book.description = String(input.description).trim();
    if (input.price !== undefined) {
      if (typeof input.price !== 'number' || input.price <= 0) throw new AppError('Ціна має бути додатним числом');
      book.price = roundMoney(input.price);
    }
    this.searchIndex.upsert(book);
    const stock = await this.stockMap();
    return this.present(book, stock.get(book.id));
  }

  addReview(user: { id: string; name: string }, bookId: string, input: { rating?: number; text?: string }) {
    this.requireBook(bookId);
    const userId = user.id;
    const rating = input.rating;
    if (!Number.isInteger(rating) || rating === undefined || rating < 1 || rating > 5) {
      throw new AppError('Оцінка має бути цілим числом від 1 до 5');
    }
    const text = String(input.text || '').trim();
    if (text.length < 3) throw new AppError('Текст відгуку занадто короткий');

    let review = [...this.db.reviews.values()].find((item) => item.bookId === bookId && item.userId === userId);
    if (!review) {
      review = {
        id: createId(),
        bookId,
        userId,
        authorName: user.name,
        rating,
        text,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      this.db.reviews.set(review.id, review);
    }
    review.rating = rating;
    review.text = text;
    review.status = 'pending';
    review.updatedAt = new Date().toISOString();
    return { id: review.id, status: review.status, rating: review.rating, text: review.text };
  }

  moderateReview(reviewId: string, status: string) {
    const review = this.db.reviews.get(reviewId);
    if (!review) throw new AppError('Відгук не знайдено', 404);
    if (status !== 'approved' && status !== 'rejected') {
      throw new AppError('Статус модерації має бути approved або rejected');
    }
    review.status = status;
    return {
      id: review.id,
      bookId: review.bookId,
      status: review.status,
      rating: review.rating,
      text: review.text,
    };
  }

  async listLibrary(userId: string): Promise<BookView[]> {
    const access = this.db.ebookAccess.get(userId) || new Set<string>();
    const stock = await this.stockMap();
    return [...access].map((bookId) => this.present(this.requireBook(bookId), stock.get(bookId)));
  }

  readEbook(userId: string, bookId: string) {
    const book = this.requireBook(bookId);
    if (book.format === 'physical') throw new AppError('У цієї книги немає електронної копії', 404);
    const access = this.db.ebookAccess.get(userId);
    if (!access || !access.has(bookId)) throw new AppError('Немає доступу до електронної копії', 403);
    return {
      bookId: book.id,
      title: book.title,
      author: book.author,
      content: book.ebookContent,
    };
  }
}
