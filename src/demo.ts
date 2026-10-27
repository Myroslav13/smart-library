import 'reflect-metadata';
import { startSystem } from './bootstrap';
import { runtime } from './runtime';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

interface ApiResult {
  status: number;
  data: any;
}

async function api(
  base: string,
  method: string,
  path: string,
  options: { token?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<ApiResult> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

interface DemoBook {
  id: string;
  title: string;
  author?: string;
  available?: number | null;
}

function findBook(books: DemoBook[], title: string): DemoBook {
  const book = books.find((item) => item.title === title);
  assert(book, `У каталозі немає книги «${title}»`);
  return book;
}

function webhookBody(provider: string, orderId: string) {
  if (provider === 'liqpay') return { status: 'success', order_id: orderId };
  return {
    type: 'payment_intent.succeeded',
    data: { object: { metadata: { order_id: orderId } } },
  };
}

async function run(base: string): Promise<void> {
  const health = await api(base, 'GET', '/api/health');
  assert(health.status === 200 && health.data.status === 'ok', 'Сервіс не відповів на /api/health');
  console.log('1. Health:', health.data.entry);

  const login = await api(base, 'POST', '/api/auth/login', {
    body: { email: 'client@library.test', password: 'client123' },
  });
  assert(login.status === 200, 'Клієнт не зміг увійти');
  const clientToken = login.data.token as string;
  console.log('2. Увійшов клієнт:', login.data.user.name);

  const search = await api(base, 'GET', `/api/books?q=${encodeURIComponent('Франко')}`);
  assert(search.status === 200 && search.data.some((book: { author: string }) => book.author.includes('Франко')), 'Пошук не знайшов Франка');
  console.log('3. Пошук «Франко»:', search.data.map((book: { title: string }) => book.title).join(', '));

  const recommendations = await api(base, 'GET', '/api/recommendations', { token: clientToken });
  assert(recommendations.status === 200 && recommendations.data.items.length > 0, 'Немає рекомендацій');
  console.log(
    '4. Рекомендації (%s): %s',
    recommendations.data.strategy,
    recommendations.data.items.map((item: { title: string }) => item.title).join(', '),
  );

  const catalog = await api(base, 'GET', '/api/books');
  const books = catalog.data as DemoBook[];
  const berkut = findBook(books, 'Захар Беркут');
  const city = findBook(books, 'Місто');
  const tygrolovy = findBook(books, 'Тигролови');
  const dune = findBook(books, 'Дюна');

  const details = await api(base, 'GET', `/api/books/${encodeURIComponent(dune.id)}`, { token: clientToken });
  assert(details.status === 200, 'Картка книги не відкрилась');
  console.log('5. Перегляд книги:', details.data.title);

  const oversell = await api(base, 'POST', '/api/cart/items', {
    token: clientToken,
    body: { bookId: berkut.id, quantity: 1000 },
  });
  assert(oversell.status === 409, 'Система дозволила замовити більше, ніж є на складі');
  console.log('6. Відмова складу:', oversell.data.error);

  const cart = await api(base, 'POST', '/api/cart/items', {
    token: clientToken,
    body: { bookId: berkut.id, quantity: 1 },
  });
  assert(cart.status === 201, 'Не вдалося додати книгу в кошик');
  const cancelCheckout = await api(base, 'POST', '/api/orders/checkout', {
    token: clientToken,
    body: { cart_id: cart.data.id },
  });
  assert(cancelCheckout.status === 201, 'Не вдалося створити замовлення для скасування');
  const availableWhileReserved = (await api(base, 'GET', `/api/books/${berkut.id}`)).data.available;
  const cancelled = await api(base, 'POST', `/api/orders/${cancelCheckout.data.orderId}/cancel`, { token: clientToken });
  assert(cancelled.status === 200 && cancelled.data.status === 'cancelled', 'Скасування не спрацювало');
  const availableAfterCancel = (await api(base, 'GET', `/api/books/${berkut.id}`)).data.available;
  assert(availableAfterCancel === availableWhileReserved + 1, 'Резерв не повернувся на склад');
  const lateWebhook = await api(base, 'POST', '/api/payments/webhook', {
    headers: { 'x-webhook-secret': runtime.webhookSecret },
    body: webhookBody(runtime.paymentProvider, cancelCheckout.data.orderId),
  });
  assert(lateWebhook.status === 409, 'Скасований платіж не має проходити');
  console.log('7. Скасування замовлення повернуло книгу на склад');

  const physical = await api(base, 'POST', '/api/cart/items', {
    token: clientToken,
    body: { bookId: city.id, quantity: 1 },
  });
  const mixedCart = await api(base, 'POST', '/api/cart/items', {
    token: clientToken,
    body: { bookId: tygrolovy.id, quantity: 1 },
  });
  assert(mixedCart.status === 201, 'Не вдалося зібрати кошик');
  const before = await api(base, 'GET', `/api/books/${city.id}`);
  const checkout = await api(base, 'POST', '/api/orders/checkout', {
    token: clientToken,
    body: { cartId: mixedCart.data.id },
  });
  assert(checkout.status === 201 && checkout.data.paymentUrl, 'Checkout не повернув посилання на оплату');
  assert(
    String(checkout.data.paymentUrl).includes(runtime.paymentProvider === 'liqpay' ? 'liqpay' : 'stripe'),
    'Невірний платіжний адаптер',
  );
  console.log('8. Checkout:', checkout.data.orderId, checkout.data.paymentUrl);

  const reserved = await api(base, 'GET', `/api/books/${city.id}`);
  assert(reserved.data.available === before.data.available - 1, 'Фізичну книгу не зарезервовано');

  const notificationsBefore = await api(base, 'GET', '/api/notifications', { token: clientToken });
  const paid = await api(base, 'POST', '/api/payments/webhook', {
    headers: { 'x-webhook-secret': runtime.webhookSecret },
    body: webhookBody(runtime.paymentProvider, checkout.data.orderId),
  });
  assert(paid.status === 200 && paid.data.status === 'succeeded', 'Webhook оплати не пройшов');
  const duplicate = await api(base, 'POST', '/api/payments/webhook', {
    headers: { 'x-webhook-secret': runtime.webhookSecret },
    body: webhookBody(runtime.paymentProvider, checkout.data.orderId),
  });
  assert(duplicate.status === 200 && duplicate.data.duplicate === true, 'Повторний webhook не ідемпотентний');

  const order = await api(base, 'GET', `/api/orders/${checkout.data.orderId}`, { token: clientToken });
  assert(order.data.status === 'preparing_shipment', `Очікувався статус preparing_shipment, отримано ${order.data.status}`);
  const afterPay = await api(base, 'GET', `/api/books/${city.id}`);
  assert(afterPay.data.available === reserved.data.available, 'Повторне списання змінює залишок');

  const notifications = await api(base, 'GET', '/api/notifications', { token: clientToken });
  assert(
    notifications.data.length === notificationsBefore.data.length + 2,
    'Має прийти email і push, без дубля після повторного webhook',
  );
  assert(
    notifications.data.some((item: { message: string }) => item.message === 'Ваше замовлення оплачено та готується до відправки'),
    'Немає сповіщення про оплату',
  );
  console.log('9. Оплата підтверджена, статус:', order.data.status);

  const library = await api(base, 'GET', `/api/library/${tygrolovy.id}`, { token: clientToken });
  assert(library.status === 200 && library.data.content, 'Електронна книга не відкрилась');
  const denied = await api(base, 'GET', `/api/library/${city.id}`, { token: clientToken });
  assert(denied.status === 404, 'Паперова книга не повинна відкриватися як електронна');
  console.log('10. Електронна книга доступна:', library.data.title);

  const warehouseLogin = await api(base, 'POST', '/api/auth/login', {
    body: { email: 'warehouse@library.test', password: 'warehouse123' },
  });
  const shipped = await api(base, 'PATCH', `/api/orders/${checkout.data.orderId}/status`, {
    token: warehouseLogin.data.token,
    body: { status: 'shipped' },
  });
  assert(shipped.status === 200 && shipped.data.status === 'shipped', 'Склад не змінив статус');
  const shippedNote = await api(base, 'GET', '/api/notifications', { token: clientToken });
  assert(
    shippedNote.data.some((item: { message: string }) => item.message === 'Замовлення передано до доставки'),
    'Немає сповіщення про доставку',
  );
  console.log('11. Склад передав замовлення до доставки');

  const adminLogin = await api(base, 'POST', '/api/auth/login', {
    body: { email: 'admin@library.test', password: 'admin123' },
  });
  const analytics = await api(base, 'GET', '/api/admin/analytics', { token: adminLogin.data.token });
  assert(analytics.status === 200 && analytics.data.ordersCount >= 2, 'Аналітика не бачить оплачені замовлення');
  const strategy = await api(base, 'PATCH', '/api/admin/recommendation-strategy', {
    token: adminLogin.data.token,
    body: { strategy: 'popularity' },
  });
  assert(strategy.data.strategy === 'popularity', 'Стратегія рекомендацій не змінилась');
  const popular = await api(base, 'GET', '/api/recommendations', { token: clientToken });
  assert(popular.data.strategy === 'popularity', 'Клієнт не отримав нову стратегію');
  console.log('12. Адмін увімкнув стратегію popularity. Виручка:', analytics.data.revenue);

  const managerLogin = await api(base, 'POST', '/api/auth/login', {
    body: { email: 'manager@library.test', password: 'manager123' },
  });
  const created = await api(base, 'POST', '/api/books', {
    token: managerLogin.data.token,
    body: {
      title: 'Сонячна машина',
      author: 'Володимир Винниченко',
      genre: 'Фантастика',
      description: 'Роман-утопія.',
      format: 'physical',
      price: 260,
      isbn: '978-617-000-009-9',
      publishedYear: 1928,
      initialStock: 3,
    },
  });
  assert(created.status === 201, 'Контент-менеджер не додав книгу');
  const found = await api(base, 'GET', `/api/books?q=${encodeURIComponent('Сонячна')}`);
  assert(found.data.some((book: { id: string }) => book.id === created.data.id), 'Нова книга не потрапила в пошук');

  const pendingBook = await api(base, 'GET', `/api/books/${dune.id}?pending=1`, { token: managerLogin.data.token });
  const pendingReview = pendingBook.data.reviews.find((review: { status?: string }) => review.status === 'pending');
  assert(pendingReview, 'Немає відгуку на модерацію');
  const moderated = await api(base, 'PATCH', `/api/reviews/${pendingReview.id}`, {
    token: managerLogin.data.token,
    body: { status: 'approved' },
  });
  assert(moderated.data.status === 'approved', 'Модерація відгуку не спрацювала');
  console.log('13. Контент-менеджер додав книгу і схвалив відгук');

  assert(physical.status === 201, 'Паперова книга не додалась у кошик');
  console.log('\nСценарій діаграми взаємодії пройдено.');
}

async function main(): Promise<void> {
  const system = await startSystem({ gatewayPort: 0, logger: ['error', 'warn'] });

  try {
    await run(system.gatewayUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('\nПомилка демо:', message);
    process.exitCode = 1;
  } finally {
    await system.close();
  }
}

void main();
