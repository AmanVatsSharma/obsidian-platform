/**
 * File:        libs/web-auth/src/components/screens/kyc-screen.tsx
 * Module:      web-auth · KYCScreen
 * Purpose:     KYC / identity verification screen (Step 3). Personal details,
 *              government ID upload (front pre-filled as "done"), liveness scan,
 *              and proof-of-address upload.
 *
 * Exports:
 *   - KYCScreen({ onSubmit?, onBack?, loading?, error?, initialData? })
 *
 * Side-effects: none
 * Key invariants:
 *   - File upload is visual-only in this component — real upload is handled by caller
 *   - GDPR/AES-256 copy at the bottom is static
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import React, { useState } from 'react';
import { AuthShell } from '../shared/auth-shell';
import { FormCard, StepIndicator } from '../shared/form-card';
import { TextInput, PrimaryButton, FieldLabel } from '../shared/primitives';
import { AuthIcons } from '../shared/icons';

interface KYCScreenProps {
  heroVariant?: 'default' | 'broker' | 'platform';
  onSubmit?: () => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
      letterSpacing: '0.12em', color: 'var(--fg3)', textTransform: 'uppercase',
      marginBottom: 12, marginTop: 24, paddingBottom: 8, borderBottom: '1px solid var(--border)',
    }}>{children}</div>
  );
}

function UploadSlot({ label, file, done }: { label: string; file: string; done: boolean }) {
  return (
    <div style={{
      padding: 18, borderRadius: 'var(--r-md)',
      background: done ? 'var(--bull-dim)' : 'var(--bg-elevated)',
      border: `1px ${done ? 'solid var(--bull)' : 'dashed var(--border-hi)'}`,
      display: 'flex', alignItems: 'center', gap: 14, minHeight: 72, cursor: done ? 'default' : 'pointer',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r-sm)',
        background: done ? 'rgba(16,217,150,0.18)' : 'var(--bg-panel)',
        border: `1px solid ${done ? 'var(--bull)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: done ? 'var(--bull)' : 'var(--fg2)',
      }}>
        {done ? AuthIcons.check : AuthIcons.upload}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600,
          letterSpacing: '0.1em', color: 'var(--fg3)', textTransform: 'uppercase', marginBottom: 3,
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg1)', fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{file}</div>
        {done && (
          <div style={{
            fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--bull)',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2,
          }}>UPLOADED</div>
        )}
      </div>
    </div>
  );
}

export function KYCScreen({ heroVariant = 'default', onSubmit, onBack, loading, error }: KYCScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [taxCountry, setTaxCountry] = useState('');
  const [tin, setTin] = useState('');

  return (
    <AuthShell heroVariant={heroVariant}>
      <FormCard
        eyebrow="STEP 03 · KNOW YOUR CUSTOMER"
        title="Verify your identity"
        subtitle="Required under FCA / CySEC / MiFID II. We use Jumio liveness + document OCR — most submissions clear in under two minutes."
      >
        <div style={{ marginBottom: 28 }}>
          <StepIndicator current={2} total={4} labels={['EMAIL', '2FA', 'KYC', 'PROFILE']} />
        </div>

        <SectionTitle>PERSONAL DETAILS</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <FieldLabel>Legal first name</FieldLabel>
            <TextInput value={firstName} onChange={setFirstName} placeholder="First name" />
          </div>
          <div>
            <FieldLabel>Legal last name</FieldLabel>
            <TextInput value={lastName} onChange={setLastName} placeholder="Last name" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <FieldLabel>Date of birth</FieldLabel>
            <TextInput value={dob} onChange={setDob} placeholder="DD / MM / YYYY" />
          </div>
          <div>
            <FieldLabel>Nationality</FieldLabel>
            <TextInput value={nationality} onChange={setNationality} placeholder="Country" />
          </div>
        </div>
        <FieldLabel>Tax residency & TIN</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
          <TextInput value={taxCountry} onChange={setTaxCountry} placeholder="Country" />
          <TextInput value={tin} onChange={setTin} placeholder="Tax ID / NINO" />
        </div>

        <SectionTitle>GOVERNMENT ID</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <UploadSlot label="ID FRONT" file="passport_front.jpg" done />
          <UploadSlot label="ID BACK" file="Upload file" done={false} />
        </div>

        {/* Liveness */}
        <div style={{
          padding: 16, borderRadius: 'var(--r-md)', background: 'var(--bg-panel)',
          border: '1px solid var(--border)', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent-dim)', border: '2px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', flexShrink: 0,
          }}>{AuthIcons.camera}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--fg1)' }}>
              Liveness & face match
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>
              A 3-second camera check. No stills are stored.
            </div>
          </div>
          <button type="button" style={{
            height: 34, padding: '0 14px', borderRadius: 'var(--r-md)',
            border: '1px solid var(--accent)', background: 'var(--accent-dim)',
            color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: 10,
            fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
          }}>START SCAN</button>
        </div>

        <SectionTitle>
          PROOF OF ADDRESS <span style={{ color: 'var(--fg4)' }}>· DATED ≤ 90 DAYS</span>
        </SectionTitle>
        <div style={{
          padding: 14, borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)',
          border: '1px dashed var(--border-hi)', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        }}>
          <span style={{ color: 'var(--fg2)', display: 'flex' }}>{AuthIcons.upload}</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg2)' }}>
            Bank statement, utility bill or council tax · PDF/JPG · max 10 MB
          </span>
          <span style={{
            marginLeft: 'auto', fontFamily: 'var(--font-data)', fontSize: 10,
            letterSpacing: '0.06em', color: 'var(--fg3)', textTransform: 'uppercase',
          }}>BROWSE →</span>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'var(--bear-dim)', marginBottom: 16,
            border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
          }}>{error}</div>
        )}

        <PrimaryButton onClick={onSubmit} disabled={loading}>
          Submit for verification {AuthIcons.arrowRight}
        </PrimaryButton>

        <div style={{
          marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <span>ENCRYPTED AT REST · AES-256 · GDPR ART.32</span>
          <span>AVG REVIEW · <span style={{ color: 'var(--fg1)' }}>1M 47S</span></span>
        </div>
      </FormCard>
    </AuthShell>
  );
}
