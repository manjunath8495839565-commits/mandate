import crypto from 'crypto';
import { env } from '../env';
import { paypalFetch } from './client';
import { recordOperation, updateOperation } from './ops';
import { PayPalOrderResponse, PayPalError } from './types';

export function deriveIdempotencyKey(
  checkoutId: string,
  kind: string,
  attempt = 1
): string {
  return crypto
    .createHash('sha256')
    .update(`${checkoutId}:${kind}:${attempt}`)
    .digest('hex')
    .slice(0, 32);
}

export interface CreateOrderParams {
  checkout_id: string;
  amount_cents: number;
  description?: string;
  reference_id?: string;
  public_url?: string;
  attempt?: number;
}

export async function createOrder(
  params: CreateOrderParams
): Promise<{ order_id: string; approve_url: string; response: PayPalOrderResponse }> {
  const publicUrl = params.public_url || env.APP_URL;
  const idempotencyKey = deriveIdempotencyKey(
    params.checkout_id,
    'CREATE_ORDER',
    params.attempt || 1
  );

  const amountValue = (params.amount_cents / 100).toFixed(2);
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.reference_id || 'mandate-smoke-001',
        custom_id: params.checkout_id,
        description: params.description || 'Mandate sandbox smoke test',
        amount: {
          currency_code: 'USD',
          value: amountValue,
        },
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: 'Mandate',
          locale: 'en-US',
          landing_page: 'LOGIN',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${publicUrl}/paypal/return?checkout=${encodeURIComponent(params.checkout_id)}`,
          cancel_url: `${publicUrl}/paypal/cancel?checkout=${encodeURIComponent(params.checkout_id)}`,
        },
      },
    },
  };

  // Persist operation record BEFORE network call
  recordOperation({
    idempotency_key: idempotencyKey,
    kind: 'CREATE_ORDER',
    request_json: payload,
    status: 'PENDING',
  });

  try {
    const res = await paypalFetch<PayPalOrderResponse>('/v2/checkout/orders', {
      method: 'POST',
      body: payload,
      idempotencyKey,
    });

    if (res.status !== 'CREATED' && res.status !== 'PAYER_ACTION_REQUIRED') {
      updateOperation({
        idempotency_key: idempotencyKey,
        paypal_order_id: res.id,
        response_json: res,
        status: 'FAILED',
      });
      throw new PayPalError(
        `Unexpected order status: ${res.status}`,
        400,
        res
      );
    }

    const approveLink = res.links?.find(
      (link) => link.rel === 'approve' || link.rel === 'payer-action'
    );
    if (!approveLink) {
      updateOperation({
        idempotency_key: idempotencyKey,
        paypal_order_id: res.id,
        response_json: res,
        status: 'FAILED',
      });
      throw new PayPalError('No approve link returned from PayPal', 500, res);
    }

    updateOperation({
      idempotency_key: idempotencyKey,
      paypal_order_id: res.id,
      response_json: res,
      status: 'CREATED',
    });

    return {
      order_id: res.id,
      approve_url: approveLink.href,
      response: res,
    };
  } catch (error: any) {
    updateOperation({
      idempotency_key: idempotencyKey,
      response_json: error?.responseBody || { message: error?.message },
      status: 'FAILED',
    });
    throw error;
  }
}

export async function getOrder(orderId: string): Promise<PayPalOrderResponse> {
  return paypalFetch<PayPalOrderResponse>(`/v2/checkout/orders/${orderId}`, {
    method: 'GET',
  });
}
