import { formatCents } from '../../lib/money';

export function Price({ cents, className = '' }: { cents: number; className?: string }) {
  return <span className={`font-semibold tabular-nums ${className}`}>{formatCents(cents)}</span>;
}
