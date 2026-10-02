import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/paypal/orders';
import { generateId } from '@/lib/util/ids';
import { logger } from '@/lib/util/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const smokeCheckoutId = generateId('chk_smoke');
    logger.info(`Starting PayPal smoke test order for checkout: ${smokeCheckoutId}`);

    const url = new URL(request.url);
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const publicUrl = `${proto}://${host}`;

    const { order_id, approve_url } = await createOrder({
      checkout_id: smokeCheckoutId,
      amount_cents: 100, // $1.00 USD
      description: 'Mandate sandbox $1.00 smoke test payment',
      public_url: publicUrl,
    });

    logger.info('====================================================');
    logger.info('MANDATE PAYPAL SMOKE TEST ORDER GENERATED');
    logger.info(`Order ID:    ${order_id}`);
    logger.info(`Approve URL: ${approve_url}`);
    logger.info('====================================================');

    return NextResponse.json({
      success: true,
      order_id,
      approval_url: approve_url,
      approve_url,
      checkout_id: smokeCheckoutId,
      amount_usd: '1.00',
    });
  } catch (error: any) {
    logger.error('PayPal smoke test order generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create PayPal smoke test order',
        details: error?.responseBody || null,
      },
      { status: 500 }
    );
  }
}
