/**
 * The shared API contract (see docs/api-contract.md).
 * Both the mock server (src/mocks) and the client (src/api) import these types,
 * so a change to the contract is a compile error on both sides.
 */

export const CATEGORIES = ['keyboards', 'ducks', 'coffee', 'stickers'] as const;
export type Category = (typeof CATEGORIES)[number];

export const SORT_OPTIONS = ['featured', 'price-asc', 'price-desc', 'rating-desc'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export type Product = {
  id: string;
  name: string;
  /** Integer cents. 1299 means $12.99. */
  price: number;
  category: Category;
  stock: number;
  rating: number;
  imageUrl: string;
};

export type ApiErrorCode =
  'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'OUT_OF_STOCK' | 'INTERNAL_ERROR';

export type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string>;
  };
};

/** GET /api/products query. `inStock` and `pageSize` are additive extensions (documented). */
export type ProductQuery = {
  search?: string;
  category?: Category;
  sort?: SortOption;
  inStock?: boolean;
};

export type ProductPageRequest = ProductQuery & { page: number; pageSize: number };

export type ProductListResponse = {
  items: Product[];
  total: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type LoginRequest = { email: string; password: string };
export type LoginResponse = { token: string; user: User };

export type OrderLineRequest = { productId: string; quantity: number };
export type CreateOrderRequest = { items: OrderLineRequest[] };
export type CreateOrderResponse = { id: string; status: 'queued' };

export type OrderStatus = 'queued' | 'processing' | 'confirmed';

export type OrderLine = OrderLineRequest & { name: string; unitPrice: number };

/** GET /api/orders/:id returns { id, status } plus the extra fields below. */
export type Order = {
  id: string;
  status: OrderStatus;
  items: OrderLine[];
  total: number;
  createdAt: string;
};

/** Messages sent over the live stock WebSocket. */
export type LiveStockClientMessage = { type: 'subscribe'; productIds: string[] };
export type LiveStockServerMessage =
  | { type: 'stock'; updates: Array<{ productId: string; stock: number }> }
  | { type: 'hello'; serverTime: string };

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

export function isSortOption(value: unknown): value is SortOption {
  return typeof value === 'string' && (SORT_OPTIONS as readonly string[]).includes(value);
}
