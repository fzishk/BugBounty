import { useEffect, useState } from 'react';
import { CircleCheck, Clock, PackageCheck, Settings } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useGetOrderQuery } from '../../api/bazaarApi';
import type { OrderStatus } from '../../api/contract';
import { ErrorState, LoadingState } from '../../components/feedback/StateViews';
import { buttonClasses } from '../../components/ui/Button';
import { Price } from '../../components/ui/Price';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { toRequestState } from '../../lib/requestState';
import NotFoundPage from '../../pages/NotFoundPage';

const STEPS: Array<{ status: OrderStatus; label: string; icon: typeof Clock }> = [
  { status: 'queued', label: 'Order received', icon: Clock },
  { status: 'processing', label: 'Payment & stock check', icon: Settings },
  { status: 'confirmed', label: 'Confirmed', icon: PackageCheck },
];

export default function OrderConfirmationPage() {
  const { id = '' } = useParams();
  const [confirmed, setConfirmed] = useState(false);
  // Poll while the order is still moving through the queue; stop once it is confirmed.
  const query = useGetOrderQuery(id, { pollingInterval: confirmed ? 0 : 1500 });
  const status = query.currentData?.status;
  useEffect(() => {
    if (status === 'confirmed') setConfirmed(true);
  }, [status]);
  const state = toRequestState(query);
  useDocumentTitle(`Order ${id}`);

  if (state.status === 'error' && state.error.kind === 'not-found')
    return <NotFoundPage what="order" />;

  return (
    <div className="container-page py-10">
      {state.status === 'loading' && <LoadingState label="Loading your order…" />}
      {state.status === 'error' && (
        <ErrorState error={state.error} onRetry={() => void query.refetch()} />
      )}
      {state.status === 'success' && (
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CircleCheck className="size-9" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight">Thanks! Your order is in.</h1>
            <p className="mt-2 text-slate-600">
              Order <span className="font-mono font-semibold text-slate-900">{state.data.id}</span>
            </p>
          </div>

          <ol className="mt-10 grid grid-cols-3 gap-2" aria-label="Order progress">
            {STEPS.map((step, index) => {
              const reached = STEPS.findIndex((s) => s.status === state.data.status) >= index;
              return (
                <li
                  key={step.status}
                  className="flex flex-col items-center text-center"
                  aria-current={step.status === state.data.status ? 'step' : undefined}
                >
                  <span
                    className={`grid size-11 place-items-center rounded-full ${
                      reached ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <step.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`mt-2 text-sm ${reached ? 'font-semibold text-slate-900' : 'text-slate-600'}`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
          <p role="status" className="sr-only">
            Order status: {state.data.status}
          </p>

          <section
            aria-labelledby="order-items"
            className="mt-10 rounded-2xl bg-white p-6 ring-1 ring-slate-200"
          >
            <h2 id="order-items" className="text-lg font-semibold">
              Items
            </h2>
            <ul className="mt-4 divide-y divide-slate-200 text-sm">
              {state.data.items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-4 py-3">
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <Price cents={item.unitPrice * item.quantity} />
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-4 font-semibold">
              <span>Items total</span>
              <Price cents={state.data.total} />
            </div>
          </section>

          <div className="mt-8 flex justify-center gap-3">
            <Link to="/shop" className={buttonClasses('primary')}>
              Continue shopping
            </Link>
            <Link to="/account" className={buttonClasses('secondary')}>
              My account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
