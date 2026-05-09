/**
 * File:        apps/platform-owner/src/features/brokers/onboard-broker-form.tsx
 * Module:      platform-owner · Broker Onboarding Form
 * Purpose:     Multi-field form for onboarding a new broker tenant. On success, redirects
 *              to /brokers/{brokerCode} with the provisioned broker detail.
 *
 * Exports:
 *   - OnboardBrokerForm()  — client component
 *
 * Depends on:
 *   - ../../lib/api/endpoints  — api.onboardBroker
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@obsidian/obsidian-ui';
import { CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api/endpoints';
import { ApiError } from '../../lib/api/client';

interface FormState {
  brokerCode: string;
  brokerDisplayName: string;
  adminMobileE164: string;
  adminName: string;
  adminEmail: string;
  timezone: string;
  jurisdictionProfile: string;
}

const INITIAL: FormState = {
  brokerCode: '',
  brokerDisplayName: '',
  adminMobileE164: '',
  adminName: '',
  adminEmail: '',
  timezone: 'Asia/Kolkata',
  jurisdictionProfile: 'INDIA',
};

function InputField({
  label,
  id,
  ...props
}: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block font-display text-[10px] uppercase tracking-[0.1em] text-fg3 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className={cn(
          'w-full rounded-r-md border border-[var(--border)] bg-[var(--bg-elevated)]',
          'px-3 py-2 font-mono text-[13px] text-fg1 placeholder-fg3',
          'focus:border-[var(--border-hi)] focus:outline-none transition-colors',
          props.className,
        )}
      />
    </div>
  );
}

function SelectField({
  label,
  id,
  children,
  ...props
}: { label: string; id: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={id} className="block font-display text-[10px] uppercase tracking-[0.1em] text-fg3 mb-1.5">
        {label}
      </label>
      <select
        id={id}
        {...props}
        className={cn(
          'w-full rounded-r-md border border-[var(--border)] bg-[var(--bg-elevated)]',
          'px-3 py-2 font-mono text-[13px] text-fg1',
          'focus:border-[var(--border-hi)] focus:outline-none transition-colors',
        )}
      >
        {children}
      </select>
    </div>
  );
}

export function OnboardBrokerForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRequestId(null);
    setLoading(true);

    try {
      await api.onboardBroker({
        brokerCode: form.brokerCode.toLowerCase().trim(),
        brokerDisplayName: form.brokerDisplayName.trim(),
        adminMobileE164: form.adminMobileE164.trim(),
        adminName: form.adminName.trim() || undefined,
        adminEmail: form.adminEmail.trim() || undefined,
        timezone: form.timezone,
        jurisdictionProfile: form.jurisdictionProfile,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/brokers/${form.brokerCode}`), 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setRequestId(err.requestId ?? null);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-r-lg border border-[var(--bull)] bg-[var(--bull-dim,#10D9961A)] p-6">
        <CheckCircle size={20} className="text-bull" />
        <div>
          <p className="font-display text-[12px] uppercase tracking-[0.08em] text-bull">Broker provisioned</p>
          <p className="font-mono text-[11px] text-fg3">Redirecting to broker detail…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Section: Broker Identity */}
      <div className="space-y-4 rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-5">
        <p className="font-display text-[10px] uppercase tracking-[0.12em] text-fg3">Broker Identity</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Broker Code *"
            id="brokerCode"
            value={form.brokerCode}
            onChange={update('brokerCode')}
            placeholder="acme-securities"
            pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
            title="Lowercase kebab-case only (e.g. acme-securities)"
            required
          />
          <InputField
            label="Display Name *"
            id="brokerDisplayName"
            value={form.brokerDisplayName}
            onChange={update('brokerDisplayName')}
            placeholder="Acme Securities"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Jurisdiction"
            id="jurisdictionProfile"
            value={form.jurisdictionProfile}
            onChange={update('jurisdictionProfile')}
          >
            <option value="INDIA">India</option>
            <option value="GLOBAL">Global</option>
            <option value="US">United States</option>
            <option value="EU">European Union</option>
            <option value="GULF">Gulf</option>
          </SelectField>
          <InputField
            label="Timezone"
            id="timezone"
            value={form.timezone}
            onChange={update('timezone')}
            placeholder="Asia/Kolkata"
          />
        </div>
      </div>

      {/* Section: Admin User */}
      <div className="space-y-4 rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-5">
        <p className="font-display text-[10px] uppercase tracking-[0.12em] text-fg3">Broker Admin</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Mobile (E.164) *"
            id="adminMobileE164"
            type="tel"
            value={form.adminMobileE164}
            onChange={update('adminMobileE164')}
            placeholder="+919999999999"
            pattern="^\+[1-9]\d{1,14}$"
            title="E.164 format (e.g. +919999999999)"
            required
          />
          <InputField
            label="Name"
            id="adminName"
            value={form.adminName}
            onChange={update('adminName')}
            placeholder="Rahul Sharma"
          />
        </div>
        <InputField
          label="Email"
          id="adminEmail"
          type="email"
          value={form.adminEmail}
          onChange={update('adminEmail')}
          placeholder="admin@acmesecurities.in"
        />
      </div>

      {/* Error toast */}
      {error && (
        <div className="rounded bg-[var(--bear-dim,#FF3B5C1A)] px-4 py-3">
          <p className="font-mono text-[12px] text-[var(--bear)]">{error}</p>
          {requestId && (
            <p className="mt-0.5 font-mono text-[10px] text-fg3">ref: {requestId}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'flex items-center gap-2',
          'rounded-r-md bg-accent px-6 py-2.5',
          'font-display text-[11px] font-bold uppercase tracking-[0.08em] text-white',
          'hover:bg-accent/90 transition-colors disabled:opacity-60',
        )}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        ONBOARD BROKER
      </button>
    </form>
  );
}
