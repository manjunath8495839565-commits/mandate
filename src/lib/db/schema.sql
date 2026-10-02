-- MANDATE Database Schema
-- Supports SQLite and Postgres with standard SQL types

CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  previously_used INTEGER NOT NULL DEFAULT 0,
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
  tax_rate_bps INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0.0,
  eta_minutes INTEGER NOT NULL DEFAULT 30,
  blurb TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  is_vegetarian INTEGER NOT NULL DEFAULT 0,
  max_qty INTEGER NOT NULL DEFAULT 50,
  tags TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mandates (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  source_text TEXT NOT NULL,
  policy_json TEXT NOT NULL,
  confirmed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  mandate_id TEXT NOT NULL,
  task TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (mandate_id) REFERENCES mandates (id)
);

CREATE TABLE IF NOT EXISTS run_steps (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checkouts (
  id TEXT PRIMARY KEY,
  run_id TEXT,
  mandate_id TEXT NOT NULL,
  merchant_id TEXT NOT NULL,
  basket_json TEXT NOT NULL,
  decision TEXT NOT NULL,
  reasons_json TEXT NOT NULL,
  digest TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (mandate_id) REFERENCES mandates (id)
);

CREATE TABLE IF NOT EXISTS payments_operations (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  paypal_refund_id TEXT,
  request_json TEXT,
  response_json TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  checkout_id TEXT NOT NULL,
  capture_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL,
  paypal_order_id TEXT,
  digest TEXT NOT NULL,
  rationale TEXT NOT NULL DEFAULT '',
  rules_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY (checkout_id) REFERENCES checkouts (id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  checkout_id TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY (checkout_id) REFERENCES checkouts (id)
);

CREATE INDEX IF NOT EXISTS idx_menu_items_merchant ON menu_items (merchant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_status_created ON ledger_entries (status, created_at);
CREATE INDEX IF NOT EXISTS idx_run_steps_run_seq ON run_steps (run_id, seq);
