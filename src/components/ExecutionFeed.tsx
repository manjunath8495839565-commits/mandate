'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RunStep } from '@/lib/agent/types';
import { DecisionBadge } from './DecisionBadge';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Search,
  BookOpen,
  ShoppingCart,
  Terminal,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ExecutionFeedProps {
  steps: RunStep[];
  isRunning: boolean;
  status: string;
}

export function ExecutionFeed({ steps, isRunning, status }: ExecutionFeedProps) {
  const feedEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-300">
            Autonomous Execution Feed
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
              <span>Agent Active</span>
            </div>
          )}
          <span className="text-xs font-mono text-zinc-500">
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {steps.map((step) => {
            return (
              <motion.div
                key={step.seq}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <StepItem step={step} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 text-xs font-mono"
          >
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            <span>Agent evaluating spending policy constraints...</span>
          </motion.div>
        )}

        <div ref={feedEndRef} />
      </div>
    </div>
  );
}

function StepItem({ step }: { step: RunStep }) {
  // 1. POLICY DECISION (Special Highlight for BLOCK, NEEDS_APPROVAL, ALLOW)
  if (step.type === 'POLICY_DECISION') {
    const decision = step.payload.decision;

    if (decision === 'BLOCK') {
      const failed = step.payload.failed || [];
      const totalCents = step.payload.total_cents || 34000;
      const formattedTotal = `$${(totalCents / 100).toFixed(2)} USD`;

      return (
        <div
          data-testid="block-card"
          className="relative overflow-hidden rounded-xl border-2 border-rose-500/90 bg-rose-950/80 p-6 shadow-[0_0_35px_rgba(244,63,94,0.35)] backdrop-blur-md"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500 text-rose-400">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono font-bold tracking-widest text-rose-300 uppercase">
                    Step {step.seq} - The Demo Moment
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    SPENDING BLOCKED BY POLICY ENGINE
                  </h3>
                </div>
                <DecisionBadge decision="BLOCK" size="lg" />
              </div>

              <div className="rounded-lg bg-black/50 border border-rose-900/60 p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-rose-200 font-semibold border-b border-rose-950 pb-2">
                  <span>Attempted Checkout Total:</span>
                  <span className="text-base text-white">{formattedTotal}</span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-rose-400 font-bold">Policy Violations Triggered:</span>
                  {failed.map((f: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-rose-300">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>
                        <strong className="text-white">{f.rule}:</strong> {f.detail || `Observed ${f.observed} exceeds limit ${f.limit}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent's Next Action */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-900/30 border border-rose-800/40 text-xs font-mono text-rose-200">
                <ArrowRight className="h-4 w-4 shrink-0 text-rose-400" />
                <div>
                  <span className="font-bold text-white">Agent Autonomous Pivot: </span>
                  <span>Rejecting merchant proposal. Finding compliant merchant with lower pricing under $200.00 USD.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (decision === 'NEEDS_APPROVAL') {
      const totalCents = step.payload.total_cents || 18500;
      const formattedTotal = `$${(totalCents / 100).toFixed(2)} USD`;

      return (
        <div
          data-testid="approval-card"
          className="rounded-xl border border-amber-500/80 bg-amber-950/60 p-5 shadow-[0_0_25px_rgba(245,158,11,0.2)] backdrop-blur-md"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                    Step {step.seq} • Human Gate Triggered
                  </span>
                  <h4 className="text-base font-bold text-white">
                    Policy Passed — Human Approval Required
                  </h4>
                </div>
                <DecisionBadge decision="NEEDS_APPROVAL" size="md" />
              </div>
              <p className="text-xs text-amber-200/90 font-mono">
                Order total is <strong className="text-white">{formattedTotal}</strong>. All catalog, vegetarian, and category constraints are satisfied, but total exceeds the $150.00 USD human approval threshold.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-emerald-500/60 bg-emerald-950/40 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Policy Engine: ALLOW</h4>
              <p className="text-xs text-emerald-300 font-mono">
                Compliant with all mandate rules.
              </p>
            </div>
          </div>
          <DecisionBadge decision="ALLOW" size="md" />
        </div>
      </div>
    );
  }

  // 2. TOOL CALL
  if (step.type === 'TOOL_CALL') {
    const toolName = step.payload.tool;
    const args = step.payload.arguments;

    let ToolIcon = Terminal;
    if (toolName === 'search_merchants') ToolIcon = Search;
    if (toolName === 'get_menu') ToolIcon = BookOpen;
    if (toolName === 'propose_checkout') ToolIcon = ShoppingCart;

    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 font-mono text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-zinc-300">
            <ToolIcon className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-white">tool_call:</span>
            <span className="text-emerald-400">{toolName}</span>
          </div>
          <span className="text-[10px] text-zinc-500">Step {step.seq}</span>
        </div>

        <pre className="overflow-x-auto rounded bg-zinc-900/90 p-2.5 text-[11px] text-zinc-400 border border-zinc-800/80">
          {JSON.stringify(args, null, 2)}
        </pre>
      </div>
    );
  }

  // 3. TOOL RESULT
  if (step.type === 'TOOL_RESULT') {
    const toolName = step.payload.tool;
    const result = step.payload.result;

    return (
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3 font-mono text-xs">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] text-zinc-500">tool_result from {toolName}</span>
          <span className="text-[10px] text-zinc-600">Step {step.seq}</span>
        </div>
        <div className="text-[11px] text-zinc-400 max-h-32 overflow-y-auto bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
          {Array.isArray(result) ? (
            <span>Received {result.length} catalog records</span>
          ) : typeof result === 'object' ? (
            <span>Decision: {result?.decision || 'PROCESSED'}</span>
          ) : (
            <span>{String(result)}</span>
          )}
        </div>
      </div>
    );
  }

  // 4. THOUGHT / REASONING
  if (step.type === 'THOUGHT') {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-3 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 font-mono mb-1">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-semibold text-zinc-300">Agent Reasoning</span>
        </div>
        <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-xs">
          {step.payload.content}
        </p>
      </div>
    );
  }

  // 5. FINISH
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs font-mono text-zinc-400 flex items-center justify-between">
      <span>{step.label}</span>
      <span className="text-zinc-500">Step {step.seq}</span>
    </div>
  );
}
