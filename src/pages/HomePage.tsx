import { ArrowRight, Coffee, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetProductPageQuery } from '../api/bazaarApi';
import { CATEGORIES } from '../api/contract';
import { ErrorState } from '../components/feedback/StateViews';
import { buttonClasses } from '../components/ui/Button';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { CATEGORY_META } from '../features/catalog/categories';
import { ProductCard } from '../features/catalog/ProductCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toRequestState } from '../lib/requestState';

const art = (name: string) => `${import.meta.env.BASE_URL}images/products/${name}.svg`;

const PERKS = [
  { icon: Truck, title: 'Free shipping', text: 'On every order over $50.' },
  { icon: RotateCcw, title: '30-day returns', text: 'Duck didn’t help? Send it back.' },
  { icon: ShieldCheck, title: '2-year warranty', text: 'On all keyboards.' },
  { icon: Coffee, title: 'Fresh roasts', text: 'Coffee roasted to order.' },
];

function FeaturedProducts() {
  const query = useGetProductPageQuery({
    sort: 'rating-desc',
    inStock: true,
    page: 1,
    pageSize: 8,
  });
  const state = toRequestState(query);
  return (
    <section aria-labelledby="featured-heading" className="container-page mt-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="featured-heading" className="text-2xl font-bold tracking-tight">
            Top rated right now
          </h2>
          <p className="mt-1 text-slate-600">The gear other developers keep coming back for.</p>
        </div>
        <Link
          to="/shop?sort=rating-desc"
          className="text-brand-700 hidden items-center gap-1 text-sm font-semibold hover:underline sm:inline-flex"
        >
          View all <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-6">
        {state.status === 'error' ? (
          <ErrorState error={state.error} onRetry={() => void query.refetch()} />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {state.status === 'loading'
              ? Array.from({ length: 4 }, (_, i) => (
                  <li key={i}>
                    <ProductCardSkeleton />
                  </li>
                ))
              : state.data.items.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle(undefined);
  return (
    <>
      <section className="from-brand-50 bg-gradient-to-b to-slate-50">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-brand-700 ring-brand-200 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold ring-1">
              New: Night-Owl On-Call Duck
            </p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Gear for developers <span className="text-brand-600">who ship.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Rubber ducks that listen, keyboards that click, coffee that keeps the pager quiet, and
              stickers for every laptop lid.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className={buttonClasses('primary', 'lg')}>
                Shop all products <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              <Link to="/shop?category=ducks" className={buttonClasses('secondary', 'lg')}>
                Meet the ducks
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4" aria-hidden="true">
            {['ducks-1', 'keyboards-1', 'coffee-2', 'stickers-1'].map((name, i) => (
              <img
                key={name}
                src={art(name)}
                alt=""
                width={400}
                height={400}
                className={`w-full rounded-3xl shadow-sm ring-1 ring-slate-200 ${i % 2 === 1 ? 'translate-y-6' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="categories-heading" className="container-page mt-16">
        <h2 id="categories-heading" className="text-2xl font-bold tracking-tight">
          Shop by category
        </h2>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category, index) => {
            const meta = CATEGORY_META[category];
            return (
              <li key={category}>
                <Link
                  to={`/shop?category=${category}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <img
                    src={art(`${category}-${(index % 5) + 1}`)}
                    alt=""
                    width={400}
                    height={400}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <span className="flex items-center gap-2 font-semibold text-slate-900">
                      <meta.icon className="text-brand-600 size-5" aria-hidden="true" />
                      {meta.label}
                    </span>
                    <span className="mt-1 text-sm text-slate-600">{meta.tagline}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <FeaturedProducts />

      <section aria-label="Why shop with us" className="container-page mt-20">
        <ul className="grid gap-6 rounded-3xl bg-white p-8 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((perk) => (
            <li key={perk.title} className="flex gap-4">
              <span className="bg-brand-50 text-brand-600 grid size-11 shrink-0 place-items-center rounded-xl">
                <perk.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">{perk.title}</p>
                <p className="text-sm text-slate-600">{perk.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
