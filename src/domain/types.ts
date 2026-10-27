import type { Role } from '../common/roles';

export const BOOK_FORMATS = ['physical', 'ebook', 'both'] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export function isBookFormat(value: string): value is BookFormat {
  return (BOOK_FORMATS as readonly string[]).includes(value);
}

export type OrderStatus =
  | 'pending_payment'
  | 'preparing_shipment'
  | 'completed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'succeeded' | 'cancelled';
export type PaymentProvider = 'stripe' | 'liqpay';
export type NotificationChannel = 'email' | 'push' | 'sms';
export type RecommendationStrategyName = 'history' | 'popularity' | 'content';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface User extends PublicUser {
  passwordHash: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  format: BookFormat;
  price: number;
  isbn: string;
  publishedYear: number | null;
  ebookContent: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  authorName: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  bookId: string;
  title: string;
  format: BookFormat;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  stockConfirmed: boolean;
  createdAt: string;
  paidAt: string | null;
  paymentUrl: string | null;
  paymentId: string | null;
  updatedAt?: string;
}

export interface Stock {
  available: number;
  reserved: number;
  title: string;
  format: BookFormat;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  provider: PaymentProvider;
  externalId: string;
  url: string;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  channel: NotificationChannel;
  message: string;
  orderId: string;
  createdAt: string;
}

export interface UserHistory {
  views: string[];
  purchases: string[];
}

export interface Session {
  userId: string;
  expiresAt: number;
}

export interface CartItem {
  bookId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
}

export interface StockStatus {
  inStock: boolean;
  available: number | null;
}

export interface BookSearchFilters {
  q?: string;
  genre?: string;
  author?: string;
  format?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  limit?: string | number;
}
