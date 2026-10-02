import fs from 'fs';
import path from 'path';
import { getDb } from '../src/lib/db';
import { merchantSchema, catalogItemSchema } from '../src/lib/catalog/loader';
import { resolveBasket } from '../src/lib/catalog/resolve';
import { ProposedCheckout } from '../src/lib/policy/types';
import { z } from 'zod';

function runSeed() {
  console.log('--- MANDATE SEED INITIALIZING ---');
  const db = getDb();

  // Read data files
  const merchantsPath = path.resolve(process.cwd(), 'data/merchants.json');
  const catalogPath = path.resolve(process.cwd(), 'data/catalog.json');
  const demoPath = path.resolve(process.cwd(), 'data/demo_scenario.json');

  const rawMerchants = JSON.parse(fs.readFileSync(merchantsPath, 'utf-8'));
  const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const demoScenario = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));

  // Validate with Zod
  const merchants = z.array(merchantSchema).parse(rawMerchants);
  const catalog = z.array(catalogItemSchema).parse(rawCatalog);

  // Recompute demo basket totals to verify
  const blockedBasket = resolveBasket(demoScenario.blocked_attempt as ProposedCheckout);
  const compliantBasket = resolveBasket(demoScenario.compliant_attempt as ProposedCheckout);

  // Execute in a single transaction
  const seedTransaction = db.transaction(() => {
    // Truncate tables
    db.prepare('DELETE FROM approvals').run();
    db.prepare('DELETE FROM webhook_events').run();
    db.prepare('DELETE FROM ledger_entries').run();
    db.prepare('DELETE FROM payments_operations').run();
    db.prepare('DELETE FROM checkouts').run();
    db.prepare('DELETE FROM run_steps').run();
    db.prepare('DELETE FROM runs').run();
    db.prepare('DELETE FROM mandates').run();
    db.prepare('DELETE FROM menu_items').run();
    db.prepare('DELETE FROM merchants').run();

    // Insert merchants
    const insertMerch = db.prepare(`
      INSERT INTO merchants (id, name, category, previously_used, delivery_fee_cents, tax_rate_bps, rating, eta_minutes, blurb)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const m of merchants) {
      insertMerch.run(
        m.id,
        m.name,
        m.category,
        m.previously_used ? 1 : 0,
        m.delivery_fee_cents,
        m.tax_rate_bps,
        m.rating,
        m.eta_minutes,
        m.blurb
      );
    }

    // Insert menu items
    const insertItem = db.prepare(`
      INSERT INTO menu_items (id, merchant_id, name, description, category, unit_price_cents, is_vegetarian, max_qty, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of catalog) {
      insertItem.run(
        item.id,
        item.merchant_id,
        item.name,
        item.description,
        item.category,
        item.unit_price_cents,
        item.is_vegetarian ? 1 : 0,
        item.max_qty,
        JSON.stringify(item.tags)
      );
    }

    // Insert demo mandate
    db.prepare(`
      INSERT INTO mandates (id, created_at, source_text, policy_json, confirmed)
      VALUES (?, datetime('now'), ?, ?, 1)
    `).run(
      demoScenario.policy.mandate_id,
      demoScenario.task,
      JSON.stringify(demoScenario.policy)
    );
  });

  seedTransaction();

  // Print ASCII summary table
  console.log('\n+---------------------------+-----------------------------------+-------+-------------+');
  console.log('| Merchant ID               | Merchant Name                     | Items | Prev Used?  |');
  console.log('+---------------------------+-----------------------------------+-------+-------------+');
  for (const m of merchants) {
    const itemCount = catalog.filter((i) => i.merchant_id === m.id).length;
    const idPad = m.id.padEnd(25);
    const namePad = m.name.padEnd(33);
    const countPad = String(itemCount).padStart(5);
    const usedPad = (m.previously_used ? 'YES' : 'NO').padEnd(11);
    console.log(`| ${idPad} | ${namePad} | ${countPad} | ${usedPad} |`);
  }
  console.log('+---------------------------+-----------------------------------+-------+-------------+\n');

  console.log(`DEMO SCENARIO BASKET TOTALS:`);
  console.log(`- Blocked Basket Total:   ${blockedBasket.total_cents} cents ($${(blockedBasket.total_cents / 100).toFixed(2)})`);
  console.log(`- Compliant Basket Total: ${compliantBasket.total_cents} cents ($${(compliantBasket.total_cents / 100).toFixed(2)})\n`);

  console.log('SEED OK');
}

try {
  runSeed();
} catch (error) {
  console.error('Seed validation or database error:', error);
  process.exit(1);
}
