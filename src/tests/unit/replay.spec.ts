import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { evaluateCheckout } from '../../lib/policy/engine';
import { resolveBasket } from '../../lib/catalog/resolve';
import { getCatalogMaxQtyMap } from '../../lib/catalog/loader';
import { ProposedCheckout, MandatePolicy } from '../../lib/policy/types';

describe('Demo Scenario Replay & Determinism (src/tests/unit/replay.spec.ts)', () => {
  const scenarioPath = path.resolve(process.cwd(), 'data/demo_scenario.json');
  const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));

  const policy = scenario.policy as MandatePolicy;
  const blockedAttempt = scenario.blocked_attempt as ProposedCheckout;
  const compliantAttempt = scenario.compliant_attempt as ProposedCheckout;
  const maxQtyMap = getCatalogMaxQtyMap();

  it('replay.demo_scenario_produces_exactly_BLOCK_34000 then_NEEDS_APPROVAL_18500 (50 iterations)', () => {
    for (let i = 0; i < 50; i++) {
      // 1. Resolve and evaluate blocked attempt
      const blockedBasket = resolveBasket(blockedAttempt);
      expect(blockedBasket.total_cents).toBe(34000);
      expect(blockedBasket.total_cents).toBe(scenario.blocked_expected.total_cents);

      const blockedDecision = evaluateCheckout(
        policy,
        blockedAttempt,
        blockedBasket,
        {
          today_spent_cents: scenario.today_spent_cents,
          catalog_max_qty: maxQtyMap,
        }
      );

      expect(blockedDecision.decision).toBe(scenario.blocked_expected.decision);
      expect(blockedDecision.failed).toEqual(scenario.blocked_expected.failed);
      expect(blockedDecision.total_cents).toBe(34000);

      // 2. Resolve and evaluate compliant attempt
      const compliantBasket = resolveBasket(compliantAttempt);
      expect(compliantBasket.total_cents).toBe(18500);
      expect(compliantBasket.total_cents).toBe(scenario.compliant_expected.total_cents);

      const compliantDecision = evaluateCheckout(
        policy,
        compliantAttempt,
        compliantBasket,
        {
          today_spent_cents: scenario.today_spent_cents,
          catalog_max_qty: maxQtyMap,
        }
      );

      expect(compliantDecision.decision).toBe(scenario.compliant_expected.decision);
      expect(compliantDecision.failed).toEqual(scenario.compliant_expected.failed);
      expect(compliantDecision.total_cents).toBe(18500);
    }
  });
});
