import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'MANDATE — Programmable Spending Authority for AI Agents',
  description: 'Deterministic spending authority for AI agents with PayPal Orders v2 and tamper-evident audit trails',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-zinc-950 text-zinc-100 min-h-screen flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}

