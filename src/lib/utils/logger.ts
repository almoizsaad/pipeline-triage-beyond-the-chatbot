type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: string;
  stack?: string;
}

export class Logger {
  private static _isProduction: boolean | null = null;

  private static get isProduction(): boolean {
    if (this._isProduction !== null) return this._isProduction;
    return typeof import.meta.env !== 'undefined' ? import.meta.env.PROD : process.env.NODE_ENV === 'production';
  }

  public static setProduction(value: boolean): void {
    this._isProduction = value;
  }

  private static format(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error?.message,
      stack: level === 'error' ? error?.stack : undefined
    };
  }

  private static log(entry: LogEntry): void {
    if (this.isProduction) {
      // In production, we output structured JSON
      console.log(JSON.stringify(entry));
    } else {
      // In development, we use standard console methods for readability
      const method = entry.level === 'debug' ? 'debug' : entry.level === 'warn' ? 'warn' : entry.level === 'error' ? 'error' : 'log';
      console[method](`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context || '');
      if (entry.stack) console.error(entry.stack);
    }
  }

  public static info(message: string, context?: Record<string, unknown>): void {
    this.log(this.format('info', message, context));
  }

  public static warn(message: string, context?: Record<string, unknown>): void {
    this.log(this.format('warn', message, context));
  }

  public static error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(this.format('error', message, context, error));
  }

  public static debug(message: string, context?: Record<string, unknown>): void {
    if (!this.isProduction) {
      this.log(this.format('debug', message, context));
    }
  }
}
