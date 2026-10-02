import { NextResponse } from 'next/server';
import { captureOrder } from '@/lib/paypal/capture';
import { z } from 'zod';

const captureOrderSchema = z.object({
  order_id: z.string().min(1),
  checkout_id: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = captureOrderSchema.parse(json);

    const result = await captureOrder({
      order_id: parsed.order_id,
      checkout_id: parsed.checkout_id,
    });

    return NextResponse.json({
      success: true,
      capture_id: result.capture_id,
      order_id: result.order_id,
      status: result.status,
      amount_cents: result.amount_cents,
      currency: result.currency,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to capture PayPal order',
        details: error?.responseBody || null,
      },
      { status: 400 }
    );
  }
}
