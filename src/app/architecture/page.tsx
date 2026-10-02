import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Layers,
  Cpu,
  UserCheck,
  CreditCard,
  Receipt,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Code2,
  Award,
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'Architecture & Demo Closing | MANDATE',
  description: 'MANDATE system architecture and core invariant principles.',
};

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 pb-20">
      {/* Hero Header */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wider uppercase">
          <Layers className="h-3.5 w-3.5" />
          <span>System Architecture & Trust Separation</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          The Mandate Architecture
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-base">
          LLMs propose purchases. Plain deterministic code decides yes or no. PayPal settles every cent with cryptographic integrity.
        </p>
      </div>

      {/* The Prime Invariant Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Core Invariant</span>
            <h2 className="text-2xl font-bold text-white tracking-tight">The Propose-Decide-Settle Separation</h2>
            <p className="text-zinc-300 text-sm max-w-2xl leading-relaxed">
              The LLM never touches payment credentials, never approves its own checkouts, and cannot override budget caps or policy limits. All money calculations use strict integer cents with zero floating-point drift.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:self-center">
            <span className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-300">
              0 LLM Dependencies in Engine
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-emerald-300">
              Deterministic Cents Math
            </span>
          </div>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Layer 1: Rule Compiler */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-4 backdrop-blur-sm relative group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold">
              01
            </div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Input</span>
          </div>
          <h3 className="text-lg font-semibold text-white">Rule Compilation</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Human inputs plain English requirements. The LLM acts purely as a semantic parser, translating intent into a verified JSON policy schema with strict upper caps and threshold limits.
          </p>
          <div className="rounded-lg bg-zinc-950/70 p-3 border border-zinc-850 font-mono text-[11px] text-zinc-400 space-y-1">
            <div className="text-blue-400">max_budget_cents: 20000</div>
            <div className="text-zinc-500">require_approval_above_cents: 15000</div>
            <div className="text-zinc-500">allowed_categories: [&apos;catering&apos;]</div>
          </div>
        </div>

        {/* Layer 2: Agent Loop */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-4 backdrop-blur-sm relative group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold">
              02
            </div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Proposal</span>
          </div>
          <h3 className="text-lg font-semibold text-white">Autonomous Agent Loop</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The agent autonomously searches catalog merchants, inspects menus, calculates portion quantities, and constructs a proposal basket using the tool <code className="text-amber-300">propose_checkout</code>.
          </p>
          <div className="rounded-lg bg-zinc-950/70 p-3 border border-zinc-850 font-mono text-[11px] text-zinc-400 space-y-1">
            <div><span className="text-amber-400">Step 6:</span> Bella Pasta ($340.00)</div>
            <div><span className="text-rose-400">Blocked:</span> CAP_EXCEEDED</div>
            <div><span className="text-emerald-400">Step 11:</span> Green Fork ($185.00)</div>
          </div>
        </div>

        {/* Layer 3: Deterministic Policy Engine */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-4 backdrop-blur-sm relative group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold">
              03
            </div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Decision</span>
          </div>
          <h3 className="text-lg font-semibold text-white">Deterministic Engine</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Zero network calls. Zero LLM influence. 11 strict invariant checks execute synchronously in plain TypeScript, evaluating caps, velocity, vegetarian requirements, and approval limits.
          </p>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex items-center gap-2 text-rose-400">
              <XCircle className="h-3.5 w-3.5" />
              <span>BLOCK: Above hard budget cap</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>NEEDS_APPROVAL: Above threshold</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>ALLOW: Within autonomous limits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 4 & 5: Human Gate & PayPal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Human-in-the-Loop Approval</h3>
              <p className="text-xs text-zinc-400">Secure escalation gate before payment dispatch</p>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            When a checkout requires approval ($185.00 exceeds $150.00 threshold), the agent cannot self-execute. A human operator reviews the itemized basket, vegetarian portion ratios, and policy checklist before authorizing checkout.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">PayPal Orders v2 & Audit Ledger</h3>
              <p className="text-xs text-zinc-400">Cryptographic settlement and immutable tracking</p>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Every transaction creates and captures a real PayPal Sandbox order. Idempotency keys prevent double charges. The ledger preserves policy decisions, LLM rationales, and full refund capabilities.
          </p>
        </div>
      </div>

      {/* Demo Closing Quote & Hackathon Final Frame */}
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-8 sm:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
          <Award className="h-4 w-4" />
          <span>Built for the PayPal AI Hackathon</span>
        </div>

        <blockquote className="max-w-3xl mx-auto space-y-4">
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            &ldquo;Mandate separates proposing from deciding. The LLM proposes. Code decides. PayPal settles it. This is how agents spend money safely.&rdquo;
          </p>
        </blockquote>

        <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Developer:</span>
            <span className="text-white font-medium">Manjunath</span>
          </div>

          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-zinc-400" />
            <span className="text-emerald-400 font-medium">github.com/manjunathy/mandate</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">PayPal Orders v2 Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
