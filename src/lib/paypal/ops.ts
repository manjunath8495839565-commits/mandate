import { getDb } from '../db';
import { generateId } from '../util/ids';
import {
  PaymentOperationKind,
  PaymentOperationStatus,
  PaymentOperationRecord,
} from './types';

export function recordOperation(params: {
  idempotency_key: string;
  kind: PaymentOperationKind;
  paypal_order_id?: string | null;
  request_json?: any;
  status?: PaymentOperationStatus;
}): PaymentOperationRecord {
  const db = getDb();
  const id = generateId('pop');
  const now = new Date().toISOString();
  const status = params.status || 'PENDING';
  const reqJson = params.request_json ? JSON.stringify(params.request_json) : null;

  const stmt = db.prepare(`
    INSERT INTO payments_operations (
      id, idempotency_key, kind, paypal_order_id, paypal_capture_id, 
      paypal_refund_id, request_json, response_json, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, NULL, NULL, ?, NULL, ?, ?, ?)
  `);

  stmt.run(
    id,
    params.idempotency_key,
    params.kind,
    params.paypal_order_id || null,
    reqJson,
    status,
    now,
    now
  );

  return {
    id,
    idempotency_key: params.idempotency_key,
    kind: params.kind,
    paypal_order_id: params.paypal_order_id || null,
    paypal_capture_id: null,
    paypal_refund_id: null,
    request_json: reqJson,
    response_json: null,
    status,
    created_at: now,
    updated_at: now,
  };
}

export function updateOperation(params: {
  idempotency_key: string;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  paypal_refund_id?: string | null;
  response_json?: any;
  status: PaymentOperationStatus;
}): void {
  const db = getDb();
  const now = new Date().toISOString();
  const resJson = params.response_json ? JSON.stringify(params.response_json) : null;

  const stmt = db.prepare(`
    UPDATE payments_operations 
    SET 
      paypal_order_id = COALESCE(?, paypal_order_id),
      paypal_capture_id = COALESCE(?, paypal_capture_id),
      paypal_refund_id = COALESCE(?, paypal_refund_id),
      response_json = ?,
      status = ?,
      updated_at = ?
    WHERE idempotency_key = ?
  `);

  stmt.run(
    params.paypal_order_id || null,
    params.paypal_capture_id || null,
    params.paypal_refund_id || null,
    resJson,
    params.status,
    now,
    params.idempotency_key
  );
}

export function getOperationByIdempotencyKey(
  idempotencyKey: string
): PaymentOperationRecord | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM payments_operations WHERE idempotency_key = ?')
    .get(idempotencyKey) as PaymentOperationRecord | undefined;
}

export function getOperationByOrderId(
  orderId: string
): PaymentOperationRecord | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM payments_operations WHERE paypal_order_id = ?')
    .get(orderId) as PaymentOperationRecord | undefined;
}
