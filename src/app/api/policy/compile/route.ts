import { NextResponse } from 'next/server';
import { compileMandatePolicy } from '@/lib/policy/compiler';
import { insertMandate } from '@/lib/db/repo';
import { z } from 'zod';

const compileRequestSchema = z.object({
  text: z.string().min(1, 'Mandate text is required'),
  mandate_id: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { text, mandate_id } = compileRequestSchema.parse(json);

    const policy = await compileMandatePolicy(text, mandate_id);

    // Save mandate to DB
    insertMandate(policy.mandate_id, text, JSON.stringify(policy), true);

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to compile mandate policy',
        details: error?.validationErrors || null,
      },
      { status: 400 }
    );
  }
}
