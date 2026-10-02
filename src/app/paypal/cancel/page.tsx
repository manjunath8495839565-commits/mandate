export const dynamic = 'force-dynamic';

export default function PayPalCancelPage() {
  return (
    <main className="min-h-screen p-8 max-w-xl mx-auto flex flex-col justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
        <h1 className="text-xl font-bold mb-2 text-white">Payment Cancelled</h1>
        <p className="text-sm text-slate-400 mb-6">
          The payment process was cancelled on PayPal before authorization was completed.
        </p>
        <a
          href="/"
          className="inline-block px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white text-sm"
        >
          Return to Dashboard
        </a>
      </div>
    </main>
  );
}
