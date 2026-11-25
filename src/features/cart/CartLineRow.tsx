import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { Price } from '../../components/ui/Price';
import { ProductImage } from '../../components/ui/ProductImage';
import { QuantityStepper } from '../../components/ui/QuantityStepper';
import { StockBadge } from '../../components/ui/StockBadge';
import { itemRemoved, quantityChanged, type CartLine } from './cartSlice';

export function CartLineRow({
  line,
  highlighted = false,
}: {
  line: CartLine;
  highlighted?: boolean;
}) {
  const dispatch = useAppDispatch();
  const soldOut = line.stock === 0;
  return (
    <li className={`flex gap-4 p-4 sm:p-5 ${highlighted ? 'bg-red-50' : ''}`}>
      <ProductImage
        src={line.imageUrl}
        alt=""
        className="size-24 shrink-0 rounded-xl ring-1 ring-slate-200"
      />
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">
            <Link to={`/products/${line.productId}`} className="hover:text-brand-700">
              {line.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            <Price cents={line.price} className="font-normal" /> each
          </p>
          <div className="mt-2">
            <StockBadge stock={line.stock} />
          </div>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          {soldOut ? (
            <p className="text-sm font-medium text-red-700">Sold out. Please remove it.</p>
          ) : (
            <QuantityStepper
              value={line.quantity}
              max={line.stock}
              onChange={(quantity) =>
                dispatch(quantityChanged({ productId: line.productId, quantity }))
              }
              label={`Quantity of ${line.name}`}
            />
          )}
          <Price cents={line.price * line.quantity} className="text-slate-900" />
          <button
            type="button"
            onClick={() => dispatch(itemRemoved(line.productId))}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-red-700"
            aria-label={`Remove ${line.name} from cart`}
          >
            <Trash2 className="size-4" aria-hidden="true" /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}
