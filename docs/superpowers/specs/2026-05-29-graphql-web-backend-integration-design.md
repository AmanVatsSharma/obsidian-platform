# GraphQL Integration — Web ↔ Backend (Enterprise Pattern)

**Date:** 2026-05-29  
**Status:** Approved for implementation  
**Goal:** Connect web trading terminal to backend via typed GraphQL with enterprise-grade patterns

---

## 1. Architecture Decision

**File-Based Schema** over introspection. Reasons:
- CI/CD reproducibility (no server needed in build pipeline)
- Schema changes visible in version control
- Breaking change detection via schema diffs
- Federation-ready (Apollo Supergraph pattern)

---

## 2. Current State (Post-Mortem of Previous Agent Work)

### What's Working:
| Component | Status |
|-----------|--------|
| Apollo Client link chain (auth → error → HTTP) | ✅ |
| Provider hierarchy (RootLayout → Auth → Apollo → Brand) | ✅ |
| Trading terminal UI (full order types) | ✅ |
| gql-service.ts (15+ hooks) | ✅ |
| Backend resolvers (40+ queries/mutations) | ✅ |
| Auth provider with OTP flow | ✅ |

### What's Broken:
| Issue | Impact | Fix |
|-------|--------|-----|
| `codegen.ts` references `/home/amansharma/...` | Type generation fails | Update to relative path |
| Schema not committed (autoSchemaFile path mismatch) | Codegen can't find schema | Fix path + commit schema |
| Frontend uses Relay pagination, backend uses offset | Data mismatch | Align frontend to backend |
| Some gql operations have wrong field selections | Missing data | Update to match schema |
| `generated/` folder doesn't exist | No types | Run codegen |

---

## 3. Implementation Plan

### Phase 1: Fix Schema Generation (Backend)

**File:** `apps/backend/src/app.module.ts`
```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  autoSchemaFile: join(process.cwd(), 'src/generated/schema.gql'),
  // Output to: apps/backend/src/generated/schema.gql
})
```

**Action:** Ensure schema generates to `apps/backend/src/generated/schema.gql`

### Phase 2: Fix Codegen (Frontend)

**File:** `apps/web/codegen.ts`

```typescript
const config: CodegenConfig = {
  schema: '../../apps/backend/src/generated/schema.gql',  // relative path
  documents: [
    'apps/web/gql/operations/**/*.gql',
    'apps/web/features/**/*.gql',
  ],
  generates: {
    'apps/web/gql/generated/graphql.ts': {
      plugins: ['typescript'],
      config: { scalars: { DateTime: 'string', UUID: 'string', JSON: 'unknown' } },
    },
    'apps/web/gql/generated/hooks.ts': {
      preset: 'near-operation-file',
      plugins: ['typescript-operations', 'typescript-react-apollo'],
    },
  },
};
```

### Phase 3: Align Frontend Operations

**Pagination:** Backend uses offset-based → `limit/offset/total` pattern.

Update `apps/web/gql/operations/oms/getOrders.gql`:
```graphql
query GetOrders($accountId: ID, $status: String, $limit: Int, $offset: Int) {
  orders(accountId: $accountId, status: $status, limit: $limit, offset: $offset) {
    data { id clientOrderId side type status quantity ... }
    total
    limit
    offset
  }
}
```

### Phase 4: Wire Types to Components

**Import pattern:**
```typescript
import { useGetOrdersQuery } from '@/gql/generated/hooks';
// or
import type { OrderEntity, PlaceOrderInput } from '@/gql/generated/graphql';
```

### Phase 5: CI/CD Integration

```yaml
# .github/workflows/graphql-codegen.yml
- name: Generate GraphQL types
  run: npm run codegen

- name: Check for schema changes
  run: git diff --exit-code apps/web/gql/generated/
```

---

## 4. File Changes Required

### Backend (1 file):
- `apps/backend/src/app.module.ts` — fix autoSchemaFile path

### Frontend (5 files):
- `apps/web/codegen.ts` — fix schema path + config
- `apps/web/gql/operations/oms/getOrders.gql` — align pagination
- `apps/web/gql/operations/oms/placeOrder.gql` — align fields
- `apps/web/gql/operations/auth/getMe.gql` — align fields
- `apps/web/gql/operations/market/getWatchlists.gql` — align fields

### New Files:
- `apps/web/gql/generated/graphql.ts` — (generated)
- `apps/web/gql/generated/hooks.ts` — (generated)
- `apps/backend/src/generated/schema.gql` — (generated, committed)

---

## 5. Success Criteria

- [ ] `npm run codegen` produces `graphql.ts` + `hooks.ts`
- [ ] Trading terminal loads real instrument data
- [ ] Order placement uses GraphQL mutation (not REST)
- [ ] Pagination works end-to-end
- [ ] Types are used in components (no `any`)
- [ ] Schema changes trigger CI failure (breaking change detection)

---

## 6. Testing Strategy

1. Start backend: `npm run dev:backend`
2. Start web: `npm run dev:web`
3. Login as demo user
4. Verify:
   - Watchlist loads instruments
   - Account balance shows equity/margin
   - Place market order → fills → reflects in positions
   - Cancel order works
   - Pagination on orders list works

---

*Author: Claude Code*  
*Approved by: User*  
*Implementation: this session*