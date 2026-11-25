import { useEffect } from 'react';
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectToasts, toastDismissed, type Toast } from '../../features/toast/toastSlice';

const ICONS = { success: CircleCheck, info: Info, error: TriangleAlert };
const TONES = {
  success: 'text-emerald-600',
  info: 'text-brand-600',
  error: 'text-red-600',
};

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const timer = setTimeout(() => dispatch(toastDismissed(toast.id)), 4000);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);
  const Icon = ICONS[toast.tone];
  return (
    <li className="pointer-events-auto flex w-80 items-start gap-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
      <Icon className={`mt-0.5 size-5 shrink-0 ${TONES[toast.tone]}`} aria-hidden="true" />
      <p className="flex-1 text-sm text-slate-800">{toast.message}</p>
      <button
        type="button"
        onClick={() => dispatch(toastDismissed(toast.id))}
        className="rounded p-0.5 text-slate-500 hover:text-slate-800"
        aria-label="Dismiss notification"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/** Polite live region: screen readers announce each toast without stealing focus. */
export function Toaster() {
  const toasts = useAppSelector(selectToasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-50">
      <ul className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </ul>
    </div>
  );
}
