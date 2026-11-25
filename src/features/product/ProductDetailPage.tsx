import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { Product } from '../../api/contract';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ErrorState } from '../../components/feedback/StateViews';
import { BackToTop } from '../../components/ui/BackToTop';
import { Button, buttonClasses } from '../../components/ui/Button';
import { LiveIndicator } from '../../components/ui/LiveIndicator';
import { Price } from '../../components/ui/Price';
import { ProductImage } from '../../components/ui/ProductImage';
import { QuantityStepper } from '../../components/ui/QuantityStepper';
import { Rating } from '../../components/ui/Rating';
import { Skeleton } from '../../components/ui/Skeleton';
import { StockBadge } from '../../components/ui/StockBadge';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import NotFoundPage from '../../pages/NotFoundPage';
import { itemAdded, selectCartLine } from '../cart/cartSlice';
import { CATEGORY_FEATURES, CATEGORY_META } from '../catalog/categories';
import { selectLiveStock } from '../live/liveStockSlice';
import { useLiveStock } from '../live/useLiveStock';
import { toastShown } from '../toast/toastSlice';
import { Reviews } from './Reviews';
import { useProduct } from './useProduct';

function neighbourId(id: string, step: number): string | null {
  const match = /^prod-(\d{4})$/.exec(id);
  if (!match) return null;
  const next = Number(match[1]) + step;
  return next >= 1 && next <= 5000 ? `prod-${String(next).padStart(4, '0')}` : null;
}

export default function ProductDetailPage() {
  const { id = '' } = useParams();
  const { state, retry } = useProduct(id);
  useLiveStock(id ? [id] : []);
  useDocumentTitle(state.status === 'success' ? state.data.name : 'Product');

  if (state.status === 'error' && state.error.kind === 'not-found')
    return <NotFoundPage what="product" />;

  const previous = neighbourId(id, -1);
  const next = neighbourId(id, 1);

  return (
    <div className="container-page py-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <ol className="flex items-center gap-2 text-slate-600">
          <li>
            <Link to="/shop" className="hover:text-brand-700">
              Shop
            </Link>
          </li>
          {state.status === 'success' && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={`/shop?category=${state.data.category}`} className="hover:text-brand-700">
                  {CATEGORY_META[state.data.category].label}
                </Link>
              </li>
            </>
          )}
        </ol>
        <div className="flex gap-2">
          {previous && (
            <Link to={`/products/${previous}`} className={buttonClasses('secondary', 'sm')}>
              <ChevronLeft className="size-4" aria-hidden="true" /> Previous
            </Link>
          )}
          {next && (
            <Link to={`/products/${next}`} className={buttonClasses('secondary', 'sm')}>
              Next <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </nav>

      {state.status === 'loading' && <ProductSkeleton />}
      {state.status === 'error' && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === 'success' && <ProductDetails key={state.data.id} product={state.data} />}
      <BackToTop />
    </div>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  const liveStock = useAppSelector((s) => selectLiveStock(s, product.id));
  const inCart = useAppSelector((s) => selectCartLine(s, product.id)?.quantity ?? 0);
  const stock = liveStock ?? product.stock;
  const available = Math.max(0, stock - inCart);
  const [quantity, setQuantity] = useState(1);
  const meta = CATEGORY_META[product.category];

  const addToCart = () => {
    dispatch(
      itemAdded({ product: { ...product, stock }, quantity: Math.min(quantity, available) }),
    );
    dispatch(
      toastShown(
        'success',
        `Added ${Math.min(quantity, available)} × ${product.name} to your cart.`,
      ),
    );
    setQuantity(1);
  };

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          eager
          className="rounded-3xl ring-1 ring-slate-200"
        />
        <div className="flex flex-col">
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.tint}`}
          >
            <meta.icon className="size-3.5" aria-hidden="true" />
            {meta.label}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <Rating value={product.rating} size="md" />
            <span>SKU {product.id}</span>
          </div>
          <Price cents={product.price} className="mt-6 text-4xl text-slate-900" />

          <div className="mt-6 flex flex-wrap items-center gap-3" aria-live="polite">
            <StockBadge stock={stock} />
            {inCart > 0 && (
              <span className="text-sm text-slate-600">{inCart} already in your cart</span>
            )}
            <LiveIndicator />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {available > 0 && (
              <QuantityStepper
                value={Math.min(quantity, available)}
                max={available}
                onChange={setQuantity}
                label="Quantity to add"
              />
            )}
            <Button
              size="lg"
              onClick={addToCart}
              disabled={available === 0}
              className="flex-1 sm:flex-none"
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
              {stock === 0 ? 'Sold out' : available === 0 ? 'All in your cart' : 'Add to cart'}
            </Button>
          </div>

          <ul className="mt-8 grid gap-3 rounded-2xl bg-white p-5 text-sm text-slate-700 ring-1 ring-slate-200 sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <Truck className="text-brand-600 size-5" aria-hidden="true" /> Free shipping over $50
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="text-brand-600 size-5" aria-hidden="true" /> 30-day returns
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="text-brand-600 size-5" aria-hidden="true" /> 2-year warranty
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-3">
        <section aria-labelledby="about-heading" className="lg:col-span-1">
          <h2 id="about-heading" className="text-xl font-semibold">
            About this item
          </h2>
          <p className="mt-3 text-slate-600">{meta.tagline}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {CATEGORY_FEATURES[product.category].map((feature) => (
              <li key={feature} className="flex gap-2">
                <span
                  className="bg-brand-500 mt-2 size-1.5 shrink-0 rounded-full"
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
          </ul>
        </section>
        <Reviews product={product} />
      </div>
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2" role="status" aria-label="Loading product">
      <Skeleton className="aspect-square rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-56" />
      </div>
    </div>
  );
}
