export function stockLabel(stock: number): string {
  if (stock <= 0) return 'Sold out';
  if (stock <= 5) return `Only ${stock} left`;
  return `${stock} in stock`;
}

export function StockBadge({ stock }: { stock: number }) {
  const tone =
    stock <= 0
      ? 'bg-slate-100 text-slate-700 ring-slate-300'
      : stock <= 5
        ? 'bg-amber-50 text-amber-800 ring-amber-200'
        : 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {stockLabel(stock)}
    </span>
  );
}
