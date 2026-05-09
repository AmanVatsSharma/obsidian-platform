#!/usr/bin/env node
/**
 * File:        tools/scripts/scaffold-module-doc.mjs
 * Module:      Tooling · Module Scaffolding
 * Purpose:     Generate a starter MODULE_DOC.md inside a backend module folder
 *              (or any provided path), pre-filled with the canonical sections
 *              from .cursor/rules/MODULE_DOC.mdc plus an empty Change-log row.
 *              Refuses to overwrite an existing MODULE_DOC.md.
 *
 * Exports:
 *   - (CLI)  node tools/scripts/scaffold-module-doc.mjs <module-path>
 *            Example: node tools/scripts/scaffold-module-doc.mjs apps/backend/src/modules/oms
 *
 * Depends on:
 *   - node:fs, node:path — stdlib only
 *
 * Side-effects:
 *   - Writes <module-path>/MODULE_DOC.md (only if absent)
 *   - Prints the path written or a refusal reason
 *
 * Key invariants:
 *   - Will NEVER overwrite an existing MODULE_DOC.md (idempotent + safe to run anywhere).
 *   - Module name is derived from the basename of <module-path>.
 *   - The template mirrors .cursor/rules/MODULE_DOC.mdc — keep them in sync.
 *
 * Read order:
 *   1. TEMPLATE constant — see what it generates
 *   2. main()           — CLI entry
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import fs from 'node:fs';
import path from 'node:path';

const CWD = process.cwd();

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function template(moduleName) {
  return `# Module: ${moduleName}

**Short:** _One-line summary of what this module owns._

**Purpose:** _Business intent — e.g. "Manage orders lifecycle: create, cancel, modify, match, settle."_

## Files

- \`${moduleName}.module.ts\` — Nest module wiring (imports / providers / exports)
- \`controllers/${moduleName}.controller.ts\` — HTTP/WS controller (thin: parse → delegate → DTO)
- \`services/${moduleName}.service.ts\` — Business logic (≤40 lines per fn)
- \`repository/${moduleName}.repository.ts\` — Non-trivial DB access
- \`dto/\` — Request/response DTOs (class-validator)
- \`entities/\` — TypeORM entities
- \`tests/\` — Unit & integration tests
- \`index.ts\` — Public barrel (consumed via \`@obsidian/backend-${moduleName}\`)
- \`MODULE_DOC.md\` — this file

## Flow diagram

\`flowcharts/${moduleName}-flow.svg\` _(create when domain logic is non-trivial)_

## Dependencies

_List internal modules and external services this module talks to._

- Internal: _e.g. \`@obsidian/backend-accounts\`, \`@obsidian/backend-market\`_
- External: _e.g. exchange connectors (via execution-gateway), notification provider_

## APIs

### REST

| Method | Path | Auth | Idempotent | Brief |
|---|---|---|---|---|
| _GET_ | _/api/v1/${moduleName}_ | _JWT_ | _N/A_ | _list_ |
| _POST_ | _/api/v1/${moduleName}_ | _JWT_ | _yes (clientId)_ | _create_ |

### GraphQL

_If applicable (admin schemas etc.). Otherwise: none._

### WebSocket (PranaStream)

_If applicable. Otherwise: none._

## Public route list (auth bypass)

_Any route that is NOT behind an auth guard MUST be listed here with rationale._
_Default: none._

## Idempotency contract

_For each write endpoint that mutates orders / payments / ledger:_
_- Field name used as idempotency key (e.g. \`clientOrderId\`)_
_- Behavior on duplicate: returns prior result, NOT a new record_
_- Storage: unique constraint on \`<table>.<column>\`_

## Domain events (outbox)

_List events emitted via OutboxService:_

- \`${moduleName}.created\` — _payload, when_
- \`${moduleName}.updated\` — _payload, when_

## Env vars

_Document only NON-SECRET variable names. Secrets live in env.example / runbooks._

- \`${moduleName.toUpperCase().replace(/-/g, '_')}_ENABLED\` — _default true_
- _add as needed_

## Tests

- Coverage target: _80% lines / 70% branches_
- Integration tests use Testcontainers + PostgreSQL
- No \`it.skip\` / \`test.skip\` without a ticket reference comment

## Failure modes & runbook hooks

_Top 3 ways this module breaks in prod, and where to look:_

1. _Symptom — Cause — First thing to check (log query / dashboard)_
2. _..._
3. _..._

## Change-log

| Date | Author | Summary |
|---|---|---|
| ${todayIso()} | _BharatERP_ | Initial MODULE_DOC scaffold |

`;
}

function main() {
  const targetArg = process.argv[2];
  if (!targetArg) {
    console.error('Usage: node tools/scripts/scaffold-module-doc.mjs <module-path>');
    console.error('Example: node tools/scripts/scaffold-module-doc.mjs apps/backend/src/modules/oms');
    process.exit(2);
  }

  const targetDir = path.isAbsolute(targetArg) ? targetArg : path.join(CWD, targetArg);
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(`[scaffold-module-doc] Not a directory: ${targetArg}`);
    process.exit(2);
  }

  const docPath = path.join(targetDir, 'MODULE_DOC.md');
  if (fs.existsSync(docPath)) {
    console.error(`[scaffold-module-doc] MODULE_DOC.md already exists at ${path.relative(CWD, docPath)} — refusing to overwrite.`);
    process.exit(1);
  }

  const moduleName = path.basename(targetDir);
  fs.writeFileSync(docPath, template(moduleName), 'utf8');
  console.log(`[scaffold-module-doc] Wrote ${path.relative(CWD, docPath)}`);
}

main();
