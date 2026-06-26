import { ConsoleLogger } from '@nestjs/common';
import { createWriteStream, mkdirSync, type WriteStream } from 'node:fs';
import { join } from 'node:path';

const LOG_DIR = join(process.cwd(), 'logs');

/**
 * Logger that mirrors Nest's console output to rotating-friendly files so the
 * full run (including BullMQ processors) can be tailed:
 *   tail -f apps/api/logs/api.log      # everything
 *   tail -f apps/api/logs/error.log    # errors + stack traces only
 *
 * Decorator pattern: wraps ConsoleLogger, adding a file sink without changing
 * the console behavior callers already rely on.
 */
export class FileLogger extends ConsoleLogger {
  private static all: WriteStream;
  private static errors: WriteStream;

  private static init() {
    if (FileLogger.all) return;
    mkdirSync(LOG_DIR, { recursive: true });
    FileLogger.all = createWriteStream(join(LOG_DIR, 'api.log'), { flags: 'a' });
    FileLogger.errors = createWriteStream(join(LOG_DIR, 'error.log'), {
      flags: 'a',
    });
  }

  private static stringify(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.stack ?? value.message;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private write(level: string, message: unknown, rest: unknown[]) {
    FileLogger.init();
    const extra = rest.map((r) => FileLogger.stringify(r)).join(' ');
    const line = `${new Date().toISOString()} [${level}] ${FileLogger.stringify(message)}${extra ? ' ' + extra : ''}\n`;
    FileLogger.all.write(line);
    if (level === 'ERROR' || level === 'FATAL') FileLogger.errors.write(line);
  }

  log(message: unknown, ...rest: unknown[]) {
    this.write('LOG', message, rest);
    super.log(message as never, ...(rest as never[]));
  }

  error(message: unknown, ...rest: unknown[]) {
    this.write('ERROR', message, rest);
    super.error(message as never, ...(rest as never[]));
  }

  warn(message: unknown, ...rest: unknown[]) {
    this.write('WARN', message, rest);
    super.warn(message as never, ...(rest as never[]));
  }

  debug(message: unknown, ...rest: unknown[]) {
    this.write('DEBUG', message, rest);
    super.debug(message as never, ...(rest as never[]));
  }

  verbose(message: unknown, ...rest: unknown[]) {
    this.write('VERBOSE', message, rest);
    super.verbose(message as never, ...(rest as never[]));
  }

  fatal(message: unknown, ...rest: unknown[]) {
    this.write('FATAL', message, rest);
    super.fatal(message as never, ...(rest as never[]));
  }
}
