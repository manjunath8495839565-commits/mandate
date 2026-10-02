# Policy Engine Specification

## Architectural Boundaries
The Policy Engine evaluates proposed agent checkouts deterministically. It has zero external dependencies on LLMs or PayPal APIs.

## Evaluation Pipeline
The policy engine sequentially evaluates 11 strict rules in exact order:
1. `CART_NOT_EMPTY`: Ensures at least 1 line item, integer quantity >= 1 and <= 50.
2. `BASKET_RECOMPUTED`: Recomputed total from official catalog must strictly match `agent_declared_total_cents`. Mismatch results in `BASKET_TOTAL_MISMATCH` and BLOCK.
3. `CURRENCY_SUPPORTED`: Must be `USD`.
4. `CATEGORY_ALLOWED`: Merchant category must be in `policy.allowed_categories`.
5. `MERCHANT_ALLOWED`: If `allowed_merchant_ids` is non-empty, merchant ID must be included.
6. `MERCHANT_PREVIOUSLY_USED`: If `require_previously_used` is true, merchant must be previously used.
7. `QUANTITIES_VALID`: Line quantities must not exceed catalog `max_qty`.
8. `CONSTRAINT_TAGS_SATISFIED`: Checks constraints such as vegetarian portions. If `required_vegetarian_count` is specified (e.g. 2 vegetarian meals for 12 people), total portions where `is_vegetarian` is true must be `>= required_vegetarian_count`. Otherwise fails with `VEGETARIAN_CONSTRAINT_VIOLATED`.
9. `CAP_NOT_EXCEEDED`: `basket.total_cents <= policy.max_total_cents`. Exceeding results in `CAP_EXCEEDED` and BLOCK.
10. `APPROVAL_THRESHOLD`: If `basket.total_cents > policy.approval_threshold_cents`, requires human approval (`NEEDS_APPROVAL`).
11. `VELOCITY_DAILY_LIMIT`: `today_spent_cents + basket.total_cents <= policy.daily_velocity_limit_cents`. Exceeding results in `VELOCITY_DAILY_LIMIT_EXCEEDED` and BLOCK.

## Decision Algebra
- If any blocking rule fails -> `BLOCK`.
- Else if `APPROVAL_THRESHOLD` fails -> `NEEDS_APPROVAL`.
- Else -> `ALLOW`.

All 11 rules are evaluated on every run to produce a complete tamper-evident audit trail with a canonical SHA-256 digest.
