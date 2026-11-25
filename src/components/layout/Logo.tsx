import { Link } from 'react-router-dom';

const LOGO_SRC = `${import.meta.env.BASE_URL}favicon.svg`;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg" aria-label="The Bug Bazaar, home">
      <img src={LOGO_SRC} alt="" width={36} height={36} className="size-9" />
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        The Bug <span className="text-brand-600">Bazaar</span>
      </span>
    </Link>
  );
}
