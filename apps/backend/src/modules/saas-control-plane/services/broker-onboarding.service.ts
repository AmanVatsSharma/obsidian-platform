/**
 * File:        apps/backend/src/modules/saas-control-plane/services/broker-onboarding.service.ts
 * Module:      saas-control-plane
 * Purpose:     Orchestrates the full broker onboarding flow as a sequenced, idempotent
 *              series of service calls. One API call for the Platform Owner does everything.
 *
 * Exports:
 *   - BrokerOnboardingService.onboardBroker(dto, requestedBy) → OnboardBrokerResult
 *   - BrokerOnboardingService.listBrokers()                   → BrokerEntity[]
 *   - BrokerOnboardingService.getBroker(tenantCode)           → BrokerEntity | null
 *   - BrokerOnboardingService.suspendBroker(tenantCode, reason) → void
 *
 * Depends on:
 *   - TenancyService        — create/find tenant by code
 *   - SaasControlPlaneService — RBAC-seeded provisioning (idempotent)
 *   - BrokerHierarchyService  — create/find broker entity
 *   - UsersService            — create/find broker admin user
 *   - RbacService             — assign 'admin' role to broker admin user
 *   - AwsSnsService           — send welcome SMS to broker admin
 *   - OutboxService           — domain event for downstream consumers
 *   - AppLoggerService
 *
 * Side-effects:
 *   - DB: tenant, tenant_provisioning, roles/permissions, broker, user, user_role rows.
 *   - DB: outbox row for 'broker.onboarded' event.
 *   - AWS SNS: welcome SMS (only on first run — skipped on resume if user already existed).
 *
 * Key invariants:
 *   - SEQUENCED + IDEMPOTENT (not atomic). Each step is safe to re-run:
 *       tenant: collision → resume; suspended → hard-fail.
 *       provisioning: already COMPLETED → noop.
 *       broker entity: collision on (tenantId, brokerCode) → resume.
 *       user: already exists → resume (no duplicate SMS).
 *       role assignment: idempotent guard in RbacService.
 *   - SMS is sent only when adminUser is newly created to prevent duplicate messages on retry.
 *   - BrokerHierarchyService.createBroker receives tenant.id (UUID); UsersService.create
 *     receives tenant.code (slug) — this dual-semantics split is intentional (see plan §6 risk 3).
 *
 * Read order:
 *   1. onboardBroker() — main orchestration flow
 *   2. suspendBroker() — simpler; delegates to SaasControlPlaneService
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../shared/logger';
import { AppError } from '../../../common/errors/app-error';
import { AwsSnsService } from '../../../shared/aws/sns.service';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { TenancyService } from '../../tenancy/services/tenancy.service';
import { BrokerHierarchyService } from '../../broker-hierarchy/services/broker-hierarchy.service';
import { UsersService } from '../../users/users.service';
import { RbacService } from '../../rbac/rbac.service';
import { SaasControlPlaneService } from './saas-control-plane.service';
import { ROLE } from '../../rbac/constants/role.constants';
import { BrokerEntity } from '../../broker-hierarchy/entities/broker.entity';
import { OnboardBrokerDto } from '../dtos/onboard-broker.dto';

export interface OnboardBrokerResult {
  tenantId: string;
  brokerCode: string;
  brokerId: string;
  adminUserId: string;
  resumed: boolean;
}

@Injectable()
export class BrokerOnboardingService {
  constructor(
    private readonly tenancy: TenancyService,
    private readonly saas: SaasControlPlaneService,
    private readonly brokerHierarchy: BrokerHierarchyService,
    private readonly users: UsersService,
    private readonly rbac: RbacService,
    private readonly sns: AwsSnsService,
    private readonly outbox: OutboxService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(BrokerOnboardingService.name);
  }

  async onboardBroker(dto: OnboardBrokerDto, requestedBy: string): Promise<OnboardBrokerResult> {
    this.logger.debug('onboardBroker:start', { brokerCode: dto.brokerCode, requestedBy });
    let resumed = false;

    // ── Step 1: Tenant ────────────────────────────────────────────────────────────
    // Code is the subdomain slug AND the JWT tid — it must exist before we can log in.
    let tenant = await this.tenancy.findByCode(dto.brokerCode);
    if (!tenant) {
      tenant = await this.tenancy.createTenant({
        code: dto.brokerCode,
        displayName: dto.brokerDisplayName,
        timezone: dto.timezone ?? 'Asia/Kolkata',
        jurisdictionProfile: dto.jurisdictionProfile ?? 'INDIA',
        status: 'PENDING',
      });
      this.logger.debug('onboardBroker: tenant created', { tenantId: tenant.id });
    } else if (tenant.status === 'SUSPENDED') {
      throw new AppError('AUTHORIZATION_FAILED', `Tenant ${dto.brokerCode} is suspended; cannot resume onboarding`);
    } else {
      resumed = true;
      this.logger.debug('onboardBroker: tenant exists (resuming)', { tenantId: tenant.id });
    }

    // ── Step 2: Provision (RBAC seed + tenant activation) ─────────────────────────
    // provisionTenant is idempotent — re-runs are noop when status=COMPLETED.
    await this.saas.provisionTenant({
      tenantId: tenant.id,
      requestedBy,
      brokerAdminEmail: dto.adminEmail,
      resources: { brokerOnboarded: true },
    });

    // ── Step 3: Broker entity ─────────────────────────────────────────────────────
    // CRITICAL: use tenant.id (UUID) — BrokerHierarchyService stores UUID FK, not slug.
    let broker = await this.brokerHierarchy.findBrokerByCode(tenant.id, dto.brokerCode);
    if (!broker) {
      broker = await this.brokerHierarchy.createBroker({
        tenantId: tenant.id,
        brokerCode: dto.brokerCode,
        displayName: dto.brokerDisplayName,
      });
      this.logger.debug('onboardBroker: broker entity created', { brokerId: broker.id });
    }

    // ── Step 4: Broker admin user ─────────────────────────────────────────────────
    // CRITICAL: use tenant.code (slug) — UserEntity.tenantId is varchar64 storing slug.
    // This must match what verifyOtp() uses when it looks up the user.
    let adminUser = await this.users.findByMobile(tenant.code, dto.adminMobileE164);
    const userWasCreated = !adminUser;
    if (!adminUser) {
      adminUser = await this.users.create({
        tenantId: tenant.code,
        mobileE164: dto.adminMobileE164,
        email: dto.adminEmail,
      });
      this.logger.debug('onboardBroker: admin user created', { adminUserId: adminUser.id });
    }

    // ── Step 5: Role assignment ───────────────────────────────────────────────────
    // RbacService.assignRoleToUser checks for existing mapping before insert — safe to re-run.
    // Uses tenant.code (slug) to match how PermissionsGuard queries RBAC.
    await this.rbac.assignRoleToUser(tenant.code, adminUser.id, ROLE.BROKER_ADMIN);

    // ── Step 6: Welcome SMS ───────────────────────────────────────────────────────
    // Only sent when the admin user was just created. Prevents duplicate SMS on retry/resume.
    if (userWasCreated) {
      await this.sendWelcomeSms(dto.adminMobileE164, dto.brokerCode, dto.brokerDisplayName);
    }

    // ── Step 7: Domain event ──────────────────────────────────────────────────────
    await this.outbox.append(
      'broker.onboarded',
      { tenantId: tenant.id, brokerId: broker.id, adminUserId: adminUser.id, requestedBy },
      tenant.id,
    );

    this.logger.debug('onboardBroker:end', { tenantId: tenant.id, brokerId: broker.id, resumed });
    return {
      tenantId: tenant.id,
      brokerCode: tenant.code,
      brokerId: broker.id,
      adminUserId: adminUser.id,
      resumed,
    };
  }

  async listBrokers(): Promise<BrokerEntity[]> {
    // Aggregates brokers across all tenants for the platform dashboard.
    return this.brokerHierarchy.listAllBrokers();
  }

  async getBroker(tenantCode: string): Promise<BrokerEntity | null> {
    const tenant = await this.tenancy.findByCode(tenantCode);
    if (!tenant) return null;
    return this.brokerHierarchy.findBrokerByCode(tenant.id, tenantCode);
  }

  async suspendBroker(tenantCode: string, reason?: string): Promise<void> {
    const tenant = await this.tenancy.findByCode(tenantCode);
    if (!tenant) throw new AppError('RESOURCE_NOT_FOUND', `Broker ${tenantCode} not found`);
    await this.saas.suspendTenant(tenant.id, reason);
  }

  private async sendWelcomeSms(mobile: string, brokerCode: string, brokerDisplayName: string): Promise<void> {
    const loginUrl = `https://${brokerCode}.obsidian.io/login`;
    const message = `Welcome to ${brokerDisplayName}. Login at ${loginUrl}. Your mobile number is your login ID.`;
    try {
      await this.sns.sendSms(mobile, message);
      this.logger.debug('onboardBroker: welcome SMS sent', { mobile, brokerCode });
    } catch (err) {
      this.logger.warn('onboardBroker: welcome SMS failed (non-fatal)', { err });
    }
  }
}
