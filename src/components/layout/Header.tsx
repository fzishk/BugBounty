import { useState, type FormEvent } from 'react';
import { Search, ShoppingCart, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../api/contract';
import { useAppSelector } from '../../app/hooks';
import { selectUser } from '../../features/auth/sessionSlice';
import { selectCartCount } from '../../features/cart/cartSlice';
import { CATEGORY_META } from '../../features/catalog/categories';
import { Logo } from './Logo';

function CartLink() {
  // Derived value: the badge reads a memoized selector, never a stored count.
  const count = useAppSelector(selectCartCount);
  return (
    <Link
      to="/cart"
      className="relative inline-flex size-11 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
    >
      <ShoppingCart className="size-6" aria-hidden="true" />
      {count > 0 && (
        <span
          className="bg-brand-600 absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full px-1 text-xs font-bold text-white"
          aria-hidden="true"
          data-testid="cart-badge"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

function HeaderSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = term.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };
  return (
    <form role="search" onSubmit={submit} className="relative hidden flex-1 md:block md:max-w-md">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search ducks, keyboards, coffee…"
        aria-label="Search the store"
        className="focus:ring-brand-600 h-11 w-full rounded-full bg-slate-100 pr-4 pl-9 text-sm placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:outline-none"
      />
    </form>
  );
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-100'
  }`;

function CategoryNav() {
  const { pathname, search } = useLocation();
  const current =
    pathname === '/shop' ? (new URLSearchParams(search).get('category') ?? 'all') : null;
  const items = [{ key: 'all', label: 'Shop all', to: '/shop' }].concat(
    CATEGORIES.map((c) => ({ key: c, label: CATEGORY_META[c].label, to: `/shop?category=${c}` })),
  );
  return (
    <nav aria-label="Categories" className="container-page flex gap-1 overflow-x-auto pb-3">
      {items.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          aria-current={current === item.key ? 'page' : undefined}
          className={navLink({ isActive: current === item.key })}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Header() {
  const user = useAppSelector(selectUser);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="bg-slate-900 text-center text-xs font-medium text-slate-100">
        <p className="container-page py-2">
          Free shipping on orders over $50 · Demo store, no real payments
        </p>
      </div>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <HeaderSearch />
        <nav aria-label="Account" className="flex items-center gap-1">
          <Link
            to={user ? '/account' : '/login'}
            className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <UserRound className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : 'Sign in'}</span>
            <span className="sr-only sm:hidden">{user ? 'My account' : 'Sign in'}</span>
          </Link>
          <CartLink />
        </nav>
      </div>
      <CategoryNav />
    </header>
  );
}
