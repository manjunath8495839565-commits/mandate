import { NextResponse } from 'next/server';
import { getLatestMandate } from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const row = getLatestMandate();
  if (!row) {
    return NextResponse.json({ mandate: null });
  }

  return NextResponse.json({
    mandate: {
      id: row.id,
      source_text: row.source_text,
      created_at: row.created_at,
      confirmed: Boolean(row.confirmed),
      policy: JSON.parse(row.policy_json),
    },
  });
}
