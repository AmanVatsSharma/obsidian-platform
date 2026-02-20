---
title: Support Module
created: 2026-02-19
maintainer: BharatERP
---

## Purpose
Scaffolds support ticket management: create, list, and status tracking for customer support workflows.

## APIs
- POST /support/tickets
- GET /support/tickets?tenantId=...
- GET /support/tickets/:id/status
- POST /support/tickets/:id/impersonation-audit

## Changelog
- 2026-02-19 IST: Added support module scaffold with ticket entity, DTO, APIs, tests, and docs.
- 2026-02-19 IST: Added impersonation-audit hook endpoint and secured controller with JWT/Tenant/RBAC guards.
