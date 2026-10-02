'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PolicyCard } from '@/components/PolicyCard';
import { MandatePolicy } from '@/lib/policy/types';
import {
  FileText,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Terminal,
} from 'lucide-react';

const DEFAULT_PROMPT = 'Team lunch, max $200, catering only, ask above $150.';

export default function HomePage() {
  const router = useRouter();
  const [ruleText, setRuleText] = useState(DEFAULT_PROMPT);
  const [isCompiling, setIsCompiling] = useState(false);
  const [policy, setPolicy] = useState<MandatePolicy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompile = async () => {
    if (!ruleText.trim()) return;
    setIsCompiling(true);
    setError(null);

    try {
      const res = await fetch('/api/policy/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ruleText }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to compile rules into policy');
      }

      setPolicy(data.policy);
    } catch (err: any) {
      setError(err.message || 'An error occurred during rule compilation');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleConfirm = () => {
    if (!policy) return;
    router.push(`/mandate?id=${policy.mandate_id}`);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <Shield className="h-3.5 w-3.5" />
          <span>The Prime Invariant: LLM Proposes — Engine Decides</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Programmable Spending Authority
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          Transform plain-English organizational policies into tamper-evident, deterministic
          spending guardrails enforced on PayPal Sandbox.
        </p>
      </div>

      {/* Rules input card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Write Your Rules</h2>
              <p className="text-xs text-zinc-400">
                Specify spending caps, category restrictions, approval thresholds, or vegetarian quotas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRuleText(DEFAULT_PROMPT)}
            className="text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors focus:outline-none"
          >
            Reset to Demo
          </button>
        </div>

        <div className="space-y-3">
          <label htmlFor="rule-input" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Natural Language Policy Prompt
          </label>
          <div className="relative">
            <textarea
              id="rule-input"
              data-testid="rule-input"
              rows={3}
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              placeholder="e.g. Team lunch, max $200, catering only, ask above $150."
              className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 p-4 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 font-mono transition-all resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <Terminal className="h-3.5 w-3.5 text-zinc-400" />
              <span>Prompt will be compiled into a strict Zod-validated JSON policy</span>
            </div>

            <button
              id="compile-button"
              data-testid="compile-button"
              type="button"
              onClick={handleCompile}
              disabled={isCompiling || !ruleText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Compiling Policy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Compile Policy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs font-mono flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-semibold">Compilation Error: </strong>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Compiled policy preview & confirmation */}
      <AnimatePresence>
        {policy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Compiled Spending Policy</h3>
                <p className="text-xs text-zinc-400">
                  Review the deterministic limits compiled from your natural language rules.
                </p>
              </div>

              <button
                id="confirm-button"
                data-testid="confirm-button"
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition-all shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span>Confirm & Proceed</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <PolicyCard policy={policy} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
