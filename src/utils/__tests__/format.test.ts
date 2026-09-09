import { calcDiscountPercent, formatDate, formatDateTime, formatPrice } from '../format';

describe('formatPrice', () => {
  it('prefixes the rupee sign', () => {
    expect(formatPrice(100)).toBe('₹100');
  });

  // en-IN groups in lakhs/crores (last 3 digits, then pairs of 2), not the
  // Western thousands grouping — this is the one a naive `toLocaleString()`
  // call could silently get wrong if the locale argument were ever dropped.
  it('uses Indian digit-grouping rather than Western thousands-grouping', () => {
    expect(formatPrice(100000)).toBe('₹1,00,000');
    expect(formatPrice(1234567)).toBe('₹12,34,567');
  });

  it('formats small and zero values plainly', () => {
    expect(formatPrice(0)).toBe('₹0');
    expect(formatPrice(999)).toBe('₹999');
  });
});

describe('formatDate', () => {
  it('returns an empty string for an empty input', () => {
    expect(formatDate('')).toBe('');
  });

  // Exact locale-string output (spacing, comma placement) is environment
  // dependent, so assert on shape/presence rather than a byte-for-byte string.
  it('formats a real ISO date into a non-empty, human-readable string containing the year', () => {
    const result = formatDate('2024-03-15T10:30:00.000Z');
    expect(result).not.toBe('');
    expect(result).toContain('2024');
  });
});

describe('formatDateTime', () => {
  it('returns an empty string for an empty input', () => {
    expect(formatDateTime('')).toBe('');
  });

  it('formats a real ISO date into a non-empty string containing a time component', () => {
    const result = formatDateTime('2024-03-15T10:30:00.000Z');
    expect(result).not.toBe('');
    // day + month + hour:minute, e.g. "15 Mar, 4:00 pm" — assert a colon shows
    // up for the minute separator rather than the exact hour (which shifts
    // with the machine's timezone).
    expect(result).toMatch(/:/);
  });
});

describe('calcDiscountPercent', () => {
  it('computes the rounded percentage drop from mrp to price', () => {
    expect(calcDiscountPercent(200, 150)).toBe(25);
    expect(calcDiscountPercent(195, 172)).toBe(12); // 171.6 rounds to 172 elsewhere; percent still rounds cleanly
  });

  it('rounds to the nearest whole percent', () => {
    // (100 - 33) / 100 = 67%, and (100 - 33.5)/100 = 66.5 -> rounds to 67 too
    expect(calcDiscountPercent(100, 33)).toBe(67);
    expect(calcDiscountPercent(300, 100)).toBe(67); // 66.67 -> 67
  });

  it('returns 0 when there is no discount', () => {
    expect(calcDiscountPercent(100, 100)).toBe(0);
  });

  it('returns 0 when mrp is zero or negative (guard clause)', () => {
    expect(calcDiscountPercent(0, 50)).toBe(0);
    expect(calcDiscountPercent(-10, 5)).toBe(0);
  });
});
