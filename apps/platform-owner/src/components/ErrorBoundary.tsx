/**
 * File:        apps/platform-owner/src/components/ErrorBoundary.tsx
 * Module:      platform-owner · Shared Components
 * Purpose:     React error boundary — catches runtime errors in child components and
 *              renders a fallback UI instead of crashing the entire page.
 *
 * Exports:
 *   - ErrorBoundary({ children, fallback?, onError? }) — wraps children; catches errors
 *   - PageError({ message, onRetry })                 — default error fallback UI
 *
 * Depends on:
 *   - react (ComponentDidCatch)
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - ErrorBoundary is NOT a hook — it is a class so it can implement React's error boundary lifecycle.
 *   - When an error bubbles to the nearest ErrorBoundary, React unmounts everything below it
 *     and mounts the fallback. This prevents white-screen crashes in production.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-08
 */

'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <PageError
          message={this.state.error?.message ?? 'An unexpected error occurred'}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export function PageError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-r-lg border border-[var(--bear)] bg-[var(--bear-dim)] p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--bear)] bg-[var(--bear)]/20">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--bear)]">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div>
        <p className="font-display text-[12px] uppercase tracking-[0.08em] text-[var(--bear)]">Something went wrong</p>
        <p className="mt-1 font-mono text-[11px] text-fg3">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-r-sm border border-accent/50 bg-accent/10 px-4 py-1.5 font-mono text-[11px] text-accent transition-colors hover:bg-accent hover:text-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}
