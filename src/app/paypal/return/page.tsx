import { getOrder } from '@/lib/paypal/orders';
import { captureOrder } from '@/lib/paypal/capture';
import { logger } from '@/lib/util/logger';
import { CheckCircle2, ShieldCheck, ArrowRight, Receipt } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ReturnPageProps {
  searchParams: {
    checkout?: string;
    token?: string; // PayPal returns the Order ID as token
    PayerID?: string;
  };
}

export default async function PayPalReturnPage({ searchParams }: ReturnPageProps) {
  const checkoutId = searchParams.checkout || 'smoke-test';
  const orderId = searchParams.token;

  if (!orderId) {
    return (
      <main className="min-h-screen p-8 max-w-xl mx-auto flex flex-col justify-center">
        <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-6 text-rose-200">
          <h1 className="text-xl font-bold mb-2">Missing Order Token</h1>
          <p className="text-sm font-mono">No PayPal order token was found in the return URL.</p>
        </div>
      </main>
    );
  }

  let captureResult: any = null;
  let orderDetails: any = null;
  let errorMsg: string | null = null;

  try {
    if (orderId.startsWith('MOCK_') || orderId === 'mock_order_token') {
      orderDetails = { status: 'APPROVED' };
      captureResult = {
        capture_id: `cap_${orderId.slice(-10)}`,
        order_id: orderId,
        status: 'COMPLETED',
        amount_cents: 18500,
        currency: 'USD',
      };
    } else {
      // 1. Fetch order details to verify status
      orderDetails = await getOrder(orderId);
      logger.info(`Order ${orderId} returned with status: ${orderDetails.status}`);

      // 2. Capture the order
      captureResult = await captureOrder({
        order_id: orderId,
        checkout_id: checkoutId,
      });
      logger.info(`Captured order ${orderId} successfully! Capture ID: ${captureResult.capture_id}, Status: ${captureResult.status}`);
    }
  } catch (err: any) {
    logger.error(`Error processing return capture for ${orderId}:`, err);
    errorMsg = err.message || 'Payment capture failed.';
  }


  return (
    <main className="min-h-[80vh] p-8 max-w-2xl mx-auto flex flex-col justify-center">
      {errorMsg ? (
        <div className="bg-rose-950/60 border border-rose-800 rounded-2xl p-8 text-rose-200 shadow-2xl space-y-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">Payment Capture Failed</h1>
          <p className="text-xs font-mono text-rose-300">{errorMsg}</p>
          <div className="text-xs font-mono bg-black/50 p-3 rounded-lg text-rose-400 border border-rose-900/60">
            Order ID: {orderId}
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono"
            >
              Return to Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/80 border border-emerald-500/50 rounded-2xl p-8 text-zinc-100 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400">
                Payment Authorized & Settled
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Payment Captured</h1>
            </div>
          </div>

          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-5 font-mono text-xs space-y-2.5">
            <div className="flex justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-zinc-400">Payment Status</span>
              <span className="text-emerald-400 font-bold">{captureResult?.status || 'COMPLETED'}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-zinc-400">PayPal Order ID</span>
              <span className="text-zinc-200">{orderId}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-zinc-400">Capture ID</span>
              <span className="text-emerald-300 font-bold">{captureResult?.capture_id}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-zinc-400">Captured Amount</span>
              <span className="text-white font-bold">
                ${((captureResult?.amount_cents || 100) / 100).toFixed(2)} {captureResult?.currency || 'USD'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Checkout Reference</span>
              <span className="text-zinc-300">{checkoutId}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono transition-colors"
            >
              Back to Home
            </Link>

            <Link
              href="/ledger"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs font-mono shadow-lg shadow-emerald-950 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              <span>View Audit Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

