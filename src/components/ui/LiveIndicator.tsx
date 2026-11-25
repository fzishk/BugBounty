import { useAppSelector } from '../../app/hooks';
import { selectConnection } from '../../features/live/liveStockSlice';

const LABELS = {
  idle: { text: 'Live stock off', dot: 'bg-slate-400' },
  connecting: { text: 'Connecting…', dot: 'bg-amber-400 animate-pulse' },
  open: { text: 'Live stock', dot: 'bg-emerald-500' },
  reconnecting: { text: 'Reconnecting…', dot: 'bg-amber-400 animate-pulse' },
  closed: { text: 'Live stock off', dot: 'bg-slate-400' },
} as const;

export function LiveIndicator() {
  const status = useAppSelector(selectConnection);
  const { text, dot } = LABELS[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      {text}
    </span>
  );
}
