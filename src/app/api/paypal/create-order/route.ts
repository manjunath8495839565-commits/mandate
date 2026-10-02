import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/paypal/orders';
import { z } from 'zod';

const createOrderSchema = z.object({
  checkout_id: z.string().min(1),
  amount_cents: z.number().int().positive(),
  description: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = createOrderSchema.parse(json);

    const url = new URL(request.url);
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const publicUrl = `${proto}://${host}`;

    const result = await createOrder({
      checkout_id: parsed.checkout_id,
      amount_cents: parsed.amount_cents,
      description: parsed.description,
      public_url: publicUrl,
    });

    return NextResponse.json({
      success: true,
      order_id: result.order_id,
      approve_url: result.approve_url,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create PayPal order',
        details: error?.responseBody || null,
      },
      { status: 400 }
    );
  }
}
