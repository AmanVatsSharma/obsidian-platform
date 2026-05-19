# Rules Engine Module

## Short
Tenant-scoped automation rules — define trigger events, condition chains, and action sequences for broker admin workflows.

## Purpose
Allows broker admins to create event-driven automation rules without code. Each rule specifies: an event trigger, zero-or-more AND-chained conditions, and one-or-more actions to execute when conditions match.

## Files
```
rules-engine/
  entities/rule.entity.ts       — RuleEntity (automation_rules table)
  dtos/rule.dto.ts            — CreateRuleDto, UpdateRuleDto, RuleConditionDto, RuleActionDto
  services/rules-engine.service.ts — RulesEngineService (CRUD + toggle)
  controllers/rules-engine.controller.ts — RulesEngineController (REST endpoints)
  rules-engine.module.ts        — NestJS module
  MODULE_DOC.md               — this file
```

## Public Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /admin/rules | JwtAuthGuard + TenantGuard + PermissionsGuard(oms:admin) | List all rules |
| POST | /admin/rules | JwtAuthGuard + TenantGuard + PermissionsGuard(oms:admin) | Create a rule |
| GET | /admin/rules/:id | JwtAuthGuard + TenantGuard + PermissionsGuard(oms:admin) | Get one rule |
| PATCH | /admin/rules/:id | JwtAuthGuard + TenantGuard + PermissionsGuard(oms:admin) | Update a rule |
| DELETE | /admin/rules/:id | JwtAuthGuard + TenantGuard + PermissionsGuard(oms:admin) | Delete a rule |
| POST | /admin/rules/:id/toggle | JwtAuthGuard + TenantGuard + PermissionsGuard(oms:admin) | Toggle active/inactive |

## Data Model
- **automation_rules** table: id, tenant_id, name, description, trigger_event, conditions (JSONB), actions (JSONB), status, priority, execution_count, last_triggered_at, created_at, updated_at

## Change-log
| Date | Change |
|------|--------|
| 2026-05-16 | Initial implementation — entity, service, controller, MODULE_DOC |
