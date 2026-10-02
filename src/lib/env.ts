import { config } from 'dotenv';
import { z } from 'zod';

// Load .env if present
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  APP_URL: z.string().url('APP_URL must be a valid URL').default('http://localhost:3000'),
  NGROK_AUTHTOKEN: z.string().optional(),

  // PayPal Sandbox credentials
  PAYPAL_CLIENT_ID: z.string().min(1, 'PAYPAL_CLIENT_ID is required'),
  PAYPAL_CLIENT_SECRET: z.string().min(1, 'PAYPAL_CLIENT_SECRET is required'),
  PAYPAL_BASE_URL: z.string().url('PAYPAL_BASE_URL must be a valid URL').default('https://api-m.sandbox.paypal.com'),
  PAYPAL_WEBHOOK_ID: z.string().optional().default(''),

  // Primary LLM Provider
  LLM_PROVIDER: z.string().min(1, 'LLM_PROVIDER is required').default('groq'),
  LLM_BASE_URL: z.string().url('LLM_BASE_URL must be a valid URL'),
  LLM_API_KEY: z.string().min(1, 'LLM_API_KEY is required'),
  LLM_MODEL: z.string().min(1, 'LLM_MODEL is required'),

  // Fallback LLM Provider
  LLM_FALLBACK_PROVIDER: z.string().min(1, 'LLM_FALLBACK_PROVIDER is required').default('openrouter'),
  LLM_FALLBACK_BASE_URL: z.string().url('LLM_FALLBACK_BASE_URL must be a valid URL'),
  LLM_FALLBACK_API_KEY: z.string().min(1, 'LLM_FALLBACK_API_KEY is required'),
  LLM_FALLBACK_MODEL: z.string().min(1, 'LLM_FALLBACK_MODEL is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errorLines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
  );
  throw new Error(
    `Invalid or missing environment configuration:\n${errorLines.join('\n')}\nNever print or log secret values!`
  );
}

export const env = parsed.data;
