/**
 * File:        apps/backend/src/modules/market/market.module.ts
 * Module:      market
 * Purpose:     Market module — instruments, exchanges, watchlists, data providers,
 *              and exchange-aware price feed with pluggable adapters.
 *
 * Exports:
 *   - InstrumentsService   — instrument/exchange CRUD
 *   - WatchlistsService    — watchlist CRUD
 *   - PriceFeedService     — exchange-aware quote polling + pub/sub
 *   - DataProviderService — provider CRUD (NEW)
 *
 * Depends on:
 *   - RbacModule — for auth guards
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - DataProviderRegistry resolves providers by code
 *   - DataProviderEntity stores provider credentials/config
 *   - Add new data provider adapters to providers array
 *
 * Read order:
 *   1. @Module declaration — see what's registered
 *   2. InstrumentEntity + ExchangeEntity — core entities
 *   3. DataProviderEntity — provider config (NEW)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeEntity } from './entities/exchange.entity';
import { InstrumentEntity } from './entities/instrument.entity';
import { DataProviderEntity } from './entities/data-provider.entity';
import { WatchlistEntity } from './entities/watchlist.entity';
import { WatchlistItemEntity } from './entities/watchlist-item.entity';
import { InstrumentsService } from './services/instruments.service';
import { WatchlistsService } from './services/watchlists.service';
import { PriceFeedService } from './services/price-feed.service';
import { InstrumentsController } from './controllers/instruments.controller';
import { WatchlistsController } from './controllers/watchlists.controller';
import { QuotesController } from './controllers/quotes.controller';
import { MarketAdminController } from './controllers/market-admin.controller';
import { AdminInstrumentsController } from './controllers/admin-instruments.controller';
import { DataProviderRegistry } from './providers/data-provider.registry';
import { GenericRestDataProviderAdapter } from './providers/generic-rest/generic-rest.adapter';
import { KiteDataProviderAdapter } from './providers/kite/kite-data-provider.adapter';
import { MarketResolver } from './market.resolver';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    RbacModule,
    TypeOrmModule.forFeature([
      ExchangeEntity,
      InstrumentEntity,
      DataProviderEntity,
      WatchlistEntity,
      WatchlistItemEntity,
    ]),
  ],
  controllers: [
    InstrumentsController,
    WatchlistsController,
    QuotesController,
    MarketAdminController,
    AdminInstrumentsController,
  ],
  providers: [
    InstrumentsService,
    WatchlistsService,
    PriceFeedService,
    DataProviderRegistry,
    GenericRestDataProviderAdapter,
    KiteDataProviderAdapter,
    MarketResolver,
  ],
  exports: [
    InstrumentsService,
    WatchlistsService,
    PriceFeedService,
  ],
})
export class MarketModule {}
