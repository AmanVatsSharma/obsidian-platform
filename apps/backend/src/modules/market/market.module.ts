/**
 * @file src/modules/market/market.module.ts
 * @module market
 * @description Market module aggregating instruments, exchanges, and watchlists
 * @author BharatERP
 * @created 2025-09-19
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeEntity } from './entities/exchange.entity';
import { InstrumentsService } from './services/instruments.service';
import { InstrumentsController } from './controllers/instruments.controller';
import { WatchlistsController } from './controllers/watchlists.controller';
import { WatchlistsService } from './services/watchlists.service';
import { PriceFeedService } from './services/price-feed.service';
import { QuotesController } from './controllers/quotes.controller';
import { InstrumentEntity } from './entities/instrument.entity';
import { WatchlistItemEntity } from './entities/watchlist-item.entity';
import { WatchlistEntity } from './entities/watchlist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExchangeEntity,
      InstrumentEntity,
      WatchlistEntity,
      WatchlistItemEntity,
    ]),
  ],
  controllers: [InstrumentsController, WatchlistsController, QuotesController],
  providers: [InstrumentsService, WatchlistsService, PriceFeedService],
  exports: [InstrumentsService, WatchlistsService, PriceFeedService],
})
export class MarketModule {}
