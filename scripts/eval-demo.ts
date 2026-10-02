import { config } from 'dotenv';
config();
import fs from 'fs';
import path from 'path';
import { getDb } from '../src/lib/db';
import { executeTool } from '../src/lib/agent/tools';
import { generateId } from '../src/lib/util/ids';
import { MandatePolicy, ProposedCheckout } from '../src/lib/policy/types';

async function runDemo() {
  const db = getDb();
  const scenarioPath = path.resolve(process.cwd(), 'data/demo_scenario.json');
  const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));
  const policy = scenario.policy as MandatePolicy;

  const runId = generateId('run_demo');
  const task = "Plan Thursday's lunch for 12 people, two vegetarians, under $200.";
  const now = new Date().toISOString();

  // 1. Create run in DB
  db.prepare(`
    INSERT INTO runs (id, mandate_id, task, status, created_at, updated_at)
    VALUES (?, ?, ?, 'RUNNING', ?, ?)
  `).run(runId, policy.mandate_id, task, now, now);

  const steps: any[] = [];
  let seq = 1;

  function recordStep(type: string, label: string, payload: any) {
    const stepId = generateId('step');
    const stepTime = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);

    db.prepare(`
      INSERT INTO run_steps (id, run_id, seq, type, label, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(stepId, runId, seq, type, label, payloadStr, stepTime);

    const stepObj = {
      id: stepId,
      run_id: runId,
      seq,
      type,
      label,
      payload,
      created_at: stepTime,
    };
    steps.push(stepObj);
    seq++;
    return stepObj;
  }

  // Step 1: Search merchants
  const searchToolRes = await executeTool(
    'search_merchants',
    JSON.stringify({ category: 'catering' }),
    policy
  );
  recordStep('TOOL_CALL', 'search_merchants', {
    tool: 'search_merchants',
    arguments: { category: 'catering' },
  });
  recordStep('TOOL_RESULT', 'search_merchants results', {
    merchants_found: searchToolRes.result.length,
    merchants: searchToolRes.result.map((m: any) => ({ id: m.id, name: m.name })),
  });

  // Step 2: Get Bella Pasta Menu
  const menuRes = await executeTool(
    'get_menu',
    JSON.stringify({ merchant_id: 'merch_bella_pasta' }),
    policy
  );
  recordStep('TOOL_CALL', 'get_menu (Bella Pasta)', {
    tool: 'get_menu',
    arguments: { merchant_id: 'merch_bella_pasta' },
  });
  recordStep('TOOL_RESULT', 'Bella Pasta menu items', {
    items_count: menuRes.result.length,
    sample_items: menuRes.result.slice(0, 3).map((i: any) => ({ id: i.id, name: i.name, unit_price_cents: i.unit_price_cents })),
  });

  // Step 3: Propose excessive Italian basket totaling 34,000 cents ($340.00)
  const blockedAttempt = scenario.blocked_attempt as ProposedCheckout;
  recordStep('THOUGHT', 'Agent rationale for initial Italian feast proposal', {
    thought: 'Proposing hearty Italian feast for 12 team members with dessert and sides.',
  });
  recordStep('TOOL_CALL', 'propose_checkout (Bella Pasta)', {
    tool: 'propose_checkout',
    arguments: {
      merchant_id: blockedAttempt.merchant_id,
      lines: blockedAttempt.lines,
      declared_total_cents: blockedAttempt.agent_declared_total_cents,
      rationale: blockedAttempt.agent_rationale,
      constraint_tags: blockedAttempt.constraint_tags,
      required_vegetarian_count: blockedAttempt.required_vegetarian_count,
    },
  });

  const blockedDecision = await executeTool(
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

  recordStep('POLICY_DECISION', 'Policy Engine Result: BLOCK', {
    decision: blockedDecision.decision?.decision,
    total_cents: blockedDecision.decision?.total_cents,
    failed_rules: blockedDecision.decision?.failed,
    digest: blockedDecision.decision?.digest,
  });

  const blockedChkId = generateId('chk');
  db.prepare(`
    INSERT INTO checkouts (id, run_id, mandate_id, merchant_id, basket_json, decision, reasons_json, digest, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    blockedChkId,
    runId,
    policy.mandate_id,
    blockedAttempt.merchant_id,
    JSON.stringify(blockedDecision.decision?.basket),
    blockedDecision.decision?.decision,
    JSON.stringify(blockedDecision.decision?.reasons),
    blockedDecision.decision?.digest
  );

  // Step 4: Agent reads reason (CAP_EXCEEDED), pivots to Green Fork Organics
  recordStep('THOUGHT', 'Agent pivot following cap block', {
    thought: 'Order exceeded $250.00 hard cap ($340.00 observed). Switching to plant-forward organic catering from Green Fork Organics.',
  });

  const gfMenuRes = await executeTool(
    'get_menu',
    JSON.stringify({ merchant_id: 'merch_green_fork' }),
    policy
  );
  recordStep('TOOL_CALL', 'get_menu (Green Fork Organics)', {
    tool: 'get_menu',
    arguments: { merchant_id: 'merch_green_fork' },
  });

  // Step 5: Propose compliant basket totaling 18,500 cents ($185.00)
  const compliantAttempt = scenario.compliant_attempt as ProposedCheckout;
  recordStep('TOOL_CALL', 'propose_checkout (Green Fork Organics)', {
    tool: 'propose_checkout',
    arguments: {
      merchant_id: compliantAttempt.merchant_id,
      lines: compliantAttempt.lines,
      declared_total_cents: compliantAttempt.agent_declared_total_cents,
      rationale: compliantAttempt.agent_rationale,
      constraint_tags: compliantAttempt.constraint_tags,
      required_vegetarian_count: compliantAttempt.required_vegetarian_count,
    },
  });

  const compliantDecision = await executeTool(
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

  const compliantChkId = generateId('chk');
  db.prepare(`
    INSERT INTO checkouts (id, run_id, mandate_id, merchant_id, basket_json, decision, reasons_json, digest, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    compliantChkId,
    runId,
    policy.mandate_id,
    compliantAttempt.merchant_id,
    JSON.stringify(compliantDecision.decision?.basket),
    compliantDecision.decision?.decision,
    JSON.stringify(compliantDecision.decision?.reasons),
    compliantDecision.decision?.digest
  );

  recordStep('POLICY_DECISION', 'Policy Engine Result: NEEDS_APPROVAL', {
    decision: compliantDecision.decision?.decision,
    total_cents: compliantDecision.decision?.total_cents,
    failed_rules: compliantDecision.decision?.failed,
    digest: compliantDecision.decision?.digest,
  });

  // Update DB run status to NEEDS_APPROVAL
  db.prepare(`
    UPDATE runs SET status = 'NEEDS_APPROVAL', updated_at = datetime('now') WHERE id = ?
  `).run(runId);

  recordStep('FINISH', 'Execution complete: awaiting human approval', {
    status: 'NEEDS_APPROVAL',
    final_amount_usd: (compliantDecision.decision?.total_cents! / 100).toFixed(2),
    digest: compliantDecision.decision?.digest,
  });

  const runRow = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId);
  const stepsRows = db.prepare('SELECT * FROM run_steps WHERE run_id = ? ORDER BY seq ASC').all(runId);

  return {
    run: runRow,
    steps: stepsRows,
  };
}

runDemo().then(out => {
  console.log('DEMO RUN COMPLETED:');
  console.log(JSON.stringify(out, null, 2));
}).catch(e => {
  console.error(e);
  process.exit(1);
});
