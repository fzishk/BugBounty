import type { ReactNode } from 'react';
import { CloudOff, LoaderCircle, SearchX, ServerCrash, type LucideIcon } from 'lucide-react';
import { ERROR_COPY, type AppError } from '../../lib/errors';
import { Button } from '../ui/Button';

/**
 * The four UI states share one layout so every page looks the same when loading,
 * empty, failed or done.
 */
function StatePanel({
  icon: Icon,
  title,
  description,
  action,
  role,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  role?: 'status' | 'alert';
  tone?: 'neutral' | 'error';
}) {
  const iconTone = tone === 'error' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600';
  return (
    <div
      role={role}
      className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200"
    >
      <span className={`mb-4 grid size-14 place-items-center rounded-full ${iconTone}`}>
        <Icon
          className={`size-7 ${role === 'status' && Icon === LoaderCircle ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
      </span>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <StatePanel icon={LoaderCircle} title={label} role="status" />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <StatePanel
      icon={SearchX}
      title={title}
      description={description}
      action={action}
      role="status"
    />
  );
}

export function ErrorState({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  const copy = ERROR_COPY[error.kind];
  return (
    <StatePanel
      icon={error.kind === 'network' ? CloudOff : ServerCrash}
      title={copy.title}
      description={copy.description}
      role="alert"
      tone="error"
      action={
        onRetry && (
          <Button onClick={onRetry} variant="primary">
            Try again
          </Button>
        )
      }
    />
  );
}
