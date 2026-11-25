# API contract

The shared contract every task builds against. Types live in [`src/api/contract.ts`](../src/api/contract.ts) and are
imported by both the client and the mock server, so a mismatch is a compile error.

## Conventions

- JSON in, JSON out. Authenticated endpoints take `Authorization: Bearer <token>`.
- **Money is integer cents.** `price: 1299` means $12.99. Formatting to dollars happens only in the UI (`formatCents`).
- Every non-2xx response uses the same error envelope:

```ts
type ApiError = {
  error: {
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'OUT_OF_STOCK' | 'INTERNAL_ERROR';
    message: string; // for developers and logs, never shown to users
    details?: Record<string, string>; // machine-readable extras (field reasons, product id)
  };
};
```

| Status | `code`             | `details`                                            |
| ------ | ------------------ | ---------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `{ <field>: <reason> }`, e.g. `{ email: 'invalid' }` |
| 401    | `UNAUTHORIZED`     | none                                                 |
| 404    | `NOT_FOUND`        | none                                                 |
| 409    | `OUT_OF_STOCK`     | `{ productId, available }`                           |
| 500    | `INTERNAL_ERROR`   | none                                                 |

## Types

```ts
type Product = {
  id: string; // "prod-0001" ... "prod-5000"
  name: string;
  price: number; // integer cents
  category: 'keyboards' | 'ducks' | 'coffee' | 'stickers';
  stock: number;
  rating: number; // 3.0 - 5.0
  imageUrl: string;
};
type User = { id: string; name: string; email: string };
```

## Endpoints

| Method | Endpoint                                      | Success                           | Errors        |
| ------ | --------------------------------------------- | --------------------------------- | ------------- |
| GET    | `/api/products?search=&category=&sort=&page=` | 200 `{ items: Product[], total }` | 500           |
| GET    | `/api/products/:id`                           | 200 `Product`                     | 404           |
| POST   | `/api/login`                                  | 200 `{ token, user }`             | 400, 401      |
| GET    | `/api/me`                                     | 200 `User`                        | 401           |
| POST   | `/api/orders`                                 | 201 `{ id, status: "queued" }`    | 400, 401, 409 |
| GET    | `/api/orders/:id`                             | 200 `{ id, status }`              | 401, 404      |

### GET /api/products

| Param      | Values                                                     | Default    |
| ---------- | ---------------------------------------------------------- | ---------- |
| `search`   | free text, matches name or id (case-insensitive)           | none       |
| `category` | `keyboards` \| `ducks` \| `coffee` \| `stickers`           | all        |
| `sort`     | `featured` \| `price-asc` \| `price-desc` \| `rating-desc` | `featured` |
| `page`     | integer ≥ 1                                                | `1`        |
| `pageSize` | 1-100 _(additive extension)_                               | `24`       |
| `inStock`  | `true` to hide sold-out products _(additive extension)_    | off        |

`total` is the number of matches across all pages, so the UI can show a result count. `inStock` is filtered on the
server so the count and paging stay correct. The two extensions are optional, so clients that don't know them are unaffected.

### POST /api/login

Body: `{ email, password }`. A 400 lists each bad field: `{ email: 'required' | 'invalid', password: 'required' }`.
Wrong credentials return 401.

### POST /api/orders

Body: `{ items: [{ productId, quantity }] }`. Header: `Idempotency-Key: <uuid>` (recommended).

- Sending the same `Idempotency-Key` again returns the **original** order (201, same `id`) and does not reserve stock twice.
- 409 when any line asks for more than `stock`. `details` is `{ productId, available }` for the first line that failed.
- 400 when `items` is empty or a quantity is not a positive integer.

### GET /api/orders/:id

Returns `{ id, status }` where `status` is `queued` → `processing` → `confirmed`. It also returns
`items`, `total` and `createdAt` (additive). Another user's order is a 404, so its existence is not revealed.

## Live stock (WebSocket)

`wss://live.bugbazaar.mock/stock` (mocked in the browser by MSW).

| Direction       | Message                                                 |
| --------------- | ------------------------------------------------------- |
| client → server | `{ type: 'subscribe', productIds: string[] }` (max 200) |
| server → client | `{ type: 'hello', serverTime }`                         |
| server → client | `{ type: 'stock', updates: [{ productId, stock }] }`    |

## How the mock works

[`src/mocks/`](../src/mocks) uses MSW: a Service Worker answers `fetch` calls in the browser, and the same handlers
answer them in Node for tests. 5,000 products are seeded from a fixed random seed, so the data is the same on every load.

| To trigger | Do this                                                                                |
| ---------- | -------------------------------------------------------------------------------------- |
| 400        | Submit the login form with an empty or invalid email, or Dev tools → Place order → 400 |
| 401        | Wrong password, or Dev tools → Expire my session                                       |
| 404        | `/products/prod-9999` or `/orders/ord-0`                                               |
| 409        | Dev tools → Place order → 409 (the mock DB lives in one tab, so two tabs cannot race)  |
| 500        | Dev tools → Product list / Product details / Place order → 500                         |
