import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import type { Book, BookFormat, BookSearchFilters } from '../domain/types';
import { isBookFormat } from '../domain/types';

interface SearchDocument {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  format: BookFormat;
  price: number;
  isbn: string;
}

function matchesFormat(bookFormat: BookFormat, filter: string): boolean {
  if (!filter) return true;
  if (!isBookFormat(filter)) {
    throw new AppError('Невідомий формат. Допустимі значення: physical, ebook, both');
  }
  if (filter === 'physical') return bookFormat === 'physical' || bookFormat === 'both';
  if (filter === 'ebook') return bookFormat === 'ebook' || bookFormat === 'both';
  return bookFormat === 'both';
}

@Injectable()
export class SearchIndexService {
  private readonly docs = new Map<string, SearchDocument>();

  upsert(book: Book): void {
    this.docs.set(book.id, {
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      description: book.description,
      format: book.format,
      price: book.price,
      isbn: book.isbn || '',
    });
  }

  findIds(filters: BookSearchFilters = {}): string[] {
    const tokens = String(filters.q || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const genre = String(filters.genre || '').trim().toLowerCase();
    const author = String(filters.author || '').trim().toLowerCase();
    const format = String(filters.format || '').trim().toLowerCase();
    const minPrice = filters.minPrice === undefined || filters.minPrice === '' ? null : Number(filters.minPrice);
    const maxPrice = filters.maxPrice === undefined || filters.maxPrice === '' ? null : Number(filters.maxPrice);

    if ((minPrice !== null && Number.isNaN(minPrice)) || (maxPrice !== null && Number.isNaN(maxPrice))) {
      throw new AppError('Некоректне значення фільтра ціни');
    }

    const found = [...this.docs.values()].filter((book) => {
      if (tokens.length) {
        const haystack = `${book.title} ${book.author} ${book.description} ${book.genre} ${book.isbn}`.toLowerCase();
        if (!tokens.every((token) => haystack.includes(token))) return false;
      }
      if (genre && book.genre.toLowerCase() !== genre) return false;
      if (author && !book.author.toLowerCase().includes(author)) return false;
      if (!matchesFormat(book.format, format)) return false;
      if (minPrice !== null && book.price < minPrice) return false;
      if (maxPrice !== null && book.price > maxPrice) return false;
      return true;
    });

    found.sort((a, b) => a.title.localeCompare(b.title, 'uk'));
    const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
    return found.slice(0, limit).map((book) => book.id);
  }
}
