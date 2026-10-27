import { Role as RoleName, type Role } from '../common/roles';
import type { BookFormat } from '../domain/types';

export const IDS = {
  client: '20000000-0000-4000-8000-000000000001',
  manager: '20000000-0000-4000-8000-000000000002',
  warehouse: '20000000-0000-4000-8000-000000000003',
  admin: '20000000-0000-4000-8000-000000000004',
  berkut: '10000000-0000-4000-8000-000000000001',
  forest: '10000000-0000-4000-8000-000000000002',
  tygrolovy: '10000000-0000-4000-8000-000000000003',
  city: '10000000-0000-4000-8000-000000000004',
  kobzar: '10000000-0000-4000-8000-000000000005',
  dune: '10000000-0000-4000-8000-000000000006',
  orwell: '10000000-0000-4000-8000-000000000007',
  holmes: '10000000-0000-4000-8000-000000000008',
  sapiens: '10000000-0000-4000-8000-000000000009',
  shadows: '10000000-0000-4000-8000-000000000010',
  pastOrder: '30000000-0000-4000-8000-000000000001',
  approvedReview: '40000000-0000-4000-8000-000000000001',
  pendingReview: '40000000-0000-4000-8000-000000000002',
};

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export const SEED_USERS: SeedUser[] = [
  { id: IDS.client, name: 'Марія Коваль', email: 'client@library.test', password: 'client123', role: RoleName.CLIENT },
  { id: IDS.manager, name: 'Андрій Мельник', email: 'manager@library.test', password: 'manager123', role: RoleName.CONTENT_MANAGER },
  { id: IDS.warehouse, name: 'Олег Савчук', email: 'warehouse@library.test', password: 'warehouse123', role: RoleName.WAREHOUSE },
  { id: IDS.admin, name: 'Ірина Петренко', email: 'admin@library.test', password: 'admin123', role: RoleName.ADMIN },
];

export interface SeedBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  format: BookFormat;
  price: number;
  isbn: string;
  publishedYear: number;
  initialStock?: number;
}

export const SEED_BOOKS: SeedBook[] = [
  { id: IDS.berkut, title: 'Захар Беркут', author: 'Іван Франко', genre: 'Класика', description: 'Історична повість про карпатську громаду.', format: 'physical', price: 280, isbn: '978-617-000-001-1', publishedYear: 1883, initialStock: 5 },
  { id: IDS.forest, title: 'Лісова пісня', author: 'Леся Українка', genre: 'Поезія', description: 'Драма-феєрія про Мавку і Лукаша.', format: 'both', price: 240, isbn: '978-617-000-001-2', publishedYear: 1911, initialStock: 6 },
  { id: IDS.tygrolovy, title: 'Тигролови', author: 'Іван Багряний', genre: 'Класика', description: 'Пригодницький роман про втечу з табору.', format: 'ebook', price: 180, isbn: '978-617-000-001-3', publishedYear: 1944 },
  { id: IDS.city, title: 'Місто', author: "Валер'ян Підмогильний", genre: 'Класика', description: 'Роман про Степана Радченка і місто.', format: 'physical', price: 320, isbn: '978-617-000-001-4', publishedYear: 1928, initialStock: 8 },
  { id: IDS.kobzar, title: 'Кобзар', author: 'Тарас Шевченко', genre: 'Поезія', description: 'Збірка поезій Тараса Шевченка.', format: 'both', price: 350, isbn: '978-617-000-001-5', publishedYear: 1840, initialStock: 10 },
  { id: IDS.dune, title: 'Дюна', author: 'Френк Герберт', genre: 'Фантастика', description: 'Роман про пустельну планету Арракіс.', format: 'physical', price: 540, isbn: '978-617-000-001-6', publishedYear: 1965, initialStock: 4 },
  { id: IDS.orwell, title: '1984', author: 'Джордж Орвелл', genre: 'Фантастика', description: 'Антиутопія про тотальний нагляд.', format: 'ebook', price: 210, isbn: '978-617-000-001-7', publishedYear: 1949 },
  { id: IDS.holmes, title: 'Пригоди Шерлока Холмса', author: 'Артур Конан Дойл', genre: 'Детектив', description: 'Збірка оповідань про Шерлока Холмса.', format: 'both', price: 300, isbn: '978-617-000-001-8', publishedYear: 1892, initialStock: 7 },
  { id: IDS.sapiens, title: 'Sapiens', author: 'Ювал Ной Харарі', genre: 'Наукова', description: 'Коротка історія людства.', format: 'physical', price: 480, isbn: '978-617-000-001-9', publishedYear: 2011, initialStock: 5 },
  { id: IDS.shadows, title: 'Тіні забутих предків', author: 'Михайло Коцюбинський', genre: 'Класика', description: 'Повість про Івана та Марічку.', format: 'ebook', price: 160, isbn: '978-617-000-002-0', publishedYear: 1911 },
];

export function ebookText(title: string, author: string): string {
  return `Електронне видання «${title}». ${author}. Текст відкривається після оплати замовлення і доступний лише в особистій бібліотеці.`;
}
