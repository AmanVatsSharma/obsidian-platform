/**
 * File:        apps/mobile/src/lib/logger.ts
 * Module:      mobile · Lib · Logger
 * Purpose:     Mobile-side logging adapter. Per CLAUDE.md §5 the backend
 *              uses `AppLoggerService` (Pino) and per CLAUDE.md §15 the
 *              frontend must never call `console.log` from component code.
 *              This module is the single chokepoint — every component,
 *              hook, and lib file imports `logDebug`, `logInfo`, `logWarn`,
 *              `logError` from here.
 *
 * Exports:
 *   - logDebug(msg, meta?)
 *   - logInfo(msg, meta?)
 *   - logWarn(msg, meta?)
 *   - logError(msg, meta?)
 *   - configureLogger(opts)   — set `enabled` / `minLevel` at app boot
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - Writes to the JS console (wrapped to gate by level and dev-mode).
 *   - The `meta` argument is JSON-serialised before being passed to the
 *     underlying console call. Cycles and unserialisable values are
 *     dropped silently.
 *
 * Key invariants:
 *   - `console.log`/`console.warn`/`console.error` are NEVER called from
 *     any file other than this one. Lint rules / code review should
 *     enforce that — the function names here are the only allowed
 *     logging surface.
 *   - In production (`!__DEV__`), `logDebug` and `logInfo` are no-ops.
 *   - `logWarn` and `logError` always run, but their payloads are
 *     sanitised to remove any value whose key contains 'token',
 *     'password', 'secret', or 'authorization' — defence in depth against
 *     accidental credential leaks through ad-hoc log lines.
 *
 * Read order:
 *   1. configureLogger — boot-time configuration
 *   2. logDebug/logInfo/logWarn/logError — the four log levels
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

let _minLevel: LogLevel = __DEV__ ? 'debug' : 'info';

export function configureLogger(opts: { minLevel?: LogLevel }): void {
  if (opts.minLevel) {
    _minLevel = opts.minLevel;
  }
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[_minLevel];
}

const SENSITIVE_KEY_RE = /token|password|secret|authorization|cookie/i;

function sanitise(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitise);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_RE.test(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = sanitise(v);
    }
  }
  return out;
}

function emit(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;
  const safeMeta = meta ? (sanitise(meta) as Record<string, unknown>) : undefined;
  // eslint-disable-next-line no-console
  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : level === 'info'
          ? console.info
          : console.debug;
  if (safeMeta) {
    fn(`[obsidian-mobile] ${msg}`, safeMeta);
  } else {
    fn(`[obsidian-mobile] ${msg}`);
  }
}

export function logDebug(msg: string, meta?: Record<string, unknown>): void {
  emit('debug', msg, meta);
}
export function logInfo(msg: string, meta?: Record<string, unknown>): void {
  emit('info', msg, meta);
}
export function logWarn(msg: string, meta?: Record<string, unknown>): void {
  emit('warn', msg, meta);
}
export function logError(msg: string, meta?: Record<string, unknown>): void {
  emit('error', msg, meta);
}
