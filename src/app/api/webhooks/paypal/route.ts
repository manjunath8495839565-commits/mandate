import { NextResponse } from 'next/server';
import { verifyWebhookSignature, recordWebhookEvent } from '@/lib/paypal/webhooks';
import { logger } from '@/lib/util/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const transmissionId = request.headers.get('paypal-transmission-id') || '';
    const transmissionTime = request.headers.get('paypal-transmission-time') || '';
    const certUrl = request.headers.get('paypal-cert-url') || '';
    const authAlgo = request.headers.get('paypal-auth-algo') || '';
    const transmissionSig = request.headers.get('paypal-transmission-sig') || '';

    const body = await request.json();
    const eventId = body?.id || 'unknown';
    const eventType = body?.event_type || 'UNKNOWN';

    logger.info(`Received PayPal webhook event: ${eventType} (ID: ${eventId})`);

    const hasHeaders = !!(transmissionId && transmissionTime && certUrl && authAlgo && transmissionSig);
    let verified = false;

    if (hasHeaders) {
      verified = await verifyWebhookSignature(
        {
          transmissionId,
          transmissionTime,
          certUrl,
          authAlgo,
          transmissionSig,
        },
        body
      );
    } else {
      logger.warn(`PayPal webhook headers missing. Marked unverified.`);
    }

    recordWebhookEvent(eventId, eventType, verified, body);

    // Return 200 within 5 seconds to satisfy PayPal webhook contract
    return NextResponse.json({
      received: true,
      event_id: eventId,
      verified,
    });
  } catch (error: any) {
    logger.error('Error handling PayPal webhook:', error);
    // Return 200 so PayPal does not loop endlessly on internal parsing issues
    return NextResponse.json({ received: true, error: error.message }, { status: 200 });
  }
}
