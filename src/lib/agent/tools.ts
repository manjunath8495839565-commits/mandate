import { z } from 'zod';
import { getAllMerchants, getItemsByMerchant } from '../catalog/loader';
import { resolveBasket } from '../catalog/resolve';
import { evaluateCheckout } from '../policy/engine';
import { MandatePolicy, PolicyDecision, ProposedCheckout } from '../policy/types';
import { getTodaySpentVelocity } from '../db/repo';
import { getCatalogMaxQtyMap } from '../catalog/loader';
import { ToolSpec } from '../llm/provider';

function sanitizeUntrustedText(text: string): string {
  // Strip any instruction-like tokens
  const clean = text.replace(/SYSTEM:|IGNORE ALL PREVIOUS|DROP TABLE/gi, '');
  return `<untrusted_data>${clean}</untrusted_data>`;
}

export const searchMerchantsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
});

export const getMenuSchema = z.object({
  merchant_id: z.string().min(1, 'merchant_id is required'),
});

export const proposeCheckoutSchema = z.object({
  merchant_id: z.string().min(1),
  lines: z.array(
    z.object({
      item_id: z.string().min(1),
      qty: z.number().int().positive(),
    })
  ),
  declared_total_cents: z.number().int().positive(),
  rationale: z.string().min(1),
  constraint_tags: z.array(z.string()).default([]),
  required_vegetarian_count: z.number().int().nonnegative().optional(),
});

export const AGENT_TOOLS: ToolSpec[] = [
  {
    type: 'function',
    function: {
      name: 'search_merchants',
      description: 'Search available catering merchants and view delivery fee, tax rate, and ratings.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword (optional)' },
          category: { type: 'string', description: 'Category filter (default: catering)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_menu',
      description: 'Retrieve the verified catalog menu for a merchant including item IDs, prices in cents, and vegetarian flags.',
      parameters: {
        type: 'object',
        properties: {
          merchant_id: { type: 'string', description: 'ID of the merchant (e.g. merch_bella_pasta)' },
        },
        required: ['merchant_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_checkout',
      description: 'Submit a proposed order basket to the deterministic policy engine for spending authorization.',
      parameters: {
        type: 'object',
        properties: {
          merchant_id: { type: 'string', description: 'Merchant ID' },
          lines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item_id: { type: 'string' },
                qty: { type: 'integer' },
              },
              required: ['item_id', 'qty'],
            },
            description: 'List of basket lines',
          },
          declared_total_cents: { type: 'integer', description: 'Agent calculated estimated total in cents' },
          rationale: { type: 'string', description: 'Why this selection fits the task and constraints' },
          constraint_tags: { type: 'array', items: { type: 'string' } },
          required_vegetarian_count: { type: 'integer', description: 'Number of vegetarian portions required' },
        },
        required: ['merchant_id', 'lines', 'declared_total_cents', 'rationale'],
      },
    },
  },
];

export async function executeTool(
  toolName: string,
  argsJson: string,
  policy: MandatePolicy
): Promise<{ result: any; decision?: PolicyDecision; proposed?: ProposedCheckout }> {
  const parsedArgs = JSON.parse(argsJson || '{}');

  switch (toolName) {
    case 'search_merchants': {
      const { query, category } = searchMerchantsSchema.parse(parsedArgs);
      let merchants = getAllMerchants();
      if (category) {
        merchants = merchants.filter((m) => m.category === category);
      }
      if (query) {
        const q = query.toLowerCase();
        merchants = merchants.filter(
          (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
        );
      }
      return {
        result: merchants.map((m) => ({
          id: m.id,
          name: sanitizeUntrustedText(m.name),
          category: m.category,
          previously_used: m.previously_used,
          delivery_fee_cents: m.delivery_fee_cents,
          tax_rate_bps: m.tax_rate_bps,
          rating: m.rating,
          eta_minutes: m.eta_minutes,
          blurb: sanitizeUntrustedText(m.blurb),
        })),
      };
    }

    case 'get_menu': {
      const { merchant_id } = getMenuSchema.parse(parsedArgs);
      const items = getItemsByMerchant(merchant_id);
      return {
        result: items.map((item) => ({
          id: item.id,
          merchant_id: item.merchant_id,
          name: sanitizeUntrustedText(item.name),
          category: item.category,
          unit_price_cents: item.unit_price_cents,
          is_vegetarian: item.is_vegetarian,
          max_qty: item.max_qty,
          tags: item.tags,
        })),
      };
    }

    case 'propose_checkout': {
      const input = proposeCheckoutSchema.parse(parsedArgs);
      const proposed: ProposedCheckout = {
        merchant_id: input.merchant_id,
        currency: 'USD',
        lines: input.lines,
        agent_declared_total_cents: input.declared_total_cents,
        agent_rationale: input.rationale,
        constraint_tags: input.constraint_tags,
        required_vegetarian_count: input.required_vegetarian_count,
      };

      // Server strictly recomputes ground truth from catalog
      const resolvedBasket = resolveBasket(proposed);
      const todaySpentCents = getTodaySpentVelocity();
      const maxQtyMap = getCatalogMaxQtyMap();

      const decision = evaluateCheckout(policy, proposed, resolvedBasket, {
        today_spent_cents: todaySpentCents,
        catalog_max_qty: maxQtyMap,
      });

      return {
        result: {
          decision: decision.decision,
          total_cents: decision.total_cents,
          failed: decision.failed,
          reasons: decision.reasons.map((r) => ({
            rule: r.rule,
            passed: r.passed,
            observed: r.observed,
            limit: r.limit,
            detail: r.detail,
          })),
          digest: decision.digest,
        },
        decision,
        proposed,
      };
    }

    default:
      throw new Error(`Unknown tool requested: ${toolName}`);
  }
}
