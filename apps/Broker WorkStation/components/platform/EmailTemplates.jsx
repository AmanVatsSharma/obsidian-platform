'use client';
import { useState } from 'react';

const TEMPLATES = [
  { id: 'welcome',         label: 'Welcome Email',               category: 'Account', subject: 'Welcome to {{broker.name}}, {{client.first_name}}!' },
  { id: 'email-verify',    label: 'Email Verification',           category: 'Account', subject: 'Verify your email address' },
  { id: 'kyc-approved',    label: 'KYC Approved',                 category: 'KYC',     subject: '✓ Your account has been verified' },
  { id: 'kyc-rejected',    label: 'KYC Rejected',                 category: 'KYC',     subject: 'Action required: Identity verification' },
  { id: 'kyc-docs-req',    label: 'KYC Documents Requested',      category: 'KYC',     subject: 'Please upload additional documents' },
  { id: 'margin-call',     label: 'Margin Call Warning',          category: 'Trading', subject: '⚠ Margin call warning on your account' },
  { id: 'stop-out',        label: 'Stop-Out Executed',            category: 'Trading', subject: 'Positions closed: margin level reached stop-out' },
  { id: 'deposit-confirm', label: 'Deposit Confirmed',            category: 'Finance', subject: '✓ Deposit of {{txn.amount}} confirmed' },
  { id: 'withdrawal-ok',   label: 'Withdrawal Approved',          category: 'Finance', subject: 'Your withdrawal has been processed' },
  { id: 'withdrawal-rej',  label: 'Withdrawal Rejected',          category: 'Finance', subject: 'Withdrawal request update' },
  { id: 'password-reset',  label: 'Password Reset',               category: 'Security',subject: 'Reset your {{broker.name}} password' },
  { id: 'new-login',       label: 'New Login from Device',        category: 'Security',subject: 'New sign-in to your account' },
  { id: 'account-susp',    label: 'Account Suspended',            category: 'Account', subject: 'Your account has been suspended' },
  { id: 'bonus-awarded',   label: 'Bonus Awarded',                category: 'Finance', subject: '🎁 You have received a {{bonus.amount}} bonus!' },
  { id: 'ib-commission',   label: 'IB Commission Paid',           category: 'IB',      subject: 'Your commission payment has been sent' },
  { id: 'reg-reminder',    label: 'Regulatory Reminder',          category: 'Compliance',subject: 'Important: Account compliance update required' },
];

const MERGE_TAGS = [
  { group: 'Client', tags: ['{{client.first_name}}','{{client.last_name}}','{{client.full_name}}','{{client.email}}','{{client.account_id}}','{{client.account_type}}'] },
  { group: 'Broker', tags: ['{{broker.name}}','{{broker.support_email}}','{{broker.support_phone}}','{{broker.website}}','{{broker.license_no}}'] },
  { group: 'Transaction', tags: ['{{txn.type}}','{{txn.amount}}','{{txn.currency}}','{{txn.method}}','{{txn.date}}','{{txn.reference}}'] },
  { group: 'Trading', tags: ['{{trade.symbol}}','{{trade.lots}}','{{trade.direction}}','{{trade.pnl}}','{{margin.level}}','{{margin.call_level}}'] },
  { group: 'KYC', tags: ['{{kyc.document_type}}','{{kyc.rejection_reason}}','{{kyc.review_link}}'] },
  { group: 'Bonus', tags: ['{{bonus.type}}','{{bonus.amount}}','{{bonus.expiry}}','{{bonus.wagering_req}}'] },
];

const SAMPLE_DATA = {
  '{{client.first_name}}': 'Alexander',
  '{{client.last_name}}': 'Mitchell',
  '{{client.full_name}}': 'Alexander Mitchell',
  '{{client.email}}': 'a.mitchell@gmail.com',
  '{{client.account_id}}': 'C1001',
  '{{client.account_type}}': 'VIP',
  '{{broker.name}}': 'ArcaFX Markets',
  '{{broker.support_email}}': 'support@arcafx.com',
  '{{broker.support_phone}}': '+1 800 ARCAFX',
  '{{broker.license_no}}': 'SD052',
  '{{txn.type}}': 'Deposit',
  '{{txn.amount}}': '$5,000.00',
  '{{txn.currency}}': 'USD',
  '{{txn.method}}': 'Wire Transfer',
  '{{txn.date}}': 'January 15, 2024',
  '{{txn.reference}}': 'TXN-10003',
  '{{bonus.amount}}': '$500',
  '{{margin.level}}': '31.7%',
  '{{margin.call_level}}': '50%',
};

const DEFAULT_BODIES = {
  'welcome': `Hi {{client.first_name}},\n\nWelcome to {{broker.name}}! Your account has been created and you're ready to start trading.\n\nAccount ID: {{client.account_id}}\nAccount Type: {{client.account_type}}\n\nTo get started, please complete your identity verification to unlock full trading access.\n\nIf you have any questions, our support team is here to help at {{broker.support_email}}.\n\nBest regards,\nThe {{broker.name}} Team`,
  'kyc-approved': `Hi {{client.first_name}},\n\nGreat news! Your identity verification has been successfully completed.\n\nYour {{broker.name}} account is now fully verified and all features are unlocked.\n\nYou can now:\n• Make deposits and withdrawals\n• Trade with your full leverage limit\n• Access all available instruments\n\nHappy trading!\n\nThe {{broker.name}} Team`,
  'margin-call': `MARGIN CALL WARNING\n\nHi {{client.first_name}},\n\nYour account margin level has dropped to {{margin.level}}, which is approaching the margin call threshold.\n\nTo avoid automatic position closure, please either:\n• Deposit additional funds\n• Close some open positions\n\nIf your margin level falls to below the stop-out level, your positions may be automatically closed.\n\nContact support immediately: {{broker.support_email}} · {{broker.support_phone}}`,
  'deposit-confirm': `Hi {{client.first_name}},\n\nYour {{txn.type}} of {{txn.amount}} has been successfully processed.\n\nTransaction Details:\nType: {{txn.type}}\nAmount: {{txn.amount}}\nMethod: {{txn.method}}\nDate: {{txn.date}}\nReference: {{txn.reference}}\n\nFunds are now available in your trading account.\n\nThank you for trading with {{broker.name}}.`,
};

function applyMergeTags(text, data) {
  let result = text || '';
  Object.entries(data).forEach(([tag, val]) => {
    result = result.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), val);
  });
  return result;
}

export default function EmailTemplates() {
  const [selectedId, setSelectedId] = useState('welcome');
  const [subjects, setSubjects] = useState(Object.fromEntries(TEMPLATES.map(t => [t.id, t.subject])));
  const [bodies, setBodies] = useState(DEFAULT_BODIES);
  const [showPreview, setShowPreview] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [catFilter, setCatFilter] = useState('All');

  const selected = TEMPLATES.find(t => t.id === selectedId);
  const subject = subjects[selectedId] || selected?.subject || '';
  const body = bodies[selectedId] || `Hi {{client.first_name}},\n\nThis is the ${selected?.label} email.\n\nRegards,\nThe {{broker.name}} Team`;

  const categories = ['All', ...new Set(TEMPLATES.map(t => t.category))];
  const filteredTemplates = catFilter === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === catFilter);

  const previewSubject = applyMergeTags(subject, SAMPLE_DATA);
  const previewBody = applyMergeTags(body, SAMPLE_DATA);

  const handleSendTest = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div style={{ padding: '0 24px 24px', height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Email Templates</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{TEMPLATES.length} templates</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14, overflow: 'hidden', minHeight: 0 }}>
        {/* Left: template list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} className={`chart-tab ${catFilter === cat ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '3px 8px' }}
                onClick={() => setCatFilter(cat)}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredTemplates.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: selectedId === t.id ? 'var(--accent-muted)' : 'var(--bg-1)',
                  border: `1px solid ${selectedId === t.id ? 'var(--border-accent)' : 'var(--border)'}`,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (selectedId !== t.id) e.currentTarget.style.background = 'var(--bg-2)'; }}
                onMouseLeave={e => { if (selectedId !== t.id) e.currentTarget.style.background = 'var(--bg-1)'; }}
              >
                <div style={{ fontSize: 12, fontWeight: 500, color: selectedId === t.id ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: editor + preview */}
        <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: 14, overflow: 'hidden', minHeight: 0 }}>
          {/* Editor */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header">
              <span className="card-title">{selected?.label}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={`btn btn-ghost btn-xs ${showPreview ? 'btn-accent' : ''}`}
                  onClick={() => setShowPreview(v => !v)}
                  style={{ color: showPreview ? 'var(--accent)' : undefined }}
                >
                  {showPreview ? '◀ Hide Preview' : '▶ Show Preview'}
                </button>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={handleSendTest}
                  style={{ color: testSent ? 'var(--bull)' : undefined }}
                >
                  {testSent ? '✓ Test sent!' : '📧 Send Test'}
                </button>
                <button className="btn btn-primary btn-xs"
                  onClick={() => alert('Template saved')}>
                  Save
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
              {/* Subject */}
              <div className="form-group">
                <label className="label">Subject Line</label>
                <input
                  className="input"
                  value={subject}
                  onChange={e => setSubjects(s => ({ ...s, [selectedId]: e.target.value }))}
                  placeholder="Email subject..."
                />
              </div>

              {/* Body */}
              <div className="form-group" style={{ flex: 1 }}>
                <label className="label">Body</label>
                <textarea
                  value={body}
                  onChange={e => setBodies(b => ({ ...b, [selectedId]: e.target.value }))}
                  style={{
                    width: '100%', minHeight: 300, background: 'var(--bg-2)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    padding: '10px 12px', fontSize: 12, color: 'var(--text-primary)',
                    fontFamily: 'var(--font-data)', resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box', lineHeight: 1.7,
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              {/* Merge tags */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  Available Merge Tags — click to insert
                </div>
                {MERGE_TAGS.map(({ group, tags }) => (
                  <div key={group} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{group}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tags.map(tag => (
                        <button
                          key={tag}
                          className="btn btn-ghost btn-xs"
                          style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--accent)' }}
                          onClick={() => setBodies(b => ({ ...b, [selectedId]: (b[selectedId] || body) + tag }))}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-header">
                <span className="card-title">Preview — Sample Data</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>As seen by: Alexander Mitchell</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {/* Email frame */}
                <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  {/* Email header */}
                  <div style={{ background: '#1a2550', padding: '20px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'white', fontFamily: 'Georgia, serif' }}>ArcaFX Markets</div>
                  </div>
                  {/* Subject bar */}
                  <div style={{ background: '#f8f9fa', padding: '12px 24px', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Subject:</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{previewSubject}</div>
                  </div>
                  {/* Body */}
                  <div style={{ padding: '24px', fontSize: 13, color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif' }}>
                    {previewBody}
                  </div>
                  {/* Footer */}
                  <div style={{ background: '#f8f9fa', padding: '16px 24px', borderTop: '1px solid #eee', fontSize: 10, color: '#999', textAlign: 'center' }}>
                    ArcaFX Ltd · Suite 201, Oliaji Trade Centre, Victoria, Mahé, Seychelles<br />
                    Licensed by Seychelles FSA · License No. SD052<br />
                    <span style={{ color: '#3B82F6', cursor: 'pointer' }}>Unsubscribe</span> · <span style={{ color: '#3B82F6', cursor: 'pointer' }}>Privacy Policy</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
