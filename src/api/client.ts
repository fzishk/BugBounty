import type {
  ApiError,
  CreateOrderPayload,
  LoginPayload,
  LoginResponse,
  Order,
  Product,
  ProductListResponse,
  User,
} from '../types/bazaar';
import {
  type GetProductsParams,
  mockCreateOrder,
  mockGetMe,
  mockGetOrderById,
  mockGetProductById,
  mockGetProducts,
  mockLogin,
} from './mockApi';

const TOKEN_STORAGE_KEY = 'bug_bazaar_token';

let inMemoryToken: string | null = null;

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }
  const errObj = (value as { error?: unknown }).error;
  return (
    typeof errObj === 'object' &&
    errObj !== null &&
    'code' in errObj &&
    'message' in errObj &&
    typeof (errObj as { message?: unknown }).message === 'string'
  );
}

function normalizeError(err: unknown): ApiError {
  if (isApiError(err)) {
    return err;
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: 'Request was cancelled.',
      },
    };
  }
  if (err instanceof Error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message || 'Unexpected error occurred.',
      },
    };
  }
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred.',
    },
  };
}

export const tokenStorage = {
  get(): string | null {
    if (inMemoryToken) return inMemoryToken;
    try {
      const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      inMemoryToken = saved;
      return saved;
    } catch {
      return inMemoryToken;
    }
  },
  set(token: string): void {
    inMemoryToken = token;
    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Ignore storage quota or privacy mode errors
    }
  },
  clear(): void {
    inMemoryToken = null;
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

function getAuthHeader(overrideToken?: string): string | undefined {
  const token = overrideToken ?? tokenStorage.get();
  return token ? `Bearer ${token}` : undefined;
}

export const apiClient = {
  async getProducts(params: GetProductsParams = {}): Promise<ProductListResponse> {
    try {
      return await mockGetProducts(params);
    } catch (err: unknown) {
      throw normalizeError(err);
    }
  },

  async getProductById(id: string, signal?: AbortSignal): Promise<Product> {
    try {
      return await mockGetProductById(id, signal);
    } catch (err: unknown) {
      throw normalizeError(err);
    }
  },

  async login(payload: LoginPayload, signal?: AbortSignal): Promise<LoginResponse> {
    try {
      const response = await mockLogin(payload, signal);
      tokenStorage.set(response.token);
      return response;
    } catch (err: unknown) {
      throw normalizeError(err);
    }
  },

  logout(): void {
    tokenStorage.clear();
  },

  async getMe(signal?: AbortSignal, token?: string): Promise<User> {
    try {
      return await mockGetMe(getAuthHeader(token), signal);
    } catch (err: unknown) {
      throw normalizeError(err);
    }
  },

  async createOrder(payload: CreateOrderPayload, signal?: AbortSignal): Promise<Order> {
    try {
      return await mockCreateOrder(payload, getAuthHeader(), signal);
    } catch (err: unknown) {
      throw normalizeError(err);
    }
  },

  async getOrderById(orderId: string, signal?: AbortSignal): Promise<Order> {
    try {
      return await mockGetOrderById(orderId, getAuthHeader(), signal);
    } catch (err: unknown) {
      throw normalizeError(err);
    }
  },
};
