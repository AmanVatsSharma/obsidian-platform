---
title: Developer Platform Module
created: 2026-02-19
maintainer: BharatERP
---

## Purpose
Scaffolds developer platform: API keys, apps, and status tracking for external API consumers.

## APIs
- POST /developer-platform/api-keys
- GET /developer-platform/api-keys?tenantId=...
- GET /developer-platform/api-keys/:id/status
- POST /developer-platform/webhooks

## Changelog
- 2026-02-19 IST: Added developer-platform module scaffold with api-key entity, DTO, APIs, tests, and docs.
- 2026-02-19 IST: Added webhook registration placeholder and secured controller with JWT/Tenant/RBAC guards.
