export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolSpec {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  tools?: ToolSpec[];
  response_format?: { type: 'json_object' };
  temperature?: number;
  max_tokens?: number;
  cache_key?: string;
}

export interface ChatCompletionResponse {
  message: {
    role: 'assistant';
    content: string | null;
    tool_calls?: ToolCall[];
  };
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  provider: string;
  model: string;
  cached: boolean;
}

export interface LLMProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}
