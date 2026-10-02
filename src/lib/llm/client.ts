import { fetch } from 'undici';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMProviderConfig,
} from './provider';
import { logger } from '../util/logger';

export class LLMClient {
  private readonly config: LLMProviderConfig;
  private readonly timeoutMs: number;

  constructor(config: LLMProviderConfig, timeoutMs = 60000) {
    this.config = config;
    this.timeoutMs = timeoutMs;
  }

  async complete(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const cleanBase = this.config.baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
    };

    // Add OpenRouter specific headers if targeting openrouter
    if (this.config.baseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://mandate.dev';
      headers['X-Title'] = 'Mandate Spending Agent';
    }

    const body: Record<string, any> = {
      model: this.config.model,
      messages: req.messages,
      temperature: req.temperature ?? 0,
    };

    if (req.tools && req.tools.length > 0) {
      body.tools = req.tools;
      body.tool_choice = 'auto';
    }

    if (req.response_format) {
      body.response_format = req.response_format;
    }

    if (req.max_tokens) {
      body.max_tokens = req.max_tokens;
    }

    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const duration = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      if (
        res.status === 400 &&
        req.response_format &&
        (errText.includes('structured-outputs') || errText.includes('response_format'))
      ) {
        logger.info(
          `Provider ${this.config.name} does not support structured-outputs. Retrying without response_format...`
        );
        delete body.response_format;
        const retryRes = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (retryRes.ok) {
          const retryData = (await retryRes.json()) as any;
          const retryChoice = retryData.choices?.[0];
          return {
            message: {
              role: 'assistant',
              content: retryChoice?.message?.content ?? null,
              tool_calls: retryChoice?.message?.tool_calls,
            },
            usage: {
              prompt_tokens: retryData.usage?.prompt_tokens ?? 0,
              completion_tokens: retryData.usage?.completion_tokens ?? 0,
            },
            provider: this.config.name,
            model: this.config.model,
            cached: false,
          };
        }
      }

      logger.error(
        `LLM Provider ${this.config.name} (${this.config.model}) failed with HTTP ${res.status} in ${duration}ms`
      );
      const error = new Error(`LLM API error (${res.status}): ${errText}`);
      (error as any).status = res.status;
      (error as any).body = errText;
      throw error;
    }

    const data = (await res.json()) as any;
    const choice = data.choices?.[0];

    logger.info(
      `LLM Provider ${this.config.name} (${this.config.model}) responded in ${duration}ms (tokens: ${data.usage?.total_tokens || 0})`
    );

    return {
      message: {
        role: 'assistant',
        content: choice?.message?.content ?? null,
        tool_calls: choice?.message?.tool_calls,
      },
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
      },
      provider: this.config.name,
      model: this.config.model,
      cached: false,
    };
  }
}
