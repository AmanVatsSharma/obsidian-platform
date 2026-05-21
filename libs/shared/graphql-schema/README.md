# @obsidian/graphql-schema

**Owner: Backend team.** All changes go through the backend PR pipeline.

## Schema Update Workflow

1. Backend resolver is added/modified on a feature branch
2. CI / pre-commit runs `npm run graphql:schema`
3. `schema.gql` is updated -- git diff shows exactly what changed
4. PR review includes schema diff as part of the backend review
5. On `main` merge, schema is committed
6. Frontend teams run `npm run codegen` to regenerate typed hooks

## For Frontend Developers

Do NOT edit `schema.gql` manually. It is machine-generated.

To regenerate types:
```bash
cd apps/web && npm run codegen
```

Codegen produces `gql/generated/graphql.ts` (types) and `gql/generated/hooks.ts` (React hooks).