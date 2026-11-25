import { LogOut, Mail, ShoppingBag, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetMeQuery } from '../../api/bazaarApi';
import { useAppDispatch } from '../../app/hooks';
import { ErrorState, LoadingState } from '../../components/feedback/StateViews';
import { Button, buttonClasses } from '../../components/ui/Button';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { toRequestState } from '../../lib/requestState';
import { signedOut } from './sessionSlice';

export default function AccountPage() {
  useDocumentTitle('My account');
  const dispatch = useAppDispatch();
  const query = useGetMeQuery();
  const state = toRequestState(query);

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold tracking-tight">My account</h1>
      <div className="mt-8 max-w-2xl">
        {state.status === 'loading' && <LoadingState label="Loading your profile…" />}
        {state.status === 'error' && (
          <ErrorState error={state.error} onRetry={() => void query.refetch()} />
        )}
        {state.status === 'success' && (
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <div className="flex items-center gap-4">
              <span className="bg-brand-100 text-brand-700 grid size-14 place-items-center rounded-full">
                <UserRound className="size-7" aria-hidden="true" />
              </span>
              <div>
                <p className="text-lg font-semibold">{state.data.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Mail className="size-4" aria-hidden="true" /> {state.data.email}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <Link to="/shop" className={buttonClasses('secondary')}>
                <ShoppingBag className="size-4" aria-hidden="true" /> Keep shopping
              </Link>
              <Button variant="danger" onClick={() => dispatch(signedOut())}>
                <LogOut className="size-4" aria-hidden="true" /> Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
