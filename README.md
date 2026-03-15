# NestTrade

Enterprise-grade Nx monorepo for the NestTrade trading platform.

## Documentation

- **[docs/](docs/)** — High-level documentation and links to app-specific docs.
- **[apps/backend/docs/](apps/backend/docs/)** — Backend API contracts, deployment, architecture, and runbooks.
- **Module docs** — Each backend module has a `MODULE_DOC.md` in its folder (e.g. `apps/backend/src/modules/users/MODULE_DOC.md`).

To generate API docs from TypeScript (Typedoc), run:

```bash
npm run docs:api
```

Output is written to `apps/backend/docs/api/`.

## Getting started

### Prerequisites

- Node.js (see `package.json` engines or project requirements)
- npm or pnpm

### Install

```bash
npm install
```

### Run backend

```bash
npm run dev:backend
# or: nx run backend:serve
```

### Run web app

```bash
npm run dev:web
# or: nx run web:dev
```

### Other apps

- `npm run dev:dealer` — Dealer workstation
- `npm run dev:support-ops` — Support ops
- `npm run dev:ib-portal` — IB portal
- `npm run dev:developer-portal` — Developer portal
- `npm run dev:public-site` — Public site

### Quality checks

- `npm run check:cycles` — Dependency cycle check (madge)
- `npm run check:duplicates` — Duplicate file check
- `npm run quality:verify` — Cycles, duplicates, contract tests, affected lint/test/build
- `npm run quality:wave2` — Lint wave2 surfaces and mobile/desktop

### Build and test

- `npm run build` — Build all projects
- `npm run lint` — Lint all
- `npm run test` — Test all
- `npm run e2e` — E2E for web app

## Repository structure

- **apps/** — Applications (backend, web, broker-admin, dealer-workstation, etc.)
- **libs/** — Shared libraries (ui-kit, web-auth, web-api-client, etc.)
- **docs/** — Root documentation index and high-level docs
- **deploy/** — Helm charts and deployment config
- **infra/** — AWS Terraform (VPC, EKS, RDS, Redis, Kafka)
- **tools/** — Scripts (e.g. check-duplicate-files)

See [docs/README.md](docs/README.md) for more detail.
