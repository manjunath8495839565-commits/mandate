/**
 * Redaction utility for credentials and secrets.
 * Ensures bearer tokens and sensitive values are never logged.
 */
export function redactSecrets(input: string, secretsToRedact: string[] = []): string {
  let redacted = input.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');
  for (const secret of secretsToRedact) {
    if (secret && secret.length > 0) {
      redacted = redacted.replaceAll(secret, '[REDACTED_SECRET]');
    }
  }
  return redacted;
}
