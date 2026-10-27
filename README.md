# Розумна книгарня

Серверна частина варіанту 4 з лабораторної №1 на NestJS і TypeScript. Інтерфейсу немає: клієнт, склад і адміністратор працюють через HTTP API.

Клієнт звертається лише до API Gateway. Gateway перевіряє сесію, ліміт запитів і пересилає HTTP у окремі Nest-застосунки: автентифікація, каталог, рекомендації, замовлення, склад, оплата, сповіщення. Сервіси між собою теж говорять по HTTP, не через gateway. PostgreSQL, Redis і Elasticsearch замінені пам'яттю кожного процесу, щоб проєкт запускався без Docker. Платіжний шлюз і розсилка імітовані.

## Запуск

```bash
npm install
npm start
```

Публічна адреса — лише API Gateway: `http://localhost:3000`. Порти мікросервісів обираються автоматично.

Перевірити сценарій з діаграми взаємодії (кошик, резерв, оплата, webhook, сповіщення):

```bash
npm run demo
```

Інший платіжний адаптер: `PAYMENT_PROVIDER=liqpay` (у PowerShell: `$env:PAYMENT_PROVIDER='liqpay'`).

## Облікові записи

| Роль | Пошта | Пароль |
| --- | --- | --- |
| Клієнт | client@library.test | client123 |
| Контент-менеджер | manager@library.test | manager123 |
| Склад | warehouse@library.test | warehouse123 |
| Адміністратор | admin@library.test | admin123 |

Секрет webhook: `dev-webhook-secret` (заголовок `x-webhook-secret`).

## Сервіси

- `src/gateway` — єдина точка входу: маршрутизація, сесія, ліміт запитів.
- `src/auth` — автентифікація, сесії в кеші, ролі.
- `src/catalog` — каталог, пошук, відгуки, електронна бібліотека.
- `src/recommendations` — Strategy: `history`, `popularity`, `content`.
- `src/orders` — кошик і замовлення. Після оплати викликає склад, рекомендації і сповіщення.
- `src/inventory` — резерв, списання, поставка, інвентаризація.
- `src/payments` — Adapter для Stripe і LiqPay. Успішний webhook повідомляє сервіс замовлень по HTTP.
- `src/notifications` — email і push.
- `src/infrastructure` — пам'ять замість PostgreSQL, Redis і Elasticsearch у кожному сервісі окремо.

Після успішної оплати замовлення позначається оплаченим, склад списує резерв, клієнт отримує email і push.

Послідовність оплати з діаграми: `POST /api/orders/checkout` → резерв → `initPayment` → `POST /api/payments/webhook`.

## Основні маршрути

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/books?q=&genre=&author=&format=&minPrice=&maxPrice=`
- `GET /api/recommendations`
- `GET /api/cart`, `POST /api/cart/items`
- `POST /api/orders/checkout` з тілом `{ "cartId": "..." }` (приймається і `cart_id`)
- `POST /api/payments/webhook`
- `POST /api/orders/:id/cancel`
- `PATCH /api/orders/:id/status` — `shipped`, потім `delivered`
- `GET /api/library/:bookId`
- `POST /api/books`, `PATCH /api/reviews/:id`
- `GET /api/inventory`, `POST /api/inventory/shipments`, `POST /api/inventory/stocktake`
- `GET /api/admin/analytics`, `PATCH /api/admin/recommendation-strategy`
