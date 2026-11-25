import { PackageX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonClasses } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const COPY = {
  page: {
    title: 'Page not found',
    body: 'The page you are looking for doesn’t exist or has moved.',
  },
  product: {
    title: 'Product not found',
    body: 'This product doesn’t exist. It may have been removed from the catalog.',
  },
  order: { title: 'Order not found', body: 'We couldn’t find that order on your account.' },
} as const;

export default function NotFoundPage({ what = 'page' }: { what?: keyof typeof COPY }) {
  const copy = COPY[what];
  useDocumentTitle(copy.title);
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-lg text-center">
        <span className="bg-brand-50 text-brand-600 mx-auto grid size-16 place-items-center rounded-full">
          <PackageX className="size-8" aria-hidden="true" />
        </span>
        <p className="text-brand-700 mt-6 text-sm font-semibold">404</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-slate-600">{copy.body}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/shop" className={buttonClasses('primary')}>
            Browse the shop
          </Link>
          <Link to="/" className={buttonClasses('secondary')}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
