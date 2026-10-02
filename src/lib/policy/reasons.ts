import { RuleId } from './types';

export interface ReasonDefinition {
  readonly code: string;
  readonly passTemplate: string;
  readonly failTemplate: string;
}

export const REASON_CODES = Object.freeze({
  CART_NOT_EMPTY: {
    code: 'CART_EMPTY',
    passTemplate: 'Cart contains {count} items with valid quantities.',
    failTemplate: 'Cart is empty or contains invalid quantities (must be 1-50).',
  },
  BASKET_RECOMPUTED: {
    code: 'BASKET_TOTAL_MISMATCH',
    passTemplate: 'Agent declared total {declared} matches recomputed catalog total {recomputed}.',
    failTemplate: 'Agent declared total {declared} does not match recomputed catalog total {recomputed}.',
  },
  CURRENCY_SUPPORTED: {
    code: 'CURRENCY_UNSUPPORTED',
    passTemplate: 'Currency {currency} is supported.',
    failTemplate: 'Currency {currency} is not supported. Only USD is permitted.',
  },
  CATEGORY_ALLOWED: {
    code: 'CATEGORY_NOT_ALLOWED',
    passTemplate: 'Merchant category {category} is in allowed categories.',
    failTemplate: 'Merchant category {category} is not in allowed categories: [{allowed}].',
  },
  MERCHANT_ALLOWED: {
    code: 'MERCHANT_NOT_ALLOWED',
    passTemplate: 'Merchant {merchant_id} is permitted by merchant policy.',
    failTemplate: 'Merchant {merchant_id} is not in the allowed merchants list.',
  },
  MERCHANT_PREVIOUSLY_USED: {
    code: 'MERCHANT_NOT_PREVIOUSLY_USED',
    passTemplate: 'Merchant history requirement met.',
    failTemplate: 'Merchant {merchant_id} has not been previously used, which is required by policy.',
  },
  QUANTITIES_VALID: {
    code: 'INVALID_QUANTITY',
    passTemplate: 'All line item quantities are within catalog limits.',
    failTemplate: 'One or more items exceed per-item catalog maximum quantity limits: {details}.',
  },
  CONSTRAINT_TAGS_SATISFIED: {
    code: 'VEGETARIAN_CONSTRAINT_VIOLATED',
    passTemplate: 'All task constraint tags and dietary requirements are satisfied.',
    failTemplate: 'Vegetarian portion count {observed} is less than required {limit}.',
  },
  CAP_NOT_EXCEEDED: {
    code: 'CAP_EXCEEDED',
    passTemplate: 'Basket total {total} is within the hard cap of {cap}.',
    failTemplate: 'Basket total {total} exceeds the hard cap of {cap}.',
  },
  APPROVAL_THRESHOLD: {
    code: 'APPROVAL_REQUIRED',
    passTemplate: 'Basket total {total} does not exceed approval threshold of {threshold}.',
    failTemplate: 'Basket total {total} exceeds approval threshold of {threshold}; human approval required.',
  },
  VELOCITY_DAILY_LIMIT: {
    code: 'VELOCITY_DAILY_LIMIT_EXCEEDED',
    passTemplate: 'Daily velocity {projected} is within daily limit of {limit}.',
    failTemplate: 'Projected daily spend {projected} exceeds daily velocity limit of {limit}.',
  },
} as const satisfies Record<RuleId, ReasonDefinition>);

export const EXTRA_REASON_CODES = Object.freeze({
  ITEM_NOT_IN_CATALOG: 'ITEM_NOT_IN_CATALOG',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  CART_EMPTY: 'CART_EMPTY',
  VEGETARIAN_CONSTRAINT_VIOLATED: 'VEGETARIAN_CONSTRAINT_VIOLATED',
  CAP_EXCEEDED: 'CAP_EXCEEDED',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  CATEGORY_NOT_ALLOWED: 'CATEGORY_NOT_ALLOWED',
  MERCHANT_NOT_ALLOWED: 'MERCHANT_NOT_ALLOWED',
  MERCHANT_NOT_PREVIOUSLY_USED: 'MERCHANT_NOT_PREVIOUSLY_USED',
  VELOCITY_DAILY_LIMIT_EXCEEDED: 'VELOCITY_DAILY_LIMIT_EXCEEDED',
  CURRENCY_UNSUPPORTED: 'CURRENCY_UNSUPPORTED',
  BASKET_TOTAL_MISMATCH: 'BASKET_TOTAL_MISMATCH',
} as const);
