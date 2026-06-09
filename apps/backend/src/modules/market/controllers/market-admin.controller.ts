/**
 * File:        apps/backend/src/modules/market/controllers/market-admin.controller.ts
 * Module:      market
 * Purpose:     Platform-admin endpoints for managing market data providers.
 *              Supports Kite Connect credential management and instrument sync.
 *
 * Exports:
 *   - MarketAdminController — @Controller('api/v1/admin/market-data')
 *       POST /kite/token        — update Kite API key + access token
 *       POST /kite/credentials — save Kite credentials to DB
 *       GET  /kite/status      — get Kite connection status
 *       POST /kite/sync       — sync instruments from Kite
 *       GET  /providers      — list all providers
 *       PATCH /providers/:id — update provider config
 *
 * Depends on:
 *   - KiteDataProviderAdapter — updateCredentials()
 *   - DataProviderRegistry   — list registered providers
 *   - DataProviderEntity    — persist credentials
 *
 * Side-effects:
 *   - Persists credentials to DataProviderEntity
 *   - Fetches and stores instruments from Kite
 *
 * Key invariants:
 *   - Kite access token expires daily at midnight IST
 *   - Admin should call /kite/token each morning after re-login
 *   - Only one Kite provider per tenant
 *
 * Read order:
 *   1. updateKiteToken() — daily token rotation
 *   2. saveKiteCredentials() — persist to DB
 *   3. syncKiteInstruments() — sync instrument master
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsNumber, IsOptional, IsBoolean, MaxLength, Min, IsIn } from 'class-validator';
import { KiteDataProviderAdapter } from '../providers/kite/kite-data-provider.adapter';
import { DataProviderRegistry } from '../providers/data-provider.registry';
import { DataProviderEntity, ProviderStatus, ProviderType } from '../entities/data-provider.entity';
import { InstrumentEntity, InstrumentSegment, InstrumentType, InstrumentStatus } from '../entities/instrument.entity';
import { ExchangeEntity } from '../entities/exchange.entity';
import { AppLoggerService } from '../../../shared/logger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../rbac/guards/tenant.guard';
import { RolesGuard } from '../../rbac/guards/roles.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';

// ─── DTOs ────────────────────────────────────────────────────────────────

class UpdateKiteTokenDto {
  @IsString()
  @MaxLength(128)
  apiKey!: string;

  @IsString()
  @MaxLength(256)
  accessToken!: string;
}

class SaveKiteCredentialsDto {
  @IsString()
  @MaxLength(128)
  apiKey!: string;

  @IsString()
  @MaxLength(256)
  apiSecret!: string;

  @IsString()
  @MaxLength(512)
  accessToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  refreshToken?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

class UpdateProviderConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  baseUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rateLimitPerSecond?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

class SyncInstrumentsQueryDto {
  @IsOptional()
  @IsIn(['NSE', 'BSE', 'MCX', 'NFO', 'CDS'])
  exchange?: 'NSE' | 'BSE' | 'MCX' | 'NFO' | 'CDS';

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ─── Controller ────────────────────────────────────────────────

@Controller('admin/market-data')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin')
export class MarketAdminController {
  constructor(
    private readonly kiteAdapter: KiteDataProviderAdapter,
    private readonly providerRegistry: DataProviderRegistry,
    @InjectRepository(DataProviderEntity)
    private readonly providers: Repository<DataProviderEntity>,
    @InjectRepository(InstrumentEntity)
    private readonly instruments: Repository<InstrumentEntity>,
    @InjectRepository(ExchangeEntity)
    private readonly exchanges: Repository<ExchangeEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(MarketAdminController.name);
  }

  // ─── Kite Token Management ─────────────────────────────────────

  @Post('kite/token')
  /**
   * Update Kite access token (in-memory only).
   * Call this daily after re-login to Kite.
   * For multi-node: store token in Redis and reload on startup.
   */
  updateKiteToken(@Body() dto: UpdateKiteTokenDto): { updated: boolean; message: string } {
    this.logger.debug('Updating Kite access token (in-memory)');
    this.kiteAdapter.updateCredentials(dto.apiKey, dto.accessToken);
    return { updated: true, message: 'Token updated in memory. Save to DB for persistence.' };
  }

  @Post('kite/credentials')
  /**
   * Save Kite credentials to database for persistence.
   * Also updates in-memory adapter for immediate use.
   */
  async saveKiteCredentials(@Body() dto: SaveKiteCredentialsDto): Promise<{ saved: boolean; providerId: string }> {
    this.logger.debug('Saving Kite credentials to DB');

    // Find or create Kite provider
    let provider = await this.providers.findOne({ where: { code: 'KITE' } });

    if (!provider) {
      provider = this.providers.create({
        code: 'KITE',
        name: 'Zerodha Kite Connect',
        providerType: ProviderType.BOTH,
      });
      provider = await this.providers.save(provider);
    }

    // Update credentials
    provider.apiKey = dto.apiKey;
    provider.apiSecret = dto.apiSecret;
    provider.accessToken = dto.accessToken;
    provider.refreshToken = dto.refreshToken;
    provider.status = ProviderStatus.CONNECTED;
    provider.isEnabled = dto.isEnabled ?? true;
    provider.exchanges = 'NSE,BSE,MCX,NFO,CDS';

    await this.providers.save(provider);

    // Also update in-memory adapter
    this.kiteAdapter.updateCredentials(dto.apiKey, dto.accessToken);

    this.logger.info('Kite credentials saved', { providerId: provider.id });
    return { saved: true, providerId: provider.id };
  }

  @Get('kite/status')
  /**
   * Get Kite connection status including instrument count.
   */
  async getKiteStatus(): Promise<{
    provider: string;
    status: ProviderStatus;
    instrumentCount: number;
    lastHealthCheck: string | null;
    exchanges: string[];
    latencyMs: number | null;
  }> {
    const provider = await this.providers.findOne({ where: { code: 'KITE' } });
    const instrumentCount = await this.instruments.count({
      where: { providerCode: 'KITE' },
    });

    // Check exchanges
    const exchanges = await this.exchanges.find({
      where: { dataProviderCode: 'KITE' },
    });

    return {
      provider: 'KITE',
      status: provider?.status ?? ProviderStatus.DISCONNECTED,
      instrumentCount,
      lastHealthCheck: provider?.lastHealthCheck?.toISOString() ?? null,
      exchanges: exchanges.map(e => e.code),
      latencyMs: provider?.latencyMs ?? null,
    };
  }

  @Post('kite/sync')
  /**
   * Sync instruments from Kite's /instruments endpoint.
   * Fetches all instruments and updates/inserts into DB.
   *
   * Kite instruments endpoint returns:
   * - NSE: EQ, NBF
   * - NFO: BNF, FNF
   * - CDS:  currency
   * - MCX:  commodities
   */
  async syncKiteInstruments(@Query() query: SyncInstrumentsQueryDto): Promise<{
    synced: number;
    exchange: string;
    message: string;
  }> {
    this.logger.debug('Syncing instruments from Kite', query);

    // Get provider credentials
    const provider = await this.providers.findOne({ where: { code: 'KITE' } });
    if (!provider?.accessToken) {
      throw new BadRequestException('Kite credentials not configured');
    }

    const kiteApiKey = provider.apiKey;
    const kiteToken = provider.accessToken;

    // Map Kite segments to exchange codes
    const exchangeMap: Record<string, { exchange: string; segment: InstrumentSegment }> = {
      'NSE': { exchange: 'NSE', segment: InstrumentSegment.EQ },
      'NFO': { exchange: 'NSE', segment: InstrumentSegment.FNO },
      'CDS': { exchange: 'NSE', segment: InstrumentSegment.CDS },
      'MCX': { exchange: 'MCX', segment: InstrumentSegment.COM },
      'BSE': { exchange: 'BSE', segment: InstrumentSegment.EQ },
    };

    let totalSynced = 0;
    const exchanges = query.exchange ? [query.exchange] : ['NSE', 'BSE', 'MCX'];

    for (const kiteExchange of exchanges) {
      const url = `https://api.kite.trade/instruments?api_key=${kiteApiKey}&access_token=${kiteToken}`;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          this.logger.warn('Kite instruments fetch failed', {
            status: res.status,
            exchange: kiteExchange,
          });
          continue;
        }

        const text = await res.text();
        const lines = text.trim().split('\n');

        // Skip header row
        const dataLines = lines.slice(1);
        const limit = query.limit ?? dataLines.length;

        let synced = 0;

        for (const line of dataLines.slice(0, limit)) {
          const cols = line.split(',');
          if (cols.length < 10) continue;

          const [
            instrumentToken,
            tradingsymbol,
            companyName,
            instrumentType,
            exchange,
            lotSize,
            tickSize,
            _,
            _,
            isin,
          ] = cols;

          // Skip non-equity exchanges if not configured
          if (!exchangeMap[exchange]) continue;

          const mapping = exchangeMap[exchange];
          const symbol = tradingsymbol.trim();
          const name = companyName?.trim() || symbol;
          const type = instrumentType?.trim().toUpperCase() as InstrumentType;
          const seg = mapping.segment;

          // Map instrument type
          let finalType: InstrumentType = InstrumentType.EQUITY;
          if (type === 'EQ') finalType = InstrumentType.EQUITY;
          else if (type === 'FUT') finalType = InstrumentType.FUTURE;
          else if (type === 'OPT') finalType = InstrumentType.OPTION;
          else if (type === 'CO') finalType = InstrumentType.FUTURE; // cover_order
          else if (type === 'BO') finalType = InstrumentType.FUTURE; // blanket_order
          else if (type === 'CE' || type === 'PE') finalType = InstrumentType.OPTION;
          else if (type === 'FUNDS') finalType = InstrumentType.FOREX;

          const segmentEnum = seg === 'EQ' ? InstrumentSegment.EQ
            : seg === 'FNO' ? InstrumentSegment.FNO
            : seg === 'COM' ? InstrumentSegment.COM
            : seg === 'CDS' ? InstrumentSegment.CDS
            : InstrumentSegment.EQ;

          // Check if exists
          let existing = await this.instruments.findOne({
            where: { exchangeCode: mapping.exchange, symbol },
          });

          if (existing) {
            // Update
            existing.providerToken = instrumentToken;
            existing.providerSymbol = symbol;
            existing.displayName = name;
            existing.type = finalType;
            existing.segment = segmentEnum;
            existing.lotSize = lotSize ? parseInt(lotSize) : 1;
            existing.tickSize = tickSize ? tickSize : '0.05';
            existing.meta = { ...existing.meta, isin };
            await this.instruments.save(existing);
          } else {
            // Insert
            const instrument = this.instruments.create({
              exchangeCode: mapping.exchange,
              symbol,
              displayName: name,
              type: finalType,
              segment: segmentEnum,
              status: InstrumentStatus.ACTIVE,
              isTradingEnabled: true,
              providerCode: 'KITE',
              providerSymbol: symbol,
              providerToken: instrumentToken,
              lotSize: lotSize ? parseInt(lotSize) : 1,
              tickSize: tickSize ? tickSize : '0.05',
              meta: { isin },
            });
            await this.instruments.save(instrument);
          }

          synced++;
        }

        totalSynced += synced;
        this.logger.info(`Synced ${synced} instruments from Kite ${kiteExchange}`);
      } catch (e) {
        this.logger.error('Kite instruments sync failed', (e as Error).stack);
      }
    }

    return {
      synced: totalSynced,
      exchange: query.exchange ?? 'all',
      message: `Synced ${totalSynced} instruments from Kite`,
    };
  }

  // ─── Provider Management ────────────────────────────────────────────

  @Get('providers')
  /**
   * List all data providers with status.
   */
  async listProviders(): Promise<
    Array<{
      id: string;
      code: string;
      name: string;
      providerType: ProviderType;
      status: ProviderStatus;
      isEnabled: boolean;
      exchanges: string[];
      instrumentCount: number;
      lastHealthCheck: string | null;
    }>
  > {
    const providers = await this.providers.find();

    return providers.map(p => ({
      id: p.code,
      code: p.code,
      name: p.name,
      providerType: p.providerType as ProviderType,
      status: p.status as ProviderStatus,
      isEnabled: p.isEnabled,
      exchanges: p.getExchanges(),
      instrumentCount: p.instrumentCount,
      lastHealthCheck: p.lastHealthCheck?.toISOString() ?? null,
    }));
  }

  @Patch('providers/:code')
  /**
   * Update provider configuration.
   */
  async updateProvider(
    @Param('code') code: string,
    @Body() dto: UpdateProviderConfigDto,
  ): Promise<{ updated: boolean }> {
    const provider = await this.providers.findOne({ where: { code } });
    if (!provider) {
      throw new BadRequestException(`Provider ${code} not found`);
    }

    if (dto.name) provider.name = dto.name;
    if (dto.baseUrl) provider.baseUrl = dto.baseUrl;
    if (dto.rateLimitPerSecond) provider.rateLimitPerSecond = dto.rateLimitPerSecond;
    if (dto.isEnabled !== undefined) provider.isEnabled = dto.isEnabled;
    if (dto.priority) provider.priority = dto.priority;

    await this.providers.save(provider);
    return { updated: true };
  }
}
