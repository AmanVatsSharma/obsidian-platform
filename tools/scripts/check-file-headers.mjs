#!/usr/bin/env node
/**
 * File:        tools/scripts/check-file-headers.mjs
 * Module:      Tooling · Quality Gates
 * Purpose:     Lint that every code file under apps/backend/src and libs/* begins
 *              with a project-standard file header (long form OR grandfathered
 *              short form). Wired into `npm run quality:verify` and run in CI.
 *
 * Exports:
 *   - (CLI)  node tools/scripts/check-file-headers.mjs [paths...]
 *            With no args: scans default roots.
 *            With paths:    scans only those files (used by agents/editor).
 *            Exit 0 = clean, exit 1 = violations, exit 2 = config error.
 *
 * Depends on:
 *   - node:fs, node:path — stdlib only, no dependencies
 *
 * Side-effects:
 *   - Reads files under SCAN_ROOTS or argv paths
 *   - Writes a violations report to stdout
 *   - Process exit code reflects pass/fail
 *
 * Key invariants:
 *   - Accepts BOTH long form (File:/Module:/Purpose:/Last-updated) and
 *     short form (@file/@module/@description/@author/@created).
 *   - Existing files with the short form are NOT flagged — grandfathered.
 *   - New files SHOULD use long form; this script does not enforce that
 *     directly (no diff against git), but the file-header-enforcer agent does.
 *   - Extension list mirrors the global rule's `applies to` list.
 *
 * Read order:
 *   1. CONFIG block        — what it scans, what counts as a header
 *   2. checkFile()         — single-file logic
 *   3. main()              — CLI entry
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── CONFIG ────────────────────────────────────────────────────────────────

const CWD = process.cwd();

const SCAN_ROOTS = [
  'apps/backend/src',
  'libs/obsidian-ui/src',
];

const SCAN_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.java',
  '.cpp', '.c', '.cs', '.rb', '.swift', '.kt', '.sh', '.mjs',
]);

const IGNORE_DIRS = new Set([
  'node_modules', 'dist', 'build', '.next', 'coverage', '.turbo',
  'generated', '__generated__',
]);

const IGNORE_BASENAMES = new Set([
  'index.ts',          // barrel — re-exports only
  'project.json',
  'tsconfig.json',
  'jest.config.ts',
  'webpack.config.ts',
]);

const IGNORE_SUFFIXES = ['.spec.ts', '.test.ts', '.d.ts'];

// Long-form required tags — header MUST contain ALL of these tokens:
const LONG_REQUIRED = ['File:', 'Module:', 'Purpose:', 'Last-updated:'];

// Short-form: ALL of SHORT_REQUIRED plus AT LEAST ONE of SHORT_DATE_TAGS.
// (`.cursor/rules/header.template.mdc` allows either @created or @last-updated.)
const SHORT_REQUIRED = ['@file', '@module', '@description', '@author'];
const SHORT_DATE_TAGS = ['@created', '@last-updated'];

// How many lines from the top to consider as "the header window":
const HEADER_WINDOW_LINES = 60;

// ─── HELPERS ───────────────────────────────────────────────────────────────

function shouldSkip(filePath) {
  const base = path.basename(filePath);
  if (IGNORE_BASENAMES.has(base)) return true;
  for (const suf of IGNORE_SUFFIXES) {
    if (base.endsWith(suf)) return true;
  }
  return false;
}

function collectFiles(root) {
  const abs = path.join(CWD, root);
  if (!fs.existsSync(abs)) return [];
  /** @type {string[]} */
  const out = [];
  const stack = [abs];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name);
      if (!SCAN_EXTENSIONS.has(ext)) continue;
      if (shouldSkip(full)) continue;
      out.push(full);
    }
  }
  return out;
}

/**
 * Returns one of: 'long' | 'short' | 'missing'.
 * Long wins if both sets are present (some files mix during transition).
 */
function classifyHeader(content) {
  const head = content.split('\n').slice(0, HEADER_WINDOW_LINES).join('\n');
  const hasLong = LONG_REQUIRED.every((tag) => head.includes(tag));
  const hasShort =
    SHORT_REQUIRED.every((tag) => head.includes(tag)) &&
    SHORT_DATE_TAGS.some((tag) => head.includes(tag));
  if (hasLong) return 'long';
  if (hasShort) return 'short';
  return 'missing';
}

function checkFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return { ok: false, kind: 'unreadable', detail: String(err) };
  }
  if (content.trim().length === 0) {
    return { ok: true, kind: 'empty' };
  }
  const klass = classifyHeader(content);
  if (klass === 'missing') {
    return { ok: false, kind: 'missing-header' };
  }
  return { ok: true, kind: klass };
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);
  /** @type {string[]} */
  let files = [];

  if (argv.length > 0) {
    // Path-mode: caller supplied specific files (used by agents / pre-commit hooks).
    for (const a of argv) {
      const abs = path.isAbsolute(a) ? a : path.join(CWD, a);
      if (!fs.existsSync(abs)) {
        console.error(`[check-file-headers] Path not found: ${a}`);
        process.exit(2);
      }
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) {
        files.push(...collectFiles(path.relative(CWD, abs)));
      } else {
        if (SCAN_EXTENSIONS.has(path.extname(abs)) && !shouldSkip(abs)) {
          files.push(abs);
        }
      }
    }
  } else {
    // Default-mode: scan SCAN_ROOTS.
    for (const r of SCAN_ROOTS) files.push(...collectFiles(r));
  }

  const violations = [];
  let scanned = 0;
  let longCount = 0;
  let shortCount = 0;

  for (const f of files) {
    const result = checkFile(f);
    scanned++;
    if (!result.ok) {
      violations.push({ file: path.relative(CWD, f), reason: result.kind, detail: result.detail });
      continue;
    }
    if (result.kind === 'long') longCount++;
    else if (result.kind === 'short') shortCount++;
  }

  if (violations.length === 0) {
    console.log(
      `[check-file-headers] OK · scanned ${scanned} · long=${longCount} short=${shortCount}`,
    );
    process.exit(0);
  }

  console.error(`[check-file-headers] FAIL · ${violations.length} of ${scanned} files missing headers:`);
  for (const v of violations) {
    console.error(`  - ${v.file}  (${v.reason}${v.detail ? ': ' + v.detail : ''})`);
  }
  console.error('');
  console.error('Fix with: dispatch the file-header-enforcer agent OR add the header manually per CLAUDE.md.');
  process.exit(1);
}

main();
