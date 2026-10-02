# MANDATE

**Programmable spending authority for AI agents.**

A human writes spending rules in plain English. An LLM compiles those rules into a strict JSON policy. A separate deterministic engine — never the model — decides `ALLOW` / `NEEDS_APPROVAL` / `BLOCK` for every proposed payment. Every cent moves through PayPal Orders v2 in sandbox with a tamper-evident audit trail. PayPal is the trust layer, not a checkout button.

---

## The Prime Invariant

The LLM **only proposes**. Plain deterministic TypeScript decides. The model can never override a cap, threshold, allowlist, or velocity limit.
- Zero dependencies on LLM or payment APIs inside the policy engine.
- Enforced at compile time, lint time, and runtime.
- All monetary amounts use integer cents (`_cents`).

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your PayPal Sandbox and LLM provider credentials:
```bash
cp .env.example .env
```

### 3. Seed Database
```bash
npm run db:seed
```

### 4. Run Tests & Verify Invariants
```bash
npm test
npm run verify
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.
