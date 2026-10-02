import { env } from '../env';
import { logger } from '../util/logger';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMProviderConfig,
} from './provider';
import { LLMClient } from './client';
import { computeCacheKey, getCachedResponse, setCachedResponse } from './cache';

export class LLMUnavailableError extends Error {
  public readonly primaryError: any;
  public readonly fallbackError: any;

  constructor(message: string, primaryError: any, fallbackError: any) {
    super(message);
    this.name = 'LLMUnavailableError';
    this.primaryError = primaryError;
    this.fallbackError = fallbackError;
  }
}

const primaryConfig: LLMProviderConfig = {
  name: env.LLM_PROVIDER,
  baseUrl: env.LLM_BASE_URL,
  apiKey: env.LLM_API_KEY,
  model: env.LLM_MODEL,
};

const fallbackConfig: LLMProviderConfig = {
  name: env.LLM_FALLBACK_PROVIDER,
  baseUrl: env.LLM_FALLBACK_BASE_URL,
  apiKey: env.LLM_FALLBACK_API_KEY,
  model: env.LLM_FALLBACK_MODEL,
};

const primaryClient = new LLMClient(primaryConfig);
const fallbackClient = new LLMClient(fallbackConfig);

const DELAYS_MS = [500, 1500, 4000];

function getJitteredDelay(baseMs: number): number {
  const jitterFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 (+-20%)
  return Math.round(baseMs * jitterFactor);
}

export async function chatCompletionWithFallback(
  req: ChatCompletionRequest,
  onFallback?: (provider: string, model: string) => void
): Promise<ChatCompletionResponse> {
  // Check cache if temperature is 0
  const isZeroTemp = (req.temperature ?? 0) === 0;
  const cacheKey = isZeroTemp
    ? computeCacheKey(primaryConfig.name, primaryConfig.model, req)
    : null;

  if (cacheKey) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      logger.info(`LLM Cache hit for key: ${cacheKey.slice(0, 12)}...`);
      return cached;
    }
  }

  let primaryError: any = null;

  // Try primary provider with exponential backoff on 429/5xx
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const response = await primaryClient.complete(req);
      if (cacheKey) {
        setCachedResponse(cacheKey, response);
      }
      return response;
    } catch (err: any) {
      primaryError = err;
      const status = err?.status;
      const isRetryable = status === 429 || (status >= 500 && status <= 599);

      if (!isRetryable || attempt === 3) {
        logger.warn(
          `Primary provider ${primaryConfig.name} failed (attempt ${attempt + 1}/4): ${err.message}. Switching to fallback.`
        );
        break;
      }

      const delay = getJitteredDelay(DELAYS_MS[attempt] || 4000);
      logger.warn(
        `Primary provider ${primaryConfig.name} encountered HTTP ${status}. Retrying in ${delay}ms (attempt ${attempt + 1}/3)...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Switch to fallback provider
  logger.info(
    `Failing over to fallback LLM provider: ${fallbackConfig.name} (${fallbackConfig.model})`
  );
  if (onFallback) {
    onFallback(fallbackConfig.name, fallbackConfig.model);
  }

  let fallbackError: any = null;
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const response = await fallbackClient.complete(req);
      if (cacheKey) {
        setCachedResponse(cacheKey, response);
      }
      return response;
    } catch (err: any) {
      fallbackError = err;
      const status = err?.status;
      const isRetryable = status === 429 || (status >= 500 && status <= 599);

      if (!isRetryable || attempt === 2) {
        break;
      }

      const delay = getJitteredDelay(DELAYS_MS[attempt] || 2000);
      logger.warn(
        `Fallback provider ${fallbackConfig.name} encountered HTTP ${status}. Retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new LLMUnavailableError(
    `All configured LLM providers failed. Primary: ${primaryError?.message}, Fallback: ${fallbackError?.message}`,
    primaryError,
    fallbackError
  );
}
