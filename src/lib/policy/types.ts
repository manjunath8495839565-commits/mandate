/**
 * Outcomes of policy evaluation.
 */
export type Decision = 'ALLOW' | 'NEEDS_APPROVAL' | 'BLOCK';

/**
 * Valid merchant and item categories.
 */
export type Category = 'catering' | 'groceries' | 'restaurant' | 'office_supplies' | 'software';

/**
 * Human-defined mandate policy rules compiled from natural language.
 */
export interface MandatePolicy {
  /** Unique identifier for the mandate */
  mandate_id: string;
  /** Hard cap on single checkout total in cents */
  max_total_cents: number;
  /** Value above which human approval is required in cents */
  approval_threshold_cents: number;
  /** Cumulative daily spending limit in cents */
  daily_velocity_limit_cents: number;
  /** Allowed categories for merchants */
  allowed_categories: Category[];
  /** Whitelist of merchant IDs (empty means all allowed) */
  allowed_merchant_ids: string[];
  /** Whether the merchant must have been previously used */
  require_previously_used: boolean;
  /** Human notes or summary of policy */
  notes: string;
}

/**
 * Line item requested by agent.
 */
export interface BasketLine {
  /** Item identifier */
  item_id: string;
  /** Quantity requested */
  qty: number;
}

/**
 * Raw checkout payload proposed by the purchasing agent.
 */
export interface ProposedCheckout {
  /** Identifier of merchant */
  merchant_id: string;
  /** Currency code, currently only USD */
  currency: 'USD';
  /** Proposed line items */
  lines: BasketLine[];
  /** Total cost declared by agent in cents */
  agent_declared_total_cents: number;
  /** Agent explanation for selection */
  agent_rationale: string;
  /** Constraints specified by task */
  constraint_tags: string[];
  /** Minimum required vegetarian portions (if required by task) */
  required_vegetarian_count?: number;
}

/**
 * Resolved line item verified against official catalog.
 */
export interface ResolvedLine {
  /** Catalog item ID */
  item_id: string;
  /** Verified item name */
  name: string;
  /** Verified quantity */
  qty: number;
  /** Catalog unit price in cents */
  unit_price_cents: number;
  /** Total for this line in cents */
  line_total_cents: number;
  /** Whether item is vegetarian */
  is_vegetarian: boolean;
  /** Item category */
  category: Category;
}

/**
 * Fully resolved and recomputed basket.
 */
export interface ResolvedBasket {
  /** Merchant ID */
  merchant_id: string;
  /** Merchant display name */
  merchant_name: string;
  /** Merchant category */
  merchant_category: Category;
  /** Whether merchant was previously used */
  merchant_previously_used: boolean;
  /** Resolved line items */
  lines: ResolvedLine[];
  /** Sum of line items in cents */
  subtotal_cents: number;
  /** Tax in cents */
  tax_cents: number;
  /** Delivery fee in cents */
  delivery_cents: number;
  /** Grand total in cents */
  total_cents: number;
}

/**
 * Identifiers for all 11 policy rules.
 */
export type RuleId =
  | 'CART_NOT_EMPTY'
  | 'BASKET_RECOMPUTED'
  | 'CURRENCY_SUPPORTED'
  | 'CATEGORY_ALLOWED'
  | 'MERCHANT_ALLOWED'
  | 'MERCHANT_PREVIOUSLY_USED'
  | 'QUANTITIES_VALID'
  | 'CONSTRAINT_TAGS_SATISFIED'
  | 'CAP_NOT_EXCEEDED'
  | 'APPROVAL_THRESHOLD'
  | 'VELOCITY_DAILY_LIMIT';

/**
 * Evaluation record for a single rule.
 */
export interface RuleEvaluation {
  /** Identifier of the rule */
  rule: RuleId;
  /** Whether the rule passed */
  passed: boolean;
  /** Value or state observed */
  observed: string;
  /** Constraint or limit applied */
  limit: string;
  /** Human-readable explanation */
  detail: string;
}

/**
 * Final deterministic evaluation result.
 */
export interface PolicyDecision {
  /** Final deterministic decision */
  decision: Decision;
  /** Complete audit of all 11 rules evaluated */
  reasons: RuleEvaluation[];
  /** List of rules or reason codes that failed */
  failed: (RuleId | 'CAP_EXCEEDED' | string)[];
  /** Recomputed basket total in cents */
  total_cents: number;
  /** Recomputed basket */
  basket: ResolvedBasket;
  /** ISO timestamp of evaluation */
  evaluated_at: string;
  /** Engine version */
  engine_version: string;
  /** Tamper-evident SHA-256 fingerprint */
  digest: string;
}

/**
 * Contextual state for policy evaluation (e.g. daily velocity).
 */
export interface PolicyContext {
  /** Total cents successfully spent today */
  today_spent_cents: number;
  /** Catalog max quantity lookup by item ID */
  catalog_max_qty?: Record<string, number>;
}
