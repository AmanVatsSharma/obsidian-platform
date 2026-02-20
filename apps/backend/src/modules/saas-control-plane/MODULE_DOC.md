---
title: SaaS Control Plane Module
created: 2026-02-17
maintainer: BharatERP
---

## Purpose
Scaffolds platform-owner governance functions including tenant provisioning, entitlements,
billing placeholders, and support impersonation audit controls.

## APIs
- POST /saas-control-plane/provisioning
- GET /saas-control-plane/provisioning?tenantId=...
- POST /saas-control-plane/entitlements
- GET /saas-control-plane/entitlements?tenantId=...
- POST /saas-control-plane/billing/invoices
- GET /saas-control-plane/billing/invoices?tenantId=...
- POST /saas-control-plane/audit/impersonations
- GET /saas-control-plane/audit/impersonations?tenantId=...

## Changelog
- 2026-02-17 IST: Added SaaS control-plane scaffolding with provisioning, entitlement, billing, and support-audit APIs plus tests/docs.
