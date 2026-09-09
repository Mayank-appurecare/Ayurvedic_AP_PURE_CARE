export function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

// Currency math (percent discounts, sums of decimal unit prices) produces
// binary floating-point noise like 66.60000000000001. Round to the nearest
// paisa so the true fractional value survives without that noise leaking
// into what's displayed.
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function calcDiscountPercent(mrp: number, price: number): number {
  if (mrp <= 0) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
