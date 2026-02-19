# Module: notifications

**Short:** Notification preference and dispatch module for transactional platform alerts.

**Purpose:** Persist notification events, enforce user channel preferences, and provide integration hooks for email/SMS/push delivery.

**Files:**
- `notifications.module.ts` - Nest module
- `controllers/notifications.controller.ts` - list notification history
- `controllers/notification-preferences.controller.ts` - update/list preferences
- `services/notification.service.ts` - dispatch orchestration and persistence
- `services/notification-template.service.ts` - template rendering helper
- `entities/` - notification and preference entities
- `dtos/` - payload validation DTOs
- `index.ts` - module re-exports
- `MODULE_DOC.md` - this file

**Flow diagram:** `flowcharts/notifications-flow.svg`

**Dependencies:**
- Internal: shared logger, request context, RBAC guards, observability module
- External: PostgreSQL via TypeORM (channel delivery providers to be wired)

**APIs:**
- `GET /notifications` - list current user notifications
- `PATCH /notifications/preferences` - upsert channel preference per category

**Env vars:**
- none specific currently; provider keys to be added when SES/SNS/FCM are enabled

**Tests:** verify preference filtering and tenant-safe read/write behavior.

**Change-log:**
- 2025-01-09 IST: Initial module with entities, APIs, and template-based dispatch stubs.
- 2026-02-17 IST: Added module doc, public re-exports, and Nx domain project boundary (`backend-notifications`).
