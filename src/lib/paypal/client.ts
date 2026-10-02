import { fetch } from 'undici';
import { env } from '../env';
import { logger } from '../util/logger';
import { redactSecrets } from '../util/redact';
import { PayPalError } from './types';

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class PayPalClient {
  private static cachedToken: CachedToken | null = null;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl = env.PAYPAL_BASE_URL.replace(/\/+$/, '').trim();
    this.clientId = env.PAYPAL_CLIENT_ID.trim();
    this.clientSecret = env.PAYPAL_CLIENT_SECRET.trim();
    this.timeoutMs = 20000;
  }

  /**
   * Retrieves an OAuth 2.0 access token using client_credentials grant.
   * Caches in memory with expires_in minus 60 seconds of safety.
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Date.now();
    if (!forceRefresh && PayPalClient.cachedToken && PayPalClient.cachedToken.expiresAt > now) {
      return PayPalClient.cachedToken.token;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const tokenUrl = `${this.baseUrl}/v1/oauth2/token`;

    const start = Date.now();
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const duration = Date.now() - start;
    logger.info(`PayPal OAuth POST /v1/oauth2/token -> status ${res.status} in ${duration}ms`);

    if (!res.ok) {
      const errText = await res.text();
      throw new PayPalError(
        `Failed to obtain PayPal OAuth token (${res.status}): ${redactSecrets(errText, [this.clientSecret])}`,
        res.status,
        errText
      );
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    const safetyBufferMs = 60 * 1000;
    const expiresAt = now + data.expires_in * 1000 - safetyBufferMs;

    PayPalClient.cachedToken = {
      token: data.access_token,
      expiresAt,
    };

    return data.access_token;
  }

  /**
   * Invalidates cached token on authentication failures.
   */
  invalidateToken(): void {
    PayPalClient.cachedToken = null;
  }

  /**
   * Low-level authenticated fetch with automatic 401 retry and idempotency header support.
   */
  async fetch<T = any>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      idempotencyKey?: string;
    } = {}
  ): Promise<T> {
    const method = options.method || 'GET';
    const idempotencyKey = options.idempotencyKey;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl}${cleanPath}`;

    let token = await this.getAccessToken();

    const doRequest = async (authToken: string) => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };
      if (idempotencyKey) {
        headers['PayPal-Request-Id'] = idempotencyKey;
      }

      const reqBody = options.body !== undefined ? JSON.stringify(options.body) : undefined;
      const start = Date.now();

      const response = await fetch(url, {
        method,
        headers,
        body: reqBody,
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      const duration = Date.now() - start;
      logger.info(
        `PayPal ${method} ${cleanPath} (idempotency: ${idempotencyKey || 'none'}) -> status ${response.status} in ${duration}ms`
      );

      return response;
    };

    let res = await doRequest(token);

    // On 401, invalidate and retry exactly once
    if (res.status === 401) {
      logger.warn(`PayPal request returned 401. Refreshing token and retrying ${cleanPath}...`);
      this.invalidateToken();
      token = await this.getAccessToken(true);
      res = await doRequest(token);
    }

    if (!res.ok) {
      const errorBody = await res.text();
      let parsedError: any = errorBody;
      try {
        parsedError = JSON.parse(errorBody);
      } catch {
        // preserve as text
      }
      throw new PayPalError(
        `PayPal API error on ${method} ${cleanPath}: HTTP ${res.status}`,
        res.status,
        parsedError
      );
    }

    // Parse JSON if content returned
    const text = await res.text();
    if (!text || text.trim().length === 0) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }
}

export const paypalClient = new PayPalClient();

export async function paypalFetch<T = any>(
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    idempotencyKey?: string;
  }
): Promise<T> {
  return paypalClient.fetch<T>(path, options);
}
