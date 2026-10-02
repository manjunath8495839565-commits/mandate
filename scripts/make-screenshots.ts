import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

async function captureScreenshots() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });

  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  console.log(`Taking screenshots against ${baseUrl}...`);

  // 1. Home page rules input
  console.log('1. Capturing home page rules input...');
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-home-rules-input.png'), fullPage: true });

  // 2. Compile policy
  console.log('2. Compiling policy and capturing preview...');
  await page.click('[data-testid="compile-button"]');
  await page.waitForSelector('[data-testid="confirm-button"]', { timeout: 35000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-home-policy-compiled.png'), fullPage: true });

  // 3. Mandate task screen
  console.log('3. Navigating to mandate task screen...');
  await page.click('[data-testid="confirm-button"]');
  await page.waitForURL('**/mandate**');
  await page.waitForSelector('[data-testid="run-agent-button"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-mandate-task-screen.png'), fullPage: true });

  // 4. Run agent & Live feed
  console.log('4. Triggering agent run and monitoring live feed...');
  await page.click('[data-testid="run-agent-button"]');
  await page.waitForURL('**/agent/run/**');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-agent-running.png'), fullPage: true });

  // 5. Block card
  console.log('5. Waiting for $340 red BLOCK card...');
  let blockCard = await page.$('[data-testid="block-card"]');
  if (!blockCard) {
    try {
      blockCard = await page.waitForSelector('[data-testid="block-card"]', { timeout: 8000 });
    } catch {
      console.log('Displaying comprehensive demo scenario run for instant demo moment capture...');
      await page.goto(`${baseUrl}/agent/run/run_demo_l5rcy0nxgudkatdx`, { waitUntil: 'networkidle' });
      blockCard = await page.waitForSelector('[data-testid="block-card"]', { timeout: 10000 });
    }
  }
  if (blockCard) {
    await blockCard.scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-agent-block-card.png'), fullPage: true });

  // 6. Approval card
  console.log('6. Waiting for $185 amber NEEDS_APPROVAL card...');
  const approvalCard = await page.waitForSelector('[data-testid="approval-card"]', { timeout: 15000 });
  await approvalCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-agent-pivot-approval.png'), fullPage: true });

  // 7. Approval Modal
  console.log('7. Capturing approval modal...');
  const modalVisible = await page.isVisible('[data-testid="approval-modal"]');
  if (!modalVisible) {
    const openBtn = await page.$('[data-testid="open-approval-button"]');
    if (openBtn) await openBtn.click();
  }
  await page.waitForSelector('[data-testid="approval-modal"]', { timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-approval-modal.png'), fullPage: true });

  // 8. Dedicated Approval Screen
  console.log('8. Capturing dedicated approval screen...');
  const runUrl = page.url();
  const runId = runUrl.includes('/agent/run/')
    ? runUrl.split('/agent/run/')[1].split('?')[0]
    : 'run_demo_l5rcy0nxgudkatdx';
  await page.goto(`${baseUrl}/paypal/approve/${runId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-paypal-approve-screen.png'), fullPage: true });

  // 9. Payment Captured Return Screen
  console.log('9. Capturing payment return screen...');
  await page.goto(`${baseUrl}/paypal/return?checkout=chk_demo_smoke&token=5PC2500974025493W`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-paypal-return-captured.png'), fullPage: true });

  // 10. Audit Ledger
  console.log('10. Capturing audit ledger...');
  await page.goto(`${baseUrl}/ledger`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-audit-ledger.png'), fullPage: true });

  await browser.close();
  console.log('All screenshots captured successfully in docs/screenshots/!');
}

captureScreenshots().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
