export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugStatus = 'open' | 'in-progress' | 'resolved';

export type Bug = {
  id: string | number;
  title: string;
  severity?: BugSeverity | string;
  status?: BugStatus | string;
  reportedAt?: string;
};

export type ProductCategory = 'keyboards' | 'ducks' | 'coffee' | 'stickers';
export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc';

export type Product = {
  id: string;
  name: string;
  price: number; // stored in cents
  category: ProductCategory;
  stock: number;
  rating: number;
  imageUrl: string;
};

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'OUT_OF_STOCK'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR';

export type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string>;
  };
};

export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'customer';
};

export type OrderItem = {
  productId: string;
  name: string;
  unitPrice: number; // integer cents
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number; // integer cents
  status: 'confirmed';
  createdAt: string;
};

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  items: CreateOrderItemInput[];
  idempotencyKey?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
};
