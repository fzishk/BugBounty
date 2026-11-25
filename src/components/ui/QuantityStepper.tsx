import { Minus, Plus } from 'lucide-react';

type Props = {
  value: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
  min?: number;
};

/** Accessible +/- control. The number input is clamped to [min, max] (max = stock). */
export function QuantityStepper({ value, max, onChange, label, min = 1 }: Props) {
  const set = (next: number) =>
    onChange(Math.max(min, Math.min(max, Number.isFinite(next) ? next : min)));
  return (
    <div
      className="inline-flex h-10 items-center rounded-lg ring-1 ring-slate-300"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className="grid h-full w-9 place-items-center rounded-l-lg text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="h-full w-12 [appearance:textfield] border-x border-slate-300 text-center text-sm tabular-nums focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        min={min}
        max={max}
        aria-label="Quantity"
        onChange={(e) => set(Number.parseInt(e.target.value, 10))}
      />
      <button
        type="button"
        className="grid h-full w-9 place-items-center rounded-r-lg text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
