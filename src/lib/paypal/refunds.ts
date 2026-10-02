import { getDb } from '../db';
import { paypalFetch } from './client';
import { deriveIdempotencyKey } from './orders';
import { recordOperation, updateOperation } from './ops';

export interface RefundCaptureParams {
  capture_id: string;
  amount_cents?: number;
  note?: string;
  attempt?: number;
}

export async function refundCapture(params: RefundCaptureParams): Promise<{
  refund_id: string;
  status: string;
}> {
  const db = getDb();
  const idempotencyKey = deriveIdempotencyKey(
    params.capture_id,
    'REFUND_CAPTURE',
    params.attempt || 1
  );

  const payload: any = {};
  if (params.amount_cents) {
    payload.amount = {
      value: (params.amount_cents / 100).toFixed(2),
      currency_code: 'USD',
    };
  }
  if (params.note) {
    payload.note_to_payer = params.note;
  }

  recordOperation({
    idempotency_key: idempotencyKey,
    kind: 'REFUND_CAPTURE',
    request_json: payload,
    status: 'PENDING',
  });

  try {
    const res = await paypalFetch<any>(
      `/v2/payments/captures/${params.capture_id}/refund`,
      {
        method: 'POST',
        body: payload,
        idempotencyKey,
      }
    );

    const refundId = res.id;
    const status = res.status || 'COMPLETED';

    updateOperation({
      idempotency_key: idempotencyKey,
      paypal_refund_id: refundId,
      response_json: res,
      status: 'COMPLETED',
    });

    // Update matching ledger entry
    db.prepare(`
      UPDATE ledger_entries 
      SET status = 'REFUNDED'
      WHERE capture_id = ?
    `).run(params.capture_id);

    return {
      refund_id: refundId,
      status,
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
