import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateOrderMutation } from '../../api/bazaarApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Alert } from '../../components/feedback/Alert';
import { EmptyState } from '../../components/feedback/StateViews';
import { Button, buttonClasses } from '../../components/ui/Button';
import { Price } from '../../components/ui/Price';
import { TextField } from '../../components/ui/TextField';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ERROR_COPY, toAppError, type AppError } from '../../lib/errors';
import { selectUser } from '../auth/sessionSlice';
import { cartCleared, selectCartLines, stockCorrected, type CartLine } from '../cart/cartSlice';
import { OrderSummary } from '../cart/OrderSummary';
import { cartFingerprint, finishAttempt, getAttemptKey } from './checkoutAttempt';

type Shipping = { fullName: string; address: string; city: string; postcode: string };
type ShippingErrors = Partial<Record<keyof Shipping, string>>;

function validateShipping(values: Shipping): ShippingErrors {
  const errors: ShippingErrors = {};
  if (!values.fullName.trim()) errors.fullName = 'Enter the name for the delivery.';
  if (!values.address.trim()) errors.address = 'Enter a street address.';
  if (!values.city.trim()) errors.city = 'Enter a city.';
  if (!/^[A-Za-z0-9 -]{3,10}$/.test(values.postcode.trim()))
    errors.postcode = 'Enter a valid postcode.';
  return errors;
}

/** Turns a checkout failure into specific, friendly copy. 409 names the product that ran out. */
function CheckoutError({ error, lines }: { error: AppError; lines: CartLine[] }) {
  if (error.kind === 'out-of-stock') {
    const line = lines.find((l) => l.productId === error.productId);
    const name = line?.name ?? 'An item in your cart';
    const left = error.available ?? 0;
    return (
      <Alert title={`${name} ${left === 0 ? 'just sold out' : `only has ${left} left`}`}>
        {left === 0
          ? 'Remove it from your cart to place the rest of your order.'
          : `We updated your cart to ${left}. Review your order and place it again.`}
      </Alert>
    );
  }
  const copy = ERROR_COPY[error.kind];
  return (
    <Alert title={copy.title}>
      {error.kind === 'server' || error.kind === 'network'
        ? 'Your order was not placed twice: retrying is safe.'
        : copy.description}
    </Alert>
  );
}

export default function CheckoutPage() {
  useDocumentTitle('Checkout');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const lines = useAppSelector(selectCartLines);
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const submittingRef = useRef(false);

  const [shipping, setShipping] = useState<Shipping>({
    fullName: user?.name ?? '',
    address: '42 Stack Street',
    city: 'Lahore',
    postcode: '54000',
  });
  const [fieldErrors, setFieldErrors] = useState<ShippingErrors>({});
  const [orderError, setOrderError] = useState<AppError | null>(null);

  if (lines.length === 0) {
    return (
      <div className="container-page py-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <div className="mt-8">
          <EmptyState
            title="Nothing to check out"
            description="Your cart is empty."
            action={
              <Link to="/shop" className={buttonClasses('primary')}>
                Browse the shop
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const soldOut = lines.some((line) => line.stock === 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A ref (not state) so a fast double click can't slip in before React re-renders.
    if (submittingRef.current) return;

    const errors = validateShipping(shipping);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstInvalid = Object.keys(errors)[0];
      document.getElementById(`shipping-${firstInvalid}`)?.focus();
      return;
    }

    submittingRef.current = true;
    setOrderError(null);
    const idempotencyKey = getAttemptKey(cartFingerprint(lines));
    try {
      const order = await createOrder({
        order: { items: lines.map(({ productId, quantity }) => ({ productId, quantity })) },
        idempotencyKey,
      }).unwrap();
      finishAttempt();
      dispatch(cartCleared());
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (error) {
      const appError = toAppError(error);
      if (appError.kind === 'out-of-stock' && appError.productId && appError.available !== null) {
        dispatch(stockCorrected({ productId: appError.productId, stock: appError.available }));
      }
      // 401 is handled centrally: the session is cleared and the route guard sends the user to login.
      if (appError.kind !== 'unauthorized') setOrderError(appError);
    } finally {
      submittingRef.current = false;
    }
  };

  const field = (name: keyof Shipping) => ({
    id: `shipping-${name}`,
    value: shipping[name],
    error: fieldErrors[name],
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      setShipping((s) => ({ ...s, [name]: e.target.value })),
  });

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <form noValidate onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {orderError && <CheckoutError error={orderError} lines={lines} />}
          <section
            aria-labelledby="shipping-heading"
            className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"
          >
            <h2 id="shipping-heading" className="text-lg font-semibold">
              Shipping details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Full name"
                autoComplete="name"
                className="sm:col-span-2"
                {...field('fullName')}
              />
              <TextField
                label="Street address"
                autoComplete="street-address"
                className="sm:col-span-2"
                {...field('address')}
              />
              <TextField label="City" autoComplete="address-level2" {...field('city')} />
              <TextField label="Postcode" autoComplete="postal-code" {...field('postcode')} />
            </div>
          </section>
          <section
            aria-labelledby="payment-heading"
            className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"
          >
            <h2 id="payment-heading" className="text-lg font-semibold">
              Payment
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Lock className="size-4" aria-hidden="true" /> Demo store: no card is charged. Orders
              are paid on delivery.
            </p>
          </section>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary>
            <ul className="mb-5 space-y-2 border-b border-slate-200 pb-5 text-sm">
              {lines.map((line) => (
                <li key={line.productId} className="flex justify-between gap-3">
                  <span className="text-slate-700">
                    {line.quantity} × {line.name}
                  </span>
                  <Price cents={line.price * line.quantity} />
                </li>
              ))}
            </ul>
            {soldOut && (
              <p className="mb-3 text-sm text-red-700">
                Remove sold-out items in your{' '}
                <Link to="/cart" className="font-semibold underline">
                  cart
                </Link>{' '}
                first.
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isLoading}
              disabled={soldOut}
            >
              {isLoading ? 'Placing order…' : 'Place order'}
            </Button>
          </OrderSummary>
        </div>
      </form>
    </div>
  );
}
