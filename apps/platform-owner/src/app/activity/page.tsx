'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@obsidian/obsidian-ui';
import { api } from '../../lib/api/endpoints';

type WsStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-accent',
  success: 'bg-bull',
  warn: 'bg-warn',
  error: 'bg-bear',
};

const EVENT_ICONS: Record<string, string> = {
  registration: 'bg-bull/20 text-bull',
  deposit: 'bg-bull/20 text-bull',
  withdrawal: 'bg-warn/20 text-warn',
  trade: 'bg-accent/20 text-accent',
  kyc: 'bg-purple/20 text-purple',
  alert: 'bg-bear/20 text-bear',
};

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  time: string;
  brokerCode: string;
  severity: string;
}

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const loadEvents = useCallback(async () => {
    try {
      const data = await api.getLiveActivity();
      if (mountedRef.current) {
        setEvents(data);
      }
    } catch {
      // silent fail — WS will deliver events when connected
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    setWsStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/activity`);

    ws.onopen = () => {
      if (!mountedRef.current) return;
      reconnectAttempt.current = 0;
      setWsStatus('connected');
    };

    ws.onmessage = (evt) => {
      if (!mountedRef.current) return;
      try {
        const event: ActivityEvent = JSON.parse(evt.data);
        setEvents((prev) => [event, ...prev].slice(0, 200));
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      wsRef.current = null;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt.current, RECONNECT_MAX_MS);
      reconnectAttempt.current++;
      setWsStatus('reconnecting');
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadEvents().finally(() => setLoading(false));
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [loadEvents, connect]);

  const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const STATUS_LABEL: Record<WsStatus, string> = {
    connecting: 'CONNECTING',
    connected: 'LIVE',
    reconnecting: 'RECONNECTING',
    disconnected: 'DISCONNECTED',
  };

  const STATUS_COLOR: Record<WsStatus, string> = {
    connecting: 'border-[var(--warn)]/25 bg-[var(--warn)]/10 text-[var(--warn)]',
    connected: 'border-bull/25 bg-bull/10 text-bull',
    reconnecting: 'border-[var(--warn)]/25 bg-[var(--warn)]/10 text-[var(--warn)]',
    disconnected: 'border-[var(--border)] text-fg3',
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            Live Activity Feed
          </h1>
          <p className="mt-0.5 font-ui text-[12px] text-fg3">
            Real-time platform event stream · {events.length} events
          </p>
        </div>
        <div className={cn('flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors', STATUS_COLOR[wsStatus])}>
          <span className={cn(
            'h-1.5 w-1.5 rounded-full',
            wsStatus === 'connected' ? 'bg-bull animate-pulse' : wsStatus === 'reconnecting' ? 'bg-[var(--warn)] animate-pulse' : 'bg-fg3',
          )} />
          {STATUS_LABEL[wsStatus]}
        </div>
      </div>

      {/* Event stream */}
      <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5">
          <div className="h-2 w-2 rounded-full bg-bull animate-pulse" />
          <span className="font-display text-[10px] uppercase tracking-[0.08em] text-fg3">Platform Event Stream</span>
          <span className="ml-auto font-mono text-[10px] text-fg3">Updated {now}</span>
        </div>

        {/* Events */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-0 divide-y divide-[var(--border)]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="h-2 w-2 rounded-full mt-1.5 bg-[var(--bg-elevated)] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-[var(--bg-elevated)] animate-shimmer-slow" />
                    <div className="h-2 w-1/3 rounded bg-[var(--bg-elevated)] animate-shimmer-slow" />
                  </div>
                  <div className="h-2 w-12 rounded bg-[var(--bg-elevated)] animate-shimmer-slow" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-ui text-[12px] text-fg3">No events yet. Onboard a broker to start generating activity.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {events.map((ev, i) => (
                <div
                  key={ev.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors',
                    i === 0 ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]',
                  )}
                >
                  <span
                    className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', SEVERITY_COLORS[ev.severity] ?? 'bg-fg3')}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-[12px] text-fg2">{ev.message}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-fg3">{ev.brokerCode}</span>
                      <span className="h-1 w-1 rounded-full bg-[var(--border-md)]" />
                      <span className={cn('rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase', EVENT_ICONS[ev.type] ?? 'bg-[var(--bg-elevated)] text-fg3 border border-[var(--border)]')}>
                        {ev.type}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-fg3">{ev.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
