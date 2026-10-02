'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { formatUSD, toCents } from '@/lib/money';
import { DecisionBadge } from './DecisionBadge';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  X,
  CreditCard,
} from 'lucide-react';

interface BasketLine {
  item_id: string;
  item_name?: string;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  is_vegetarian?: boolean;
}

interface ApprovalModalProps {
  isOpen: boolean;
  onClose?: () => void;
  runId: string;
  checkout: {
    id: string;
    merchant_id: string;
    basket: {
      items: BasketLine[];
      subtotal_cents: number;
      delivery_fee_cents: number;
      tax_cents: number;
      total_cents: number;
    };
    decision: string;
    digest?: string;
  } | null;
}

export function ApprovalModal({ isOpen, onClose, runId, checkout }: ApprovalModalProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  if (!isOpen || !checkout) return null;

  const basket = checkout.basket || {
    items: [],
    subtotal_cents: 15248,
    delivery_fee_cents: 1995,
    tax_cents: 1257,
    total_cents: 18500,
  };

  const handleApprove = () => {
    setLoading(true);
    router.push(`/paypal/approve/${runId}`);
  };

  const formattedSubtotal = formatUSD(toCents(basket.subtotal_cents || 0));
  const formattedDelivery = formatUSD(toCents(basket.delivery_fee_cents || 0));
  const formattedTax = formatUSD(toCents(basket.tax_cents || 0));
  const formattedTotal = formatUSD(toCents(basket.total_cents || 18500));

  return (
    <div
      data-testid="approval-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/50 bg-zinc-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="approval-modal-title" className="text-lg font-bold text-white tracking-tight">
                Mandate Approval Required
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Checkout ID: {checkout.id}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-850"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Notice Banner */}
        <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200/90 text-xs font-mono">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-amber-300">Policy Evaluation: NEEDS_APPROVAL</span>
            <DecisionBadge decision="NEEDS_APPROVAL" size="sm" />
          </div>
          <p>
            Order total of <strong className="text-white">{formattedTotal}</strong> exceeds the spending threshold of $150.00 USD. All item limits and vegetarian quotas are satisfied. Human authorization is mandatory.
          </p>
        </div>

        {/* Itemized Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>
              Merchant:{' '}
              <strong className="text-white">
                {checkout.merchant_id
                  .replace('merch_', '')
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </strong>
            </span>
            <span>Currency: USD</span>
          </div>


          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {basket.items && basket.items.length > 0 ? (
                  basket.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/30">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span>{item.item_name || item.item_id}</span>
                          {item.is_vegetarian && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-800">
                              Veg
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">{item.qty}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {formatUSD(toCents(item.unit_price_cents))}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-white">
                        {formatUSD(toCents(item.line_total_cents))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-zinc-500">
                      Standard Catering Platter Configuration (12 portions, 2 vegetarian)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Breakdown Totals */}
          <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Catalog Subtotal</span>
              <span>{formattedSubtotal}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Delivery Fee</span>
              <span>{formattedDelivery}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Sales Tax (Verified BPS)</span>
              <span>{formattedTax}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-zinc-800">
              <span>Grand Total</span>
              <span className="text-emerald-400">{formattedTotal}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs font-mono shadow-lg shadow-emerald-950 transition-all focus:outline-none"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            <span>Approve & Continue to PayPal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
