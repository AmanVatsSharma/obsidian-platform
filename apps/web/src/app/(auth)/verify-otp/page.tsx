"use client";
import { useAuth } from 'apps/src/providers/auth-provider';
import { useState } from 'react';

export default function VerifyOtpPage() {
  const { verifyOtp } = useAuth();
  const [tenantId, setTenantId] = useState('acme');
  const [mobileE164, setMobileE164] = useState('');
  const [otp, setOtp] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [status, setStatus] = useState<string>('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Verifying...');
    try {
      await verifyOtp({ tenantId, mobileE164, otp, totpCode, deviceInfo: 'web' });
      setStatus('Verified and logged in');
    } catch (e: any) {
      setStatus(e?.message || 'Failed');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Verify OTP</h1>
      <form onSubmit={onSubmit}>
        <input placeholder="Tenant ID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        <input placeholder="Mobile (+91...)" value={mobileE164} onChange={(e) => setMobileE164(e.target.value)} />
        <input placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
        <input placeholder="TOTP (if enabled)" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} />
        <button type="submit">Verify</button>
      </form>
      <p>{status}</p>
    </div>
  );
}


