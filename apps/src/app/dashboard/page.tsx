"use client";
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../providers/auth-provider';

type Watchlist = { id: string; name: string };
type WatchlistItem = { id: string; instrumentId: string };

export default function DashboardPage() {
  const { accessToken, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [newName, setNewName] = useState('My Watchlist');
  const [instrumentId, setInstrumentId] = useState('');

  const authed = useMemo(() => !!accessToken, [accessToken]);

  const fetchJson = async (path: string, init?: RequestInit) => {
    setError(null);
    const res = await fetch(path, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-tenant-id': 'acme',
        ...(init?.headers as Record<string, string>),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const loadLists = async () => {
    try {
      setLoading(true);
      const data = await fetchJson('/market/watchlists');
      setWatchlists(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load watchlists');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (id: string) => {
    try {
      setLoading(true);
      const data = await fetchJson(`/market/watchlists/${id}/items`);
      setItems(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    try {
      setLoading(true);
      await fetchJson('/market/watchlists', {
        method: 'POST',
        body: JSON.stringify({ name: newName }),
      });
      await loadLists();
    } catch (e: any) {
      setError(e?.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!selectedId || !instrumentId) return;
    try {
      setLoading(true);
      await fetchJson(`/market/watchlists/${selectedId}/items`, {
        method: 'POST',
        body: JSON.stringify({ instrumentId }),
      });
      await loadItems(selectedId);
    } catch (e: any) {
      setError(e?.message || 'Add item failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authed) return;
    void loadLists();
  }, [authed]);

  useEffect(() => {
    if (selectedId) void loadItems(selectedId);
  }, [selectedId]);

  if (!authed) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Dashboard (Protected)</h1>
        <p>Not authenticated.</p>
        <p>
          Go to <a href="/(auth)/verify-otp">Verify OTP</a> or{' '}
          <button onClick={() => refresh()}>Try refresh</button>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard: Watchlists</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <h3>Your Lists</h3>
          <div>
            <input placeholder="New list name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <button onClick={createList} disabled={loading}>Create</button>
          </div>
          <ul>
            {watchlists.map((w) => (
              <li key={w.id}>
                <button onClick={() => setSelectedId(w.id)} style={{ fontWeight: selectedId === w.id ? 700 : 400 }}>
                  {w.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Items {selectedId ? `(list ${selectedId})` : ''}</h3>
          <div>
            <input placeholder="Instrument ID" value={instrumentId} onChange={(e) => setInstrumentId(e.target.value)} />
            <button onClick={addItem} disabled={!selectedId || loading}>Add</button>
          </div>
          <ul>
            {items.map((it) => (
              <li key={it.id}>{it.instrumentId}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}



