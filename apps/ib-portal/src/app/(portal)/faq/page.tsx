/**
 * File:        apps/ib-portal/src/app/(portal)/faq/page.tsx
 * Module:      ib-portal · FAQ
 * Purpose:     Frequently asked questions — accordion grouped by topic, fresh Obsidian-native design
 *
 * Exports:
 *   - FAQPage() — client component (accordion open state)
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQGroup {
  topic: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQGroup[] = [
  {
    topic: 'COMMISSIONS & PAYMENTS',
    items: [
      { q: 'When are commissions paid?', a: 'Commissions are calculated monthly and paid in the first 5 business days of the following month. For example, March commissions are paid by April 7th.' },
      { q: 'What is the minimum payout amount?', a: 'The minimum payout threshold is $100.00. If your balance is below this amount, it rolls over to the following month.' },
      { q: 'Can I change my payment method?', a: 'Yes. You can update your payment method from the Earnings > Payment History tab. Changes take effect from the next payout cycle.' },
      { q: 'Are commissions subject to chargebacks?', a: 'Commissions earned from trades that are later reversed or cancelled will be clawed back in the following month\'s statement.' },
    ],
  },
  {
    topic: 'REFERRAL LINKS & TRACKING',
    items: [
      { q: 'How does referral tracking work?', a: 'Each referral link sets a cookie with a 90-day expiry. If a client signs up within 90 days of clicking your link, they are attributed to you permanently.' },
      { q: 'Can I create multiple referral links?', a: 'Yes — create per-channel tracking links from the Referral Links page. Each link tracks clicks, signups, verified accounts, and deposits independently.' },
      { q: 'What is the click-to-deposit conversion rate?', a: 'This is the percentage of people who clicked your link and made a first deposit. Industry average is 1.5–3%. Email campaigns typically convert best.' },
    ],
  },
  {
    topic: 'SUB-IB PROGRAM',
    items: [
      { q: 'What is a Sub-IB?', a: 'A Sub-IB is an introducing broker you have recruited. You earn an override commission on all their client trades — 20% for Tier 1 and 10% for Tier 2 sub-IBs.' },
      { q: 'How many levels of sub-IBs can I have?', a: 'Currently two levels: Tier 1 (direct recruits) and Tier 2 (their recruits). There is no limit on the number of sub-IBs per level.' },
      { q: 'Does recruiting sub-IBs affect my own client commissions?', a: 'No. Your direct client commissions are unaffected by your sub-IB activity. Override earnings are separate and additive.' },
    ],
  },
  {
    topic: 'TIERS & UPGRADES',
    items: [
      { q: 'How do I progress to GOLD tier?', a: 'Reach $10,000 in monthly commissions (from any source) for 2 consecutive months. You\'ll be notified and upgraded automatically.' },
      { q: 'What does GOLD tier unlock?', a: 'GOLD tier IBs receive +0.5 pip/lot on all Forex instruments, priority support, and a dedicated account manager.' },
      { q: 'Can I be downgraded from GOLD?', a: 'If your monthly commission drops below $6,000 for 3 consecutive months, a review is triggered. Contact your account manager before this happens.' },
    ],
  },
  {
    topic: 'COMPLIANCE & LEGAL',
    items: [
      { q: 'What am I allowed to say in marketing materials?', a: 'All marketing claims must be factual and not misleading. Do not guarantee profits. All marketing must include the required risk warning. Broker-provided templates are pre-approved.' },
      { q: 'Do I need to be licensed to operate as an IB?', a: 'Licensing requirements vary by jurisdiction. You are responsible for ensuring you comply with local regulations. Contact us if you need guidance for your region.' },
    ],
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={cn('border-b border-[var(--border)] last:border-b-0')}>
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-hover)]"
        onClick={onToggle}
      >
        <span className="font-sans text-[13px] font-medium text-fg1">{item.q}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={cn('shrink-0 text-fg3 transition-transform duration-[180ms]', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 pt-0">
          <p className="font-sans text-[13px] leading-relaxed text-fg2">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (key: string) => setOpenKey(k => k === key ? null : key);

  return (
    <div className="mx-auto max-w-[900px] p-6 space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold text-fg1">FAQ</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">Answers to common questions about commissions, tracking, and the IB program</p>
      </div>

      <div className="space-y-4">
        {FAQ_DATA.map(group => (
          <div key={group.topic}>
            <div className="mb-2 font-display text-[10px] tracking-[0.15em] text-fg3 uppercase">{group.topic}</div>
            <div className="card overflow-hidden">
              {group.items.map((item, i) => {
                const key = `${group.topic}-${i}`;
                return (
                  <AccordionItem
                    key={key}
                    item={item}
                    isOpen={openKey === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="rounded-lg border border-accent/20 bg-accent/8 px-5 py-4">
        <div className="font-sans text-[13px] font-medium text-fg1 mb-0.5">Can't find what you're looking for?</div>
        <div className="font-sans text-[13px] text-fg2">
          Contact your account manager directly from the{' '}
          <a href="/contact" className="text-accent hover:underline">Contact Manager</a> page.
        </div>
      </div>
    </div>
  );
}
