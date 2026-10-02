import { createHash } from 'crypto';
import {
  MandatePolicy,
  ProposedCheckout,
  ResolvedBasket,
  PolicyContext,
  PolicyDecision,
  RuleEvaluation,
  RuleId,
  Decision,
} from './types';
import { REASON_CODES } from './reasons';

export const ENGINE_VERSION = '1.0.0';

/**
 * Deterministically evaluates a proposed agent checkout against human policy.
 *
 * Prime Invariant: The LLM only proposes. Plain deterministic TypeScript decides.
 * Zero external calls. Zero LLM dependencies. Zero float math.
 */
export function evaluateCheckout(
  policy: MandatePolicy,
  proposed: ProposedCheckout,
  basket: ResolvedBasket,
  ctx: PolicyContext
): PolicyDecision {
  const reasons: RuleEvaluation[] = [];
  const failed: (RuleId | 'CAP_EXCEEDED' | string)[] = [];

  // 1. CART_NOT_EMPTY
  // At least 1 line item, every qty is an integer between 1 and 50.
  const hasItems = basket.lines.length > 0;
  const quantitiesValidIntegerRange = basket.lines.every(
    (l) => Number.isInteger(l.qty) && l.qty >= 1 && l.qty <= 50
  );
  const cartNotEmptyPassed = hasItems && quantitiesValidIntegerRange;
  if (!cartNotEmptyPassed) {
    failed.push('CART_NOT_EMPTY');
    const observedStr = !hasItems
      ? '0 items'
      : basket.lines.map((l) => `${l.item_id}:${l.qty}`).join(', ');
    reasons.push({
      rule: 'CART_NOT_EMPTY',
      passed: false,
      observed: observedStr,
      limit: '1-50 items with integer qty',
      detail: !hasItems
        ? 'Cart is empty.'
        : 'One or more items have invalid quantities (must be integer between 1 and 50).',
    });
  } else {
    reasons.push({
      rule: 'CART_NOT_EMPTY',
      passed: true,
      observed: `${basket.lines.length} items`,
      limit: '1-50 items',
      detail: REASON_CODES.CART_NOT_EMPTY.passTemplate.replace(
        '{count}',
        String(basket.lines.length)
      ),
    });
  }

  // 2. BASKET_RECOMPUTED
  // Agent declared total must strictly equal server recomputed total.
  const declaredTotal = proposed.agent_declared_total_cents;
  const recomputedTotal = basket.total_cents;
  const basketRecomputedPassed = declaredTotal === recomputedTotal;
  if (!basketRecomputedPassed) {
    failed.push('BASKET_RECOMPUTED');
    reasons.push({
      rule: 'BASKET_RECOMPUTED',
      passed: false,
      observed: `${declaredTotal} cents`,
      limit: `${recomputedTotal} cents`,
      detail: REASON_CODES.BASKET_RECOMPUTED.failTemplate
        .replace('{declared}', String(declaredTotal))
        .replace('{recomputed}', String(recomputedTotal)),
    });
  } else {
    reasons.push({
      rule: 'BASKET_RECOMPUTED',
      passed: true,
      observed: `${declaredTotal} cents`,
      limit: `${recomputedTotal} cents`,
      detail: REASON_CODES.BASKET_RECOMPUTED.passTemplate
        .replace('{declared}', String(declaredTotal))
        .replace('{recomputed}', String(recomputedTotal)),
    });
  }

  // 3. CURRENCY_SUPPORTED
  // Only USD is supported.
  const currencyPassed = proposed.currency === 'USD';
  if (!currencyPassed) {
    failed.push('CURRENCY_SUPPORTED');
    reasons.push({
      rule: 'CURRENCY_SUPPORTED',
      passed: false,
      observed: String(proposed.currency),
      limit: 'USD',
      detail: REASON_CODES.CURRENCY_SUPPORTED.failTemplate.replace(
        '{currency}',
        String(proposed.currency)
      ),
    });
  } else {
    reasons.push({
      rule: 'CURRENCY_SUPPORTED',
      passed: true,
      observed: 'USD',
      limit: 'USD',
      detail: REASON_CODES.CURRENCY_SUPPORTED.passTemplate.replace('{currency}', 'USD'),
    });
  }

  // 4. CATEGORY_ALLOWED
  // Merchant category must be in allowed_categories.
  const categoryAllowed =
    policy.allowed_categories.length === 0 ||
    policy.allowed_categories.includes(basket.merchant_category);
  if (!categoryAllowed) {
    failed.push('CATEGORY_ALLOWED');
    reasons.push({
      rule: 'CATEGORY_ALLOWED',
      passed: false,
      observed: basket.merchant_category,
      limit: policy.allowed_categories.join(', '),
      detail: REASON_CODES.CATEGORY_ALLOWED.failTemplate
        .replace('{category}', basket.merchant_category)
        .replace('{allowed}', policy.allowed_categories.join(', ')),
    });
  } else {
    reasons.push({
      rule: 'CATEGORY_ALLOWED',
      passed: true,
      observed: basket.merchant_category,
      limit:
        policy.allowed_categories.length === 0
          ? 'all'
          : policy.allowed_categories.join(', '),
      detail: REASON_CODES.CATEGORY_ALLOWED.passTemplate.replace(
        '{category}',
        basket.merchant_category
      ),
    });
  }

  // 5. MERCHANT_ALLOWED
  // If allowed_merchant_ids is non-empty, merchant must be in it.
  const merchantAllowed =
    policy.allowed_merchant_ids.length === 0 ||
    policy.allowed_merchant_ids.includes(basket.merchant_id);
  if (!merchantAllowed) {
    failed.push('MERCHANT_ALLOWED');
    reasons.push({
      rule: 'MERCHANT_ALLOWED',
      passed: false,
      observed: basket.merchant_id,
      limit: policy.allowed_merchant_ids.join(', '),
      detail: REASON_CODES.MERCHANT_ALLOWED.failTemplate.replace(
        '{merchant_id}',
        basket.merchant_id
      ),
    });
  } else {
    reasons.push({
      rule: 'MERCHANT_ALLOWED',
      passed: true,
      observed: basket.merchant_id,
      limit:
        policy.allowed_merchant_ids.length === 0
          ? 'all'
          : policy.allowed_merchant_ids.join(', '),
      detail: REASON_CODES.MERCHANT_ALLOWED.passTemplate.replace(
        '{merchant_id}',
        basket.merchant_id
      ),
    });
  }

  // 6. MERCHANT_PREVIOUSLY_USED
  // If require_previously_used is true, merchant must be previously used.
  const previouslyUsedPassed =
    !policy.require_previously_used || basket.merchant_previously_used;
  if (!previouslyUsedPassed) {
    failed.push('MERCHANT_PREVIOUSLY_USED');
    reasons.push({
      rule: 'MERCHANT_PREVIOUSLY_USED',
      passed: false,
      observed: 'previously_used=false',
      limit: 'previously_used=true',
      detail: REASON_CODES.MERCHANT_PREVIOUSLY_USED.failTemplate.replace(
        '{merchant_id}',
        basket.merchant_id
      ),
    });
  } else {
    reasons.push({
      rule: 'MERCHANT_PREVIOUSLY_USED',
      passed: true,
      observed: `previously_used=${basket.merchant_previously_used}`,
      limit: policy.require_previously_used ? 'previously_used=true' : 'optional',
      detail: REASON_CODES.MERCHANT_PREVIOUSLY_USED.passTemplate,
    });
  }

  // 7. QUANTITIES_VALID
  // No line qty exceeds the per-item max_qty declared in the catalog.
  const maxQtyMap = ctx.catalog_max_qty || {};
  const quantityViolations: string[] = [];
  for (const line of basket.lines) {
    const itemMax = maxQtyMap[line.item_id];
    if (typeof itemMax === 'number' && line.qty > itemMax) {
      quantityViolations.push(`${line.item_id} (${line.qty} > ${itemMax})`);
    }
  }
  const quantitiesValid = quantityViolations.length === 0;
  if (!quantitiesValid) {
    failed.push('QUANTITIES_VALID');
    reasons.push({
      rule: 'QUANTITIES_VALID',
      passed: false,
      observed: quantityViolations.join(', '),
      limit: 'Within item catalog max_qty',
      detail: REASON_CODES.QUANTITIES_VALID.failTemplate.replace(
        '{details}',
        quantityViolations.join(', ')
      ),
    });
  } else {
    reasons.push({
      rule: 'QUANTITIES_VALID',
      passed: true,
      observed: 'all quantities valid',
      limit: 'Within item catalog max_qty',
      detail: REASON_CODES.QUANTITIES_VALID.passTemplate,
    });
  }

  // 8. CONSTRAINT_TAGS_SATISFIED
  // Vegetarian constraint: vegetarian portions in the basket must be >= required_vegetarian_count
  let constraintsPassed = true;
  let constraintObserved = 'no constraints';
  let constraintLimit = 'none';
  let constraintDetail: string = REASON_CODES.CONSTRAINT_TAGS_SATISFIED.passTemplate;

  const reqVegCount = proposed.required_vegetarian_count;
  if (typeof reqVegCount === 'number' && reqVegCount > 0) {
    const vegPortions = basket.lines
      .filter((l) => l.is_vegetarian)
      .reduce((sum, l) => sum + l.qty, 0);

    constraintObserved = `${vegPortions} portions`;
    constraintLimit = `>= ${reqVegCount} portions`;

    if (vegPortions < reqVegCount) {
      constraintsPassed = false;
      constraintDetail = REASON_CODES.CONSTRAINT_TAGS_SATISFIED.failTemplate
        .replace('{observed}', String(vegPortions))
        .replace('{limit}', String(reqVegCount));
    }
  }

  if (!constraintsPassed) {
    failed.push('CONSTRAINT_TAGS_SATISFIED');
    reasons.push({
      rule: 'CONSTRAINT_TAGS_SATISFIED',
      passed: false,
      observed: constraintObserved,
      limit: constraintLimit,
      detail: constraintDetail,
    });
  } else {
    reasons.push({
      rule: 'CONSTRAINT_TAGS_SATISFIED',
      passed: true,
      observed: constraintObserved,
      limit: constraintLimit,
      detail: constraintDetail,
    });
  }

  // 9. CAP_NOT_EXCEEDED
  // basket.total_cents <= policy.max_total_cents
  const capPassed = basket.total_cents <= policy.max_total_cents;
  if (!capPassed) {
    failed.push('CAP_EXCEEDED');
    reasons.push({
      rule: 'CAP_NOT_EXCEEDED',
      passed: false,
      observed: `${basket.total_cents} cents`,
      limit: `${policy.max_total_cents} cents`,
      detail: REASON_CODES.CAP_NOT_EXCEEDED.failTemplate
        .replace('{total}', `${basket.total_cents} cents`)
        .replace('{cap}', `${policy.max_total_cents} cents`),
    });
  } else {
    reasons.push({
      rule: 'CAP_NOT_EXCEEDED',
      passed: true,
      observed: `${basket.total_cents} cents`,
      limit: `${policy.max_total_cents} cents`,
      detail: REASON_CODES.CAP_NOT_EXCEEDED.passTemplate
        .replace('{total}', `${basket.total_cents} cents`)
        .replace('{cap}', `${policy.max_total_cents} cents`),
    });
  }

  // 10. APPROVAL_THRESHOLD
  // If basket.total_cents > policy.approval_threshold_cents -> NEEDS_APPROVAL
  // Note: if the order exceeds the hard cap, it is already a hard BLOCK, not an approval candidate
  const thresholdPassed =
    !capPassed || basket.total_cents <= policy.approval_threshold_cents;
  if (!thresholdPassed) {
    failed.push('APPROVAL_THRESHOLD');
    reasons.push({
      rule: 'APPROVAL_THRESHOLD',
      passed: false,
      observed: `${basket.total_cents} cents`,
      limit: `${policy.approval_threshold_cents} cents`,
      detail: REASON_CODES.APPROVAL_THRESHOLD.failTemplate
        .replace('{total}', `${basket.total_cents} cents`)
        .replace('{threshold}', `${policy.approval_threshold_cents} cents`),
    });
  } else {
    reasons.push({
      rule: 'APPROVAL_THRESHOLD',
      passed: true,
      observed: `${basket.total_cents} cents`,
      limit: `${policy.approval_threshold_cents} cents`,
      detail: REASON_CODES.APPROVAL_THRESHOLD.passTemplate
        .replace('{total}', `${basket.total_cents} cents`)
        .replace('{threshold}', `${policy.approval_threshold_cents} cents`),
    });
  }

  // 11. VELOCITY_DAILY_LIMIT
  // ctx.today_spent_cents + basket.total_cents <= policy.daily_velocity_limit_cents
  const projectedSpend = ctx.today_spent_cents + basket.total_cents;
  const velocityPassed = projectedSpend <= policy.daily_velocity_limit_cents;
  if (!velocityPassed) {
    failed.push('VELOCITY_DAILY_LIMIT');
    reasons.push({
      rule: 'VELOCITY_DAILY_LIMIT',
      passed: false,
      observed: `${projectedSpend} cents`,
      limit: `${policy.daily_velocity_limit_cents} cents`,
      detail: REASON_CODES.VELOCITY_DAILY_LIMIT.failTemplate
        .replace('{projected}', `${projectedSpend} cents`)
        .replace('{limit}', `${policy.daily_velocity_limit_cents} cents`),
    });
  } else {
    reasons.push({
      rule: 'VELOCITY_DAILY_LIMIT',
      passed: true,
      observed: `${projectedSpend} cents`,
      limit: `${policy.daily_velocity_limit_cents} cents`,
      detail: REASON_CODES.VELOCITY_DAILY_LIMIT.passTemplate
        .replace('{projected}', `${projectedSpend} cents`)
        .replace('{limit}', `${policy.daily_velocity_limit_cents} cents`),
    });
  }

  // FINAL DECISION ALGEBRA
  // Blocking rules: everything except APPROVAL_THRESHOLD
  const blockingRules: string[] = [
    'CART_NOT_EMPTY',
    'BASKET_RECOMPUTED',
    'CURRENCY_SUPPORTED',
    'CATEGORY_ALLOWED',
    'MERCHANT_ALLOWED',
    'MERCHANT_PREVIOUSLY_USED',
    'QUANTITIES_VALID',
    'CONSTRAINT_TAGS_SATISFIED',
    'CAP_NOT_EXCEEDED',
    'CAP_EXCEEDED',
    'VELOCITY_DAILY_LIMIT',
  ];

  const hasBlockingFailures = failed.some((r) => blockingRules.includes(r));
  let decision: Decision;

  if (hasBlockingFailures) {
    decision = 'BLOCK';
  } else if (failed.includes('APPROVAL_THRESHOLD')) {
    decision = 'NEEDS_APPROVAL';
  } else {
    decision = 'ALLOW';
  }

  // Compute canonical digest
  const sortedLines = [...basket.lines].sort((a, b) => a.item_id.localeCompare(b.item_id));
  const canonicalPayload = {
    policy_id: policy.mandate_id,
    merchant_id: basket.merchant_id,
    lines: sortedLines.map((l) => ({
      item_id: l.item_id,
      qty: l.qty,
      unit_price_cents: l.unit_price_cents,
    })),
    total_cents: basket.total_cents,
    engine_version: ENGINE_VERSION,
  };

  const digest = createHash('sha256')
    .update(JSON.stringify(canonicalPayload))
    .digest('hex')
    .slice(0, 16);

  return {
    decision,
    reasons,
    failed,
    total_cents: basket.total_cents,
    basket,
    evaluated_at: new Date().toISOString(),
    engine_version: ENGINE_VERSION,
    digest,
  };
}
