import { PolicyDecision, ProposedCheckout } from '../policy/types';

export type StepType =
  | 'THOUGHT'
  | 'TOOL_CALL'
  | 'TOOL_RESULT'
  | 'POLICY_DECISION'
  | 'FINISH';

export interface RunStep {
  seq: number;
  type: StepType;
  label: string;
  payload: any;
  created_at: string;
}

export interface AgentRunResult {
  run_id: string;
  mandate_id: string;
  task: string;
  status: 'COMPLETED' | 'NEEDS_APPROVAL' | 'BLOCKED' | 'FAILED';
  final_decision?: PolicyDecision;
  proposed_checkout?: ProposedCheckout;
  steps: RunStep[];
  attempts: number;
}
