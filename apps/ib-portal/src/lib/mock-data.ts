/**
 * File:        apps/ib-portal/src/lib/mock-data.ts
 * Module:      ib-portal · Mock Data
 * Purpose:     All demo data for the IB portal — extracted from legacy/ObsidianPartners.jsx
 *
 * Exports:
 *   - MOCK_IB                — IBProfile
 *   - SPARKLINE_DATA         — number[] (30 data points for hero sparkline)
 *   - EARNINGS_BAR_DATA      — { month, direct, subib }[] (6 months)
 *   - TOP_CLIENTS            — TopClient[] (top 10)
 *   - ALL_CLIENTS            — Client[]
 *   - ANNOUNCEMENTS          — Announcement[]
 *   - COMMISSION_SCHEDULE    — CommissionSchedule[]
 *   - STATEMENT_ROWS         — EarningsRow[]
 *   - MONTHLY_EARNINGS       — MonthlyEarning[]
 *   - PAYMENTS               — Payment[]
 *   - SUB_IBS                — SubIB[]
 *   - REFERRAL_LINKS         — ReferralLink[]
 *   - LINK_SIGNUP_HISTORY    — number[][] (4 series × 30 days)
 *   - MARKETING_BANNERS      — MarketingBanner[]
 *   - EMAIL_TEMPLATES        — EmailTemplate[]
 *   - LP_TEMPLATES           — LPTemplate[]
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import type {
  Announcement,
  Client,
  CommissionSchedule,
  EarningsRow,
  EmailTemplate,
  IBProfile,
  LPTemplate,
  MarketingBanner,
  MonthlyEarning,
  Payment,
  ReferralLink,
  SubIB,
  TopClient,
} from './types';

export const MOCK_IB: IBProfile = {
  name: 'James Liu',
  tier: 'SILVER',
  broker: 'ArcaFX Markets',
  since: 'Jan 2024',
  code: 'ARC-JL-4821',
  avatar: 'JL',
  earningsMTD: 8240,
  pendingPayout: 8240,
  nextPayment: 'Mar 31, 2026',
  allTimeEarnings: 42800,
  allTimeClients: 312,
  volumeMTD: 2400000,
  activeClients: 32,
  newClients: 6,
  dormantClients: 11,
  toGold: 10000,
  goldUnlocks: '+0.5 pip/lot · Priority Support · Dedicated AM',
};

export const SPARKLINE_DATA: number[] = [
  210, 195, 280, 310, 260, 390, 420, 480, 510, 560,
  620, 580, 640, 700, 720, 810, 760, 830, 880, 920,
  860, 940, 990, 1050, 1020, 1100, 1080, 1150, 1200, 1240,
];

export const EARNINGS_BAR_DATA = [
  { month: 'Oct', direct: 3800, subib: 620 },
  { month: 'Nov', direct: 4200, subib: 810 },
  { month: 'Dec', direct: 3600, subib: 740 },
  { month: 'Jan', direct: 5100, subib: 920 },
  { month: 'Feb', direct: 6400, subib: 1180 },
  { month: 'Mar', direct: 6900, subib: 1340 },
];

export const TOP_CLIENTS: TopClient[] = [
  { rank: 1,  name: 'Sarah K.',   volume: 284000, trades: 142, commission: 1840, status: 'ACTIVE',  link: 'YouTube Bio', joined: 'Feb 2024' },
  { rank: 2,  name: 'Michael T.', volume: 198000, trades: 98,  commission: 1240, status: 'ACTIVE',  link: 'Telegram',    joined: 'Mar 2024' },
  { rank: 3,  name: 'Priya M.',   volume: 176000, trades: 87,  commission: 1080, status: 'ACTIVE',  link: 'YouTube Bio', joined: 'Jan 2024' },
  { rank: 4,  name: 'Chen W.',    volume: 154000, trades: 74,  commission: 960,  status: 'ACTIVE',  link: 'Email',       joined: 'Apr 2024' },
  { rank: 5,  name: 'David R.',   volume: 132000, trades: 68,  commission: 820,  status: 'ACTIVE',  link: 'Instagram',   joined: 'May 2024' },
  { rank: 6,  name: 'Fatima A.',  volume: 98000,  trades: 52,  commission: 610,  status: 'DORMANT', link: 'Telegram',    joined: 'Jun 2024' },
  { rank: 7,  name: 'James O.',   volume: 87000,  trades: 44,  commission: 540,  status: 'ACTIVE',  link: 'YouTube Bio', joined: 'Jul 2024' },
  { rank: 8,  name: 'Liu Y.',     volume: 76000,  trades: 39,  commission: 480,  status: 'ACTIVE',  link: 'Email',       joined: 'Aug 2024' },
  { rank: 9,  name: 'Emma S.',    volume: 61000,  trades: 31,  commission: 380,  status: 'DORMANT', link: 'Instagram',   joined: 'Sep 2024' },
  { rank: 10, name: 'Omar H.',    volume: 48000,  trades: 24,  commission: 290,  status: 'ACTIVE',  link: 'Telegram',    joined: 'Oct 2024' },
];

export const ALL_CLIENTS: Client[] = [
  { name: 'Sarah K.',   joined: 'Feb 2024', type: 'Standard', volumeMTD: 284000, tradesMTD: 142, commission: 1840, lastTrade: 'Today',     status: 'ACTIVE',     link: 'YouTube Bio' },
  { name: 'Michael T.', joined: 'Mar 2024', type: 'Standard', volumeMTD: 198000, tradesMTD: 98,  commission: 1240, lastTrade: 'Today',     status: 'ACTIVE',     link: 'Telegram'    },
  { name: 'Priya M.',   joined: 'Jan 2024', type: 'Premium',  volumeMTD: 176000, tradesMTD: 87,  commission: 1080, lastTrade: 'Yesterday', status: 'ACTIVE',     link: 'YouTube Bio' },
  { name: 'Chen W.',    joined: 'Apr 2024', type: 'Standard', volumeMTD: 154000, tradesMTD: 74,  commission: 960,  lastTrade: 'Yesterday', status: 'ACTIVE',     link: 'Email'       },
  { name: 'David R.',   joined: 'May 2024', type: 'Standard', volumeMTD: 132000, tradesMTD: 68,  commission: 820,  lastTrade: '2d ago',    status: 'ACTIVE',     link: 'Instagram'   },
  { name: 'Fatima A.',  joined: 'Jun 2024', type: 'Standard', volumeMTD: 0,       tradesMTD: 0,   commission: 0,    lastTrade: '45d ago',   status: 'DORMANT',    link: 'Telegram'    },
  { name: 'Emma S.',    joined: 'Sep 2024', type: 'Standard', volumeMTD: 0,       tradesMTD: 0,   commission: 0,    lastTrade: '38d ago',   status: 'DORMANT',    link: 'Instagram'   },
  { name: 'Alex P.',    joined: 'Nov 2024', type: 'Standard', volumeMTD: 0,       tradesMTD: 0,   commission: 0,    lastTrade: 'Never',     status: 'UNVERIFIED', link: 'YouTube Bio' },
  { name: 'Yuki T.',    joined: 'Dec 2024', type: 'Premium',  volumeMTD: 0,       tradesMTD: 0,   commission: 0,    lastTrade: 'Never',     status: 'UNVERIFIED', link: 'Email'       },
  { name: 'Omar H.',    joined: 'Oct 2024', type: 'Standard', volumeMTD: 48000,   tradesMTD: 24,  commission: 290,  lastTrade: '3d ago',    status: 'ACTIVE',     link: 'Telegram'    },
];

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 1, date: 'Mar 15', tag: 'NEW',       text: 'New instrument added: NVDA stock CFD — effective April 1' },
  { id: 2, date: 'Mar 10', tag: 'UPDATE',    text: 'Commission rates updated for Q2 — see schedule' },
  { id: 3, date: 'Mar 5',  tag: 'MARKETING', text: 'New marketing materials available for download' },
  { id: 4, date: 'Feb 28', tag: 'NEW',       text: 'Sub-IB override rates increased to 20% for Tier 1 partners' },
  { id: 5, date: 'Feb 20', tag: 'UPDATE',    text: 'Payment processing window reduced to 1-2 business days' },
  { id: 6, date: 'Feb 14', tag: 'MARKETING', text: 'Valentine\'s Day promotion: double commission on XAUUSD this week' },
];

export const COMMISSION_SCHEDULE: CommissionSchedule[] = [
  { instrument: 'Forex Majors',   rate: '$8.00 per lot' },
  { instrument: 'Forex Minors',   rate: '$6.00 per lot' },
  { instrument: 'Gold / Silver',  rate: '$10.00 per lot' },
  { instrument: 'Indices',        rate: '$5.00 per lot' },
  { instrument: 'Crypto CFDs',    rate: '$7.00 per lot' },
];

export const STATEMENT_ROWS: EarningsRow[] = [
  { date: 'Mar 19', client: 'Sarah K.',   instrument: 'EUR/USD', side: 'BUY',  lots: 2.5, rate: 8,  commission: 20,   type: 'Direct', status: 'PENDING' },
  { date: 'Mar 18', client: 'Michael T.', instrument: 'XAU/USD', side: 'SELL', lots: 1.0, rate: 10, commission: 10,   type: 'Direct', status: 'PENDING' },
  { date: 'Mar 18', client: 'Maria S.',   instrument: 'GBP/USD', side: 'BUY',  lots: 3.0, rate: 8,  commission: 24,   type: 'Sub-IB', status: 'PENDING' },
  { date: 'Mar 17', client: 'Priya M.',   instrument: 'BTC/USD', side: 'BUY',  lots: 1.5, rate: 7,  commission: 10.5, type: 'Direct', status: 'PENDING' },
  { date: 'Mar 16', client: 'Sophie C.',  instrument: 'S&P 500', side: 'BUY',  lots: 4.0, rate: 5,  commission: 20,   type: 'Sub-IB', status: 'PENDING' },
  { date: 'Mar 15', client: 'Chen W.',    instrument: 'EUR/USD', side: 'SELL', lots: 2.0, rate: 8,  commission: 16,   type: 'Direct', status: 'PENDING' },
];

export const MONTHLY_EARNINGS: MonthlyEarning[] = [
  { month: 'Mar 2026', clients: 32, lots: 1030, commission: 8240,  change: +14, status: 'PENDING' },
  { month: 'Feb 2026', clients: 29, lots: 956,  commission: 7580,  change: +18, status: 'PAID'    },
  { month: 'Jan 2026', clients: 26, lots: 810,  commission: 6420,  change: +8,  status: 'PAID'    },
  { month: 'Dec 2025', clients: 24, lots: 748,  commission: 5940,  change: -4,  status: 'PAID'    },
  { month: 'Nov 2025', clients: 25, lots: 762,  commission: 6180,  change: +24, status: 'PAID'    },
  { month: 'Oct 2025', clients: 21, lots: 614,  commission: 4980,  change: +12, status: 'PAID'    },
];

export const PAYMENTS: Payment[] = [
  { period: 'Feb 2026', amount: 7580, method: 'Bank Transfer', ref: 'PAY-2026-02-JL', date: 'Mar 5, 2026',  status: 'PAID' },
  { period: 'Jan 2026', amount: 6420, method: 'Bank Transfer', ref: 'PAY-2026-01-JL', date: 'Feb 5, 2026',  status: 'PAID' },
  { period: 'Dec 2025', amount: 5940, method: 'Bank Transfer', ref: 'PAY-2025-12-JL', date: 'Jan 5, 2026',  status: 'PAID' },
  { period: 'Nov 2025', amount: 6180, method: 'Bank Transfer', ref: 'PAY-2025-11-JL', date: 'Dec 5, 2025',  status: 'PAID' },
  { period: 'Oct 2025', amount: 4980, method: 'USDT Wallet',   ref: 'PAY-2025-10-JL', date: 'Nov 5, 2025',  status: 'PAID' },
  { period: 'Sep 2025', amount: 3920, method: 'Bank Transfer', ref: 'PAY-2025-09-JL', date: 'Oct 5, 2025',  status: 'PAID' },
];

export const SUB_IBS: SubIB[] = [
  { id: 1, name: 'Sophie Chen',       initials: 'SC', tier: 1, clients: 18, volumeMTD: 1680000, earnings: 2100, myOverride: 420, joined: 'Mar 2024', status: 'ACTIVE', children: [] },
  { id: 2, name: 'Maria Santos',      initials: 'MS', tier: 1, clients: 12, volumeMTD: 990000,  earnings: 1240, myOverride: 248, joined: 'Apr 2024', status: 'ACTIVE', children: [
    { id: 4, name: 'David Park',      initials: 'DP', tier: 2, clients: 3,  volumeMTD: 224000,  earnings: 280,  myOverride: 28,  joined: 'Jul 2024', status: 'ACTIVE', children: [] },
  ]},
  { id: 3, name: 'Ahmed Al-Rashid',   initials: 'AA', tier: 1, clients: 8,  volumeMTD: 712000,  earnings: 890,  myOverride: 178, joined: 'May 2024', status: 'ACTIVE', children: [] },
];

export const REFERRAL_LINKS: ReferralLink[] = [
  { name: 'YouTube Bio',     short: 'arcafx.com/y/jl-yt', clicks: 1247, signups: 34, verified: 28, deposited: 22, volume: 1240000, commission: 4820, conv: 2.7, active: true },
  { name: 'Telegram Group',  short: 'arcafx.com/y/jl-tg', clicks: 834,  signups: 19, verified: 15, deposited: 12, volume: 680000,  commission: 2140, conv: 1.9, active: true },
  { name: 'Instagram',       short: 'arcafx.com/y/jl-ig', clicks: 412,  signups: 8,  verified: 6,  deposited: 4,  volume: 210000,  commission: 680,  conv: 1.4, active: true },
  { name: 'Email Campaign',  short: 'arcafx.com/y/jl-em', clicks: 289,  signups: 22, verified: 18, deposited: 16, volume: 890000,  commission: 2800, conv: 5.9, active: true },
];

export const LINK_SIGNUP_HISTORY: number[][] = [
  [4,2,1,3,5,3,4,6,4,5,7,6,8,5,4,6,9,7,8,6,7,9,8,10,9,11,8,9,10,12],
  [1,2,1,1,2,3,1,2,1,2,3,2,1,2,3,2,3,1,2,2,1,3,2,2,1,2,3,2,1,2],
  [0,1,0,1,1,0,1,0,0,1,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1],
  [2,1,2,3,2,1,2,3,1,2,2,3,2,1,3,2,3,2,1,2,3,2,1,2,3,1,2,3,2,1],
];

export const MARKETING_BANNERS: MarketingBanner[] = [
  { name: 'Leaderboard',   size: '728×90',    type: 'PNG/HTML' },
  { name: 'Rectangle',     size: '300×250',   type: 'PNG/HTML' },
  { name: 'Skyscraper',    size: '160×600',   type: 'PNG/HTML' },
  { name: 'Mobile Banner', size: '320×50',    type: 'PNG'      },
  { name: 'Social Square', size: '1080×1080', type: 'PNG'      },
  { name: 'Social Story',  size: '1080×1920', type: 'PNG'      },
];

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  { name: 'Welcome to Trading',  subject: 'Start your trading journey today',              tag: 'Onboarding' },
  { name: 'Market Update',       subject: 'This week in markets — key moves to watch',     tag: 'Content'    },
  { name: 'New Instrument',      subject: 'Now available: NVDA CFD on ArcaFX',             tag: 'Product'    },
  { name: 'Reactivation',        subject: 'We miss you — markets are moving',              tag: 'Retention'  },
  { name: 'Webinar Invite',      subject: 'Free webinar: Mastering EUR/USD this quarter',  tag: 'Event'      },
];

export const LP_TEMPLATES: LPTemplate[] = [
  { id: 'demo',       name: 'Free Demo Account',      desc: 'High converting registration flow'    },
  { id: 'classic',    name: 'Classic Register',       desc: 'Simple, clean signup page'             },
  { id: 'comparison', name: 'Comparison',             desc: 'Broker vs competitor overview'         },
  { id: 'webinar',    name: 'Webinar Registration',   desc: 'Event signup with countdown'           },
  { id: 'platform',   name: 'Platform Tour',          desc: 'Interactive platform showcase'         },
  { id: 'analysis',   name: 'Market Analysis',        desc: 'Weekly analysis lead magnet'           },
];
