import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ChatCompletionRequest, ChatCompletionResponse } from './provider';

const CACHE_DIR = path.resolve(process.cwd(), '.cache/llm');

export function computeCacheKey(
  provider: string,
  model: string,
  req: ChatCompletionRequest
): string {
  const norm = {
    provider,
    model,
    temp: req.temperature ?? 0,
    messages: req.messages,
    tools: req.tools || null,
  };
  return crypto.createHash('sha256').update(JSON.stringify(norm)).digest('hex');
}

export function getCachedResponse(
  cacheKey: string
): ChatCompletionResponse | null {
  if (process.env.LLM_CACHE_ENABLED === 'false') {
    return null;
  }
  const filePath = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as ChatCompletionResponse;
    return {
      ...parsed,
      cached: true,
    };
  } catch {
    return null;
  }
}

export function setCachedResponse(
  cacheKey: string,
  response: ChatCompletionResponse
): void {
  if (process.env.LLM_CACHE_ENABLED === 'false') {
    return;
  }
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  const filePath = path.join(CACHE_DIR, `${cacheKey}.json`);
  fs.writeFileSync(filePath, JSON.stringify(response, null, 2), 'utf-8');
}
