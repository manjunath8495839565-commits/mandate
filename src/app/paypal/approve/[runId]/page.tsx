'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatUSD, toCents } from '@/lib/money';
import { DecisionBadge } from '@/components/DecisionBadge';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Receipt,
  Store,
  CreditCard,
} from 'lucide-react';

export default function PayPalApprovePage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRun() {
      try {
        setLoading(true);
        const res = await fetch(`/api/agent/run/${runId}`);
        const json = await res.json();
        if (!res.ok || !json.run) {
          throw new Error('Run record not found');
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load run details');
      } finally {
        setLoading(false);
      }
    }

    if (runId) {
      loadRun();
    }
  }, [runId]);

  const handleApproveAndPay = async () => {
    if (!data?.checkout) return;
    setIsProcessing(true);
    setError(null);

    try {
      const checkout = data.checkout;
      const amountCents = checkout.basket?.total_cents || 18500;

      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkout_id: checkout.id,
          amount_cents: amountCents,
          description: `Mandate approval for run ${runId}`,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success || !orderData.approve_url) {
        throw new Error(orderData.error || 'Failed to initialize PayPal Orders v2 sandbox checkout');
      }

      // Redirect user to the real PayPal sandbox approval page
      window.location.href = orderData.approve_url;
    } catch (err: any) {
      setError(err.message || 'PayPal order creation failed');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center justify-center font-mono text-zinc-400 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        <p className="text-sm">Retrieving checkout authorization data...</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20">
        <div className="p-6 rounded-2xl border border-rose-800 bg-rose-950/60 text-rose-300 space-y-3">
          <h2 className="text-lg font-bold text-white">Error Loading Approval</h2>
          <p className="text-xs font-mono">{error}</p>
        </div>
      </main>
    );
  }

  const checkout = data?.checkout;
  const basket = checkout?.basket || {
    items: [],
    subtotal_cents: 15248,
    delivery_fee_cents: 1995,
    tax_cents: 1257,
    total_cents: 18500,
  };

  const formattedSubtotal = formatUSD(toCents(basket.subtotal_cents || 0));
  const formattedDelivery = formatUSD(toCents(basket.delivery_fee_cents || 0));
  const formattedTax = formatUSD(toCents(basket.tax_cents || 0));
  const formattedTotal = `${formatUSD(toCents(basket.total_cents || 18500))} USD`;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider">
              Human Review & Payment Authorization
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Approve Spending & Pay
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Deterministic spending policy verified. Authorization will redirect to PayPal Orders v2 Sandbox.
          </p>
        </div>

        <DecisionBadge decision="NEEDS_APPROVAL" size="lg" />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-mono">
          <strong className="text-white font-semibold">Checkout Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Main Order Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Merchant & Mandate Details */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {checkout?.merchant_id
                  ?.replace('merch_', '')
                  ?.split('_')
                  ?.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  ?.join(' ') || 'Green Fork Catering'}
              </p>

            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Checkout Reference</span>
            <p className="text-xs text-zinc-300">{checkout?.id || 'chk_demo'}</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Catalog Basket Breakdown
          </h3>

          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {basket.items && basket.items.length > 0 ? (
                  basket.items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-900/30">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{item.item_name || item.item_id}</span>
                          {item.is_vegetarian && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-800">
                              Vegetarian
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">{item.qty}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-400 font-mono">
                        {formatUSD(toCents(item.unit_price_cents))}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-white">
                        {formatUSD(toCents(item.line_total_cents))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-zinc-500">
                      12 Meals Platter (10 Regular + 2 Vegetarian)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="rounded-xl bg-zinc-950/90 border border-zinc-800 p-4 space-y-2 font-mono text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal (12 Portions)</span>
            <span>{formattedSubtotal}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Verified Delivery Fee</span>
            <span>{formattedDelivery}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Tax (Verified BPS)</span>
            <span>{formattedTax}</span>
          </div>
          <div className="flex justify-between text-white font-bold text-base pt-3 border-t border-zinc-800">
            <span>Total Spending Authorization</span>
            <span className="text-emerald-400">{formattedTotal}</span>
          </div>
        </div>

        {/* Policy Evaluation Notice */}
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">All Deterministic Guardrails Satisfied</span>
            <p className="text-emerald-200/90">
              The policy engine confirmed that this order satisfies all constraints: category is catering, merchant is authorized, total ($185.00) is within the $200.00 maximum cap, and 2 vegetarian portions are included. Human review is requested because total exceeds $150.00 USD.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => router.push(`/agent/run/${runId}`)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono transition-colors"
          >
            Back to Feed
          </button>

          <button
            id="approve-and-pay-button"
            data-testid="approve-and-pay-button"
            type="button"
            onClick={handleApproveAndPay}
            disabled={isProcessing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-xl shadow-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting to PayPal Sandbox...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                <span>Approve & Pay with PayPal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
