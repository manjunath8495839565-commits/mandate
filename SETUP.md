# MANDATE Setup Guide

## Requirements
- Node.js >= 20.11.0 (tested on Node 20.11+)
- npm >= 10.x

## Step-by-Step Setup

1. **Clone and Install**:
   ```bash
   git clone <repo-url> mandate
   cd mandate
   npm install
   ```

2. **Configure Environment Variables**:
   Edit `.env` with your sandbox credentials:
   - `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`: From [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox).
   - `PAYPAL_BASE_URL`: `https://api-m.sandbox.paypal.com`
   - `LLM_PROVIDER`: `groq` (or `cerebras`, `openrouter`, `ollama`)
   - `LLM_API_KEY`: API key for your chosen provider
   - `DATABASE_URL`: `file:./dev.db` (or a PostgreSQL connection string starting with `postgres://`)

3. **Initialize Database**:
   ```bash
   npm run db:seed
   ```

4. **Verify Scaffolding & Policy Engine**:
   ```bash
   npm run verify
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```
