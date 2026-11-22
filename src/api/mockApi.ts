import type {
  ApiError,
  Bug,
  CreateOrderPayload,
  LoginPayload,
  LoginResponse,
  Order,
  Product,
  ProductCategory,
  ProductListResponse,
  SortOption,
  User,
} from '../types/bazaar';

const BUGS: Bug[] = [
  { id: 1, title: 'Login button overlaps footer', severity: 'Low' },
  { id: 2, title: 'Checkout total is wrong', severity: 'High' },
  { id: 3, title: 'Search ignores capital letters', severity: 'Medium' },
];

const CATEGORIES: ProductCategory[] = ['keyboards', 'ducks', 'coffee', 'stickers'];

const CATEGORY_PREFIXES: Record<ProductCategory, string[]> = {
  keyboards: [
    'Clicky 65% Dev Keyboard',
    'Tactile 75% Tactile Board',
    'Split Ortho Ergonomic Deck',
    'Low-Profile Wireless Keeb',
    'Macro Pad Debugger',
  ],
  ducks: [
    'Rubber Debugger Duck',
    'Neon Cyberpunk Duck',
    'Barista Espresso Duck',
    'Vintage Capybara & Duck',
    'Night-Owl Rubber Duck',
  ],
  coffee: [
    'Segfault Dark Roast Beans',
    'Zero-Downtime Espresso Blend',
    'Kernel Panic Cold Brew',
    'Async Single-Origin Pour',
    'Midnight Commit Medium Roast',
  ],
  stickers: [
    'Works On My Machine Sticker',
    'Strict Mode Enforced Decal',
    'No Any Type Holographic Sticker',
    'Git Push Force Sticker',
    'Rubber Duck Debugging Badge',
  ],
};

function createApiError(
  code: ApiError['error']['code'],
  message: string,
  details?: Record<string, string>,
): ApiError {
  return details ? { error: { code, message, details } } : { error: { code, message } };
}

function seedProducts(count = 5000): Product[] {
  const products: Product[] = [];

  for (let i = 1; i <= count; i += 1) {
    const category = CATEGORIES[(i - 1) % CATEGORIES.length];
    const templates = CATEGORY_PREFIXES[category];
    const template = templates[(i - 1) % templates.length];
    const paddedId = String(i).padStart(4, '0');
    const baseCents =
      category === 'keyboards'
        ? 8900
        : category === 'coffee'
          ? 1800
          : category === 'ducks'
            ? 1200
            : 500;
    const price = baseCents + ((i * 375) % 9500);
    const stock = i % 25 === 0 ? 0 : (i % 19) + 1;
    const rating = Number((3.6 + ((i * 13) % 14) / 10).toFixed(1));

    products.push({
      id: `prod-${paddedId}`,
      name: `${template} #${paddedId}`,
      price,
      category,
      stock,
      rating: Math.min(5, rating),
      imageUrl: `https://example.com/images/prod-${paddedId}.png`,
    });
  }

  return products;
}

const DEMO_USER: User = {
  id: 'usr-101',
  name: 'Faizan Ahmed',
  email: 'faizan@bugbazaar.dev',
  role: 'customer',
};

const VALID_TOKEN = 'mock-jwt-token-usr-101';

let productsStore: Product[] = seedProducts(5000);
const ordersStore = new Map<string, Order>();
const idempotencyOrderMap = new Map<string, string>();
let orderCounter = 9000;

function waitWithSignal(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Request aborted', 'AbortError'));
  }

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new DOMException('Request aborted', 'AbortError'));
    };

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function getAuthenticatedUser(authHeader?: string): User | null {
  if (!authHeader) return null;
  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  if (parts[1] !== VALID_TOKEN) return null;
  return DEMO_USER;
}

export function fetchBugs(): Promise<Bug[]> {
  return new Promise<Bug[]>((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.25) {
        reject(new Error('The bug server is hiding'));
      } else {
        resolve(BUGS);
      }
    }, 300);
  });
}

export type GetProductsParams = {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  forceError?: '400' | '500';
  signal?: AbortSignal;
};

export async function mockGetProducts(
  params: GetProductsParams = {},
): Promise<ProductListResponse> {
  await waitWithSignal(120, params.signal);

  if (params.forceError === '500') {
    throw createApiError('INTERNAL_ERROR', 'Simulated 500 error while loading product catalog.');
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const category = params.category ?? 'all';
  const sort = params.sort ?? 'featured';
  const search = (params.search ?? '').trim().toLowerCase();

  const validCategories = ['all', ...CATEGORIES];
  const validSorts: SortOption[] = ['featured', 'price-asc', 'price-desc', 'rating-desc'];

  if (
    params.forceError === '400' ||
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    !validCategories.includes(category) ||
    !validSorts.includes(sort as SortOption)
  ) {
    throw createApiError('BAD_REQUEST', 'Invalid query parameters for GET /api/products.');
  }

  let results = productsStore.slice();

  if (category !== 'all') {
    results = results.filter((item) => item.category === category);
  }

  if (search.length > 0) {
    results = results.filter(
      (item) => item.name.toLowerCase().includes(search) || item.id.toLowerCase().includes(search),
    );
  }

  if (sort === 'price-asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    results.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating-desc') {
    results.sort((a, b) => b.rating - a.rating);
  }

  const total = results.length;
  const startIndex = (page - 1) * pageSize;
  const items = results.slice(startIndex, startIndex + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
  };
}

export async function mockGetProductById(id: string, signal?: AbortSignal): Promise<Product> {
  await waitWithSignal(80, signal);
  const found = productsStore.find((item) => item.id === id);
  if (!found) {
    throw createApiError('NOT_FOUND', `Product "${id}" was not found.`, { productId: id });
  }
  return found;
}

export async function mockLogin(
  payload: LoginPayload,
  signal?: AbortSignal,
): Promise<LoginResponse> {
  await waitWithSignal(100, signal);

  const email = payload.email.trim().toLowerCase();
  const password = payload.password;

  if (!email || !password || !email.includes('@')) {
    throw createApiError('BAD_REQUEST', 'Valid email and password are required.');
  }

  if (email !== DEMO_USER.email || password.length < 4) {
    throw createApiError('UNAUTHORIZED', 'Invalid email or password.');
  }

  return {
    token: VALID_TOKEN,
    user: DEMO_USER,
  };
}

export async function mockGetMe(authHeader?: string, signal?: AbortSignal): Promise<User> {
  await waitWithSignal(80, signal);
  const user = getAuthenticatedUser(authHeader);
  if (!user) {
    throw createApiError('UNAUTHORIZED', 'Authentication required.');
  }
  return user;
}

export async function mockCreateOrder(
  payload: CreateOrderPayload,
  authHeader?: string,
  signal?: AbortSignal,
): Promise<Order> {
  await waitWithSignal(150, signal);

  const user = getAuthenticatedUser(authHeader);
  if (!user) {
    throw createApiError('UNAUTHORIZED', 'Authentication required to place an order.');
  }

  if (payload.idempotencyKey) {
    const existingOrderId = idempotencyOrderMap.get(payload.idempotencyKey);
    if (existingOrderId) {
      const existingOrder = ordersStore.get(existingOrderId);
      if (existingOrder) {
        return existingOrder;
      }
    }
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw createApiError('BAD_REQUEST', 'Order must include at least one item.');
  }

  const resolvedItems: Order['items'] = [];
  let total = 0;

  for (const entry of payload.items) {
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) {
      throw createApiError('BAD_REQUEST', `Invalid quantity for product "${entry.productId}".`);
    }

    const product = productsStore.find((p) => p.id === entry.productId);
    if (!product) {
      throw createApiError('BAD_REQUEST', `Unknown product "${entry.productId}".`);
    }

    if (product.stock < entry.quantity) {
      throw createApiError(
        'OUT_OF_STOCK',
        `${product.name} is out of stock (requested ${entry.quantity}, available ${product.stock}).`,
        {
          productId: product.id,
          productName: product.name,
        },
      );
    }

    resolvedItems.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: entry.quantity,
    });
    total += product.price * entry.quantity;
  }

  for (const line of resolvedItems) {
    productsStore = productsStore.map((p) =>
      p.id === line.productId ? { ...p, stock: p.stock - line.quantity } : p,
    );
  }

  orderCounter += 1;
  const order: Order = {
    id: `ord-${orderCounter}`,
    userId: user.id,
    items: resolvedItems,
    total,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  ordersStore.set(order.id, order);
  if (payload.idempotencyKey) {
    idempotencyOrderMap.set(payload.idempotencyKey, order.id);
  }

  return order;
}

export async function mockGetOrderById(
  orderId: string,
  authHeader?: string,
  signal?: AbortSignal,
): Promise<Order> {
  await waitWithSignal(80, signal);

  const user = getAuthenticatedUser(authHeader);
  if (!user) {
    throw createApiError('UNAUTHORIZED', 'Authentication required.');
  }

  const order = ordersStore.get(orderId);
  if (!order || order.userId !== user.id) {
    throw createApiError('NOT_FOUND', `Order "${orderId}" was not found.`, { orderId });
  }

  return order;
}
