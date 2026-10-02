import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { executeTool } from '../../lib/agent/tools';
import { getDb } from '../../lib/db';
import { generateId } from '../../lib/util/ids';
import { MandatePolicy, ProposedCheckout } from '../../lib/policy/types';

describe('Agent Loop & Tool Calling End-to-End (src/tests/integration/agent.spec.ts)', () => {
  const scenarioPath = path.resolve(process.cwd(), 'data/demo_scenario.json');
  const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));
  const policy = scenario.policy as MandatePolicy;

  it('agent executes demo scenario: blocked $340 basket -> retry -> compliant $185 basket (NEEDS_APPROVAL)', async () => {
    const db = getDb();
    const runId = generateId('run_test');
    const task = "Plan Thursday's lunch for 12 people, two vegetarians, under $200.";
    const now = new Date().toISOString();

    // 1. Initialize run record
    db.prepare(`
      INSERT INTO runs (id, mandate_id, task, status, created_at, updated_at)
      VALUES (?, ?, ?, 'RUNNING', ?, ?)
    `).run(runId, policy.mandate_id, task, now, now);

    // 2. Step 1: Agent calls search_merchants
    const searchRes = await executeTool(
      'search_merchants',
      JSON.stringify({ category: 'catering' }),
      policy
    );
    expect(searchRes.result.length).toBeGreaterThan(0);
    // Verify prompt-injection defense sanitization tags
    expect(searchRes.result[0].name).toContain('<untrusted_data>');

    db.prepare(`
      INSERT INTO run_steps (id, run_id, seq, type, label, payload_json, created_at)
      VALUES (?, ?, 1, 'TOOL_CALL', 'search_merchants', ?, ?)
    `).run(generateId('step'), runId, JSON.stringify(searchRes.result), now);

    // 3. Step 2: Agent calls get_menu for Bella Pasta
    const menuRes = await executeTool(
      'get_menu',
      JSON.stringify({ merchant_id: 'merch_bella_pasta' }),
      policy
    );
    expect(menuRes.result.length).toBeGreaterThan(0);
    expect(menuRes.result[0].name).toContain('<untrusted_data>');

    db.prepare(`
      INSERT INTO run_steps (id, run_id, seq, type, label, payload_json, created_at)
      VALUES (?, ?, 2, 'TOOL_CALL', 'get_menu', ?, ?)
    `).run(generateId('step'), runId, JSON.stringify(menuRes.result), now);

    // 4. Step 3: Agent proposes excessive basket totaling 34,000 cents ($340.00)
    const blockedAttempt = scenario.blocked_attempt as ProposedCheckout;
    const blockedProposeRes = await executeTool(
      'propose_checkout',
      JSON.stringify({
        merchant_id: blockedAttempt.merchant_id,
        lines: blockedAttempt.lines,
        declared_total_cents: blockedAttempt.agent_declared_total_cents,
        rationale: blockedAttempt.agent_rationale,
        constraint_tags: blockedAttempt.constraint_tags,
        required_vegetarian_count: blockedAttempt.required_vegetarian_count,
      }),
      policy
    );

    expect(blockedProposeRes.decision).toBeDefined();
    expect(blockedProposeRes.decision?.total_cents).toBe(34000);
    expect(blockedProposeRes.decision?.decision).toBe('BLOCK');
    expect(blockedProposeRes.decision?.failed).toContain('CAP_EXCEEDED');

    db.prepare(`
      INSERT INTO run_steps (id, run_id, seq, type, label, payload_json, created_at)
      VALUES (?, ?, 3, 'POLICY_DECISION', 'Policy Decision: BLOCK', ?, ?)
    `).run(generateId('step'), runId, JSON.stringify(blockedProposeRes.decision), now);

    // 5. Step 4: Agent reads reason (CAP_EXCEEDED), switches to Green Fork Organics, gets menu
    const gfMenuRes = await executeTool(
      'get_menu',
      JSON.stringify({ merchant_id: 'merch_green_fork' }),
      policy
    );
    expect(gfMenuRes.result.length).toBeGreaterThan(0);

    // 6. Step 5: Agent proposes compliant basket totaling 18,500 cents ($185.00)
    const compliantAttempt = scenario.compliant_attempt as ProposedCheckout;
    const compliantProposeRes = await executeTool(
      'propose_checkout',
      JSON.stringify({
        merchant_id: compliantAttempt.merchant_id,
        lines: compliantAttempt.lines,
        declared_total_cents: compliantAttempt.agent_declared_total_cents,
        rationale: compliantAttempt.agent_rationale,
        constraint_tags: compliantAttempt.constraint_tags,
        required_vegetarian_count: compliantAttempt.required_vegetarian_count,
      }),
      policy
    );

    expect(compliantProposeRes.decision).toBeDefined();
    expect(compliantProposeRes.decision?.total_cents).toBe(18500);
    expect(compliantProposeRes.decision?.decision).toBe('NEEDS_APPROVAL');
    expect(compliantProposeRes.decision?.failed).toContain('APPROVAL_THRESHOLD');

    db.prepare(`
      INSERT INTO run_steps (id, run_id, seq, type, label, payload_json, created_at)
      VALUES (?, ?, 4, 'POLICY_DECISION', 'Policy Decision: NEEDS_APPROVAL', ?, ?)
    `).run(generateId('step'), runId, JSON.stringify(compliantProposeRes.decision), now);

    // Update run status
    db.prepare(`
      UPDATE runs SET status = 'NEEDS_APPROVAL' WHERE id = ?
    `).run(runId);

    // 7. Verify database records
    const runRow = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId) as any;
    expect(runRow.status).toBe('NEEDS_APPROVAL');

    const stepsRows = db.prepare('SELECT * FROM run_steps WHERE run_id = ? ORDER BY seq ASC').all(runId) as any[];
    expect(stepsRows.length).toBe(4);
    expect(stepsRows[2].label).toContain('BLOCK');
    expect(stepsRows[3].label).toContain('NEEDS_APPROVAL');
  });
});
