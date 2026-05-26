/**
 * File:        apps/web/features/console/components/sections/profile-section.tsx
 * Module:      web · Console · Profile
 * Purpose:     /console/profile — avatar header, personal info form, address form,
 *              locale form, and a sticky save bar that appears when fields are dirty.
 *
 * Exports:
 *   - default ProfileSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianBadge, ObsidianIcon, ObsidianSelect,
 *                              ObsidianSegmented, useToast
 *   - ../../lib/use-console-user
 *
 * Side-effects:
 *   - Local React state only. Save handler fires a success toast.
 *   - [SonuRamTODO] Replace mock save with PUT /v1/users/me when backend lands
 *     (Obsidian follow-up).
 *
 * Key invariants:
 *   - Full legal name is read-only when KYC is approved (changing it would invalidate
 *     KYC documents).
 *   - DOB is permanently read-only after KYC submission.
 *   - The dirty-bar uses sticky positioning so it stays visible regardless of scroll
 *     position; uses shadow-float (overlay shadow is allowed, structural shadows are not).
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import {
  ObsidianBadge,
  ObsidianIcon,
  ObsidianSegmented,
  ObsidianSelect,
  useToast,
} from '@obsidian/obsidian-ui';

import { useConsoleUser } from '../../lib/use-console-user';

type ProfileDraft = {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  lang: string;
  tz: string;
};

function snapshot(user: ReturnType<typeof useConsoleUser>): ProfileDraft {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    country: user.country,
    city: user.city,
    address: user.address,
    lang: user.lang,
    tz: user.timezone,
  };
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="frow">
      <div className="lbl">
        {label}
        {hint && <span className="hint">{hint}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function ProfileSection() {
  const user = useConsoleUser();
  const toast = useToast();
  const [draft, setDraft] = React.useState<ProfileDraft>(() => snapshot(user));
  const [firstDay, setFirstDay] = React.useState<'Monday' | 'Sunday'>('Monday');
  const [numberFormat, setNumberFormat] = React.useState<'1,234.56' | '1.234,56' | '1 234,56'>(
    '1,234.56',
  );

  const dirty = React.useMemo(() => {
    const baseline = snapshot(user);
    return JSON.stringify(draft) !== JSON.stringify(baseline);
  }, [draft, user]);

  const set = <K extends keyof ProfileDraft>(k: K, v: ProfileDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const onSave = () => {
    toast.push({ kind: 'bull', title: 'Profile updated', detail: 'Changes saved · 200ms' });
  };

  const onDiscard = () => setDraft(snapshot(user));

  return (
    <>
      <section className="sec">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
            <div
              aria-hidden="true"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                color: '#fff',
                boxShadow: '0 0 24px var(--accent-glow)',
              }}
            >
              {user.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                {user.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg3)' }}>
                  {user.id}
                </span>
                <span className="muted">·</span>
                <ObsidianBadge kind="bull" dot>
                  Active
                </ObsidianBadge>
                <ObsidianBadge kind="muted">KYC L{user.kycLevel}</ObsidianBadge>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn sm">
                <ObsidianIcon name="Upload" size={12} />
                Change photo
              </button>
              <button type="button" className="btn sm ghost" aria-label="Remove photo">
                <ObsidianIcon name="Trash2" size={12} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Personal information</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow label="Full legal name" hint="Must match your verification documents.">
            <div className="ip">
              <input
                type="text"
                value={draft.name}
                readOnly={user.kycState === 'approved'}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
          </FieldRow>
          <FieldRow label="Email">
            <div className="ip-row">
              <div className="ip">
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>
              <button type="button" className="btn sm ghost">
                <ObsidianIcon name="MailCheck" size={12} />
                Verified
              </button>
            </div>
          </FieldRow>
          <FieldRow label="Phone">
            <div className="ip-row">
              <div className="ip">
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </div>
              <button type="button" className="btn sm">
                Re-verify
              </button>
            </div>
          </FieldRow>
          <FieldRow label="Date of birth" hint="Cannot be changed after verification.">
            <div className="ip">
              <input type="text" value={user.dob} readOnly />
            </div>
          </FieldRow>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Address</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow label="Country of residence">
            <ObsidianSelect
              value={draft.country}
              onChange={(v) => set('country', v)}
              options={[
                'Spain',
                'United Kingdom',
                'Japan',
                'Germany',
                'France',
                'United States',
                'Singapore',
                'Cyprus',
              ]}
            />
          </FieldRow>
          <FieldRow label="City">
            <div className="ip">
              <input
                type="text"
                value={draft.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>
          </FieldRow>
          <FieldRow
            label="Street address"
            hint="Used for monthly statements and tax forms."
          >
            <div className="ip">
              <input
                type="text"
                value={draft.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </div>
          </FieldRow>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Locale</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow label="Display language">
            <ObsidianSelect
              value={draft.lang}
              onChange={(v) => set('lang', v)}
              options={['English', 'Español', '日本語', 'Deutsch', 'Français', '中文 (简体)', 'Polski']}
            />
          </FieldRow>
          <FieldRow
            label="Time zone"
            hint="Affects timestamps in statements and the platform clock."
          >
            <ObsidianSelect
              value={draft.tz}
              onChange={(v) => set('tz', v)}
              options={[
                'Europe/Madrid (UTC+01:00)',
                'Europe/London (UTC+00:00)',
                'Asia/Tokyo (UTC+09:00)',
                'America/New_York (UTC-05:00)',
                'Asia/Singapore (UTC+08:00)',
                'UTC',
              ]}
            />
          </FieldRow>
          <FieldRow label="First day of week">
            <ObsidianSegmented
              value={firstDay}
              onChange={setFirstDay}
              options={['Monday', 'Sunday'] as const}
            />
          </FieldRow>
          <FieldRow label="Number format">
            <ObsidianSegmented
              value={numberFormat}
              onChange={setNumberFormat}
              options={['1,234.56', '1.234,56', '1 234,56'] as const}
            />
          </FieldRow>
        </div>
      </section>

      {dirty && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            marginTop: 24,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-md)',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: 'var(--shadow-float)',
          }}
        >
          <ObsidianIcon name="AlertCircle" size={14} />
          <span style={{ fontSize: 12 }}>You have unsaved changes.</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" className="btn sm ghost" onClick={onDiscard}>
              Discard
            </button>
            <button type="button" className="btn sm primary" onClick={onSave}>
              Save changes
            </button>
          </div>
        </div>
      )}
    </>
  );
}
