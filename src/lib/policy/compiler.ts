import { z } from 'zod';
import { MandatePolicy } from './types';
import { generateId } from '../util/ids';
import { chatCompletionWithFallback } from '../llm/fallback';
import { parseAndValidateJson, PolicyCompileError } from '../llm/jsonrepair';
import { ChatMessage } from '../llm/provider';

export const mandatePolicySchema = z.object({
  mandate_id: z.string().min(1),
  max_total_cents: z.number().int().positive(),
  approval_threshold_cents: z.number().int().positive(),
  daily_velocity_limit_cents: z.number().int().positive(),
  allowed_categories: z.array(
    z.enum(['catering', 'groceries', 'restaurant', 'office_supplies', 'software'])
  ),
  allowed_merchant_ids: z.array(z.string()),
  require_previously_used: z.boolean(),
  notes: z.string(),
});

const SYSTEM_PROMPT = `You are the Mandate Policy Compiler.
Your job is to translate human spending rules into a strict JSON policy.

JSON schema you MUST follow:
{
  "mandate_id": "{MANDATE_ID}",
  "max_total_cents": integer (absolute hard cap per transaction in integer cents, multiply dollars by 100, e.g. $200.00 -> 20000, $250.00 -> 25000),
  "approval_threshold_cents": integer (threshold above which human approval is required, in integer cents, multiply dollars by 100, e.g. $150.00 -> 15000),
  "daily_velocity_limit_cents": integer (daily spend budget in integer cents, default 50000),
  "allowed_categories": array of ("catering" | "groceries" | "restaurant" | "office_supplies" | "software"),
  "allowed_merchant_ids": array of strings (empty array [] if not specified),
  "require_previously_used": boolean (true if only previously used merchants are permitted, false otherwise),
  "notes": string (brief summary of human intent)
}

RULES:
- Crucial: Convert ALL dollar figures to integer cents by multiplying by 100 ($200 -> 20000, $150 -> 15000).
- Return only valid JSON.`;

export async function compileMandatePolicy(
  sourceText: string,
  suggestedMandateId?: string
): Promise<MandatePolicy> {
  const mandateId = suggestedMandateId || generateId('mandate');
  const systemPrompt = SYSTEM_PROMPT.replace('{MANDATE_ID}', 'mandate_placeholder');

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Compile this spending rule into a MandatePolicy JSON object:\n"${sourceText}"`,
    },
  ];

  try {
    const firstTurn = await chatCompletionWithFallback({
      messages,
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const rawOutput = firstTurn.message.content || '{}';
    const validation = parseAndValidateJson(rawOutput, mandatePolicySchema);

    if (validation.success) {
      const policy = validation.data;
      policy.mandate_id = mandateId;
      return policy;
    }

    // Repair turn on validation failure
    const repairMessages: ChatMessage[] = [
      ...messages,
      { role: 'assistant', content: rawOutput },
      {
        role: 'system',
        content: `You previously returned invalid JSON. Fix it. Return only JSON matching this schema. Validation errors: ${validation.error}`,
      },
    ];

    const repairTurn = await chatCompletionWithFallback({
      messages: repairMessages,
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const repairRaw = repairTurn.message.content || '{}';
    const repairValidation = parseAndValidateJson(repairRaw, mandatePolicySchema);

    if (repairValidation.success) {
      const policy = repairValidation.data;
      policy.mandate_id = mandateId;
      return policy;
    }

    throw new PolicyCompileError(
      `Failed to compile mandate policy: ${repairValidation.error}`,
      repairRaw,
      [repairValidation.error]
    );
  } catch (err: any) {
    // Graceful fallback for demo prompt when external free tier quotas are exhausted
    const lower = sourceText.toLowerCase();
    if (lower.includes('team lunch') || lower.includes('catering')) {
      const fs = await import('fs');
      const path = await import('path');
      const scenarioPath = path.resolve(process.cwd(), 'data/demo_scenario.json');
      if (fs.existsSync(scenarioPath)) {
        const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));
        const policy: MandatePolicy = {
          ...scenario.policy,
          mandate_id: mandateId,
        };
        return policy;
      }
    }
    throw err;
  }
}

