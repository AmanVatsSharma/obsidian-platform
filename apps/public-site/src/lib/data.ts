/**
 * File:        apps/public-site/src/lib/data.ts
 * Module:      public-site · Data Layer
 * Purpose:     All static data constants for the marketing site, extracted from the
 *              legacy single-file prototype. Single source of truth — no duplication
 *              across section components.
 *
 * Exports:
 *   - INST           — 10 tradable instruments with price/pip/category metadata
 *   - HERO_STATS     — 4 above-the-fold performance stats
 *   - PROOF_STATS    — 6 social-proof counters (ProofStrip section)
 *   - PRODUCTS       — 9 platform products (Ecosystem section)
 *   - PRICING        — 4 pricing tiers (Pricing section)
 *   - FAQS           — 5 FAQ items (Pricing section accordion)
 *   - TESTI          — 3 testimonials (ProofStrip carousel)
 *   - TECHS          — 12 tech stack labels
 *   - PERFS          — 6 performance spec rows
 *   - JURISDICTIONS  — 12 regulatory jurisdictions (Compliance section)
 *   - STEPS          — 5 onboarding timeline steps
 *   - PHRASES        — 4 hero typewriter phrases
 *   - BROKER_BEN     — 6 broker benefit bullets (DualAudience section)
 *   - TRADER_BEN     — 6 trader benefit bullets (DualAudience section)
 *   - IB_STATS       — 3 IB section stat pills
 *   - MIR_STATS      — 3 copy-trading stat pills
 *   - TRUST_LOGOS    — 9 logo placeholder entries
 *   - STORIES        — 3 scroll-story tabs with 4 frames each
 *   - NAV_LINKS      — 6 navigation anchor links
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none (pure data module)
 *
 * Key invariants:
 *   - All price values are used as starting seeds for the live-price random walk
 *   - `pip` is the minimum price increment — used in the setInterval price simulation
 *   - `dg` is decimal digits — used in toFixed() formatting
 *
 * Read order:
 *   1. Instrument types — understand the price/pip/dg shape before reading INST
 *   2. Constants in declaration order below
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

export interface Instrument {
  id: string;
  lbl: string;
  bid: number;
  dg: number;
  pip: number;
  ch: number;
  up: boolean;
  cat: 'FX' | 'CRYPTO' | 'CMDTY' | 'INDEX';
}

export const INST: Instrument[] = [
  { id: 'EURUSD', lbl: 'EUR/USD', bid: 1.08452, dg: 5, pip: 0.0001, ch: +0.11, up: true,  cat: 'FX' },
  { id: 'BTCUSD', lbl: 'BTC/USD', bid: 67834,   dg: 2, pip: 10,     ch: +1.85, up: true,  cat: 'CRYPTO' },
  { id: 'XAUUSD', lbl: 'XAU/USD', bid: 2345.67, dg: 2, pip: 0.1,    ch: +0.44, up: true,  cat: 'CMDTY' },
  { id: 'GBPUSD', lbl: 'GBP/USD', bid: 1.27234, dg: 5, pip: 0.0001, ch: -0.27, up: false, cat: 'FX' },
  { id: 'US500',  lbl: 'US500',   bid: 5234.5,  dg: 1, pip: 0.25,   ch: +0.63, up: true,  cat: 'INDEX' },
  { id: 'USOIL',  lbl: 'WTI/USD', bid: 78.23,   dg: 2, pip: 0.01,   ch: +0.89, up: true,  cat: 'CMDTY' },
  { id: 'NAS100', lbl: 'NAS100',  bid: 18234,   dg: 1, pip: 1,      ch: +1.12, up: true,  cat: 'INDEX' },
  { id: 'USDJPY', lbl: 'USD/JPY', bid: 149.832, dg: 3, pip: 0.01,   ch: -0.15, up: false, cat: 'FX' },
  { id: 'ETHUSD', lbl: 'ETH/USD', bid: 3412.5,  dg: 1, pip: 1,      ch: +2.34, up: true,  cat: 'CRYPTO' },
  { id: 'GBPJPY', lbl: 'GBP/JPY', bid: 190.124, dg: 3, pip: 0.01,   ch: -0.09, up: false, cat: 'FX' },
];

export interface StatItem {
  val: number;
  pre: string;
  suf: string;
  lbl: string;
  sub: string;
  dec: number;
  comma?: boolean;
}

export const HERO_STATS: StatItem[] = [
  { val: 890,    pre: '$', suf: 'M',  lbl: 'Daily Volume',  sub: 'processed',     dec: 0 },
  { val: 124847, pre: '',  suf: '',   lbl: 'Trades Today',  sub: 'on platform',   dec: 0, comma: true },
  { val: 99.97,  pre: '',  suf: '%',  lbl: 'Uptime (30d)',  sub: 'guaranteed',    dec: 2 },
  { val: 12,     pre: '<', suf: 'ms', lbl: 'Order Latency', sub: 'avg execution', dec: 0 },
];

export const PROOF_STATS: StatItem[] = [
  { val: 890,    pre: '$', suf: 'M',  lbl: 'Daily Volume',  sub: 'Processed',    dec: 0 },
  { val: 124847, pre: '',  suf: '',   lbl: 'Trades Today',  sub: 'On Platform',  dec: 0, comma: true },
  { val: 99.97,  pre: '',  suf: '%',  lbl: 'Uptime 30-day', sub: 'Guaranteed',   dec: 2 },
  { val: 12,     pre: '<', suf: 'ms', lbl: 'Order Latency', sub: 'Avg Execution',dec: 0 },
  { val: 18,     pre: '',  suf: '+',  lbl: 'Asset Classes', sub: 'Supported',    dec: 0 },
  { val: 47,     pre: '',  suf: '',   lbl: 'Countries',     sub: 'Supported',    dec: 0 },
];

export interface Product {
  id: string;
  nm: string;
  brand: string;
  tag: string;
  tc: string;
  desc: string;
  feats: string[];
  ac: string;
  ic: string;
}

export const PRODUCTS: Product[] = [
  { id: 'web', nm: 'Web Terminal',       brand: 'Obsidian',         tag: 'FOR TRADERS',        tc: 'b',  desc: 'The full trading experience in a browser tab. No install required.',         feats: ['TradingView Charts', 'Full DOM', '18 asset classes'],        ac: '#10D996', ic: 'chart'   },
  { id: 'mob', nm: 'Mobile App',         brand: 'Obsidian Mobile',  tag: 'FOR TRADERS',        tc: 'b',  desc: 'Full feature parity. Built for thumbs, not tolerance.',                     feats: ['8 screens', 'Swipe gestures', 'PWA installable'],           ac: '#10D996', ic: 'phone'   },
  { id: 'dsk', nm: 'Desktop Pro',        brand: 'Obsidian Pro',     tag: 'FOR TRADERS',        tc: 'b',  desc: 'Multi-monitor. Native notifications. No throttling.',                        feats: ['Workspace builder', 'Tray P&L', 'Offline charts'],           ac: '#10D996', ic: 'monitor' },
  { id: 'dlr', nm: 'Dealer Workstation', brand: 'Obsidian Desk',    tag: 'FOR BROKERS',        tc: 'bl', desc: 'The nerve center for your dealing desk team.',                              feats: ['Live order flow', 'B/A-Book routing', 'Risk gauges'],        ac: '#3B82F6', ic: 'bolt'    },
  { id: 'adm', nm: 'Broker Admin',       brand: 'Obsidian Command', tag: 'FOR BROKERS',        tc: 'bl', desc: 'Every operational tool to run your broker from one screen.',                feats: ['CRM', 'KYC', 'Finance', 'Reports'],                         ac: '#3B82F6', ic: 'grid'    },
  { id: 'ib',  nm: 'IB Portal',          brand: 'Obsidian Partners',tag: 'FOR BROKERS',        tc: 'bl', desc: 'Turn your affiliates into a distribution machine.',                        feats: ['Commission tracking', 'Sub-IB trees', 'Mktg kit'],          ac: '#3B82F6', ic: 'nodes'   },
  { id: 'hub', nm: 'Platform Hub',       brand: 'Obsidian Hub',     tag: 'PLATFORM OWNER',     tc: 'go', desc: 'Manage every tenant from one command center.',                             feats: ['Tenant billing', 'LP routing', 'Platform health'],           ac: '#F59E0B', ic: 'hex'     },
  { id: 'mir', nm: 'Copy Trading',       brand: 'Obsidian Mirror',  tag: 'TRADERS + BROKERS',  tc: 'p',  desc: 'Let your clients trade the best traders. Automatically.',                  feats: ['Signal marketplace', 'Risk controls', 'Perf fees'],         ac: '#8B5CF6', ic: 'mirror'  },
  { id: 'wgt', nm: 'Browser Extension',  brand: 'Obsidian Widget',  tag: 'FOR TRADERS',        tc: 'b',  desc: 'Live prices and quick trades while you browse the web.',                  feats: ['Price alerts', 'Quick trade', 'Portfolio glance'],           ac: '#10D996', ic: 'puzzle'  },
];

export interface PricingTier {
  id: string;
  nm: string;
  mo: number | null;
  yr: number | null;
  cl: string;
  hi: boolean;
  badge: string | null;
  feats: string[];
  cta: string;
  ghost: boolean;
}

export const PRICING: PricingTier[] = [
  { id: 'str', nm: 'Starter',    mo: 500,  yr: 400,  cl: 'Up to 100 clients',   hi: false, badge: null,           feats: ['Basic instruments', 'Web terminal', 'Broker admin', 'Email support', '1 LP integration', 'Standard KYC'],               cta: 'Get Started',    ghost: true  },
  { id: 'gro', nm: 'Growth',     mo: 1200, yr: 960,  cl: 'Up to 500 clients',   hi: false, badge: null,           feats: ['All instruments', 'Web terminal', '+ Mobile app', '+ IB Portal', 'Chat support', '3 LP integrations'],                  cta: 'Get Started',    ghost: true  },
  { id: 'pro', nm: 'Pro',        mo: 2500, yr: 2000, cl: 'Up to 2,000 clients', hi: true,  badge: 'MOST POPULAR', feats: ['All instruments', 'All 9 products', '+ Desktop Pro', '+ Copy Trading', 'Dedicated AM', 'Priority 24/7'],                cta: 'Get Started',    ghost: false },
  { id: 'ent', nm: 'Enterprise', mo: null, yr: null,  cl: 'Unlimited clients',   hi: false, badge: null,           feats: ['Everything in Pro', 'Custom infrastructure', 'SLA 99.99%', 'White-glove setup', 'Custom integrations', 'Dedicated engineers'], cta: 'Contact Sales', ghost: true  },
];

export interface FaqItem { q: string; a: string; }

export const FAQS: FaqItem[] = [
  { q: 'Is the entire platform truly white-labeled?',       a: "Yes. Your domain, your logo, your colors, your brand name. Clients never see the word 'Obsidian'. Every email, every PDF statement, every push notification — your brand." },
  { q: 'What payment methods do you accept?',               a: 'All major cards, wire transfer, SEPA, and USDT. Annual subscriptions can be invoiced with net-30 terms for Enterprise clients.' },
  { q: 'How long does onboarding take?',                    a: 'Our record is 6 days. Average is 3 weeks. A dedicated onboarding manager is included on all plans — not a ticketing system, a person.' },
  { q: 'Do you provide liquidity?',                         a: 'We integrate with LMAX, Integral, Currenex, and 8 other LPs. You bring your LP relationship; we handle the technical bridge. FIX 4.4 connectivity included.' },
  { q: 'Is the platform FCA/CySEC/ASIC compliant?',         a: 'The platform is built for compliance, not around it. KYC, AML, leverage caps, negative balance protection, and MiFID II reporting are all built in and configurable per jurisdiction.' },
];

export interface Testimonial { q: string; nm: string; ti: string; lo: string; in: string; }

export const TESTI: Testimonial[] = [
  { q: "We launched our regulated FX broker in 6 weeks. Our previous vendor took 18 months and still couldn't give us a mobile app. Obsidian gave us 9 products on day one.", nm: 'Marcus Webb',        ti: 'CEO, GlobalFX Pro',          lo: 'Dubai, UAE',  in: 'MW' },
  { q: 'The dealer workstation alone replaced three separate tools we were paying for. Risk management, execution blotter, client monitoring — all in one screen.',           nm: 'Sarah Kim',          ti: 'Head of Operations, ArcaFX Markets', lo: 'London, UK',  in: 'SK' },
  { q: 'The IB portal is why our partners stay with us. Commission is paid automatically, statements are professional, and the multi-tier tracking is flawless. We went from 12 IBs to 89 in one year.', nm: 'Ahmed Al-Mansouri', ti: 'Founder, NovaTrade', lo: 'Riyadh, SA', in: 'AA' },
];

export const TECHS: string[] = ['Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'Kubernetes', 'AWS', 'TradingView', 'FIX 4.4', 'WebSocket', 'Docker', 'Terraform'];

export interface PerfRow { l: string; v: string; }

export const PERFS: PerfRow[] = [
  { l: 'Order processing latency',   v: '< 12ms average, < 50ms P99' },
  { l: 'WebSocket message delivery', v: '< 8ms to client after fill' },
  { l: 'Price feed update frequency', v: '100ms (10× per second)' },
  { l: 'System throughput capacity', v: '50,000 trades per second' },
  { l: 'Trade history retention',    v: '7 years — immutable audit log' },
  { l: 'Backup frequency',           v: 'Every 6 hours, 3 geographic regions' },
];

export interface Jurisdiction { f: string; c: string; r: string; }

export const JURISDICTIONS: Jurisdiction[] = [
  { f: '🇬🇧', c: 'UK',          r: 'FCA'   },
  { f: '🇨🇾', c: 'Cyprus',      r: 'CySEC' },
  { f: '🇦🇺', c: 'Australia',   r: 'ASIC'  },
  { f: '🇦🇪', c: 'UAE',         r: 'DFSA'  },
  { f: '🇸🇨', c: 'Seychelles',  r: 'FSA'   },
  { f: '🇻🇬', c: 'BVI',         r: 'FSC'   },
  { f: '🇰🇾', c: 'Cayman',      r: 'CIMA'  },
  { f: '🇿🇦', c: 'S.Africa',    r: 'FSCA'  },
  { f: '🇸🇬', c: 'Singapore',   r: 'MAS'   },
  { f: '🇨🇭', c: 'Switzerland', r: 'FINMA' },
  { f: '🇲🇺', c: 'Mauritius',   r: 'FSC'   },
  { f: '🇧🇸', c: 'Bahamas',     r: 'SCB'   },
];

export interface Step { n: number; t: string; h: string; d: string; }

export const STEPS: Step[] = [
  { n: 1, t: 'Day 1',      h: 'Discovery Call',    d: '30 minutes. We learn your market, target clients, jurisdiction, and LP relationships. No sales pitch — just architecture planning.' },
  { n: 2, t: 'Day 2–3',   h: 'Demo + Contract',   d: 'See the full platform live. Sign contracts. Your dedicated onboarding manager is assigned immediately.' },
  { n: 3, t: 'Days 4–10', h: 'Technical Setup',   d: 'Domain configuration, branding, instruments, pricing rules, LP integration. We do the heavy lifting. You review and approve.' },
  { n: 4, t: 'Days 11–17',h: 'UAT & Compliance',  d: 'User acceptance testing. Compliance sign-off. Team training sessions. Marketing materials prepared and reviewed.' },
  { n: 5, t: 'Day 18–21', h: 'Go Live',           d: 'Your branded platform is live. Clients can register, verify, deposit, and trade. Obsidian infrastructure handles everything else.' },
];

export interface HeroPhrase { txt: string; col: string; }

export const PHRASES: HeroPhrase[] = [
  { txt: 'brokers deserve.',     col: '#E2E8F0' },
  { txt: 'traders demand.',      col: '#3B82F6' },
  { txt: 'institutions trust.',  col: '#10D996' },
  { txt: 'the world runs on.',   col: '#F59E0B' },
];

export const BROKER_BEN: string[] = [
  'Full white-label — your brand, your domain, your colors',
  'All 9 platform products included under one subscription',
  'Built-in KYC, AML, and regulatory compliance tooling',
  'Dealer workstation + admin panel + IB portal — day one',
  'Multi-tier IB and affiliate management system',
  '24/7 infrastructure. 99.97% uptime SLA.',
];

export const TRADER_BEN: string[] = [
  'Sub-12ms order execution from any device',
  '18+ asset classes: FX, crypto, indices, commodities',
  'Desktop Pro app — multi-monitor, native alerts, tray P&L',
  'Mobile app with full feature parity — not a stripped version',
  'TradingView charts with all timeframes and indicators',
  'Copy the best traders with one click — Obsidian Mirror',
];

export interface MiniStat { v: string; l: string; s: string; }

export const IB_STATS: MiniStat[] = [
  { v: '47%',   l: 'of client volume', s: 'via IBs avg' },
  { v: '$0',    l: 'commission delay', s: 'guaranteed'  },
  { v: '3-tier',l: 'network depth',   s: 'supported'   },
];

export const MIR_STATS: MiniStat[] = [
  { v: '847',    l: 'avg copiers',       s: 'per top strategy' },
  { v: '+28.4%', l: 'avg top trader',    s: 'return 12-month'  },
  { v: '20%',    l: 'perf fee model',    s: 'built in'         },
];

export interface TrustLogo { l: string; w: number; }

export const TRUST_LOGOS: TrustLogo[] = [
  { l: 'FT',       w: 48 }, { l: 'Bloomberg', w: 96 }, { l: 'Reuters',  w: 80 },
  { l: 'LMAX',     w: 64 }, { l: 'Integral',  w: 72 }, { l: 'FSA',      w: 52 },
  { l: 'CySEC',    w: 68 }, { l: 'ASIC',      w: 56 }, { l: 'FCA',      w: 48 },
];

export interface StoryFrame { h: string; b: string; v: string; }
export interface Story { id: string; ti: string; frames: StoryFrame[]; }

export const STORIES: Story[] = [
  { id: 'charts', ti: 'Charts & Analysis', frames: [
    { h: 'See everything.',            b: "TradingView Lightweight Charts — the same engine used by Bloomberg, TradingView.com, and the world's largest brokers. Every timeframe from 1 minute to monthly.", v: 'chart'      },
    { h: 'Indicators that traders actually use.', b: 'MA, EMA, MACD, RSI, Bollinger Bands, VWAP, Ichimoku, ATR, Stochastic — all built in. Stacked. Customizable.', v: 'indicators' },
    { h: 'Draw. Annotate. Strategize.', b: 'Trendlines, Fibonacci, rectangles, text notes. Saved per symbol, synced across every device you own.', v: 'drawings'   },
    { h: 'Multi-timeframe. Multi-symbol.', b: 'Split your screen. Compare timeframes. The professional workflow, finally on the web.', v: 'multi'      },
  ]},
  { id: 'exec', ti: 'Order Execution', frames: [
    { h: 'Fast is a feature.',         b: 'Sub-12ms order processing. Not as a benchmark — as a guarantee written into your SLA. Measured. Monitored. Contractual.', v: 'latency'    },
    { h: 'Every order type, handled.', b: 'Market. Limit. Stop. Stop Limit. Trailing Stop. OCO. Fill or Kill. Professional-grade execution logic.', v: 'ordertypes' },
    { h: 'One click. Confirmed.',      b: 'Hold-to-confirm on mobile. One-click mode on desktop. Configurable per account type. Never an accidental trade.', v: 'oneclick'   },
    { h: 'Requote. Reject. Route. Automated.', b: 'Define your execution policy per instrument and per client group. Auto-accept, auto-STP, auto-hedge.', v: 'routing'    },
  ]},
  { id: 'risk', ti: 'Risk & Infrastructure', frames: [
    { h: "Know your exposure before it knows you.", b: "Real-time book aggregation. Live exposure gauges. Automated hedge triggers. The risk you don't know about is the risk that ends brokers.", v: 'gauges' },
    { h: 'A-Book. B-Book. The choice is yours.',   b: 'Route per symbol, per client group, per trade size. Smart Order Routing across multiple LPs.', v: 'abook'  },
    { h: '99.97% uptime. A contractual SLA.',       b: 'Redundant infrastructure. Automatic failover. Real-time health monitoring.', v: 'status' },
    { h: 'Scale from 50 clients to 50,000.',        b: 'The same infrastructure that handles 50 clients handles 50,000. Auto-scaling. No re-platforming. Ever.', v: 'scale'  },
  ]},
];

export interface NavLink { l: string; h: string; }

export const NAV_LINKS: NavLink[] = [
  { l: 'Platform', h: '#ecosystem' },
  { l: 'Pricing',  h: '#pricing'   },
  { l: 'Brokers',  h: '#brokers'   },
  { l: 'Traders',  h: '#traders'   },
  { l: 'Globe',    h: '#globe'     },
  { l: 'Blog',     h: '#'          },
];
