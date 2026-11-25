import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  LoginRequest,
  LoginResponse,
  Order,
  Product,
  ProductListResponse,
  ProductPageRequest,
  ProductQuery,
  User,
} from './contract';

export const CATALOG_PAGE_SIZE = 48;

/** Builds the query string. Defaults are omitted so equal filters produce equal cache keys. */
export function toProductParams(query: ProductQuery, page: number, pageSize: number) {
  const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
  if (query.search?.trim()) params.search = query.search.trim();
  if (query.category) params.category = query.category;
  if (query.sort && query.sort !== 'featured') params.sort = query.sort;
  if (query.inStock) params.inStock = 'true';
  return params;
}

/**
 * The one place the app talks to the REST API. Components use the generated hooks;
 * none of them call fetch directly.
 */
export const bazaarApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Product', 'Order', 'Me'],
  // Unused cache entries live for 5 minutes, so going back to a page is instant.
  keepUnusedDataFor: 300,
  endpoints: (build) => ({
    /** The catalog: infinite pages for the virtualized grid. */
    getProducts: build.infiniteQuery<ProductListResponse, ProductQuery, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
          return loaded < lastPage.total ? lastPageParam + 1 : undefined;
        },
      },
      query: ({ queryArg, pageParam }) => ({
        url: 'products',
        params: toProductParams(queryArg, pageParam, CATALOG_PAGE_SIZE),
      }),
      providesTags: (result) => [
        { type: 'Product', id: 'LIST' },
        ...(result?.pages.flatMap((page) =>
          page.items.map((p) => ({ type: 'Product' as const, id: p.id })),
        ) ?? []),
      ],
    }),

    /** A single page, used for small lists such as "Featured" on the home page. */
    getProductPage: build.query<ProductListResponse, ProductPageRequest>({
      query: ({ page, pageSize, ...query }) => ({
        url: 'products',
        params: toProductParams(query, page, pageSize),
      }),
      providesTags: (result) => [
        { type: 'Product', id: 'LIST' },
        ...(result?.items.map((p) => ({ type: 'Product' as const, id: p.id })) ?? []),
      ],
    }),

    getProduct: build.query<Product, string>({
      query: (id) => `products/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),

    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: 'login', method: 'POST', body }),
    }),

    getMe: build.query<User, void>({
      query: () => 'me',
      providesTags: ['Me'],
      keepUnusedDataFor: 0,
    }),

    createOrder: build.mutation<
      CreateOrderResponse,
      { order: CreateOrderRequest; idempotencyKey: string }
    >({
      query: ({ order, idempotencyKey }) => ({
        url: 'orders',
        method: 'POST',
        body: order,
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      // Stock changed on the server: refetch the products that were bought, and any list showing them.
      invalidatesTags: (result, _error, { order }) =>
        result
          ? [
              { type: 'Product', id: 'LIST' },
              ...order.items.map((i) => ({ type: 'Product' as const, id: i.productId })),
            ]
          : [],
    }),

    getOrder: build.query<Order, string>({
      query: (id) => `orders/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useGetProductsInfiniteQuery,
  useGetProductPageQuery,
  useGetProductQuery,
  useLoginMutation,
  useGetMeQuery,
  useCreateOrderMutation,
  useGetOrderQuery,
} = bazaarApi;
