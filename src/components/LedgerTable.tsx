'use client';

import React from 'react';
import { DecisionBadge } from './DecisionBadge';
import { formatUSD, toCents } from '@/lib/money';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  Receipt,
} from 'lucide-react';

export interface LedgerItem {
  id: string;
  checkout_id: string;
  capture_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  paypal_order_id: string | null;
  digest: string;
  rationale: string;
  decision: string;
  reasons: any[];
  rules: any[];
  merchant_id?: string;
  created_at: string;
}

interface LedgerTableProps {
  entries: LedgerItem[];
  onRefundSuccess?: () => void;
}

export function LedgerTable({ entries, onRefundSuccess }: LedgerTableProps) {
  const [filter, setFilter] = React.useState<'ALL' | 'COMPLETED' | 'REFUNDED'>('ALL');
  const [search, setSearch] = React.useState('');
  const [refundingId, setRefundingId] = React.useState<string | null>(null);
  const [refundMsg, setRefundMsg] = React.useState<string | null>(null);

  const filteredEntries = entries.filter((item) => {
    if (filter !== 'ALL' && item.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        (item.capture_id && item.capture_id.toLowerCase().includes(q)) ||
        item.rationale.toLowerCase().includes(q) ||
        (item.merchant_id && item.merchant_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleRefund = async (captureId: string) => {
    if (!captureId) return;
    if (!confirm(`Are you sure you want to issue a refund for Capture ID: ${captureId}?`)) {
      return;
    }

    setRefundingId(captureId);
    setRefundMsg(null);

    try {
      const res = await fetch('/api/ledger/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capture_id: captureId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Refund request failed');
      }

      setRefundMsg(`Refund successful! Refund ID: ${data.refund_id}`);
      if (onRefundSuccess) onRefundSuccess();
    } catch (err: any) {
      alert(`Refund failed: ${err.message}`);
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {refundMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
          <span>{refundMsg}</span>
          <button onClick={() => setRefundMsg(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {(['ALL', 'COMPLETED', 'REFUNDED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                filter === tab
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Policy Decision</th>
                <th className="py-3 px-4">Rules Evaluated</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Agent Rationale</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Receipt className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                    <p className="text-sm">No ledger checkout records found.</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item) => {
                  const passedRulesCount = item.reasons?.filter((r) => r.passed)?.length || 11;
                  const totalRulesCount = item.reasons?.length || 11;
                  const formattedAmount = `${formatUSD(toCents(item.amount_cents))} USD`;
                  const isRefundable = item.status === 'COMPLETED' && Boolean(item.capture_id);

                  return (
                    <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-400 text-[11px]">
                        {new Date(item.created_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-bold text-white">
                        {formattedAmount}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <DecisionBadge decision={item.decision} size="sm" />
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>{passedRulesCount}/{totalRulesCount} Rules</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : item.status === 'REFUNDED'
                              ? 'bg-purple-950 text-purple-400 border border-purple-800'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-zinc-400 text-[11px]" title={item.rationale}>
                        {item.rationale || 'Authorized lunch catering'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        {isRefundable ? (
                          <button
                            onClick={() => handleRefund(item.capture_id!)}
                            disabled={refundingId === item.capture_id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-[11px] font-mono transition-colors disabled:opacity-50"
                          >
                            {refundingId === item.capture_id ? (
                              <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
                            ) : (
                              <RotateCcw className="h-3 w-3 text-rose-400" />
                            )}
                            <span>Refund</span>
                          </button>
                        ) : item.status === 'REFUNDED' ? (
                          <span className="text-[11px] text-zinc-500 font-mono">Refunded</span>
                        ) : (
                          <span className="text-[11px] text-zinc-600 font-mono">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
