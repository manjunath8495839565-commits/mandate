'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PolicyCard } from '@/components/PolicyCard';
import { MandatePolicy } from '@/lib/policy/types';
import {
  Play,
  Sparkles,
  Bot,
  Loader2,
  AlertCircle,
  FileEdit,
  ArrowRight,
} from 'lucide-react';

const DEFAULT_TASK = "Plan Thursday's lunch for 12 people, two vegetarians, under $200.";

function MandateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mandateIdFromUrl = searchParams.get('id');

  const [policy, setPolicy] = useState<MandatePolicy | null>(null);
  const [taskText, setTaskText] = useState(DEFAULT_TASK);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPolicy() {
      try {
        setLoadingPolicy(true);
        const endpoint = mandateIdFromUrl
          ? `/api/mandate/${mandateIdFromUrl}`
          : '/api/mandate';

        const res = await fetch(endpoint);
        const data = await res.json();

        if (res.ok && data) {
          setPolicy(data.policy || data.mandate?.policy);
        } else {
          setError('No confirmed mandate found. Please write and compile rules first.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load policy');
      } finally {
        setLoadingPolicy(false);
      }
    }

    fetchPolicy();
  }, [mandateIdFromUrl]);

  const handleRunAgent = async () => {
    if (!taskText.trim() || !policy) return;
    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: taskText,
          mandate_id: policy.mandate_id,
          async: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.run_id) {
        throw new Error(data.error || 'Failed to start autonomous agent run');
      }

      router.push(`/agent/run/${data.run_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to launch agent run');
      setIsStarting(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Active Spending Mandate
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Confirmed deterministic policy constraints guarding agent execution.
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 border border-zinc-800 transition-colors self-start sm:self-auto"
        >
          <FileEdit className="h-3.5 w-3.5 text-zinc-400" />
          <span>Edit Rules</span>
        </button>
      </div>

      {loadingPolicy ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono text-sm flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          <span>Loading confirmed mandate policy...</span>
        </div>
      ) : policy ? (
        <div className="space-y-8">
          {/* Confirmed Policy Card */}
          <PolicyCard policy={policy} />

          {/* Task Input Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-emerald-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Give the Agent a Task</h2>
                  <p className="text-xs text-zinc-400">
                    Instruct the autonomous purchasing agent. It will browse catalogs, compose a basket, and submit proposals to the policy engine.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTaskText(DEFAULT_TASK)}
                className="text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors focus:outline-none"
              >
                Reset Task
              </button>
            </div>

            <div className="space-y-4">
              <label htmlFor="task-input" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Agent Objective & Constraints
              </label>

              <textarea
                id="task-input"
                data-testid="task-input"
                rows={3}
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="e.g. Plan Thursday's lunch for 12 people, two vegetarians, under $200."
                className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 p-4 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 font-mono transition-all resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs font-mono text-zinc-500">
                  Agent uses OpenRouter/Groq tool-calling with deterministic policy gates
                </div>

                <button
                  id="run-agent-button"
                  data-testid="run-agent-button"
                  type="button"
                  onClick={handleRunAgent}
                  disabled={isStarting || !taskText.trim()}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Launching Agent...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" />
                      <span>Run Agent</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs font-mono flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">Error: </strong>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-center space-y-4">
          <p className="text-sm text-zinc-400">
            No confirmed policy is currently active. Please configure and compile rules first.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium font-mono"
          >
            Create Mandate Policy
          </button>
        </div>
      )}
    </main>
  );
}

export default function MandatePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-zinc-400 font-mono text-sm flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          <span>Loading mandate page...</span>
        </div>
      }
    >
      <MandateContent />
    </Suspense>
  );
}

