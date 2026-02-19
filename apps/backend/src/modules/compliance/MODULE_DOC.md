---
title: Compliance Module
created: 2026-02-17
maintainer: BharatERP
---

## Purpose
Scaffolds jurisdiction-aware compliance controls for KYC, AML, sanctions, suitability,
and audit retention requirements.

## Entities
- CompliancePolicyEntity

## APIs
- POST /compliance/policies — create/update tenant jurisdiction policy
- GET /compliance/policies?tenantId=... — list tenant policies

## Dependencies
- Shared logger
- TypeORM policy repository

## Changelog
- 2026-02-17 IST: Added compliance policy scaffolding with DTO validation, controller/service, tests, exports, and module documentation.
