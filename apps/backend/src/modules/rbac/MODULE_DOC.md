# Module: rbac

Short: Role and permission management for access control.

Purpose: Provide RBAC (roles and permissions) to protect routes and operations.

Files:
- rbac.module.ts — Nest module
- guards/ — roles and tenant guards
- decorators/ — metadata decorators for roles/tenant
- MODULE_DOC.md — this file

Flow diagram: `flowcharts/rbac-flow.svg`

Dependencies: users module (for role assignment later)

APIs:
- REST
  - POST /admin/rbac/roles — create role
  - GET /admin/rbac/roles — list roles
  - GET /admin/rbac/roles/:name — get role by name
  - PATCH /admin/rbac/roles/:name — update role name/description
  - DELETE /admin/rbac/roles/:name — delete role and its relations
  - POST /admin/rbac/roles/:name/users — assign role to user { userId }
  - POST /admin/rbac/roles/:name/permissions — grant permission to role { permissionName }
  - POST /admin/rbac/permissions — create permission
  - GET /admin/rbac/permissions — list permissions
  - GET /admin/rbac/permissions/:name — get permission by name
  - PATCH /admin/rbac/permissions/:name — update permission
  - DELETE /admin/rbac/permissions/:name — delete permission

Env vars: None specific

Tests: Skipped per instruction

Change-log:
- 2025-09-18 IST: Initial scaffold
- 2025-09-19 IST: Added entities (roles, permissions, user_roles, role_permissions), guards, decorators, and seeder gated by SEED_RBAC_TENANT_ID
- 2025-09-19 IST: Added admin controllers for roles/permissions, CRUD DTOs, wired into module
- 2025-09-19 IST: Secured admin endpoints with JwtAuthGuard
