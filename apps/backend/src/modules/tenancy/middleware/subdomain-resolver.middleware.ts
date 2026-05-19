/**
 * @file src/modules/tenancy/middleware/subdomain-resolver.middleware.ts
 * @module tenancy
 * @description Resolves {slug}.obsidian.io subdomains and custom broker domains to x-tenant-id.
 *              Runs before RequestContextMiddleware so the context always has a validated tenantId.
 * @author BharatERP
 * @created 2026-04-24
 *
 * Exports:
 *   - SubdomainResolverMiddleware — NestJS injectable middleware
 *
 * Depends on:
 *   - TenancyService — to look up tenant by code or customDomain
 *
 * Side-effects:
 *   - Mutates req.headers['x-tenant-id'] when resolved from Host
 *
 * Key invariants:
 *   - If x-tenant-id header is already set by client, it is left unchanged
 *     (JWT strategy will reject it if it mismatches the access token — trust the guard, not the header)
 *   - If Host does not match a known tenant, the header is not set and auth guard will handle rejection
 *   - No caching yet — each request hits DB (add Redis cache in Phase 1 performance pass)
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../entities/tenant.entity';
import { AppLoggerService } from '../../../shared/logger';

const OBSIDIAN_APEX = process.env.APEX_DOMAIN || 'obsidian.io';

@Injectable()
export class SubdomainResolverMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(SubdomainResolverMiddleware.name);
  }

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    // Explicit header already set — JWT guard will validate it; nothing to do
    if (req.headers['x-tenant-id']) {
      next();
      return;
    }

    const host = (req.headers['host']) ?? '';
    let tenant: TenantEntity | null = null;

    if (host.endsWith(`.${OBSIDIAN_APEX}`)) {
      // {slug}.obsidian.io → look up by code
      const slug = host.replace(`.${OBSIDIAN_APEX}`, '').split('.').pop() ?? '';
      if (slug) {
        tenant = await this.tenants.findOne({ where: { code: slug } }).catch(() => null);
      }
    } else if (host && !host.includes(OBSIDIAN_APEX)) {
      // Fully custom domain (e.g. trading.mybrokerfirm.com) — future: add customDomain field to TenantEntity
      // For now: noop; customDomain support comes in Phase 1 white-label config
    }

    if (tenant?.code) {
      // Set to the code (slug) — this is the tenantId used throughout the system
      (req.headers as Record<string, string>)['x-tenant-id'] = tenant.code;
      this.logger.debug(`Subdomain resolved: ${host} → ${tenant.code}`);
    }

    next();
  }
}
