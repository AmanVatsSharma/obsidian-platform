---
title: Tenancy Module
created: 2026-02-17
maintainer: BharatERP
---

## Purpose
Provides tenant lifecycle and legal-entity scaffolding for global broker SaaS operations.

## Entities
- TenantEntity
- LegalEntityEntity

## APIs
- POST /tenancy/tenants — create tenant
- GET /tenancy/tenants — list tenants
- POST /tenancy/legal-entities — create legal entity
- GET /tenancy/legal-entities?tenantId=... — list legal entities

## Dependencies
- SharedModule logger
- TypeORM repositories

## Flow
1. Platform owner creates tenant and jurisdiction profile.
2. Broker legal entities are attached to tenant.
3. Downstream hierarchy/compliance modules consume tenant identifiers.

## Env
- TENANCY_ENABLED=true

## Tests
- Unit test scaffold in `tests/tenancy.service.spec.ts`.

## Changelog
- 2026-02-17 IST: Added tenancy scaffold with entities, DTO validation, controller, service, exports, and module documentation.
