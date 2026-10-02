export type Cents = number & { readonly __brand: 'Cents' };

function assertSafeInteger(value: number, context: string): void {
  if (!Number.isFinite(value) || !Number.isSafeInteger(value)) {
    throw new TypeError(`Expected safe integer for money value in ${context}, received: ${value}`);
  }
}

/**
 * Converts a raw number to branded Cents.
 * Validates that input is finite and an integer.
 */
export function toCents(n: number): Cents {
  if (!Number.isFinite(n) || Number.isNaN(n)) {
    throw new TypeError(`Cannot convert non-finite or NaN value to Cents: ${n}`);
  }
  const rounded = Math.round(n);
  assertSafeInteger(rounded, 'toCents');
  return rounded as Cents;
}

/**
 * Returns numeric value from Cents.
 */
export function fromCents(c: Cents): number {
  assertSafeInteger(c, 'fromCents');
  return c;
}

/**
 * Adds multiple Cents together safely.
 */
export function addCents(...c: Cents[]): Cents {
  let total = 0;
  for (const amount of c) {
    assertSafeInteger(amount, 'addCents component');
    total += amount;
  }
  assertSafeInteger(total, 'addCents result');
  return total as Cents;
}

/**
 * Multiplies Cents by quantity with half-up rounding.
 */
export function mulCents(c: Cents, qty: number): Cents {
  assertSafeInteger(c, 'mulCents price');
  if (!Number.isFinite(qty) || Number.isNaN(qty)) {
    throw new TypeError(`Cannot multiply Cents by non-finite quantity: ${qty}`);
  }
  // Math.round implements round-half-up for positive numbers
  const result = Math.round(c * qty);
  assertSafeInteger(result, 'mulCents result');
  return result as Cents;
}

/**
 * Formats Cents to USD string representation (e.g. $12.50).
 */
export function formatUSD(c: Cents): string {
  assertSafeInteger(c, 'formatUSD');
  const dollars = c / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Sums line items ({ price_cents, qty }) safely without float drift.
 */
export function sumLineItems(items: { price_cents: number; qty: number }[]): Cents {
  let subtotal = 0;
  for (const item of items) {
    const itemPrice = toCents(item.price_cents);
    const lineTotal = mulCents(itemPrice, item.qty);
    subtotal += lineTotal;
  }
  assertSafeInteger(subtotal, 'sumLineItems subtotal');
  return subtotal as Cents;
}
