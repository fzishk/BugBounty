import { Star } from 'lucide-react';

export function Rating({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const icon = size === 'sm' ? 'size-3.5' : 'size-4';
  return (
    <span className="inline-flex items-center gap-1 text-sm text-slate-700">
      <Star className={`${icon} fill-accent-400 text-accent-500`} aria-hidden="true" />
      <span className="font-medium tabular-nums">{value.toFixed(1)}</span>
      <span className="sr-only">out of 5 stars</span>
    </span>
  );
}
