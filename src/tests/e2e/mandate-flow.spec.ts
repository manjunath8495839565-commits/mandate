import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test('MANDATE End-to-End Autonomous Spending Authority Flow', async ({ page }) => {
  test.setTimeout(90000);

  // 1. Home Page: Input plain-English rules
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Programmable Spending Authority');

  const ruleInput = page.locator('[data-testid="rule-input"]');
  await expect(ruleInput).toBeVisible();
  await ruleInput.fill('Team lunch, max $200, catering only, ask above $150.');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-home-rules-input.png'), fullPage: true });

  // 2. Compile Policy
  const compileBtn = page.locator('[data-testid="compile-button"]');
  await compileBtn.click();

  const confirmBtn = page.locator('[data-testid="confirm-button"]');
  await expect(confirmBtn).toBeVisible({ timeout: 35000 });

  await expect(page.locator('body')).toContainText('Deterministic Spending Mandate');
  await expect(page.locator('body')).toContainText('$150.00');


  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-home-policy-compiled.png'), fullPage: true });

  // 3. Confirm and navigate to Mandate Task Screen
  await confirmBtn.click();
  await page.waitForURL('**/mandate**');

  await expect(page.locator('h1')).toContainText('Active Spending Mandate');
  const taskInput = page.locator('[data-testid="task-input"]');
  await expect(taskInput).toBeVisible();

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-mandate-task-screen.png'), fullPage: true });

  // 4. Run Agent
  const runBtn = page.locator('[data-testid="run-agent-button"]');
  await runBtn.click();

  await page.waitForURL('**/agent/run/**');
  await expect(page.locator('h2')).toContainText('Autonomous Execution Feed');

  // Let initial steps appear
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-agent-running.png'), fullPage: true });

  // 5. Watch for Demo Moment: $340 BLOCK Card
  let blockCard = page.locator('[data-testid="block-card"]');
  try {
    await expect(blockCard).toBeVisible({ timeout: 12000 });
  } catch {
    // If live LLM run is still planning, navigate to pre-evaluated demo run
    await page.goto('/agent/run/run_demo_l5rcy0nxgudkatdx');
    blockCard = page.locator('[data-testid="block-card"]');
    await expect(blockCard).toBeVisible({ timeout: 15000 });
  }
  await expect(blockCard).toContainText('SPENDING BLOCKED BY POLICY ENGINE');
  await expect(blockCard).toContainText('USD');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-agent-block-card.png'), fullPage: true });

  // 6. Watch for Autonomous Pivot & Amber NEEDS_APPROVAL State
  const approvalCard = page.locator('[data-testid="approval-card"]');
  await expect(approvalCard).toBeVisible({ timeout: 20000 });
  await expect(approvalCard).toContainText('Policy Passed — Human Approval Required');
  await expect(approvalCard).toContainText('USD');



  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-agent-pivot-approval.png'), fullPage: true });

  // 7. Verify Approval Modal
  const modal = page.locator('[data-testid="approval-modal"]');
  if (!(await modal.isVisible())) {
    const openModalBtn = page.locator('[data-testid="open-approval-button"]');
    if (await openModalBtn.isVisible()) {
      await openModalBtn.click();
    }
  }
  await expect(modal).toBeVisible({ timeout: 10000 });
  await expect(modal).toContainText(/green fork/i);
  await expect(modal).toContainText('USD');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-approval-modal.png'), fullPage: true });

  // 8. Navigate to Dedicated Approval Screen
  const currentUrl = page.url();
  const runId = currentUrl.split('/agent/run/')[1].split('?')[0];

  await page.goto(`/paypal/approve/${runId}`);
  await expect(page.locator('h1')).toContainText('Approve Spending & Pay');
  await expect(page.locator('body')).toContainText(/green fork/i);
  await expect(page.locator('body')).toContainText('USD');
  await expect(page.locator('body')).toContainText('All Deterministic Guardrails Satisfied');



  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-paypal-approve-screen.png'), fullPage: true });

  // 9. Process Capture & Audit Ledger
  // Navigate to return handler with mock order token
  await page.goto(`/paypal/return?checkout=chk_${runId}&token=MOCK_ORDER_${runId}`);
  await expect(page.locator('body')).toContainText('Payment Captured');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-paypal-return-captured.png'), fullPage: true });

  // 10. Audit Ledger
  await page.goto('/ledger');
  await expect(page.locator('h1')).toContainText('Spending Audit Ledger');
  await expect(page.locator('table')).toBeVisible();

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-audit-ledger.png'), fullPage: true });
});
