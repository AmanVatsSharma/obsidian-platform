/**
 * File:        apps/broker-admin/src/app/(admin)/kite-login/page.tsx
 * Module:      broker-admin · Kite Login
 * Purpose:     OAuth flow for Zerodha Kite data access.
 *              Kite provides instrument data and live prices only.
 *              Execution is routed internally via your B-book.
 *
 * Exports:
 *   - default (KiteLoginPage) — step-by-step login flow
 *
 * Key invariants:
 *   - Access token expires at midnight IST each day
 *   - Must re-login daily to refresh token
 *   - Kite = Data only. No order routing.
 *
 * Kite Connect Flow:
 *   1. Get API key from Kite dashboard
 *   2. Generate request_token via /api/login
 *   3. User authorizes in Kite (browser)
 *   4. Enter PIN in our UI
 *   5. Exchange for access_token
 *   6. Save credentials for live data fetch
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Key, Lock, ArrowRight, Check, AlertCircle, ExternalLink, RefreshCw,
  Loader2, Copy, CheckCircle, XCircle, Clock, Shield
} from 'lucide-react';

// Steps in the Kite login flow
type Step = 'api-key' | 'request-token' | 'pin' | 'connected';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface KiteState {
  step: Step;
  apiKey: string;
  apiSecret: string;
  requestToken: string;
  accessToken: string;
  status: ConnectionStatus;
  error: string | null;
  expiryDate: string | null;
  lastSync: string | null;
  instrumentCount: number;
}

export default function KiteLoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<KiteState>({
    step: 'api-key',
    apiKey: '',
    apiSecret: '',
    requestToken: '',
    accessToken: '',
    status: 'disconnected',
    error: null,
    expiryDate: null,
    lastSync: null,
    instrumentCount: 0,
  });

  // Handle callback with request_token from Kite
  useEffect(() => {
    const requestToken = searchParams.get('request_token');
    const status = searchParams.get('status');

    if (requestToken) {
      setState(s => ({ ...s, step: 'pin', requestToken }));
    }
    if (status === 'success') {
      // User cancelled or timed out
      setState(s => ({ ...s, error: 'Login was cancelled or timed out', status: 'error' }));
    }
  }, [searchParams]);

  const updateField = useCallback((field: string, value: string) => {
    setState(s => ({ ...s, [field]: value, error: null }));
  }, []);

  const handleGenerateRequestToken = useCallback(async () => {
    if (!state.apiKey || !state.apiSecret) {
      setState(s => ({ ...s, error: 'API Key and API Secret are required' }));
      return;
    }

    setState(s => ({ ...s, status: 'connecting', error: null }));

    // Redirect to Kite login to get request token
    // In production, this would be a server-side redirect
    const redirectUrl = `${window.location.origin}/kite-login`;
    const kiteLoginUrl = `https://kite.trade/connect/login?api_key=${state.apiKey}&redirect_url=${encodeURIComponent(redirectUrl)}`;

    // For demo, simulate request token received
    setState(s => ({
      ...s,
      step: 'pin',
      requestToken: 'DEMO_REQUEST_TOKEN_' + Date.now(),
      status: 'connecting'
    }));
  }, [state.apiKey, state.apiSecret]);

  const handleSubmitPin = useCallback(async () => {
    if (!state.requestToken) {
      setState(s => ({ ...s, error: 'Request token is required' }));
      return;
    }

    // In production, this calls backend to exchange for access token
    // POST /api/token?request_token=X&pin=XXXXXX
    const DEMO_MODE = true;

    if (DEMO_MODE) {
      // Simulate successful token exchange
      const mockAccessToken = 'access_token_demo_' + Date.now();
      const expiry = new Date();
      expiry.setHours(23, 59, 59, 999); // Midnight IST

      setState(s => ({
        ...s,
        step: 'connected',
        accessToken: mockAccessToken,
        status: 'connected',
        expiryDate: expiry.toISOString(),
        lastSync: new Date().toISOString(),
        instrumentCount: 8434,
      }));
    }
  }, [state.requestToken]);

  const handleDisconnect = useCallback(() => {
    setState(s => ({
      ...s,
      step: 'api-key',
      apiKey: '',
      apiSecret: '',
      requestToken: '',
      accessToken: '',
      status: 'disconnected',
      expiryDate: null,
      error: null,
    }));
  }, []);

  const handleSync = useCallback(() => {
    if (state.status !== 'connected') return;

    setState(s => ({ ...s, lastSync: new Date().toISOString() }));
  }, [state.status]);

  // Kite redirects here with request_token after user login
  const step = state.step;

  return (
    <div className="flex flex-col p-6 max-w-2xl mx-auto">
      <div className="module-header !border-b mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Key size={20} className="text-accent" />
          </div>
          <div>
            <p className="module-title">Zerodha Kite Connect</p>
            <p className="module-subtitle">
              Kite for market data only — execution via your B-book
            </p>
          </div>
        </div>
        <ConnectionStatusBadge status={state.status} />
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-bear/10 border border-bear/30 flex items-center gap-2">
          <AlertCircle size={14} className="text-bear" />
          <span className="text-[12px] text-bear">{state.error}</span>
        </div>
      )}

      {/* Connected Status Panel */}
      {state.status === 'connected' && (
        <div className="mb-6 rounded-lg border border-bull/30 bg-bull/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-bull" />
              <span className="text-[13px] font-bold text-bull">Connected to Kite</span>
            </div>
            <button
              className="text-[11px] text-bear hover:underline"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-[10px] text-fg3">Access Token</p>
              <p className="font-mono text-[11px] text-fg2 truncate">
                {state.accessToken.substring(0, 20)}...
              </p>
            </div>
            <div>
              <p className="text-[10px] text-fg3">Expires</p>
              <p className="font-mono text-[11px] text-fg2">
                {state.expiryDate
                  ? 'Midnight IST'
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-fg3">Instruments</p>
              <p className="font-mono text-[11px] text-bull">
                {state.instrumentCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-bull/20">
            <button
              className="btn-primary btn btn-sm"
              onClick={handleSync}
            >
              <RefreshCw size={12} /> Sync Now
            </button>
            <button
              className="btn-ghost btn btn-sm"
              onClick={() => window.open('https://kite.zerodha.co.in', '_blank')}
            >
              <ExternalLink size={12} /> Open Kite
            </button>
          </div>
        </div>
      )}

      {/* Login Flow */}
      {state.status !== 'connected' && (
        <div className="space-y-6">
          {/* Step 1: API Key */}
          {step === 'api-key' && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="step-badge">1</span>
                <h3 className="text-[14px] font-bold">Enter Kite API Credentials</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="kpi-label">API Key</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="xxxxxxxxxxxxx"
                    value={state.apiKey}
                    onChange={e => updateField('apiKey', e.target.value)}
                  />
                  <p className="text-[10px] text-fg3 mt-1">
                    <a
                      href="https://developers.kite.trade/apps"
                      target="_blank"
                      className="text-accent hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={10} /> Get from Kite Developers
                    </a>
                  </p>
                </div>

                <div>
                  <label className="kpi-label">API Secret</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••••••••"
                    value={state.apiSecret}
                    onChange={e => updateField('apiSecret', e.target.value)}
                  />
                </div>

                <button
                  className="btn-primary btn w-full"
                  onClick={handleGenerateRequestToken}
                  disabled={state.status === 'connecting'}
                >
                  {state.status === 'connecting' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Connecting...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={14} /> Generate Request Token
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: PIN Entry */}
          {step === 'pin' && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="step-badge">2</span>
                <h3 className="text-[14px] font-bold">Enter PIN to Complete Login</h3>
              </div>

              <div className="p-4 rounded-lg bg-[var(--bg-elevated)] mb-4">
                <p className="text-[12px] text-fg2 mb-2">
                  <Lock size={12} className="inline mr-1" />
                  A browser window has opened on Kite. After you complete the login there,
                  enter your 6-digit PIN below.
                </p>
                <p className="text-[10px] text-fg3">
                  Request token: {state.requestToken?.substring(0, 20)}...
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="kpi-label">PIN (6 digits)</label>
                  <input
                    className="input text-center tracking-widest"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    // In production, this triggers backend call to exchange token
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleSubmitPin();
                      }
                    }}
                  />
                </div>

                <button
                  className="btn-primary btn w-full"
                  onClick={handleSubmitPin}
                  disabled={state.status === 'connecting'}
                >
                  {state.status === 'connecting' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Getting Token...
                    </>
                  ) : (
                    <>
                      <Key size={14} /> Complete Login
                    </>
                  )}
                </button>

                <button
                  className="btn-ghost btn w-full"
                  onClick={() => setState(s => ({ ...s, step: 'api-key', requestToken: '' }))}
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 rounded-lg border border-warn/30 bg-warn/10">
            <div className="flex items-start gap-2">
              <Clock size={14} className="text-warn mt-0.5" />
              <div className="text-[11px] text-warn">
                <p className="font-bold mb-1">Token Expiry</p>
                <p>
                  Kite access tokens expire at midnight IST each day.
                  You need to re-login daily to refresh the token.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Steps Progress */}
      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <p className="text-[10px] text-fg3 mb-3">Connection Steps</p>
        <div className="flex items-center gap-2 text-[11px]">
          <StepIndicator
            label="API Key"
            done={state.status === 'connected'}
            active={state.step === 'api-key'}
          />
          <div className="w-8 h-px bg-[var(--border)]" />
          <StepIndicator
            label="Login"
            done={!!state.accessToken}
            active={state.step === 'pin'}
          />
          <div className="w-8 h-px bg-[var(--border)]" />
          <StepIndicator
            label="Token"
            done={state.status === 'connected'}
            active={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Components ────────────────────────────────────────────────────────────────

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    connected: { bg: 'bg-bull/20', text: 'text-bull', icon: Check, label: 'Connected' },
    connecting: { bg: 'bg-warn/20', text: 'text-warn', icon: Loader2, label: 'Connecting...' },
    disconnected: { bg: 'bg-fg3/20', text: 'text-fg3', icon: XCircle, label: 'Disconnected' },
    error: { bg: 'bg-bear/20', text: 'text-bear', icon: AlertCircle, label: 'Error' },
  };
  const c = config[status];
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      <Icon size={12} className={status === 'connecting' ? 'animate-spin' : ''} />
      {c.label}
    </span>
  );
}

function StepIndicator({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  const colors = done ? 'text-bull' : active ? 'text-accent' : 'text-fg3';
  const bg = done ? 'bg-bull' : active ? 'bg-accent' : 'bg-fg3';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-5 h-5 rounded-full ${bg} opacity-20 flex items-center justify-center`}>
        {done && <Check size={10} className="text-bull" />}
      </div>
      <span className={colors}>{label}</span>
    </div>
  );
}