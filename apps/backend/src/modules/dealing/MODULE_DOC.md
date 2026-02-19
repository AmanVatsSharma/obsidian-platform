---
title: Dealing Module
created: 2026-02-19
maintainer: BharatERP
---

## Purpose
Scaffolds dealing desk operations: deal capture, quotes, and status tracking for trading workflows.

## APIs
- POST /dealing/deals
- GET /dealing/deals?tenantId=...
- GET /dealing/deals/:id/status
- POST /dealing/deals/:id/override

## Changelog
- 2026-02-19 IST: Added dealing module scaffold with deal entity, DTO, APIs, tests, and docs.
- 2026-02-19 IST: Added secured manual-override audit hook endpoint for dealer intervention workflow.
