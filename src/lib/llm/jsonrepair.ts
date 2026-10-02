import { z } from 'zod';

export class PolicyCompileError extends Error {
  public readonly rawOutput: string;
  public readonly validationErrors: string[];

  constructor(message: string, rawOutput: string, validationErrors: string[] = []) {
    super(message);
    this.name = 'PolicyCompileError';
    this.rawOutput = rawOutput;
    this.validationErrors = validationErrors;
  }
}

/**
 * Defensive JSON repair:
 * - strips markdown code fences (```json ... ```)
 * - removes leading text before the first '{' or '['
 * - removes trailing text after the last '}' or ']'
 * - removes trailing commas before closing braces/brackets
 * - replaces unescaped single quotes with double quotes
 * - unescapes doubled braces
 */
export function repairJsonString(input: string): string {
  let cleaned = input.trim();

  // Strip code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // Extract from first brace to last brace
  const firstBrace = cleaned.search(/[{\[]/);
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Remove trailing commas before closing brackets/braces
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Fix single quotes used as JSON keys or string delimiters:
  // e.g. 'key': 'value' -> "key": "value"
  cleaned = cleaned.replace(/(?<=[{,]\s*)'([^']+)'\s*:/g, '"$1":');
  cleaned = cleaned.replace(/:\s*'([^']*)'/g, ': "$1"');

  // Unescape doubled braces
  cleaned = cleaned.replace(/\{\{/g, '{').replace(/\}\}/g, '}');

  return cleaned;
}

/**
 * Parses and validates JSON using a Zod schema with automatic repair.
 */
export function parseAndValidateJson<T>(
  raw: string,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; raw: string } {
  try {
    const repaired = repairJsonString(raw);
    const parsed = JSON.parse(repaired);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const issues = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return { success: false, error: issues, raw };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `JSON syntax parse error: ${err.message}`,
      raw,
    };
  }
}
