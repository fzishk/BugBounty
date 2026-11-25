import { memo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../../api/contract';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Button } from '../../components/ui/Button';
import { Price } from '../../components/ui/Price';
import { ProductImage } from '../../components/ui/ProductImage';
import { Rating } from '../../components/ui/Rating';
import { StockBadge } from '../../components/ui/StockBadge';
import { itemAdded, selectCartLine } from '../cart/cartSlice';
import { selectLiveStock } from '../live/liveStockSlice';
import { toastShown } from '../toast/toastSlice';
import { CATEGORY_META } from './categories';

/**
 * Memoized: with 5,000 products and live stock ticks, a card re-renders only when its own
 * product, its own live stock, or its own cart line changes.
 */
export const ProductCard = memo(function ProductCard({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) {
  const dispatch = useAppDispatch();
  const liveStock = useAppSelector((state) => selectLiveStock(state, product.id));
  const inCart = useAppSelector((state) => selectCartLine(state, product.id)?.quantity ?? 0);
  const stock = liveStock ?? product.stock;
  const canAdd = stock > inCart;

  const addToCart = () => {
    dispatch(itemAdded({ product: { ...product, stock } }));
    dispatch(toastShown('success', `Added ${product.name} to your cart.`));
  };

  return (
    <article className="group has-[a:focus-visible]:ring-brand-600 relative flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg has-[a:focus-visible]:ring-2">
      <ProductImage
        src={product.imageUrl}
        alt=""
        eager={eager}
        className="transition group-hover:scale-[1.02]"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-brand-700 text-xs font-semibold tracking-wide uppercase">
          {CATEGORY_META[product.category].label}
        </p>
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">
          {/* Stretched link: the whole card is clickable, but there is only one link per card. */}
          <Link
            to={`/products/${product.id}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-2">
          <Rating value={product.rating} />
          <StockBadge stock={stock} />
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <Price cents={product.price} className="text-lg" />
          <Button
            size="sm"
            className="relative z-10"
            onClick={addToCart}
            disabled={!canAdd}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
            {stock <= 0 ? 'Sold out' : 'Add'}
          </Button>
        </div>
      </div>
    </article>
  );
});
