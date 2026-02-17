"use client";
import { useAuth } from 'apps/src/providers/auth-provider';
import { useState } from 'react';

export default function RequestOtpPage() {
  const { requestOtp } = useAuth();
  const [tenantId, setTenantId] = useState('acme');
  const [mobileE164, setMobileE164] = useState('');
  const [status, setStatus] = useState<string>('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      await requestOtp(tenantId, mobileE164);
      setStatus('OTP sent');
    } catch (e: any) {
      setStatus(e?.message || 'Failed');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Request OTP</h1>
      <form onSubmit={onSubmit}>
        <input placeholder="Tenant ID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        <input placeholder="Mobile (+91...)" value={mobileE164} onChange={(e) => setMobileE164(e.target.value)} />
        <button type="submit">Send</button>
      </form>
      <p>{status}</p>
    </div>
  );
}


