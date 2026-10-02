import { NextResponse } from 'next/server';
import { refundCapture } from '@/lib/paypal/refunds';
import { z } from 'zod';

const refundSchema = z.object({
  capture_id: z.string().min(1, 'capture_id is required'),
  note: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { capture_id, note } = refundSchema.parse(json);

    const result = await refundCapture({
      capture_id,
      note: note || 'Refund requested from Mandate Admin UI',
    });

    return NextResponse.json({
      success: true,
      refund_id: result.refund_id,
      status: result.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Refund processing failed',
        details: error?.responseBody || null,
      },
      { status: 400 }
    );
  }
}
