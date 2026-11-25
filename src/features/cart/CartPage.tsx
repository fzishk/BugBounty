import { ArrowRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { EmptyState } from '../../components/feedback/StateViews';
import { buttonClasses } from '../../components/ui/Button';
import { LiveIndicator } from '../../components/ui/LiveIndicator';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useLiveStock } from '../live/useLiveStock';
import { CartLineRow } from './CartLineRow';
import { selectCartLines } from './cartSlice';
import { OrderSummary } from './OrderSummary';

export default function CartPage() {
  const lines = useAppSelector(selectCartLines);
  useDocumentTitle('Your cart');
  useLiveStock(lines.map((line) => line.productId));
  const blocked = lines.some((line) => line.stock === 0 || line.quantity > line.stock);

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>
        {lines.length > 0 && <LiveIndicator />}
      </div>

      {lines.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Find a rubber duck, a keyboard, or a strong coffee to get started."
            action={
              <Link to="/shop" className={buttonClasses('primary')}>
                <ShoppingCart className="size-4" aria-hidden="true" /> Start shopping
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section aria-labelledby="cart-items-heading">
            <h2 id="cart-items-heading" className="sr-only">
              Items in your cart
            </h2>
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              {lines.map((line) => (
                <CartLineRow key={line.productId} line={line} />
              ))}
            </ul>
          </section>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummary>
              {blocked && (
                <p role="alert" className="mb-3 text-sm text-red-700">
                  Remove sold-out items before checking out.
                </p>
              )}
              <Link
                to="/checkout"
                aria-disabled={blocked}
                onClick={(e) => blocked && e.preventDefault()}
                className={buttonClasses(
                  'primary',
                  'lg',
                  `w-full ${blocked ? 'pointer-events-none opacity-50' : ''}`,
                )}
              >
                Checkout <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              <Link
                to="/shop"
                className="text-brand-700 mt-3 block text-center text-sm font-medium hover:underline"
              >
                Continue shopping
              </Link>
            </OrderSummary>
          </div>
        </div>
      )}
    </div>
  );
}
