import { ArrowUp } from 'lucide-react';
import { useScrollThreshold } from '../../hooks/useScrollThreshold';

export function BackToTop() {
  const visible = useScrollThreshold(600);
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0 });
        document.getElementById('main')?.focus({ preventScroll: true });
      }}
      className="fixed right-5 bottom-5 z-30 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
    >
      <ArrowUp className="size-4" aria-hidden="true" />
      Back to top
    </button>
  );
}
