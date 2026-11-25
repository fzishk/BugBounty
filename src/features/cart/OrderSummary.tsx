import type { ReactNode } from 'react';
import { useAppSelector } from '../../app/hooks';
import { Price } from '../../components/ui/Price';
import { selectCartCount, selectCartTotal } from './cartSlice';

export const FREE_SHIPPING_CENTS = 5000;
export const SHIPPING_CENTS = 599;

export function shippingFor(subtotal: number): number {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS;
}

export function OrderSummary({ children }: { children?: ReactNode }) {
  const count = useAppSelector(selectCartCount);
  const subtotal = useAppSelector(selectCartTotal);
  const shipping = shippingFor(subtotal);
  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"
    >
      <h2 id="summary-heading" className="text-lg font-semibold">
        Order summary
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-600">
            Subtotal ({count} {count === 1 ? 'item' : 'items'})
          </dt>
          <dd>
            <Price cents={subtotal} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-600">Shipping</dt>
          <dd>
            {shipping === 0 ? (
              <span className="font-semibold text-emerald-700">Free</span>
            ) : (
              <Price cents={shipping} />
            )}
          </dd>
        </div>
        {shipping > 0 && (
          <p className="bg-brand-50 text-brand-800 rounded-lg px-3 py-2 text-xs">
            Add <Price cents={FREE_SHIPPING_CENTS - subtotal} className="font-semibold" /> more for
            free shipping.
          </p>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
          <dt className="font-semibold">Total</dt>
          <dd>
            <Price cents={subtotal + shipping} className="text-lg" />
          </dd>
        </div>
      </dl>
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
