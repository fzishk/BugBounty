import type { ReactNode } from 'react';
import { CircleAlert, Info } from 'lucide-react';

/** Inline banner. role="alert" makes screen readers announce it as soon as it appears. */
export function Alert({
  tone = 'error',
  title,
  children,
}: {
  tone?: 'error' | 'info';
  title: string;
  children?: ReactNode;
}) {
  const styles =
    tone === 'error'
      ? 'bg-red-50 text-red-900 ring-red-200'
      : 'bg-brand-50 text-brand-900 ring-brand-200';
  const Icon = tone === 'error' ? CircleAlert : Info;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl p-4 ring-1 ${styles}`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1">{children}</div>}
      </div>
    </div>
  );
}
