/**
 * @file src/modules/notifications/services/notification.service.ts
 * @module notifications
 * @description Notification dispatch service with channel stubs and preferences
 * @auth  BharatERP
 * @created 2025-01-09
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationPreferenceEntity } from '../entities/notification-preference.entity';
import { AppLoggerService } from '../../../shared/logger';
import { getRequestContext } from '../../../shared/request-context';
import { UpdateNotificationPreferencesDto } from '../dtos/update-notification-preferences.dto';
import { NotificationTemplateService } from './notification-template.service';

type Channel = 'email' | 'sms' | 'push' | 'in-app';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
    @InjectRepository(NotificationPreferenceEntity)
    private readonly prefs: Repository<NotificationPreferenceEntity>,
    private readonly logger: AppLoggerService,
    private readonly templates: NotificationTemplateService,
  ) {
    this.logger.setContext(NotificationService.name);
  }

  async list(userId: string, limit = 20): Promise<NotificationEntity[]> {
    const ctx = getRequestContext();
    if (!ctx?.tenantId) return [];
    return this.notifications.find({
      where: { tenantId: ctx.tenantId, userId },
      order: { createdAt: 'DESC' } as any,
      take: limit,
    });
  }

  async updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    const ctx = getRequestContext();
    if (!ctx?.tenantId) return { updated: false };
    const existing = await this.prefs.findOne({
      where: { tenantId: ctx.tenantId, userId, category: dto.category },
    });
    if (existing) {
      existing.email = dto.email;
      existing.sms = dto.sms;
      existing.push = dto.push;
      await this.prefs.save(existing);
      return existing;
    }
    const created = this.prefs.create({
      tenantId: ctx.tenantId,
      userId,
      category: dto.category,
      email: dto.email,
      sms: dto.sms,
      push: dto.push,
    });
    return this.prefs.save(created);
  }

  async send(options: {
    userId: string;
    type: string;
    title: string;
    bodyTemplate: string;
    vars?: Record<string, any>;
    channels?: Channel[];
    category?: string;
    inAppOnly?: boolean;
  }): Promise<void> {
    const ctx = getRequestContext();
    if (!ctx?.tenantId) return;
    const channels: Channel[] = options.inAppOnly
      ? ['in-app']
      : options.channels ?? ['in-app', 'email'];
    const category = options.category ?? 'general';
    const prefs = await this.prefs.findOne({
      where: { tenantId: ctx.tenantId, userId: options.userId, category },
    });
    const allowed = this.filterChannels(channels, prefs);
    const body = this.templates.render(options.bodyTemplate, options.vars ?? {});

    for (const channel of allowed) {
      const record = this.notifications.create({
        tenantId: ctx.tenantId,
        userId: options.userId,
        type: options.type,
        channel,
        status: 'sent',
        title: options.title,
        body,
      });
      await this.notifications.save(record);
      // Stubbed dispatch: integrate SES/SNS/FCM later.
      this.logger.debug('Notification dispatched (stub)', {
        channel,
        userId: options.userId,
        type: options.type,
      });
    }
  }

  private filterChannels(channels: Channel[], prefs?: NotificationPreferenceEntity | null): Channel[] {
    if (!prefs) return channels;
    return channels.filter((ch) => {
      if (ch === 'email') return prefs.email;
      if (ch === 'sms') return prefs.sms;
      if (ch === 'push') return prefs.push;
      return true; // in-app always allowed
    });
  }
}

