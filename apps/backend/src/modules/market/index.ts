/**
 * File:        apps/backend/src/modules/market/index.ts
 * Module:      market
 * Purpose:     Barrel export for market module public API
 *
 * Exports:
 *   - MarketModule
 *   - InstrumentsService, WatchlistsService, PriceFeedService
 *   - InstrumentEntity, InstrumentStatus, InstrumentSegment, InstrumentType
 *   - ExchangeEntity, ExchangeSegment, ExchangeStatus
 *   - DataProviderEntity, ProviderType, ProviderStatus
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

export * from './market.module';
export * from './services/instruments.service';
export * from './services/watchlists.service';
export * from './services/price-feed.service';
export * from './services/segment-access.service';
export * from './services/ltp-cache.service';
export * from './entities/instrument.entity';
export * from './entities/exchange.entity';
export * from './entities/data-provider.entity';
export * from './entities/user-segment-access.entity';
export * from './entities/watchlist.entity';
export * from './entities/watchlist-item.entity';
export * from './market.resolver';
