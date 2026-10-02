import { redactSecrets } from './redact';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = 'info';

  setLevel(level: LogLevel) {
    this.level = level;
  }

  info(msg: string, ...args: any[]) {
    console.log(`[INFO] ${redactSecrets(msg)}`, ...args);
  }

  warn(msg: string, ...args: any[]) {
    console.warn(`[WARN] ${redactSecrets(msg)}`, ...args);
  }

  error(msg: string, ...args: any[]) {
    console.error(`[ERROR] ${redactSecrets(msg)}`, ...args);
  }

  debug(msg: string, ...args: any[]) {
    if (this.level === 'debug') {
      console.debug(`[DEBUG] ${redactSecrets(msg)}`, ...args);
    }
  }
}

export const logger = new Logger();
