'use client';
import { useState } from 'react';
import { teamMembers, auditLog } from '../../lib/mockData';

function avatarBg(name = '') {
  const colors = ['#3B82F6','#10D996','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#EF4444','#84CC16'];
  let h = 0;
  for (const c of name) h = ((h << 5) - h) + c.charCodeAt(0);
  return colors[Math.abs(h) % colors.length];
}

const ROLE_COLORS = {
  'Super Admin': { bg: 'rgba(255,59,92,0.12)',   color: 'var(--bear)' },
  'Admin':       { bg: 'rgba(59,130,246,0.12)',   color: 'var(--accent)' },
  'Compliance':  { bg: 'rgba(245,158,11,0.12)',   color: 'var(--warn)' },
  'Compliance Officer': { bg: 'rgba(245,158,11,0.12)', color: 'var(--warn)' },
  'Finance':     { bg: 'rgba(16,217,150,0.12)',   color: 'var(--bull)' },
  'Support':     { bg: 'rgba(139,154,176,0.12)',  color: 'var(--text-secondary)' },
  'Dealer':      { bg: 'rgba(139,92,246,0.12)',   color: '#8B5CF6' },
  'Read Only':   { bg: 'rgba(74,85,104,0.12)',    color: 'var(--text-tertiary)' },
};

function RolePill({ role }) {
  const style = ROLE_COLORS[role] || { bg: 'var(--bg-3)', color: 'var(--text-secondary)' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: style.bg, color: style.color }}>
      {role}
    </span>
  );
}

// ─── PERMISSIONS MATRIX ───────────────────────────────────────────────────────
const ROLES = ['Super Admin','Admin','Compliance','Finance','Support','Dealer','Read Only'];
const PERMISSIONS = [
  { category: 'CLIENTS', perms: ['View','Edit','Create','Delete','Export','KYC Approve','KYC Reject','Adjust Balance','Suspend'] },
  { category: 'TRADING', perms: ['View Instruments','Edit Instruments','View Orders','Cancel Orders','View Exposure'] },
  { category: 'RISK',    perms: ['View Risk','Edit Limits','View Surveillance','Resolve Alerts'] },
  { category: 'FINANCE', perms: ['View Transactions','Approve Deposits','Approve Withdrawals','View P&L','Manage Bonuses','Pay Commissions'] },
  { category: 'REPORTS', perms: ['View Reports','Create Reports','Schedule Reports','Export Reports'] },
  { category: 'PLATFORM',perms: ['View Settings','Edit Brand','Edit Templates','Manage API','Edit Compliance'] },
  { category: 'TEAM',    perms: ['View Members','Invite Members','Edit Roles','Remove Members','View Audit Log'] },
  { category: 'DEALER',  perms: ['Access Workstation','Accept Orders','Reject Orders','Manual Quote','Hedge Controls'] },
];

const DEFAULT_MATRIX = {
  'Super Admin': 'all',
  'Admin': { deny: ['Delete','Remove Members','Hedge Controls'] },
  'Compliance': { allow: ['View','KYC Approve','KYC Reject','View Risk','View Surveillance','Resolve Alerts','View Reports','View Members','View Audit Log','View Transactions','View Orders','View Exposure'] },
  'Finance':    { allow: ['View','View Transactions','Approve Deposits','Approve Withdrawals','View P&L','Manage Bonuses','Pay Commissions','View Reports','Export Reports'] },
  'Support':    { allow: ['View','Edit','Create','Add Notes','View Transactions','View Reports','View Members'] },
  'Dealer':     { allow: ['View Instruments','View Orders','View Exposure','View Risk','Access Workstation','Accept Orders','Reject Orders','Manual Quote'] },
  'Read Only':  { allow: ['View','View Transactions','View Reports','View Risk','View Instruments'] },
};

function hasPermission(role, perm) {
  const m = DEFAULT_MATRIX[role];
  if (m === 'all') return 'full';
  if (!m) return 'none';
  if (m.deny && m.deny.some(d => perm.includes(d))) return 'none';
  if (m.allow && m.allow.some(a => perm.includes(a) || a === perm || perm.startsWith(a))) return 'full';
  if (m.allow && m.allow.some(a => a.toLowerCase().includes(perm.toLowerCase().split(' ')[0]))) return 'partial';
  return 'none';
}

function PermissionsMatrix() {
  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Roles & Permissions</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            Click cells to toggle (Super Admin only)
          </div>
        </div>
        <button className="btn btn-primary btn-sm">+ Create Custom Role</button>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 200 }}>Permission</th>
              {ROLES.map(r => (
                <th key={r} style={{ width: 90, textAlign: 'center' }}>
                  <RolePill role={r} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(({ category, perms }) => (
              <>
                <tr key={category}>
                  <td colSpan={ROLES.length + 1} style={{
                    background: 'var(--bg-3)', padding: '7px 12px',
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--text-tertiary)',
                  }}>
                    {category}
                  </td>
                </tr>
                {perms.map(perm => (
                  <tr key={perm}>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 20 }}>{perm}</td>
                    {ROLES.map(role => {
                      const level = hasPermission(role, perm);
                      return (
                        <td key={role} style={{ textAlign: 'center', cursor: 'pointer' }}
                          title={`${role}: ${level}`}
                          onClick={() => {}}>
                          {level === 'full'    && <span style={{ color: 'var(--bull)',          fontSize: 14 }}>✓</span>}
                          {level === 'partial' && <span style={{ color: 'var(--warn)',          fontSize: 12 }}>◐</span>}
                          {level === 'none'    && <span style={{ color: 'var(--text-muted)',    fontSize: 14 }}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
function AuditLogView() {
  const [filterMember, setFilterMember] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const filtered = auditLog.filter(e =>
    (!filterMember || e.member === filterMember) &&
    (!filterAction || e.action.includes(filterAction))
  );

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Audit Log</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            Immutable record of all admin actions
          </div>
        </div>
        <button className="btn btn-ghost btn-sm">Export CSV</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <select className="select" style={{ width: 180 }} value={filterMember} onChange={e => setFilterMember(e.target.value)}>
          <option value="">All team members</option>
          {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          <option value="System">System</option>
        </select>
        <input className="input" style={{ width: 200 }} placeholder="Filter by action type..." value={filterAction} onChange={e => setFilterAction(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {['Timestamp','Team Member','Action','Entity','Details','Old Value','New Value','IP','Result'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id}>
                  <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)', whiteSpace: 'nowrap' }}>{entry.time}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="avatar-sm" style={{ background: avatarBg(entry.member), width: 22, height: 22, fontSize: 9 }}>
                        {entry.member.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>{entry.member}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{entry.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--accent)' }}>{entry.action}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{entry.entityType}</span> {entry.entityId}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.details}
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{entry.oldValue || '—'}</td>
                  <td style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-data)' }}>{entry.newValue || '—'}</td>
                  <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{entry.ip}</td>
                  <td>
                    <span style={{ fontSize: 10, color: entry.result === 'success' ? 'var(--bull)' : 'var(--bear)' }}>
                      {entry.result === 'success' ? '✓' : '✗'} {entry.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            Log is immutable — no deletion possible · Showing {filtered.length} of {auditLog.length} entries
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── INVITE MODAL ─────────────────────────────────────────────────────────────
function InviteModal({ onClose }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'Support', sendEmail: true, message: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ fontSize: 15, fontWeight: 600 }}>Invite Team Member</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
            <div className="form-group">
              <label className="label">First Name</label>
              <input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" />
            </div>
            <div className="form-group">
              <label className="label">Last Name</label>
              <input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@arcafx.com" />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.filter(r => r !== 'Super Admin').map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.sendEmail} onChange={e => set('sendEmail', e.target.checked)} />
              Send welcome email with temporary password
            </label>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="label">Custom Message (optional)</label>
            <textarea
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder="Welcome to the ArcaFX team..."
              style={{ width: '100%', minHeight: 64, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            disabled={!form.firstName || !form.email}
            onClick={() => { alert(`Invitation sent to ${form.email}`); onClose(); }}
          >
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TEAM MEMBERS MAIN ────────────────────────────────────────────────────────
export default function TeamMembers({ initialSubModule }) {
  const [subModule, setSubModule]   = useState(initialSubModule || 'members');
  const [showInvite, setShowInvite] = useState(false);

  if (subModule === 'roles')     return <PermissionsMatrix />;
  if (subModule === 'audit-log') return <AuditLogView />;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Team Members</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {teamMembers.length} members · {teamMembers.filter(m => m.twoFA).length} with 2FA enabled
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSubModule('roles')}>Roles & Permissions</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSubModule('audit-log')}>Audit Log</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>+ Invite Member</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {['Member','Email','Role','Last Login','2FA','Status','Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(member => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-sm" style={{ background: avatarBg(member.name), width: 30, height: 30, fontSize: 11 }}>
                        {member.avatar}
                      </div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{member.name}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-data)' }}>{member.email}</td>
                  <td><RolePill role={member.role} /></td>
                  <td style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{member.lastLogin}</td>
                  <td>
                    {member.twoFA ? (
                      <span style={{ fontSize: 10, color: 'var(--bull)', fontWeight: 600 }}>● Enabled</span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>○ Not set</span>
                    )}
                  </td>
                  <td>
                    <span className={`pill ${member.status === 'Active' ? 'pill-active' : member.status === 'Invited' ? 'pill-warn' : 'pill-suspended'}`} style={{ fontSize: 10 }}>
                      {member.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-xs">Edit</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => alert(`Reset password for ${member.name}`)}>Reset PW</button>
                      {member.role !== 'Super Admin' && (
                        <button className="btn btn-ghost btn-xs" style={{ color: 'var(--bear)' }}
                          onClick={() => confirm(`Suspend ${member.name}?`) && alert('Member suspended')}>
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
