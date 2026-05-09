/**
 * File:        apps/dealer-workstation/src/components/workspace/tabs/chat-tab.tsx
 * Module:      dealer-workstation · Workspace
 * Purpose:     Internal dealing desk chat — 3-column layout: left channel list (CHANNELS +
 *              DIRECT sections), center message thread with input, right sidebar (TEAM ONLINE
 *              with roles + TODAY'S EVENTS mini from economic calendar).
 *
 * Exports:
 *   - ChatTab() — dealing desk internal comms panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useDeskData } from '../../../lib/mock-data-context';
import { CHAT_CHANNELS, TEAM_MEMBERS, DIRECT_CONTACTS } from '../../../lib/mock-data';

export function ChatTab() {
  const { chatMessages, sendChatMessage, economicEvents } = useDeskData();
  const [activeChannel, setActiveChannel] = useState('dealing-desk');
  const [draft, setDraft]                 = useState('');
  const bottomRef                         = useRef<HTMLDivElement>(null);
  const inputRef                          = useRef<HTMLInputElement>(null);

  const messages = chatMessages.filter(m => m.channel === activeChannel);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannel]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    sendChatMessage(activeChannel, text);
    setDraft('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const unreadMap: Record<string, number> = {};
  for (const ch of CHAT_CHANNELS) {
    if (ch.id !== activeChannel) {
      unreadMap[ch.id] = chatMessages.filter(m => m.channel === ch.id).length;
    }
  }

  function channelDotColor(id: string): string {
    if (id === 'risk-alerts') return 'var(--warn)';
    if (id === 'compliance')  return 'var(--purple)';
    if (id === 'breaks')      return 'var(--fg3)';
    return 'var(--bull)';
  }

  const upcomingEvents = [...economicEvents]
    .filter(e => e.minutesAway > 0)
    .sort((a, b) => a.minutesAway - b.minutesAway)
    .slice(0, 3);

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* Column 1: Channel list (CHANNELS + DIRECT) */}
      <div style={{ width: 148, flexShrink: 0, background: 'var(--bg-panel)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '10px 0', overflowY: 'auto' }}>
        {/* CHANNELS section */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg3)', padding: '0 10px', marginBottom: 4 }}>CHANNELS</div>
        {CHAT_CHANNELS.map(ch => {
          const active = activeChannel === ch.id;
          const unread = unreadMap[ch.id] ?? 0;
          return (
            <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: active ? 700 : 400, color: active ? 'var(--fg1)' : 'var(--fg3)', background: active ? 'var(--bg-active)' : 'transparent', border: 'none', borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: channelDotColor(ch.id), flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{ch.label}</span>
              {unread > 0 && !active && (
                <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1, flexShrink: 0 }}>{unread}</span>
              )}
            </button>
          );
        })}

        {/* DIRECT section */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg3)', padding: '8px 10px 4px', marginTop: 4, borderTop: '1px solid var(--border)' }}>DIRECT</div>
        {DIRECT_CONTACTS.map(dc => {
          const active = activeChannel === dc.id;
          const dotColor = dc.status === 'online' ? 'var(--bull)' : dc.status === 'away' ? 'var(--warn)' : 'var(--fg3)';
          return (
            <button key={dc.id} onClick={() => setActiveChannel(dc.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: active ? 700 : 400, color: active ? 'var(--fg1)' : 'var(--fg3)', background: active ? 'var(--bg-active)' : 'transparent', border: 'none', borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dc.name.split(' ')[0]}</span>
              {dc.unread > 0 && !active && (
                <span style={{ background: 'var(--bear)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1, flexShrink: 0 }}>{dc.unread}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Column 2: Message thread + input */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Thread header */}
        <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: channelDotColor(activeChannel) }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--fg1)' }}>
            {CHAT_CHANNELS.find(c => c.id === activeChannel) ? `#${activeChannel}` : activeChannel}
          </span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', marginLeft: 4 }}>{messages.length} messages</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
          {messages.length === 0 && (
            <div style={{ color: 'var(--fg3)', fontFamily: 'var(--font-data)', fontSize: 11, padding: '12px 0' }}>No messages in this channel yet.</div>
          )}
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, color: 'var(--accent)' }}>
                {msg.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, color: 'var(--fg1)' }}>{msg.author}</span>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)' }}>{msg.time}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)', lineHeight: 1.45, wordBreak: 'break-word' }}>{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 6 }}>
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${activeChannel}…`}
            style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '5px 10px', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg1)', outline: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            style={{ padding: '5px 14px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, border: '1px solid', cursor: draft.trim() ? 'pointer' : 'not-allowed', borderColor: draft.trim() ? 'var(--accent)' : 'var(--border)', background: draft.trim() ? 'var(--accent-dim)' : 'var(--bg-panel)', color: draft.trim() ? 'var(--accent)' : 'var(--fg3)' }}
          >SEND</button>
        </div>
      </div>

      {/* Column 3: TEAM ONLINE + TODAY'S EVENTS */}
      <div style={{ width: 172, flexShrink: 0, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* TEAM ONLINE */}
        <div style={{ padding: '10px 10px 6px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg3)', marginBottom: 8 }}>TEAM ONLINE</div>
          {TEAM_MEMBERS.map(m => {
            const dotColor = m.status === 'online' ? 'var(--bull)' : m.status === 'away' ? 'var(--warn)' : 'var(--fg3)';
            return (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '4px 6px', borderRadius: 'var(--r-sm)', background: m.status === 'online' ? 'rgba(16,217,150,0.04)' : 'transparent' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: dotColor, ...(m.status === 'online' ? { boxShadow: '0 0 0 2px rgba(16,217,150,0.2)' } : {}) }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: m.status === 'online' ? 'var(--fg1)' : 'var(--fg3)', fontWeight: m.status === 'online' ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.name.split(' ')[0]}
                  </div>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)' }}>{m.role}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* TODAY'S EVENTS mini */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg3)', marginBottom: 8 }}>TODAY'S EVENTS</div>
          {upcomingEvents.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>No upcoming events</div>
          ) : (
            upcomingEvents.map(evt => (
              <div key={evt.id} style={{ marginBottom: 6, padding: '4px 6px', borderRadius: 'var(--r-sm)', background: evt.minutesAway <= 10 && evt.impact === 'HIGH' ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)', border: `1px solid ${evt.minutesAway <= 10 && evt.impact === 'HIGH' ? 'rgba(245,158,11,0.25)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: evt.impact === 'HIGH' ? 'var(--bear)' : evt.impact === 'MEDIUM' ? 'var(--warn)' : 'var(--fg3)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg1)', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.name}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: evt.minutesAway <= 10 ? 'var(--warn)' : 'var(--fg3)', paddingLeft: 10 }}>
                  {evt.flag} in {evt.minutesAway}m
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
