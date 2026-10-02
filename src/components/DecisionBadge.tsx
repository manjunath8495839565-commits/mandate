'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export type PolicyDecisionType = 'ALLOW' | 'NEEDS_APPROVAL' | 'BLOCK' | string;

interface DecisionBadgeProps {
  decision: PolicyDecisionType;
  size?: 'sm' | 'md' | 'lg';
}

export function DecisionBadge({ decision, size = 'md' }: DecisionBadgeProps) {
  const norm = decision?.toUpperCase() || 'BLOCK';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  if (norm === 'ALLOW') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-mono uppercase bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-medium ${sizeClasses[size]}`}
        aria-label="Policy Decision: Allow"
      >
        <CheckCircle2 className={`${iconSizes[size]} text-emerald-400`} />
        <span>ALLOW</span>
      </span>
    );
  }

  if (norm === 'NEEDS_APPROVAL') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-mono uppercase bg-amber-950/70 border border-amber-500/40 text-amber-300 font-medium ${sizeClasses[size]}`}
        aria-label="Policy Decision: Needs Approval"
      >
        <AlertTriangle className={`${iconSizes[size]} text-amber-400`} />
        <span>NEEDS APPROVAL</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono uppercase bg-rose-950/70 border border-rose-500/40 text-rose-300 font-medium ${sizeClasses[size]}`}
      aria-label="Policy Decision: Block"
    >
      <ShieldAlert className={`${iconSizes[size]} text-rose-400`} />
      <span>BLOCK</span>
    </span>
  );
}
