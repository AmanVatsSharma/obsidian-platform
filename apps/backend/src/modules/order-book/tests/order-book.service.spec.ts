/**
 * File:        apps/backend/src/modules/order-book/tests/order-book.service.spec.ts
 * Module:      order-book
 * Purpose:     Unit tests for OrderBookService — book store, spread/mid-price computation,
 *              depth slicing, and realtime broadcast calls.
 *
 * Exports:
 *   - OrderBookService — unit under test
 *
 * Depends on:
 *   - OrderBookService      — module under test
 *   - AppLoggerService      — mocked
 *   - RealtimeAggregatorService — mocked
 *
 * Side-effects:
 *   - none (pure unit tests with in-memory Map)
 *
 * Key invariants tested:
 *   - Bids sorted descending, asks sorted ascending (sorted before calling updateBook)
 *   - getSpread returns null when book is empty
 *   - getDepth returns correct slice sizes
 *   - Key is case-insensitive and uppercased
 *
 * Read order:
 *   1. mock setup    — AppLoggerService + RealtimeAggregatorService mocks
 *   2. updateBook() — ingest tests
 *   3. getSpread()  — spread/mid-price tests
 *   4. getDepth()   — depth slicing tests
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrderBookService } from '../services/order-book.service';
import { AppLoggerService } from '../../../shared/logger';
import { RealtimeAggregatorService } from '../../realtime/prana-stream/services/realtime-aggregator.service';
import { OrderBookLevel } from '../dtos/order-book.dto';

const dummyLogger = {
  setContext: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockRealtimeAggregator = {
  publishOrderBook: jest.fn(),
};

function makeLevels(prices: string[], qty = '100', orders = 1): OrderBookLevel[] {
  return prices.map((price) => ({ price, qty: String(qty), orders }));
}

describe('OrderBookService', () => {
  let service: OrderBookService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderBookService,
        { provide: AppLoggerService, useValue: dummyLogger },
        { provide: RealtimeAggregatorService, useValue: mockRealtimeAggregator },
      ],
    }).compile();

    service = module.get(OrderBookService);
  });

  // -------------------------------------------------------------------------
  // updateBook — basic store + broadcast
  // -------------------------------------------------------------------------

  describe('updateBook', () => {
    it('stores the book under the uppercased key', () => {
      const bids = makeLevels(['100.5', '100.0']);
      const asks = makeLevels(['101.0', '101.5']);
      service.updateBook('nse', 'infy', bids, asks);
      expect(service.getBook('NSE:INFY')).not.toBeNull();
      expect(service.getBook('NSE:INFY').bids).toHaveLength(2);
    });

    it('sets ts = Date.now()', () => {
      const before = Date.now();
      const bids = makeLevels(['100']);
      const asks = makeLevels(['101']);
      service.updateBook('BSE', 'RELIANCE', bids, asks);
      const book = service.getBook('BSE:RELIANCE');
      expect(book.ts).toBeGreaterThanOrEqual(before);
    });

    it('calls realtimeAggregator.publishOrderBook with the frame', () => {
      const bids = makeLevels(['100']);
      const asks = makeLevels(['101']);
      service.updateBook('NSE', 'INFY', bids, asks);
      expect(mockRealtimeAggregator.publishOrderBook).toHaveBeenCalledTimes(1);
      const [key, frame] = mockRealtimeAggregator.publishOrderBook.mock.calls[0];
      expect(key).toBe('NSE:INFY');
      expect(frame.type).toBe('orderbook.depth');
      expect(frame.bids).toBe(bids);
      expect(frame.asks).toBe(asks);
      expect(frame.spread).toBe(1);
      expect(frame.midPrice).toBe(100.5);
    });

    it('overwrites previous book on subsequent update', () => {
      const bids1 = makeLevels(['100'], '50');
      const asks1 = makeLevels(['101'], '50');
      service.updateBook('NSE', 'INFY', bids1, asks1);

      const bids2 = makeLevels(['100.2'], '200');
      const asks2 = makeLevels(['101.2'], '200');
      service.updateBook('NSE', 'INFY', bids2, asks2);

      const book = service.getBook('NSE:INFY');
      expect(book.bids).toHaveLength(1);
      expect(book.bids[0].qty).toBe('200');
    });
  });

  // -------------------------------------------------------------------------
  // getBook
  // -------------------------------------------------------------------------

  describe('getBook', () => {
    it('returns null for unknown key', () => {
      expect(service.getBook('NSE:UNKNOWN')).toBeNull();
    });

    it('returns stored book for known key', () => {
      const bids = makeLevels(['99']);
      const asks = makeLevels(['102']);
      service.updateBook('NSE', 'TCS', bids, asks);
      const book = service.getBook('NSE:TCS');
      expect(book).not.toBeNull();
      expect(book.exchange).toBe('NSE');
      expect(book.symbol).toBe('TCS');
    });

    it('is case-insensitive', () => {
      const bids = makeLevels(['50']);
      const asks = makeLevels(['55']);
      service.updateBook('mcx', 'crudeoil', bids, asks);
      expect(service.getBook('MCX:CRUDEOIL')).not.toBeNull();
      expect(service.getBook('Mcx:CrudeOil')).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // getSpread
  // -------------------------------------------------------------------------

  describe('getSpread', () => {
    it('returns spread, spreadBps, and midPrice for a valid book', () => {
      const bids = makeLevels(['100.0']);
      const asks = makeLevels(['100.10']);
      service.updateBook('NSE', 'INFY', bids, asks);
      const result = service.getSpread('NSE:INFY');
      expect(result.spread).toBeCloseTo(0.1);
      expect(result.midPrice).toBeCloseTo(100.05);
      // spreadBps = spread / midPrice * 10000
      expect(result.spreadBps).toBeCloseTo((0.1 / 100.05) * 10_000, 2);
    });

    it('returns null when book does not exist', () => {
      expect(service.getSpread('NSE:UNKNOWN')).toBeNull();
    });

    it('returns null when bids are empty', () => {
      service.updateBook('NSE', 'INFY', [], makeLevels(['101']));
      expect(service.getSpread('NSE:INFY')).toBeNull();
    });

    it('returns null when asks are empty', () => {
      service.updateBook('NSE', 'INFY', makeLevels(['100']), []);
      expect(service.getSpread('NSE:INFY')).toBeNull();
    });

    it('spreadBps is 0 when midPrice is 0 (degenerate book)', () => {
      // Build a book with bids=asks=0 to exercise the midPrice=0 guard
      const bids = [{ price: '0', qty: '0', orders: 0 }];
      const asks = [{ price: '0', qty: '0', orders: 0 }];
      service.updateBook('NSE', 'INFY', bids, asks);
      const result = service.getSpread('NSE:INFY');
      expect(result.spreadBps).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // getDepth
  // -------------------------------------------------------------------------

  describe('getDepth', () => {
    beforeEach(() => {
      const bids = makeLevels(['100.5', '100.4', '100.3', '100.2', '100.1', '100.0']);
      const asks = makeLevels(['100.6', '100.7', '100.8', '100.9', '101.0', '101.1']);
      service.updateBook('NSE', 'INFY', bids, asks);
    });

    it('returns top 5 levels by default', () => {
      const { bids, asks } = service.getDepth('NSE:INFY');
      expect(bids).toHaveLength(5);
      expect(asks).toHaveLength(5);
    });

    it('respects the levels parameter', () => {
      const { bids, asks } = service.getDepth('NSE:INFY', 3);
      expect(bids).toHaveLength(3);
      expect(asks).toHaveLength(3);
    });

    it('returns empty arrays for unknown instrument', () => {
      const { bids, asks } = service.getDepth('NSE:UNKNOWN');
      expect(bids).toHaveLength(0);
      expect(asks).toHaveLength(0);
    });

    it('returns all available levels when book has fewer than requested', () => {
      const shortBids = makeLevels(['100', '99']);
      const shortAsks = makeLevels(['101', '102']);
      service.updateBook('BSE', 'SHRIRAM', shortBids, shortAsks);
      const { bids, asks } = service.getDepth('BSE:SHRIRAM', 10);
      expect(bids).toHaveLength(2);
      expect(asks).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // realtime broadcast
  // -------------------------------------------------------------------------

  describe('publishOrderBook integration', () => {
    it('is called once per updateBook call', () => {
      const bids = makeLevels(['50']);
      const asks = makeLevels(['51']);
      service.updateBook('NSE', 'INFY', bids, asks);
      service.updateBook('NSE', 'TCS', bids, asks);
      expect(mockRealtimeAggregator.publishOrderBook).toHaveBeenCalledTimes(2);
    });
  });
});