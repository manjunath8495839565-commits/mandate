import { env } from '../env';
import { getDb } from '../db';
import { generateId } from '../util/ids';
import { logger } from '../util/logger';
import { paypalFetch } from './client';
import {
  PayPalWebhookVerificationRequest,
  PayPalWebhookVerificationResponse,
} from './types';

export interface VerifyWebhookHeaders {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
}

export async function verifyWebhookSignature(
  headers: VerifyWebhookHeaders,
  webhookEvent: Record<string, any>
): Promise<boolean> {
  const webhookId = env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    logger.warn('PAYPAL_WEBHOOK_ID is not configured. Webhook signature cannot be verified.');
    return false;
  }

  const payload: PayPalWebhookVerificationRequest = {
    transmission_id: headers.transmissionId,
    transmission_time: headers.transmissionTime,
    cert_url: headers.certUrl,
    auth_algo: headers.authAlgo,
    transmission_sig: headers.transmissionSig,
    webhook_id: webhookId,
    webhook_event: webhookEvent,
  };

  try {
    const res = await paypalFetch<PayPalWebhookVerificationResponse>(
      '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        body: payload,
      }
    );

    return res.verification_status === 'SUCCESS';
  } catch (error) {
    logger.error('Error verifying PayPal webhook signature:', error);
    return false;
  }
}

export function recordWebhookEvent(
  eventId: string,
  eventType: string,
  verified: boolean,
  payload: any
): boolean {
  const db = getDb();
  const id = generateId('wh');
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO webhook_events (id, event_id, event_type, verified, payload_json, received_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, eventId, eventType, verified ? 1 : 0, JSON.stringify(payload), now);
    return true;
  } catch (err: any) {
    // If unique constraint violation on event_id, it is a duplicate delivery
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      logger.info(`Duplicate webhook event ${eventId} ignored.`);
      return false;
    }
    throw err;
  }
}
