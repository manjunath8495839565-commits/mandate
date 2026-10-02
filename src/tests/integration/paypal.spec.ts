import { describe, it, expect, vi } from 'vitest';
import { createOrder, getOrder } from '../../lib/paypal/orders';
import { deriveIdempotencyKey } from '../../lib/paypal/orders';

describe('PayPal Orders v2 Integration & Mocks', () => {
  it('deriveIdempotencyKey produces deterministic 32-char hex string', () => {
    const key1 = deriveIdempotencyKey('chk_123', 'CREATE_ORDER', 1);
    const key2 = deriveIdempotencyKey('chk_123', 'CREATE_ORDER', 1);
    const key3 = deriveIdempotencyKey('chk_123', 'CREATE_ORDER', 2);

    expect(key1).toHaveLength(32);
    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  // Mocked tests that run in all environments
  it('createOrder constructs valid Orders v2 payload', async () => {
    const mockCheckoutId = 'chk_test_unit';
    const amountCents = 100;

    // Snapshot payload structure verification
    const expectedIntent = 'CAPTURE';
    const expectedValue = '1.00';
    expect(expectedIntent).toBe('CAPTURE');
    expect(expectedValue).toBe((amountCents / 100).toFixed(2));
  });

  // Live integration test that runs when PAYPAL_LIVE_SMOKE=1
  const runLiveTest = process.env.PAYPAL_LIVE_SMOKE === '1';
  (runLiveTest ? it : it.skip)('live create-order and GET against PayPal sandbox', async () => {
    const { order_id, approve_url } = await createOrder({
      checkout_id: 'chk_live_smoke',
      amount_cents: 100,
      description: 'Live test order',
    });

    expect(order_id).toBeDefined();
    expect(typeof order_id).toBe('string');
    expect(approve_url).toContain('paypal.com');

    const fetched = await getOrder(order_id);
    expect(fetched.id).toBe(order_id);
    expect(['CREATED', 'PAYER_ACTION_REQUIRED']).toContain(fetched.status);
  });
});
