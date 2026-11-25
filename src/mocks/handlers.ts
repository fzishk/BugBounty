import { delay, http, HttpResponse } from 'msw';
import {
  isCategory,
  isSortOption,
  type ApiError,
  type ApiErrorCode,
  type CreateOrderRequest,
  type CreateOrderResponse,
  type LoginRequest,
  type LoginResponse,
  type Order,
  type OrderStatus,
  type ProductListResponse,
  type User,
} from '../api/contract';
import { chaos, latencyMs } from './chaos';
import { db, DEMO_PASSWORD, DEMO_USER, setStock } from './db';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  OUT_OF_STOCK: 409,
  INTERNAL_ERROR: 500,
};

function apiError(code: ApiErrorCode, message: string, details?: Record<string, string>) {
  const body: ApiError = { error: details ? { code, message, details } : { code, message } };
  return HttpResponse.json(body, { status: STATUS_BY_CODE[code] });
}

function currentUser(request: Request): User | null {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return db.tokens.get(token) === DEMO_USER.id ? DEMO_USER : null;
}

/** Orders move queued -> processing -> confirmed over a few seconds, like a real worker queue. */
function statusFor(createdAtMs: number): OrderStatus {
  const age = Date.now() - createdAtMs;
  if (age < 2500) return 'queued';
  if (age < 5000) return 'processing';
  return 'confirmed';
}

/** Dev tools: invalidate every token so the next authenticated call returns 401. */
export function revokeAllSessions(): void {
  db.tokens.clear();
}

const MAX_PAGE_SIZE = 100;

export const restHandlers = [
  http.get('*/api/products', async ({ request }) => {
    await delay(latencyMs());
    if (chaos.get().productsFail) {
      return apiError('INTERNAL_ERROR', 'Simulated catalog failure.');
    }

    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const category = url.searchParams.get('category') || undefined;
    const sort = url.searchParams.get('sort') || 'featured';
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '24');
    const inStock = url.searchParams.get('inStock') === 'true';

    if (
      (category !== undefined && !isCategory(category)) ||
      !isSortOption(sort) ||
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_PAGE_SIZE
    ) {
      // Not in the contract's listed errors for this endpoint, but a real server would do this.
      return apiError('INTERNAL_ERROR', 'Invalid catalog query.');
    }

    let results = db.products;
    if (category) results = results.filter((p) => p.category === category);
    if (inStock) results = results.filter((p) => p.stock > 0);
    if (search) results = results.filter((p) => db.searchIndex.get(p.id)?.includes(search));

    if (sort !== 'featured') {
      results = [...results].sort((a, b) => {
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'price-desc') return b.price - a.price;
        return b.rating - a.rating;
      });
    }

    const start = (page - 1) * pageSize;
    const body: ProductListResponse = {
      items: results.slice(start, start + pageSize),
      total: results.length,
    };
    return HttpResponse.json(body);
  }),

  http.get('*/api/products/:id', async ({ params }) => {
    await delay(latencyMs());
    if (chaos.get().productDetailFail) {
      return apiError('INTERNAL_ERROR', 'Simulated product failure.');
    }
    const product = db.productsById.get(String(params.id));
    if (!product) {
      return apiError('NOT_FOUND', `Product ${String(params.id)} does not exist.`);
    }
    return HttpResponse.json(product);
  }),

  http.post('*/api/login', async ({ request }) => {
    await delay(latencyMs());
    const body = (await request.json().catch(() => ({}))) as Partial<LoginRequest>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    // 400: field-level problems, keyed by field name with a machine-readable reason.
    const details: Record<string, string> = {};
    if (!email) details.email = 'required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) details.email = 'invalid';
    if (!password) details.password = 'required';
    if (Object.keys(details).length > 0) {
      return apiError('VALIDATION_ERROR', 'Login request is invalid.', details);
    }

    if (email !== DEMO_USER.email || password !== DEMO_PASSWORD) {
      return apiError('UNAUTHORIZED', 'Email or password is incorrect.');
    }

    const token = `tok_${crypto.randomUUID()}`;
    db.tokens.set(token, DEMO_USER.id);
    const response: LoginResponse = { token, user: DEMO_USER };
    return HttpResponse.json(response);
  }),

  http.get('*/api/me', async ({ request }) => {
    await delay(latencyMs());
    const user = currentUser(request);
    if (!user) return apiError('UNAUTHORIZED', 'Missing or expired token.');
    return HttpResponse.json(user);
  }),

  http.post('*/api/orders', async ({ request }) => {
    await delay(latencyMs());
    const user = currentUser(request);
    if (!user) return apiError('UNAUTHORIZED', 'Missing or expired token.');

    // Idempotency: the same key always returns the first order instead of creating a new one.
    const idempotencyKey = request.headers.get('Idempotency-Key');
    const existingId = idempotencyKey ? db.idempotency.get(idempotencyKey) : undefined;
    if (existingId) {
      const response: CreateOrderResponse = { id: existingId, status: 'queued' };
      return HttpResponse.json(response, { status: 201 });
    }

    const forced = chaos.get().orderFailure;
    if (forced === '500') return apiError('INTERNAL_ERROR', 'Simulated order service outage.');

    const body = (await request.json().catch(() => ({}))) as Partial<CreateOrderRequest>;
    const items = Array.isArray(body.items) ? body.items : [];
    if (forced === '400' || items.length === 0) {
      return apiError('VALIDATION_ERROR', 'Order must contain at least one item.', {
        items: 'required',
      });
    }

    for (const line of items) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        return apiError('VALIDATION_ERROR', 'Quantity must be a positive integer.', {
          [`items.${line.productId}`]: 'invalid_quantity',
        });
      }
      const product = db.productsById.get(line.productId);
      if (!product) {
        return apiError('VALIDATION_ERROR', 'Unknown product.', {
          [`items.${line.productId}`]: 'unknown_product',
        });
      }
      if (forced === '409' || product.stock < line.quantity) {
        return apiError('OUT_OF_STOCK', `${product.name} does not have enough stock.`, {
          productId: product.id,
          available: String(forced === '409' ? 0 : product.stock),
        });
      }
    }

    // All lines are valid: reserve stock and create the order.
    const lines = items.flatMap((line) => {
      const product = db.productsById.get(line.productId);
      if (!product) return []; // already validated above
      setStock(product.id, product.stock - line.quantity);
      return [{ ...line, name: product.name, unitPrice: product.price }];
    });
    db.orderCounter += 1;
    const id = `ord-${db.orderCounter}`;
    const createdAtMs = Date.now();
    db.orders.set(id, {
      id,
      userId: user.id,
      status: 'queued',
      items: lines,
      total: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      createdAt: new Date(createdAtMs).toISOString(),
      createdAtMs,
    });
    if (idempotencyKey) db.idempotency.set(idempotencyKey, id);

    const response: CreateOrderResponse = { id, status: 'queued' };
    return HttpResponse.json(response, { status: 201 });
  }),

  http.get('*/api/orders/:id', async ({ request, params }) => {
    await delay(latencyMs());
    const user = currentUser(request);
    if (!user) return apiError('UNAUTHORIZED', 'Missing or expired token.');
    const stored = db.orders.get(String(params.id));
    if (!stored || stored.userId !== user.id) {
      return apiError('NOT_FOUND', `Order ${String(params.id)} does not exist.`);
    }
    const { userId: _userId, createdAtMs, ...order } = stored;
    const response: Order = { ...order, status: statusFor(createdAtMs) };
    return HttpResponse.json(response);
  }),
];
