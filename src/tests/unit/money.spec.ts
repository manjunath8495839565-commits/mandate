import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  addCents,
  mulCents,
  formatUSD,
  sumLineItems,
  Cents,
} from '../../lib/money';

describe('Money Module (src/lib/money.ts)', () => {
  it('money.rounds_half_up', () => {
    // 101 cents * 0.5 = 50.5 cents -> rounds half-up to 51 cents
    expect(mulCents(toCents(101), 0.5)).toBe(51);

    // 103 cents * 0.5 = 51.5 cents -> rounds half-up to 52 cents
    expect(mulCents(toCents(103), 0.5)).toBe(52);

    // 100 cents * 0.5 = 50.0 cents -> 50 cents
    expect(mulCents(toCents(100), 0.5)).toBe(50);

    // 100 cents * 0.49 = 49 cents
    expect(mulCents(toCents(100), 0.49)).toBe(49);
  });

  it('money.no_float_drift_across_1000_adds', () => {
    // 0.10 in float normally suffers drift after 1000 additions (0.1 * 1000 != 100 in float)
    // In integer cents: 10 cents * 1000 = 10,000 cents exactly
    let sum = toCents(0);
    const tenCents = toCents(10);
    for (let i = 0; i < 1000; i++) {
      sum = addCents(sum, tenCents);
    }
    expect(fromCents(sum)).toBe(10000);
    expect(Number.isSafeInteger(sum)).toBe(true);
  });

  it('money.rejects_nan_and_infinity', () => {
    expect(() => toCents(NaN)).toThrow(TypeError);
    expect(() => toCents(Infinity)).toThrow(TypeError);
    expect(() => toCents(-Infinity)).toThrow(TypeError);

    const validCents = toCents(500);
    expect(() => mulCents(validCents, NaN)).toThrow(TypeError);
    expect(() => mulCents(validCents, Infinity)).toThrow(TypeError);
    expect(() => fromCents(NaN as any)).toThrow(TypeError);
    expect(() => addCents(validCents, NaN as any)).toThrow(TypeError);
  });

  it('money.formatUSD_matches_expected_strings', () => {
    expect(formatUSD(toCents(0))).toBe('$0.00');
    expect(formatUSD(toCents(100))).toBe('$1.00');
    expect(formatUSD(toCents(1250))).toBe('$12.50');
    expect(formatUSD(toCents(34000))).toBe('$340.00');
    expect(formatUSD(toCents(18500))).toBe('$185.00');
  });

  it('sumLineItems calculates correct totals safely', () => {
    const items = [
      { price_cents: 1795, qty: 10 },
      { price_cents: 1450, qty: 2 },
      { price_cents: 4500, qty: 1 },
      { price_cents: 1200, qty: 1 },
      { price_cents: 1208, qty: 2 },
    ];
    const total = sumLineItems(items);
    expect(total).toBe(28966);
  });
});
