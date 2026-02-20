---
title: Risk Policy Module
created: 2026-02-17
maintainer: BharatERP
---

## Purpose
Scaffolds jurisdiction risk rules and assignment APIs for broker-admin and platform-owner controls.

## Entities
- RiskPolicyEntity
- TenantRiskPolicyEntity

## APIs
- POST /risk-policy/policies
- POST /risk-policy/assignments
- GET /risk-policy/policies?tenantId=...

## Dependencies
- Shared logger
- TypeORM repositories

## Changelog
- 2026-02-17 IST: Added risk policy scaffolding with policy/assignment entities, DTOs, APIs, tests, and docs.
