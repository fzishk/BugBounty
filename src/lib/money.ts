const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Prices travel as integer cents; they become dollars only at the moment of display. */
export function formatCents(cents: number): string {
  return usd.format(Math.round(cents) / 100);
}
