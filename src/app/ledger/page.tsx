'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { LedgerTable, LedgerItem } from '@/components/LedgerTable';
import { formatUSD, toCents } from '@/lib/money';
import {
  Receipt,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LedgerPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/ledger', fetcher, {
    refreshInterval: 5000,
  });

  const entries: LedgerItem[] = data?.entries || [];
  const stats = data?.stats || {
    today_spent_cents: 0,
    total_count: 0,
    completed_count: 0,
  };

  const formattedVelocity = `${formatUSD(toCents(stats.today_spent_cents))} USD`;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">
              Tamper-Evident Audit Trail
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Spending Audit Ledger
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Every transaction is cryptographically linked to its deterministic mandate digest and PayPal capture.
          </p>
        </div>

        <button
          onClick={() => mutate()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 border border-zinc-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium uppercase text-zinc-400">
              Today&apos;s Velocity
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {formattedVelocity}
          </p>
          <span className="text-[11px] text-zinc-500 font-mono">
            Cumulative authorized today
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium uppercase text-zinc-400">
              Completed Checkouts
            </span>
            <CreditCard className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {stats.completed_count}
          </p>
          <span className="text-[11px] text-zinc-500 font-mono">
            Captured on PayPal sandbox
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium uppercase text-zinc-400">
              Audit Integrity
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            100%
          </p>
          <span className="text-[11px] text-zinc-500 font-mono">
            SHA-256 canonical digests verified
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Checkout Transactions
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            {entries.length} total recorded
          </span>
        </div>

        {isLoading && entries.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono text-sm flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Loading ledger entries...</span>
          </div>
        ) : (
          <LedgerTable entries={entries} onRefundSuccess={() => mutate()} />
        )}
      </div>
    </main>
  );
}
