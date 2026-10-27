import type { Book, RecommendationStrategyName, UserHistory } from '../domain/types';

export interface RecommendationItem {
  id: string;
  title: string;
  author: string;
  genre: string;
  format: Book['format'];
  price: number;
  reason: string;
  score: number;
}

export interface RecommendationContext {
  userId: string;
  books: Map<string, Book>;
  history: Map<string, UserHistory>;
  salesCount: Map<string, number>;
}

function ranked(
  books: Map<string, Book>,
  scoreOf: (book: Book) => number,
  reasonOf: (book: Book) => string,
  limit = 5,
): RecommendationItem[] {
  return [...books.values()]
    .map((book) => ({ book, score: scoreOf(book) }))
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title, 'uk'))
    .slice(0, limit)
    .map(({ book, score }) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      format: book.format,
      price: book.price,
      reason: reasonOf(book),
      score,
    }));
}

function popularity(ctx: RecommendationContext): RecommendationItem[] {
  return ranked(
    ctx.books,
    (book) => ctx.salesCount.get(book.id) || 0,
    (book) => `Популярне у книгарні (${ctx.salesCount.get(book.id) || 0} продажів)`,
  );
}

function history(ctx: RecommendationContext): RecommendationItem[] {
  const personal = ctx.history.get(ctx.userId) || { views: [], purchases: [] };
  const genreScore = new Map<string, number>();
  const bump = (bookId: string, weight: number) => {
    const book = ctx.books.get(bookId);
    if (!book) return;
    genreScore.set(book.genre, (genreScore.get(book.genre) || 0) + weight);
  };
  personal.purchases.forEach((id) => bump(id, 3));
  personal.views.forEach((id) => bump(id, 1));
  if (!genreScore.size) return popularity(ctx);

  const excluded = new Set(personal.purchases);
  const candidates = new Map(
    [...ctx.books.values()].filter((book) => !excluded.has(book.id)).map((book) => [book.id, book] as const),
  );
  return ranked(
    candidates,
    (book) => (genreScore.get(book.genre) || 0) * 10 + (ctx.salesCount.get(book.id) || 0),
    (book) => (genreScore.get(book.genre) ? `Схоже на ваші вподобання: ${book.genre}` : 'Популярне у книгарні'),
  );
}

function content(ctx: RecommendationContext): RecommendationItem[] {
  const personal = ctx.history.get(ctx.userId) || { views: [], purchases: [] };
  const lastViewedId = personal.views[personal.views.length - 1];
  const last = lastViewedId ? ctx.books.get(lastViewedId) : undefined;
  if (!last) return popularity(ctx);

  const excluded = new Set([last.id, ...personal.purchases]);
  const candidates = new Map(
    [...ctx.books.values()].filter((book) => !excluded.has(book.id)).map((book) => [book.id, book] as const),
  );
  return ranked(
    candidates,
    (book) => (book.genre === last.genre ? 5 : 0) + (book.author === last.author ? 3 : 0),
    (book) => {
      if (book.author === last.author) return `Той самий автор, що й «${last.title}»`;
      if (book.genre === last.genre) return `Той самий жанр, що й «${last.title}»`;
      return 'Інші книги каталогу';
    },
  );
}

export const recommendationStrategies: Record<
  RecommendationStrategyName,
  (ctx: RecommendationContext) => RecommendationItem[]
> = {
  history,
  popularity,
  content,
};

export const STRATEGY_NAMES = Object.keys(recommendationStrategies) as RecommendationStrategyName[];
