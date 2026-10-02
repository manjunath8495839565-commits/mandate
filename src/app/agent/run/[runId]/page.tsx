'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { ExecutionFeed } from '@/components/ExecutionFeed';
import { PolicyCard } from '@/components/PolicyCard';
import { ApprovalModal } from '@/components/ApprovalModal';
import { DecisionBadge } from '@/components/DecisionBadge';
import {
  Terminal,
  ArrowRight,
  Shield,
  Loader2,
  AlertTriangle,
  Receipt,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AgentRunPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;

  const [modalOpen, setModalOpen] = useState(false);

  const { data, error, isLoading } = useSWR(
    runId ? `/api/agent/run/${runId}` : null,
    fetcher,
    {
      refreshInterval: (latestData) => {
        const status = latestData?.run?.status;
        if (status === 'COMPLETED' || status === 'NEEDS_APPROVAL') {
          return 0; // stop polling once finished
        }
        return 1000; // poll every 1s
      },
    }
  );

  const run = data?.run;
  const steps = data?.steps || [];
  const checkout = data?.checkout;
  const policy = data?.policy;
  const status = run?.status || 'RUNNING';
  const isRunning = status === 'RUNNING';

  // Extract latest evaluated policy reasons from checkout or steps
  const latestReasons = checkout?.reasons || [];


  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Autonomous Agent Run
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-mono text-zinc-400">{runId}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {run?.task || "Plan Thursday's lunch for 12 people, two vegetarians, under $200."}
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isRunning ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>RUNNING</span>
            </div>
          ) : (
            <DecisionBadge decision={status} size="md" />
          )}

          {status === 'COMPLETED' && (
            <button
              onClick={() => router.push('/ledger')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono transition-colors"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>View Ledger</span>
            </button>
          )}

          {status === 'NEEDS_APPROVAL' && (
            <button
              id="open-approval-button"
              data-testid="open-approval-button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono shadow-lg shadow-amber-950 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Review & Approve</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Spending Policy Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <PolicyCard policy={policy} reasons={latestReasons} />
          </div>
        </div>

        {/* Right Column: Live Execution Feed */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md p-6 shadow-2xl">
            <ExecutionFeed
              steps={steps}
              isRunning={isRunning}
              status={status}
            />
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        runId={runId}
        checkout={checkout}
      />
    </main>
  );
}
