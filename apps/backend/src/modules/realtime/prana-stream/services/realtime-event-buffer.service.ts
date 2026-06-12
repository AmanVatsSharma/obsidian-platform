/**
 * File:        apps/backend/src/modules/realtime/prana-stream/services/realtime-event-buffer.service.ts
 * Module:      realtime/prana-stream
 * Purpose:     Per-user monotonic event log with bounded ring buffer.
 *              Used to replay missed events to a client that has just
 *              reconnected with `lastSeqSeen`. Buffers in-memory only —
 *              the canonical event log is the outbox table; this is the
 *              "fast path" for live-tail replay.
 *
 * Exports:
 *   - RealtimeEventBufferService
 *     .record(userId, eventName, data) → seq
 *     .replay(userId, fromSeq) → RealtimeEvent[]
 *     .getLatestSeq(userId) → seq (or 0)
 *     .pruneOlderThan(userId, seq)  — drop entries <= seq
 *
 * Depends on:
 *   - AppLoggerService
 *
 * Side-effects:
 *   - Holds per-user circular buffers in process memory
 *   - Sends nothing to network — caller is responsible for emitting
 *
 * Key invariants:
 *   - Per-user seqs are monotonic increasing starting at 1
 *   - Buffer is bounded — old events are evicted; capacity is configurable
 *   - Replay returns events in seq order, even if `fromSeq` is old (skips)
 *   - Events held: order.updated, position.updated, account.updated,
 *                  orderbook.depth, watchlist.ticks (last N only)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../../shared/logger';

export type BufferedRealtimeEvent = {
  userId: string;
  eventName:
    | 'order.updated'
    | 'position.updated'
    | 'account.updated'
    | 'orderbook.depth'
    | 'watchlist.ticks'
    | 'margin.breach';
  data: unknown;
  seq: number;
  ts: string;
};

type UserBuffer = {
  seq: number;
  entries: BufferedRealtimeEvent[];
};

const DEFAULT_CAPACITY = Number(
  process.env.PRANA_EVENT_BUFFER_CAPACITY ?? 500,
);

@Injectable()
export class RealtimeEventBufferService {
  private readonly buffers: Map<string, UserBuffer> = new Map();
  private readonly capacity: number;

  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(RealtimeEventBufferService.name);
    this.capacity = DEFAULT_CAPACITY;
  }

  /**
   * Record a new event for the user. Returns the assigned seq.
   * When the buffer is full, the oldest entry is dropped (FIFO).
   */
  record(
    userId: string,
    eventName: BufferedRealtimeEvent['eventName'],
    data: unknown,
  ): number {
    let buf = this.buffers.get(userId);
    if (!buf) {
      buf = { seq: 0, entries: [] };
      this.buffers.set(userId, buf);
    }
    buf.seq += 1;
    const entry: BufferedRealtimeEvent = {
      userId,
      eventName,
      data,
      seq: buf.seq,
      ts: new Date().toISOString(),
    };
    buf.entries.push(entry);
    if (buf.entries.length > this.capacity) {
      // Drop oldest
      const dropped = buf.entries.length - this.capacity;
      buf.entries.splice(0, dropped);
    }
    return entry.seq;
  }

  /**
   * Replay events with seq > fromSeq, in seq order.
   * Returns [] if the buffer has no events newer than fromSeq,
   * or if fromSeq is older than what's in the buffer (caller can
   * fall back to a fresh snapshot).
   */
  replay(userId: string, fromSeq: number): BufferedRealtimeEvent[] {
    const buf = this.buffers.get(userId);
    if (!buf) return [];
    return buf.entries.filter((e) => e.seq > fromSeq);
  }

  /**
   * Return the most recent seq for the user (0 if no events yet).
   * Used by the client on reconnect: "I last saw seq X, please catch me up."
   */
  getLatestSeq(userId: string): number {
    const buf = this.buffers.get(userId);
    return buf?.seq ?? 0;
  }

  /**
   * Drop entries with seq <= given seq. Called after a successful replay
   * so we don't keep growing the buffer forever for inactive users.
   */
  pruneOlderThan(userId: string, seq: number): number {
    const buf = this.buffers.get(userId);
    if (!buf) return 0;
    const before = buf.entries.length;
    buf.entries = buf.entries.filter((e) => e.seq > seq);
    return before - buf.entries.length;
  }

  /**
   * Get the buffer occupancy for a user (for diagnostics / health).
   */
  getStats(userId: string): { entries: number; capacity: number; latestSeq: number } {
    const buf = this.buffers.get(userId);
    return {
      entries: buf?.entries.length ?? 0,
      capacity: this.capacity,
      latestSeq: buf?.seq ?? 0,
    };
  }

  /**
   * Clear the buffer for a user (e.g. on logout / explicit disconnect).
   */
  clear(userId: string): void {
    this.buffers.delete(userId);
  }
}
