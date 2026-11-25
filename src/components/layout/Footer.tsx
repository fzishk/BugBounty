import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../api/contract';
import { CATEGORY_META } from '../../features/catalog/categories';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-slate-600">
            Developer gear for people who ship. Rubber ducks included.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Shop</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {CATEGORIES.map((category) => (
              <li key={category}>
                <Link to={`/shop?category=${category}`} className="hover:text-brand-700">
                  {CATEGORY_META[category].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Account</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link to="/account" className="hover:text-brand-700">
                My account
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-brand-700">
                Cart
              </Link>
            </li>
            <li>
              <Link to="/checkout" className="hover:text-brand-700">
                Checkout
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">About this project</h2>
          <p className="mt-3 text-sm text-slate-600">
            A React + TypeScript training project. All data comes from an in-browser mock API.
          </p>
        </div>
      </div>
      <p className="border-t border-slate-200 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} The Bug Bazaar. Illustrations made for this project.
      </p>
    </footer>
  );
}
