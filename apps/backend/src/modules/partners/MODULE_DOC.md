---
title: Partners Module
created: 2026-02-19
maintainer: BharatERP
---

## Purpose
Scaffolds partner management: onboarding, integrations, and status tracking for B2B partner workflows.

## APIs
- POST /partners
- GET /partners?tenantId=...
- GET /partners/:id/status
- POST /partners/:id/payout-approvals

## Changelog
- 2026-02-19 IST: Added partners module scaffold with partner entity, DTO, APIs, tests, and docs.
- 2026-02-19 IST: Added payout-approval audit hook endpoint and secured controller guard baseline.
