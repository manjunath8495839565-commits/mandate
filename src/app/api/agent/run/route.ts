import { NextResponse } from 'next/server';
import { runAgentLoop } from '@/lib/agent/loop';
import { getMandate, getLatestMandate } from '@/lib/db/repo';
import { MandatePolicy } from '@/lib/policy/types';
import { z } from 'zod';

const runRequestSchema = z.object({
  task: z.string().min(1, 'Task description is required'),
  mandate_id: z.string().optional(),
  policy: z.any().optional(),
  async: z.boolean().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { task, mandate_id, policy, async: isAsync } = runRequestSchema.parse(json);

    let resolvedPolicy: MandatePolicy | null = null;

    if (policy) {
      resolvedPolicy = policy as MandatePolicy;
    } else if (mandate_id) {
      const dbRow = getMandate(mandate_id);
      if (dbRow) {
        resolvedPolicy = JSON.parse(dbRow.policy_json);
      }
    }
    
    if (!resolvedPolicy) {
      const latestRow = getLatestMandate();
      if (latestRow) {
        resolvedPolicy = JSON.parse(latestRow.policy_json);
      }
    }

    if (!resolvedPolicy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either a policy object or a valid mandate_id is required.',
        },
        { status: 400 }
      );
    }

    if (isAsync) {
      const { generateId } = await import('@/lib/util/ids');
      const runId = generateId('run');
      // Fire agent loop in background
      runAgentLoop({
        task,
        policy: resolvedPolicy,
        run_id: runId,
      }).catch((err) => {
        console.error(`Async agent run ${runId} failed:`, err);
      });

      return NextResponse.json({
        success: true,
        run_id: runId,
      });
    }

    const result = await runAgentLoop({
      task,
      policy: resolvedPolicy,
    });

    return NextResponse.json({
      success: true,
      run: result,
      run_id: result.run_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Agent run execution failed',
      },
      { status: 500 }
    );
  }
}

