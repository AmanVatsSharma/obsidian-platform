# Custom ESLint Rules — Obsidian Platform Backend

This directory contains 3 custom ESLint rules that enforce the 7 load-bearing patterns
defined in CLAUDE.md. These patterns exist as convention but were not previously enforced
in code.

## Rules

### 1. `no-raw-throw`

**File:** `no-raw-throw.js`

**What it catches:**
```ts
// FLAGGED — raw Error
throw new Error('something went wrong');

// FLAGGED — raw HttpException
throw new HttpException('message', 400);

// FLAGGED — NestJS exception subclasses
throw new BadRequestException('invalid input');
throw new NotFoundException('user not found');
throw new ForbiddenException('access denied');
```

**Why it matters:** Pattern #1 from the 7 load-bearing patterns. `AppError(code, message)`
is the only contract the global exception filter understands. Raw `Error` and
`HttpException` produce opaque HTTP responses and bypass the `code → HTTP status` mapping.

**Allowed:**
```ts
// CORRECT
throw new AppError('ORDER_NOT_FOUND', 'Order 12345 does not exist');
throw new DomainError('INVALID_LEVERAGE', 'Leverage must be positive');
```

**Exempt:** `*.spec.ts`, `*.test.ts`, `__tests__/`, `/tests/`

---

### 2. `no-direct-event-emitter`

**File:** `no-direct-event-emitter.js`

**What it catches:**
```ts
// FLAGGED — direct emit
this.eventEmitter.emit('order.placed', payload);
eventEmitter.emit('user.updated', data);
```

**Why it matters:** Pattern #3 from the 7 load-bearing patterns. Direct `emit()`
loses transactional guarantees. If the DB transaction fails after the event was emitted,
the event is orphaned. There is no retry mechanism and no record in the outbox table.
All cross-module events must use `OutboxService.enqueue()` within the same DB transaction
as the domain write.

**Allowed:**
```ts
// CORRECT — transactional outbox
await this.outboxService.enqueue('order.placed', payload);
// Same transaction — both the domain write AND the outbox insert commit together
```

See `apps/backend/src/shared/outbox/` for `OutboxService` and `OutboxWorkerSkeleton`.

**Exempt:** `*.spec.ts`, `*.test.ts`, `__tests__/`, `/tests/`

---

### 3. `no-console-log`

**File:** `no-console-log.js`

**What it catches:**
```ts
// FLAGGED
console.log('hello');
console.error(err);
console.warn('deprecated');
console.info('debug');
console.debug('trace');
console.trace();
```

**Why it matters:** Pattern #2 from the 7 load-bearing patterns. `console.log` bypasses
Pino entirely — no `requestId` correlation, no structured fields, no log level filtering,
no shipper integration, no performance tracing.

**Allowed:**
```ts
// CORRECT — structured logging with requestId
this.logger.debug({ requestId, userId, orderId }, 'Order placed');
this.logger.error({ requestId, err }, 'Payment failed');
```

Import `AppLoggerService` from `@obsidian/backend-shared` or inject it as a service provider.

**Exempt:** `*.spec.ts`, `*.test.ts`, `__tests__/`, `/tests/`

---

## Adding to `eslint.config.mjs`

### Option A — Bulk import from the barrel

In `eslint.config.mjs`, add at the top:

```js
const {
  noRawThrow,
  noDirectEventEmitter,
  noConsoleLog,
} = require('./tools/scripts/eslint-rules');
```

Then add a new override block for the backend:

```js
{
  files: ['apps/backend/src/**/*.ts'],
  excludedFiles: [
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/__tests__/**',
  ],
  rules: {
    'no-raw-throw': 'error',
    'no-direct-event-emitter': 'error',
    'no-console-log': 'error',
  },
},
```

### Option B — Per-file import (if preferred)

```js
const noRawThrow = require('./tools/scripts/eslint-rules/no-raw-throw');
const noDirectEventEmitter = require('./tools/scripts/eslint-rules/no-direct-event-emitter');
const noConsoleLog = require('./tools/scripts/eslint-rules/no-console-log');
```

### Verification

After adding to `eslint.config.mjs`, run:

```bash
npm run lint -- --no-cache
```

You should see violations flagged in existing source files (excluding test files).
Fix them by replacing raw throws / console.log calls with the correct patterns.

---

## Adding a new rule

1. Create `tools/scripts/eslint-rules/<rule-name>.js`
2. Export `{ meta: {...}, create(context) {...} }`
3. Add the JSDoc header with `HOW TO ADD TO eslint.config.mjs` section
4. Export the rule from `index.js`
5. Add a section to this README

Each rule file is self-documenting — the header comment in every `.js` file contains
the exact config snippet needed to activate it.

---

## Parser compatibility

All rules use `@typescript-eslint/parser` AST nodes and are compatible with the
TypeScript files in `apps/backend/src/`. The parser handles:
- `NewExpression` for `throw new Error(...)`
- `CallExpression` for `console.log(...)` and `eventEmitter.emit(...)`
- TypeScript-specific syntax (generics, decorators, etc.)

No additional parser plugins are required beyond what the project already uses.