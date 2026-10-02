'use client';

import React from 'react';
import { MandatePolicy, RuleEvaluation } from '@/lib/policy/types';
import { formatUSD, toCents } from '@/lib/money';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface PolicyCardProps {
  policy: MandatePolicy | null;
  reasons?: RuleEvaluation[];
  digest?: string;
  className?: string;
}

export function PolicyCard({ policy, reasons, digest, className = '' }: PolicyCardProps) {
  if (!policy) {
    return (
      <div className={`p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-zinc-400 ${className}`}>
        <p className="text-sm font-mono">No active mandate policy loaded.</p>
      </div>
    );
  }

  const formattedMaxCheckout = formatUSD(toCents(policy.max_total_cents));
  const formattedDailyVelocity = formatUSD(toCents(policy.daily_velocity_limit_cents));
  const formattedApproval = policy.approval_threshold_cents
    ? formatUSD(toCents(policy.approval_threshold_cents))
    : 'None';

  // Map reasons by rule name for fast lookup
  const reasonMap = new Map<string, RuleEvaluation>();
  if (reasons) {
    for (const r of reasons) {
      reasonMap.set(r.rule, r);
    }
  }

  const allRules: { key: string; label: string; desc: string }[] = [
    { key: 'CART_NOT_EMPTY', label: 'Cart Not Empty', desc: 'Basket must contain valid items' },
    { key: 'BASKET_RECOMPUTED', label: 'Math Integrity', desc: 'Catalog unit prices recomputed server-side' },
    { key: 'CURRENCY_SUPPORTED', label: 'Currency', desc: 'Strictly USD supported' },
    { key: 'CATEGORY_ALLOWED', label: 'Category Filter', desc: policy.allowed_categories.join(', ') },
    {
      key: 'MERCHANT_ALLOWED',
      label: 'Merchant Whitelist',
      desc: policy.allowed_merchant_ids.length ? policy.allowed_merchant_ids.join(', ') : 'All authorized merchants',
    },
    {
      key: 'MERCHANT_PREVIOUSLY_USED',
      label: 'Prior Usage',
      desc: policy.require_previously_used ? 'Only previously used merchants' : 'Any verified merchant',
    },
    { key: 'QUANTITIES_VALID', label: 'Quantity Limits', desc: 'Must satisfy catalog max quantity per item' },
    { key: 'CONSTRAINT_TAGS_SATISFIED', label: 'Dietary & Constraints', desc: 'Portion & vegetarian counts validated' },
    { key: 'CAP_NOT_EXCEEDED', label: 'Per-Checkout Budget Cap', desc: `Max ${formattedMaxCheckout}` },
    { key: 'APPROVAL_THRESHOLD', label: 'Human Review Gate', desc: `Requires approval above ${formattedApproval}` },
    { key: 'VELOCITY_DAILY_LIMIT', label: 'Daily Spending Velocity', desc: `Max ${formattedDailyVelocity} daily` },
  ];

  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md p-6 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Deterministic Spending Mandate</h3>
            <p className="text-xs font-mono text-zinc-400">{policy.mandate_id}</p>
          </div>
        </div>

        {digest && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="text-zinc-500">SHA256:</span>
            <span>{digest.slice(0, 10)}...{digest.slice(-6)}</span>
          </div>
        )}
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Max Budget</span>
          <p className="text-lg font-bold font-mono text-white mt-0.5">{formattedMaxCheckout}</p>
          <span className="text-[10px] text-zinc-500 font-mono">per checkout</span>
        </div>

        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Approval Gate</span>
          <p className="text-lg font-bold font-mono text-amber-400 mt-0.5">{formattedApproval}</p>
          <span className="text-[10px] text-zinc-500 font-mono">requires human review</span>
        </div>

        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Daily Velocity</span>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{formattedDailyVelocity}</p>
          <span className="text-[10px] text-zinc-500 font-mono">max daily spend</span>
        </div>

        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Category</span>
          <p className="text-lg font-bold text-white capitalize mt-0.5 truncate">
            {policy.allowed_categories.join(', ')}
          </p>
          <span className="text-[10px] text-zinc-500 font-mono">permitted categories</span>
        </div>
      </div>

      {/* Live Rules Checklist */}
      <div className="space-y-2 mt-4 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {reasons && reasons.length > 0 ? 'Live Policy Evaluation Results' : 'Active 11 Deterministic Guardrails'}
          </span>
          {reasons && reasons.length > 0 && (
            <span className="text-[11px] font-mono text-zinc-400">
              {reasons.filter((r) => r.passed).length}/{reasons.length} Passed
            </span>
          )}
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {allRules.map((rule) => {
            const evaluated = reasonMap.get(rule.key);
            const isEvaluated = Boolean(evaluated);
            const passed = evaluated ? evaluated.passed : true;

            return (
              <div
                key={rule.key}
                className={`flex items-center justify-between p-2 rounded-md text-xs font-mono transition-colors ${
                  !isEvaluated
                    ? 'bg-zinc-950/30 text-zinc-400 border border-zinc-800/40'
                    : passed
                    ? 'bg-emerald-950/20 text-emerald-300 border border-emerald-800/30'
                    : 'bg-rose-950/30 text-rose-300 border border-rose-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {!isEvaluated ? (
                    <div className="h-4 w-4 rounded-full border border-zinc-700 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    </div>
                  ) : passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-semibold text-zinc-200">{rule.label}</span>
                </div>

                <div className="text-right">
                  {isEvaluated && !passed ? (
                    <span className="text-rose-400 font-semibold">{evaluated?.detail}</span>
                  ) : isEvaluated && passed && evaluated?.detail ? (
                    <span className="text-zinc-400">{evaluated.detail}</span>
                  ) : (
                    <span className="text-zinc-500">{rule.desc}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
