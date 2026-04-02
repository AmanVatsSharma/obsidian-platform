import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════ */
const IB = {
  name: "James Liu", tier: "SILVER", broker: "ArcaFX Markets",
  since: "Jan 2024", code: "ARC-JL-4821", avatar: "JL",
  earningsMTD: 8240, pendingPayout: 8240, nextPayment: "Mar 31, 2026",
  allTimeEarnings: 42800, allTimeClients: 312, volumeMTD: 2400000,
  activeClients: 32, newClients: 6, dormantClients: 11,
  toGold: 10000, goldUnlocks: "+0.5 pip/lot · Priority Support · Dedicated AM",
};

const sparklineData = [210,195,280,310,260,390,420,480,510,560,620,580,640,700,720,810,760,830,880,920,860,940,990,1050,1020,1100,1080,1150,1200,1240];

const kpiCards = [
  { label: "Active Clients", value: "32", sub: "trading in last 30d", icon: "👥", trend: +4 },
  { label: "Volume MTD", value: "$2.4M", sub: "across all instruments", icon: "📊", trend: +12 },
  { label: "New Clients", value: "6", sub: "joined this month", icon: "✨", trend: +2 },
  { label: "Projected MTD", value: "$9,100", sub: "at current rate", icon: "🎯", trend: +10.5 },
];

const earningsBarData = [
  { month: "Oct", direct: 3800, subib: 620 },
  { month: "Nov", direct: 4200, subib: 810 },
  { month: "Dec", direct: 3600, subib: 740 },
  { month: "Jan", direct: 5100, subib: 920 },
  { month: "Feb", direct: 6400, subib: 1180 },
  { month: "Mar", direct: 6900, subib: 1340 },
];

const topClients = [
  { rank: 1, name: "Sarah K.", volume: 284000, trades: 142, commission: 1840, status: "ACTIVE", link: "YouTube Bio", joined: "Feb 2024" },
  { rank: 2, name: "Michael T.", volume: 198000, trades: 98, commission: 1240, status: "ACTIVE", link: "Telegram", joined: "Mar 2024" },
  { rank: 3, name: "Priya M.", volume: 176000, trades: 87, commission: 1080, status: "ACTIVE", link: "YouTube Bio", joined: "Jan 2024" },
  { rank: 4, name: "Chen W.", volume: 154000, trades: 74, commission: 960, status: "ACTIVE", link: "Email", joined: "Apr 2024" },
  { rank: 5, name: "David R.", volume: 132000, trades: 68, commission: 820, status: "ACTIVE", link: "Instagram", joined: "May 2024" },
  { rank: 6, name: "Fatima A.", volume: 98000, trades: 52, commission: 610, status: "DORMANT", link: "Telegram", joined: "Jun 2024" },
  { rank: 7, name: "James O.", volume: 87000, trades: 44, commission: 540, status: "ACTIVE", link: "YouTube Bio", joined: "Jul 2024" },
  { rank: 8, name: "Liu Y.", volume: 76000, trades: 39, commission: 480, status: "ACTIVE", link: "Email", joined: "Aug 2024" },
  { rank: 9, name: "Emma S.", volume: 61000, trades: 31, commission: 380, status: "DORMANT", link: "Instagram", joined: "Sep 2024" },
  { rank: 10, name: "Omar H.", volume: 48000, trades: 24, commission: 290, status: "ACTIVE", link: "Telegram", joined: "Oct 2024" },
];

const announcements = [
  { id: 1, date: "Mar 15", tag: "NEW", text: "New instrument added: NVDA stock CFD — effective April 1" },
  { id: 2, date: "Mar 10", tag: "UPDATE", text: "Commission rates updated for Q2 — see schedule" },
  { id: 3, date: "Mar 5", tag: "MARKETING", text: "New marketing materials available for download" },
];

const commissionSchedule = [
  { instrument: "Forex Majors", rate: "$8.00 per lot", icon: "💱" },
  { instrument: "Forex Minors", rate: "$6.00 per lot", icon: "🌐" },
  { instrument: "Gold / Silver", rate: "$10.00 per lot", icon: "🥇" },
  { instrument: "Indices", rate: "$5.00 per lot", icon: "📈" },
  { instrument: "Crypto CFDs", rate: "$7.00 per lot", icon: "₿" },
];

const statementRows = [
  { date: "Mar 19", client: "Sarah K.", instrument: "EUR/USD", side: "BUY", lots: 2.5, rate: 8, commission: 20, type: "Direct", status: "PENDING" },
  { date: "Mar 18", client: "Michael T.", instrument: "XAU/USD", side: "SELL", lots: 1.0, rate: 10, commission: 10, type: "Direct", status: "PENDING" },
  { date: "Mar 18", client: "Maria S.", instrument: "GBP/USD", side: "BUY", lots: 3.0, rate: 8, commission: 24, type: "Sub-IB", status: "PENDING" },
  { date: "Mar 17", client: "Priya M.", instrument: "BTC/USD", side: "BUY", lots: 1.5, rate: 7, commission: 10.5, type: "Direct", status: "PENDING" },
  { date: "Mar 16", client: "Sophie C.", instrument: "S&P 500", side: "BUY", lots: 4.0, rate: 5, commission: 20, type: "Sub-IB", status: "PENDING" },
  { date: "Mar 15", client: "Chen W.", instrument: "EUR/USD", side: "SELL", lots: 2.0, rate: 8, commission: 16, type: "Direct", status: "PENDING" },
];

const monthlyEarnings = [
  { month: "Mar 2026", clients: 32, lots: 1030, commission: 8240, change: +14, status: "PENDING" },
  { month: "Feb 2026", clients: 29, lots: 956, commission: 7580, change: +18, status: "PAID" },
  { month: "Jan 2026", clients: 26, lots: 810, commission: 6420, change: +8, status: "PAID" },
  { month: "Dec 2025", clients: 24, lots: 748, commission: 5940, change: -4, status: "PAID" },
  { month: "Nov 2025", clients: 25, lots: 762, commission: 6180, change: +24, status: "PAID" },
  { month: "Oct 2025", clients: 21, lots: 614, commission: 4980, change: +12, status: "PAID" },
];

const payments = [
  { period: "Feb 2026", amount: 7580, method: "Bank Transfer", ref: "PAY-2026-02-JL", date: "Mar 5, 2026", status: "PAID" },
  { period: "Jan 2026", amount: 6420, method: "Bank Transfer", ref: "PAY-2026-01-JL", date: "Feb 5, 2026", status: "PAID" },
  { period: "Dec 2025", amount: 5940, method: "Bank Transfer", ref: "PAY-2025-12-JL", date: "Jan 5, 2026", status: "PAID" },
  { period: "Nov 2025", amount: 6180, method: "Bank Transfer", ref: "PAY-2025-11-JL", date: "Dec 5, 2025", status: "PAID" },
  { period: "Oct 2025", amount: 4980, method: "USDT Wallet", ref: "PAY-2025-10-JL", date: "Nov 5, 2025", status: "PAID" },
  { period: "Sep 2025", amount: 3920, method: "Bank Transfer", ref: "PAY-2025-09-JL", date: "Oct 5, 2025", status: "PAID" },
];

const allClients = [
  { name: "Sarah K.", joined: "Feb 2024", type: "Standard", volumeMTD: 284000, tradesMTD: 142, commission: 1840, lastTrade: "Today", status: "ACTIVE", link: "YouTube Bio" },
  { name: "Michael T.", joined: "Mar 2024", type: "Standard", volumeMTD: 198000, tradesMTD: 98, commission: 1240, lastTrade: "Today", status: "ACTIVE", link: "Telegram" },
  { name: "Priya M.", joined: "Jan 2024", type: "Premium", volumeMTD: 176000, tradesMTD: 87, commission: 1080, lastTrade: "Yesterday", status: "ACTIVE", link: "YouTube Bio" },
  { name: "Chen W.", joined: "Apr 2024", type: "Standard", volumeMTD: 154000, tradesMTD: 74, commission: 960, lastTrade: "Yesterday", status: "ACTIVE", link: "Email" },
  { name: "David R.", joined: "May 2024", type: "Standard", volumeMTD: 132000, tradesMTD: 68, commission: 820, lastTrade: "2d ago", status: "ACTIVE", link: "Instagram" },
  { name: "Fatima A.", joined: "Jun 2024", type: "Standard", volumeMTD: 0, tradesMTD: 0, commission: 0, lastTrade: "45d ago", status: "DORMANT", link: "Telegram" },
  { name: "Emma S.", joined: "Sep 2024", type: "Standard", volumeMTD: 0, tradesMTD: 0, commission: 0, lastTrade: "38d ago", status: "DORMANT", link: "Instagram" },
  { name: "Alex P.", joined: "Nov 2024", type: "Standard", volumeMTD: 0, tradesMTD: 0, commission: 0, lastTrade: "Never", status: "UNVERIFIED", link: "YouTube Bio" },
  { name: "Yuki T.", joined: "Dec 2024", type: "Premium", volumeMTD: 0, tradesMTD: 0, commission: 0, lastTrade: "Never", status: "UNVERIFIED", link: "Email" },
  { name: "Omar H.", joined: "Oct 2024", type: "Standard", volumeMTD: 48000, tradesMTD: 24, commission: 290, lastTrade: "3d ago", status: "ACTIVE", link: "Telegram" },
];

const subIBs = [
  { id: 1, name: "Sophie Chen", initials: "SC", tier: 1, clients: 18, volumeMTD: 1680000, earnings: 2100, myOverride: 420, joined: "Mar 2024", status: "ACTIVE", children: [] },
  { id: 2, name: "Maria Santos", initials: "MS", tier: 1, clients: 12, volumeMTD: 990000, earnings: 1240, myOverride: 248, joined: "Apr 2024", status: "ACTIVE", children: [
    { id: 4, name: "David Park", initials: "DP", tier: 2, clients: 3, volumeMTD: 224000, earnings: 280, myOverride: 28, joined: "Jul 2024", status: "ACTIVE", children: [] }
  ]},
  { id: 3, name: "Ahmed Al-Rashid", initials: "AA", tier: 1, clients: 8, volumeMTD: 712000, earnings: 890, myOverride: 178, joined: "May 2024", status: "ACTIVE", children: [] },
];

const referralLinks = [
  { name: "YouTube Bio", short: "arcafx.com/y/jl-yt", clicks: 1247, signups: 34, verified: 28, deposited: 22, volume: 1240000, commission: 4820, conv: 2.7, active: true },
  { name: "Telegram Group", short: "arcafx.com/y/jl-tg", clicks: 834, signups: 19, verified: 15, deposited: 12, volume: 680000, commission: 2140, conv: 1.9, active: true },
  { name: "Instagram", short: "arcafx.com/y/jl-ig", clicks: 412, signups: 8, verified: 6, deposited: 4, volume: 210000, commission: 680, conv: 1.4, active: true },
  { name: "Email Campaign", short: "arcafx.com/y/jl-em", clicks: 289, signups: 22, verified: 18, deposited: 16, volume: 890000, commission: 2800, conv: 5.9, active: true },
];

const linkSignupHistory = [
  [4,2,1,3,5,3,4,6,4,5,7,6,8,5,4,6,9,7,8,6,7,9,8,10,9,11,8,9,10,12],
  [1,2,1,1,2,3,1,2,1,2,3,2,1,2,3,2,3,1,2,2,1,3,2,2,1,2,3,2,1,2],
  [0,1,0,1,1,0,1,0,0,1,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1],
  [2,1,2,3,2,1,2,3,1,2,2,3,2,1,3,2,3,2,1,2,3,2,1,2,3,1,2,3,2,1],
];

const marketingBanners = [
  { name: "Leaderboard", size: "728×90", type: "PNG/HTML" },
  { name: "Rectangle", size: "300×250", type: "PNG/HTML" },
  { name: "Skyscraper", size: "160×600", type: "PNG/HTML" },
  { name: "Mobile Banner", size: "320×50", type: "PNG" },
  { name: "Social Square", size: "1080×1080", type: "PNG" },
  { name: "Social Story", size: "1080×1920", type: "PNG" },
];

const emailTemplates = [
  { name: "Welcome to Trading", subject: "Start your trading journey today 🚀", tag: "Onboarding" },
  { name: "Market Update", subject: "This week in markets — key moves to watch", tag: "Content" },
  { name: "New Instrument", subject: "Now available: NVDA CFD on ArcaFX", tag: "Product" },
  { name: "Reactivation", subject: "We miss you — markets are moving", tag: "Retention" },
  { name: "Webinar Invite", subject: "Free webinar: Mastering EUR/USD this quarter", tag: "Event" },
];

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-base: #06080A;
    --bg-surface: #0C0E12;
    --bg-surface2: #0F1216;
    --bg-surface3: #13161B;
    --bg-hover: #1A1E25;
    --bull: #10D996;
    --bull-dim: rgba(16,217,150,0.12);
    --bear: #FF3B5C;
    --bear-dim: rgba(255,59,92,0.12);
    --accent: #3B82F6;
    --accent-dim: rgba(59,130,246,0.12);
    --warn: #F59E0B;
    --warn-dim: rgba(245,158,11,0.12);
    --silver: #94A3B8;
    --gold: #F59E0B;
    --platinum: #E2E8F0;
    --text-primary: #E8EDF3;
    --text-secondary: #6B7A8E;
    --text-muted: #3D4A59;
    --border: rgba(255,255,255,0.06);
    --border-bright: rgba(255,255,255,0.12);
    --font-data: 'IBM Plex Mono', monospace;
    --font-display: 'Syne', sans-serif;
    --font-ui: 'DM Sans', sans-serif;
    --radius: 10px;
    --radius-sm: 6px;
    --sidebar-w: 220px;
    --topbar-h: 56px;
    --transition: 0.18s ease;
  }

  html, body, #root { height: 100%; background: var(--bg-base); color: var(--text-primary); font-family: var(--font-ui); }
  * { scrollbar-width: thin; scrollbar-color: var(--bg-surface3) transparent; }
  *::-webkit-scrollbar { width: 4px; height: 4px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: var(--bg-surface3); border-radius: 4px; }

  .obsidian-portal { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

  /* TOPBAR */
  .topbar {
    height: var(--topbar-h); min-height: var(--topbar-h);
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; gap: 16px; position: relative; z-index: 100;
    backdrop-filter: blur(12px);
  }
  .topbar-brand { display: flex; align-items: center; gap: 10px; }
  .topbar-logo {
    font-family: var(--font-display); font-weight: 800; font-size: 17px;
    background: linear-gradient(135deg, var(--accent), var(--bull));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: -0.3px;
  }
  .topbar-divider { width: 1px; height: 20px; background: var(--border-bright); }
  .topbar-label { font-size: 11px; color: var(--text-secondary); letter-spacing: 1.5px; text-transform: uppercase; font-family: var(--font-data); }
  .topbar-actions { display: flex; align-items: center; gap: 8px; }
  .topbar-btn {
    width: 36px; height: 36px; border-radius: var(--radius-sm);
    background: var(--bg-surface2); border: 1px solid var(--border);
    color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 15px; transition: var(--transition);
  }
  .topbar-btn:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-bright); }
  .topbar-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), #6366F1);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-data); font-size: 11px; font-weight: 600;
    color: white; cursor: pointer; border: 2px solid var(--border-bright);
    letter-spacing: 0.5px;
  }
  .hamburger { display: none; }

  /* LAYOUT */
  .portal-body { display: flex; flex: 1; overflow: hidden; }

  /* SIDEBAR */
  .sidebar {
    width: var(--sidebar-w); min-width: var(--sidebar-w);
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden;
    transition: width 0.22s ease, min-width 0.22s ease;
    position: relative; z-index: 50;
  }
  .sidebar.collapsed { width: 56px; min-width: 56px; }
  .sidebar.mobile-open { position: absolute; left: 0; top: 0; height: 100%; z-index: 200; }

  .sidebar-profile {
    padding: 20px 14px 16px;
    border-bottom: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 10px;
  }
  .sidebar-collapsed .sidebar-profile { align-items: center; padding: 16px 8px; }
  .profile-row { display: flex; align-items: center; gap: 10px; }
  .profile-avatar {
    width: 38px; height: 38px; min-width: 38px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), #6366F1);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-data); font-size: 12px; font-weight: 600; color: white;
    border: 2px solid rgba(59,130,246,0.4);
  }
  .profile-info { overflow: hidden; }
  .profile-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-broker { font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
  .tier-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 20px;
    font-family: var(--font-data); font-size: 9px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase;
    border: 1px solid; width: fit-content;
  }
  .tier-SILVER { background: rgba(148,163,184,0.1); border-color: rgba(148,163,184,0.3); color: var(--silver); }
  .tier-GOLD { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); color: var(--gold); }
  .tier-PLATINUM { background: rgba(226,232,240,0.1); border-color: rgba(226,232,240,0.3); color: var(--platinum); }
  .tier-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

  .ref-code-row {
    display: flex; align-items: center; gap: 6px;
    background: var(--bg-surface2); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 6px 9px;
  }
  .ref-code-label { font-size: 9px; color: var(--text-muted); font-family: var(--font-data); letter-spacing: 1px; text-transform: uppercase; }
  .ref-code-value { font-family: var(--font-data); font-size: 11px; color: var(--accent); flex: 1; }
  .copy-btn {
    background: none; border: none; color: var(--text-secondary); cursor: pointer;
    font-size: 12px; padding: 2px; border-radius: 3px; transition: var(--transition); line-height: 1;
  }
  .copy-btn:hover { color: var(--bull); }
  .copy-btn.copied { color: var(--bull); }

  /* NAV */
  .sidebar-nav { flex: 1; padding: 12px 0; }
  .nav-section-label {
    font-size: 9px; color: var(--text-muted); letter-spacing: 1.5px;
    text-transform: uppercase; font-family: var(--font-data);
    padding: 10px 16px 4px;
    white-space: nowrap; overflow: hidden;
  }
  .sidebar.collapsed .nav-section-label { display: none; }
  .nav-item {
    display: flex; align-items: center; gap: 9px;
    padding: 8px 16px; cursor: pointer;
    font-size: 13px; color: var(--text-secondary);
    border-radius: 0; transition: var(--transition);
    border-left: 2px solid transparent;
    white-space: nowrap; overflow: hidden;
    position: relative;
  }
  .sidebar.collapsed .nav-item { padding: 10px; justify-content: center; }
  .nav-item:hover { color: var(--text-primary); background: var(--bg-hover); }
  .nav-item.active {
    color: var(--accent); background: var(--accent-dim);
    border-left-color: var(--accent); font-weight: 500;
  }
  .sidebar.collapsed .nav-item.active { border-left-color: transparent; border-radius: var(--radius-sm); }
  .nav-item-icon { font-size: 14px; min-width: 16px; text-align: center; }
  .nav-item-text { flex: 1; }
  .sidebar-collapse-btn {
    padding: 12px 16px; border-top: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px;
    color: var(--text-muted); font-size: 12px; cursor: pointer;
    transition: var(--transition);
  }
  .sidebar-collapse-btn:hover { color: var(--text-secondary); }
  .sidebar.collapsed .sidebar-collapse-btn { justify-content: center; padding: 12px 8px; }

  /* MAIN */
  .main-content { flex: 1; overflow-y: auto; overflow-x: hidden; background: var(--bg-base); }
  .page-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
  .page-header { margin-bottom: 24px; }
  .page-title { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--text-primary); }
  .page-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 3px; }

  /* CARDS */
  .card {
    background: var(--bg-surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px;
  }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .card-title { font-family: var(--font-data); font-size: 10px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-secondary); }
  .card-action { font-size: 12px; color: var(--accent); cursor: pointer; }

  /* EARNINGS HERO */
  .earnings-hero {
    background: linear-gradient(135deg, #0C1220 0%, #080D16 60%, #0A0F14 100%);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 12px; padding: 28px;
    position: relative; overflow: hidden; margin-bottom: 20px;
  }
  .earnings-hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 600px 300px at 80% 50%, rgba(59,130,246,0.05), transparent);
    pointer-events: none;
  }
  .earnings-hero::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.4), rgba(16,217,150,0.3), transparent);
  }
  .hero-grid { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: start; }
  .hero-period { font-family: var(--font-data); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px; }
  .hero-amount { font-family: var(--font-data); font-size: 48px; font-weight: 700; color: var(--bull); line-height: 1; letter-spacing: -2px; }
  .hero-sub { font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: flex; gap: 16px; flex-wrap: wrap; }
  .hero-sub span { display: flex; align-items: center; gap: 5px; }
  .hero-sub .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--text-muted); }
  .hero-payment { text-align: right; }
  .hero-payment-label { font-size: 11px; color: var(--text-secondary); font-family: var(--font-data); letter-spacing: 1px; text-transform: uppercase; }
  .hero-payment-date { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-top: 4px; }
  .hero-payment-amount { font-family: var(--font-data); font-size: 22px; font-weight: 700; color: var(--warn); margin-top: 6px; }
  .hero-payment-sub { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }

  .hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin-top: 24px; border-top: 1px solid var(--border); padding-top: 20px; }
  .hero-stat { }
  .hero-stat-label { font-family: var(--font-data); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 6px; }
  .hero-stat-value { font-family: var(--font-data); font-size: 16px; font-weight: 600; color: var(--text-primary); }
  .hero-stat-sub { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }
  .tier-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(148,163,184,0.1); border: 1px solid rgba(148,163,184,0.25);
    border-radius: 20px; padding: 4px 12px;
    font-family: var(--font-data); font-size: 12px; font-weight: 700;
    color: var(--silver); letter-spacing: 1px;
  }

  /* SPARKLINE */
  .sparkline { width: 100%; height: 48px; }

  /* TIER PROGRESS */
  .tier-progress { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 20px; margin-bottom: 20px; }
  .tier-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .tier-progress-label { font-family: var(--font-data); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-secondary); }
  .tier-progress-amount { font-family: var(--font-data); font-size: 12px; color: var(--warn); }
  .progress-bar-bg { height: 6px; background: var(--bg-surface3); border-radius: 3px; overflow: hidden; }
  .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--bull)); border-radius: 3px; transition: width 1s ease; }
  .tier-unlock-text { font-size: 11px; color: var(--text-muted); margin-top: 8px; }
  .tier-unlock-text strong { color: var(--warn); }

  /* KPI GRID */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .kpi-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; transition: var(--transition); position: relative; overflow: hidden; }
  .kpi-card:hover { border-color: var(--border-bright); }
  .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--accent), var(--bull)); opacity: 0.5; }
  .kpi-icon { font-size: 20px; margin-bottom: 10px; }
  .kpi-value { font-family: var(--font-data); font-size: 24px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
  .kpi-label { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
  .kpi-trend { display: flex; align-items: center; gap: 4px; margin-top: 8px; font-family: var(--font-data); font-size: 11px; }
  .trend-up { color: var(--bull); }
  .trend-down { color: var(--bear); }

  /* CHARTS */
  .charts-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-bottom: 20px; }
  .chart-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
  .chart-title { font-family: var(--font-data); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 16px; }
  .chart-svg { width: 100%; overflow: visible; }
  .chart-legend { display: flex; gap: 16px; margin-top: 12px; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary); }
  .legend-dot { width: 8px; height: 8px; border-radius: 2px; }
  .chart-toggle { display: flex; gap: 2px; }
  .toggle-btn { font-family: var(--font-data); font-size: 10px; padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border); background: none; color: var(--text-secondary); cursor: pointer; transition: var(--transition); }
  .toggle-btn.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }

  /* DONUT */
  .donut-container { display: flex; align-items: center; gap: 20px; }
  .donut-legend { display: flex; flex-direction: column; gap: 10px; }
  .donut-legend-item { display: flex; align-items: center; gap: 8px; }
  .donut-legend-dot { width: 10px; height: 10px; border-radius: 3px; }
  .donut-legend-label { font-size: 12px; color: var(--text-secondary); }
  .donut-legend-val { font-family: var(--font-data); font-size: 13px; color: var(--text-primary); font-weight: 600; }

  /* TABLES */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { font-family: var(--font-data); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
  td { font-size: 13px; color: var(--text-secondary); padding: 11px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; white-space: nowrap; }
  tr:hover td { background: var(--bg-hover); }
  tr.clickable { cursor: pointer; }
  td.mono { font-family: var(--font-data); font-size: 12px; }
  td.primary { color: var(--text-primary); font-weight: 500; }
  td.bull { color: var(--bull); font-family: var(--font-data); font-size: 12px; }
  td.rank { font-family: var(--font-data); font-size: 11px; color: var(--text-muted); text-align: center; }

  /* STATUS BADGES */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-family: var(--font-data); font-size: 10px; font-weight: 700; letter-spacing: 0.8px; white-space: nowrap; }
  .badge-ACTIVE, .badge-PAID { background: var(--bull-dim); color: var(--bull); border: 1px solid rgba(16,217,150,0.2); }
  .badge-DORMANT, .badge-PENDING { background: var(--warn-dim); color: var(--warn); border: 1px solid rgba(245,158,11,0.2); }
  .badge-SUSPENDED, .badge-FAILED, .badge-REJECTED { background: var(--bear-dim); color: var(--bear); border: 1px solid rgba(255,59,92,0.2); }
  .badge-UNVERIFIED, .badge-PROCESSING { background: var(--accent-dim); color: var(--accent); border: 1px solid rgba(59,130,246,0.2); }
  .badge-NEW { background: rgba(139,92,246,0.15); color: #A78BFA; border: 1px solid rgba(139,92,246,0.25); }
  .badge-UPDATE { background: var(--accent-dim); color: var(--accent); border: 1px solid rgba(59,130,246,0.2); }
  .badge-MARKETING { background: rgba(236,72,153,0.12); color: #F472B6; border: 1px solid rgba(236,72,153,0.2); }
  .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

  /* ANNOUNCEMENTS */
  .announcements-strip { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .announcement-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .announcement-item:last-child { border-bottom: none; }
  .announcement-date { font-family: var(--font-data); font-size: 11px; color: var(--text-muted); min-width: 40px; }
  .announcement-text { font-size: 13px; color: var(--text-secondary); flex: 1; }

  /* TABS */
  .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
  .tab-btn {
    font-family: var(--font-ui); font-size: 13px; font-weight: 500;
    padding: 10px 16px; background: none; border: none; cursor: pointer;
    color: var(--text-secondary); border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: var(--transition);
  }
  .tab-btn:hover { color: var(--text-primary); }
  .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

  /* COMMISSION CARD */
  .commission-card { background: var(--bg-surface2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 20px; }
  .commission-title { font-family: var(--font-data); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 16px; }
  .commission-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .commission-row:last-child { border-bottom: none; }
  .comm-instr { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); }
  .comm-rate { font-family: var(--font-data); font-size: 13px; font-weight: 600; color: var(--bull); }
  .commission-footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border-top: 1px solid var(--border); margin-top: 8px; }
  .comm-footer-item { background: var(--bg-surface2); padding: 12px 16px; }
  .comm-footer-label { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
  .comm-footer-val { font-family: var(--font-data); font-size: 13px; color: var(--text-primary); font-weight: 600; }

  /* FILTERS */
  .filter-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .filter-btn { font-size: 12px; padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border); background: none; color: var(--text-secondary); cursor: pointer; transition: var(--transition); font-family: var(--font-ui); }
  .filter-btn:hover { border-color: var(--border-bright); color: var(--text-primary); }
  .filter-btn.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
  .search-input {
    background: var(--bg-surface2); border: 1px solid var(--border); border-radius: var(--radius-sm);
    padding: 7px 12px; font-size: 13px; color: var(--text-primary); font-family: var(--font-ui);
    width: 200px; transition: var(--transition);
  }
  .search-input:focus { outline: none; border-color: var(--accent); }
  .search-input::placeholder { color: var(--text-muted); }
  .ml-auto { margin-left: auto; }

  /* BUTTONS */
  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; cursor: pointer; transition: var(--transition); border: none; font-family: var(--font-ui); }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #2563EB; }
  .btn-secondary { background: var(--bg-surface2); border: 1px solid var(--border); color: var(--text-secondary); }
  .btn-secondary:hover { border-color: var(--border-bright); color: var(--text-primary); }
  .btn-bull { background: var(--bull-dim); border: 1px solid rgba(16,217,150,0.25); color: var(--bull); }
  .btn-bull:hover { background: rgba(16,217,150,0.2); }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .btn-icon { width: 30px; height: 30px; padding: 0; justify-content: center; }

  /* SUB-IB TREE */
  .tree-node { margin-left: 0; }
  .tree-node-child { margin-left: 28px; position: relative; }
  .tree-node-child::before { content: ''; position: absolute; left: -16px; top: 24px; width: 16px; height: 1px; background: var(--border-bright); }
  .tree-node-child::after { content: ''; position: absolute; left: -16px; top: 0; width: 1px; height: 24px; background: var(--border-bright); }
  .tree-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 14px; transition: var(--transition); }
  .tree-card:hover { border-color: var(--border-bright); }
  .tree-avatar { width: 36px; height: 36px; min-width: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #3B82F6); display: flex; align-items: center; justify-content: center; font-family: var(--font-data); font-size: 11px; font-weight: 600; color: white; }
  .tree-info { flex: 1; }
  .tree-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .tree-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; font-family: var(--font-data); }
  .tree-stats { display: flex; gap: 20px; align-items: center; }
  .tree-stat { text-align: right; }
  .tree-stat-val { font-family: var(--font-data); font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .tree-stat-label { font-size: 10px; color: var(--text-muted); margin-top: 2px; font-family: var(--font-data); }
  .override-pill { background: rgba(16,217,150,0.1); border: 1px solid rgba(16,217,150,0.2); border-radius: 20px; padding: 2px 10px; font-family: var(--font-data); font-size: 11px; color: var(--bull); }

  /* REFERRAL LINKS */
  .link-row { background: var(--bg-surface2); border-radius: var(--radius-sm); padding: 14px 16px; border: 1px solid var(--border); margin-bottom: 8px; }
  .link-row:hover { border-color: var(--border-bright); }
  .link-name { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
  .link-url { font-family: var(--font-data); font-size: 11px; color: var(--accent); }
  .link-stats-row { display: flex; gap: 20px; margin-top: 10px; flex-wrap: wrap; }
  .link-stat { }
  .link-stat-val { font-family: var(--font-data); font-size: 14px; font-weight: 600; color: var(--text-primary); }
  .link-stat-label { font-size: 10px; color: var(--text-muted); margin-top: 1px; font-family: var(--font-data); letter-spacing: 0.5px; }
  .funnel-bar { height: 4px; border-radius: 2px; margin-top: 12px; background: var(--bg-surface3); overflow: hidden; display: flex; gap: 2px; }
  .funnel-seg { height: 100%; border-radius: 1px; }
  .conv-badge { font-family: var(--font-data); font-size: 12px; padding: 2px 8px; border-radius: 4px; }
  .conv-best { background: var(--bull-dim); color: var(--bull); }
  .conv-good { background: var(--accent-dim); color: var(--accent); }
  .conv-avg { background: var(--warn-dim); color: var(--warn); }

  /* REFERRAL PERFORMANCE CHART */
  .link-perf-chart { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 20px; }

  /* MARKETING */
  .banner-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .banner-card { background: var(--bg-surface2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: var(--transition); }
  .banner-card:hover { border-color: var(--border-bright); }
  .banner-preview { height: 100px; display: flex; align-items: center; justify-content: center; position: relative; }
  .banner-canvas { border-radius: 0; }
  .banner-info { padding: 12px; }
  .banner-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
  .banner-size { font-family: var(--font-data); font-size: 10px; color: var(--text-muted); margin-top: 2px; }
  .banner-actions { display: flex; gap: 6px; margin-top: 10px; }

  /* EMAIL TEMPLATES */
  .template-card { background: var(--bg-surface2); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 16px; }
  .template-icon { font-size: 24px; }
  .template-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .template-subject { font-size: 12px; color: var(--text-secondary); margin-top: 3px; font-style: italic; }
  .template-actions { display: flex; gap: 8px; margin-left: auto; }

  /* LANDING PAGE */
  .landing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .lp-template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .lp-template-card { background: var(--bg-surface2); border: 2px solid var(--border); border-radius: var(--radius); padding: 14px; text-align: center; cursor: pointer; transition: var(--transition); }
  .lp-template-card:hover { border-color: var(--border-bright); }
  .lp-template-card.selected { border-color: var(--accent); background: var(--accent-dim); }
  .lp-template-icon { font-size: 28px; margin-bottom: 8px; }
  .lp-template-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
  .lp-config { }
  .form-group { margin-bottom: 14px; }
  .form-label { font-family: var(--font-data); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; display: block; }
  .form-input { width: 100%; background: var(--bg-surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 9px 12px; font-size: 13px; color: var(--text-primary); font-family: var(--font-ui); transition: var(--transition); }
  .form-input:focus { outline: none; border-color: var(--accent); }
  .lp-preview { background: var(--bg-surface2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .lp-preview-header { padding: 14px 16px; border-bottom: 1px solid var(--border); font-family: var(--font-data); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; }
  .lp-preview-live { width: 6px; height: 6px; border-radius: 50%; background: var(--bull); display: inline-block; margin-right: 6px; }
  .lp-preview-content { padding: 24px; min-height: 340px; background: linear-gradient(135deg, #0a0d12, #070910); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .lp-preview-headline { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
  .lp-preview-sub { font-size: 13px; color: var(--text-secondary); max-width: 260px; margin-bottom: 20px; }
  .lp-preview-cta { background: var(--accent); color: white; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; }
  .lp-stats-row { display: flex; gap: 12px; margin-top: 16px; }
  .lp-stat { flex: 1; background: var(--bg-surface3); border-radius: var(--radius-sm); padding: 12px; text-align: center; }
  .lp-stat-val { font-family: var(--font-data); font-size: 18px; font-weight: 700; color: var(--text-primary); }
  .lp-stat-label { font-size: 11px; color: var(--text-muted); margin-top: 3px; }

  /* OVERRIDE RATES */
  .override-card { background: var(--bg-surface2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 20px; }
  .override-title { font-family: var(--font-data); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 16px; }
  .override-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .override-row:last-child { border-bottom: none; }
  .override-tier { font-size: 13px; color: var(--text-secondary); }
  .override-pct { font-family: var(--font-data); font-size: 18px; font-weight: 700; color: var(--bull); }
  .override-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
  .modal { background: var(--bg-surface); border: 1px solid var(--border-bright); border-radius: 12px; padding: 28px; width: 420px; max-width: 90vw; position: relative; }
  .modal-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; margin-bottom: 16px; }
  .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--text-secondary); font-size: 18px; cursor: pointer; }
  .modal-close:hover { color: var(--text-primary); }
  .modal-amount { font-family: var(--font-data); font-size: 36px; font-weight: 700; color: var(--bull); text-align: center; padding: 20px 0; }
  .modal-footer { display: flex; gap: 10px; margin-top: 20px; }
  .modal-footer .btn { flex: 1; justify-content: center; }

  /* DRAWER */
  .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 500; }
  .drawer { position: fixed; right: 0; top: 0; height: 100%; width: 420px; max-width: 90vw; background: var(--bg-surface); border-left: 1px solid var(--border-bright); z-index: 501; overflow-y: auto; padding: 28px; }
  .drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .drawer-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; }
  .drawer-close { background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer; }
  .drawer-section { margin-bottom: 20px; }
  .drawer-section-title { font-family: var(--font-data); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .info-item { background: var(--bg-surface2); border-radius: var(--radius-sm); padding: 10px 12px; }
  .info-label { font-size: 11px; color: var(--text-muted); margin-bottom: 3px; }
  .info-val { font-size: 13px; font-weight: 600; color: var(--text-primary); }

  /* MISC */
  .section-gap { margin-bottom: 20px; }
  .text-bull { color: var(--bull); }
  .text-bear { color: var(--bear); }
  .text-accent { color: var(--accent); }
  .text-warn { color: var(--warn); }
  .text-muted { color: var(--text-muted); }
  .divider { height: 1px; background: var(--border); margin: 20px 0; }
  .empty-state { text-align: center; padding: 40px; color: var(--text-muted); font-size: 13px; }
  .total-row td { color: var(--text-primary); font-weight: 600; font-family: var(--font-data); border-top: 1px solid var(--border-bright); }
  .change-pos { color: var(--bull); font-family: var(--font-data); font-size: 12px; }
  .change-neg { color: var(--bear); font-family: var(--font-data); font-size: 12px; }

  /* RESPONSIVE */
  @media (max-width: 1024px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .charts-row { grid-template-columns: 1fr; }
    .landing-grid { grid-template-columns: 1fr; }
    .hero-grid { grid-template-columns: 1fr; }
    .hero-payment { text-align: left; margin-top: 16px; }
    .lp-template-grid { grid-template-columns: repeat(2, 1fr); }
    .hero-amount { font-size: 36px; }
  }
  @media (max-width: 768px) {
    :root { --sidebar-w: 0px; }
    .sidebar { position: fixed; left: -240px; transition: left 0.22s ease; width: 240px !important; min-width: 240px !important; height: 100%; top: 0; z-index: 300; }
    .sidebar.mobile-open { left: 0; }
    .hamburger { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: var(--bg-surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; font-size: 16px; color: var(--text-secondary); }
    .kpi-grid { grid-template-columns: 1fr 1fr; }
    .hero-stats { grid-template-columns: 1fr 1fr; }
    .page-container { padding: 16px; }
    .commission-footer { grid-template-columns: 1fr; }
    .lp-template-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .kpi-grid { grid-template-columns: 1fr; }
    .hero-stats { grid-template-columns: 1fr; }
    .hero-amount { font-size: 30px; }
  }
`;

/* ═══════════════════════════════════════════════
   UTILITY COMPONENTS
═══════════════════════════════════════════════ */
const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toLocaleString()}`;
const fmtNum = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n;

function Badge({ status }) {
  return <span className={`badge badge-${status}`}><span className="badge-dot" />{status}</span>;
}

function Sparkline({ data, color = "var(--bull)", height = 48 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const w = 300, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#spkGrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.direct + d.subib));
  const w = 440, h = 160, barW = 44, gap = 24;
  const totalW = data.length * (barW + gap) - gap;
  const offsetX = (w - totalW) / 2;
  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} className="chart-svg">
      {data.map((d, i) => {
        const x = offsetX + i * (barW + gap);
        const totalH = ((d.direct + d.subib) / maxVal) * h;
        const directH = (d.direct / maxVal) * h;
        const subibH = (d.subib / maxVal) * h;
        return (
          <g key={i}>
            <rect x={x} y={h - totalH} width={barW} height={subibH} fill="var(--accent)" opacity="0.8" rx="2" />
            <rect x={x} y={h - directH} width={barW} height={directH} fill="var(--bull)" opacity="0.9" rx="2" />
            <text x={x + barW/2} y={h + 18} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="IBM Plex Mono">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart() {
  const data = [
    { label: "Direct Clients", val: 6900, pct: 0.62, color: "var(--bull)" },
    { label: "Sub-IB Tier 1", val: 1340, pct: 0.28, color: "var(--accent)" },
    { label: "Sub-IB Tier 2", val: 280, pct: 0.10, color: "var(--warn)" },
  ];
  const r = 52, cx = 60, cy = 60, stroke = 16;
  let cumAngle = -Math.PI / 2;
  const arcs = data.map(d => {
    const angle = d.pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle), y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle), y2 = cy + r * Math.sin(cumAngle);
    const largeArc = d.pct > 0.5 ? 1 : 0;
    return { ...d, d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}` };
  });
  return (
    <div className="donut-container">
      <svg viewBox="0 0 120 120" width="120" height="120">
        {arcs.map((a, i) => <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={stroke} strokeLinecap="butt" />)}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="700" fontFamily="IBM Plex Mono">$8.2K</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="IBM Plex Mono">MTD</text>
      </svg>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div key={i} className="donut-legend-item">
            <div className="donut-legend-dot" style={{ background: d.color }} />
            <div>
              <div className="donut-legend-label">{d.label}</div>
              <div className="donut-legend-val">${d.val.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkPerformanceChart({ links }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const colors = ["var(--bull)", "var(--accent)", "var(--warn)", "#A78BFA"];
  const w = 600, h = 120;
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="chart-svg">
      {linkSignupHistory.map((series, li) => {
        const max = Math.max(...linkSignupHistory.flat());
        const pts = series.map((v, i) => {
          const x = (i / (series.length - 1)) * w;
          const y = h - (v / max) * (h - 8) - 4;
          return `${x},${y}`;
        }).join(' ');
        return (
          <polyline key={li} points={pts} fill="none" stroke={colors[li]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        );
      })}
      {[0, 10, 20, 29].map(i => (
        <text key={i} x={(i / 29) * w} y={h + 16} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="IBM Plex Mono">Mar {i + 1}</text>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   MODULE 1: DASHBOARD
═══════════════════════════════════════════════ */
function Dashboard({ onNavigate }) {
  const [chartView, setChartView] = useState('monthly');
  const progress = (IB.earningsMTD / IB.toGold) * 100;
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Welcome back, {IB.name} — here's your performance overview</div>
      </div>

      {/* Earnings Hero */}
      <div className="earnings-hero">
        <div className="hero-grid">
          <div>
            <div className="hero-period">TOTAL EARNINGS — MARCH 2026</div>
            <div className="hero-amount">${IB.earningsMTD.toLocaleString()}.00</div>
            <div style={{ marginTop: 16 }}>
              <Sparkline data={sparklineData} />
            </div>
            <div className="hero-sub">
              <span><span className="dot" />30-day trend</span>
              <span style={{ color: 'var(--bull)' }}>↑ Growing</span>
            </div>
          </div>
          <div className="hero-payment">
            <div className="hero-payment-label">NEXT PAYMENT</div>
            <div className="hero-payment-date">{IB.nextPayment}</div>
            <div className="hero-payment-amount">${IB.pendingPayout.toLocaleString()}.00</div>
            <div className="hero-payment-sub" style={{ color: 'var(--text-secondary)' }}>Pending payout</div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-label">This Month</div>
            <div className="hero-stat-value">{IB.activeClients} active clients</div>
            <div className="hero-stat-sub">{fmt(IB.volumeMTD)} volume</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">All Time</div>
            <div className="hero-stat-value">${IB.allTimeEarnings.toLocaleString()}</div>
            <div className="hero-stat-sub">{IB.allTimeClients} clients referred</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Tier Status</div>
            <div style={{ marginTop: 2 }}>
              <span className="tier-pill"><span className="tier-dot" />{IB.tier}</span>
            </div>
            <div className="hero-stat-sub" style={{ marginTop: 6 }}>${(IB.toGold - IB.earningsMTD).toLocaleString()} to GOLD</div>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="tier-progress">
        <div className="tier-progress-header">
          <span className="tier-progress-label">Progress to GOLD tier</span>
          <span className="tier-progress-amount">${IB.earningsMTD.toLocaleString()} / ${IB.toGold.toLocaleString()} monthly</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="tier-unlock-text">GOLD unlocks: <strong>{IB.goldUnlocks}</strong></div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpiCards.map((k, i) => (
          <div className="kpi-card" key={i}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.sub}</div>
            <div className="kpi-trend">
              <span className={k.trend > 0 ? 'trend-up' : 'trend-down'}>
                {k.trend > 0 ? '↑' : '↓'} {Math.abs(k.trend)}%
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <div className="chart-title">EARNINGS BREAKDOWN</div>
            <div className="chart-toggle">
              <button className={`toggle-btn ${chartView === 'monthly' ? 'active' : ''}`} onClick={() => setChartView('monthly')}>Monthly</button>
              <button className={`toggle-btn ${chartView === 'weekly' ? 'active' : ''}`} onClick={() => setChartView('weekly')}>Weekly</button>
            </div>
          </div>
          <BarChart data={earningsBarData} />
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--bull)' }} />Direct commission</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent)' }} />Sub-IB override</div>
          </div>
        </div>
        <div className="chart-card">
          <div className="card-header"><div className="chart-title">EARNINGS BY SOURCE</div></div>
          <DonutChart />
        </div>
      </div>

      {/* Top 10 Clients */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">MY TOP 10 CLIENTS</div>
          <span className="card-action" onClick={() => onNavigate('clients')}>View all →</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Client</th>
                <th>Volume MTD</th>
                <th>Trades</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Ref Link</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map(c => (
                <tr key={c.rank} className="clickable">
                  <td className="rank">{c.rank}</td>
                  <td className="primary">{c.name}</td>
                  <td className="mono">{fmt(c.volume)}</td>
                  <td className="mono">{c.trades}</td>
                  <td className="bull">${c.commission.toLocaleString()}</td>
                  <td><Badge status={c.status} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}>{c.link}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Announcements */}
      <div className="card-header" style={{ marginBottom: 10 }}>
        <div className="card-title" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>BROKER ANNOUNCEMENTS</div>
      </div>
      <div className="announcements-strip">
        {announcements.map(a => (
          <div className="announcement-item" key={a.id}>
            <span className="announcement-date">{a.date}</span>
            <Badge status={a.tag} />
            <span className="announcement-text">{a.text}</span>
            <span style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MODULE 2: EARNINGS
═══════════════════════════════════════════════ */
function Earnings() {
  const [tab, setTab] = useState('overview');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const tabs = ['overview', 'statement', 'payments', 'tax'];
  const tabLabels = { overview: 'Overview', statement: 'Statement', payments: 'Payment History', tax: 'Tax Documents' };
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Earnings</div>
        <div className="page-subtitle">Commission center — track every dollar earned</div>
      </div>
      <div className="tabs">
        {tabs.map(t => <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{tabLabels[t]}</button>)}
      </div>

      {tab === 'overview' && (
        <>
          <div className="commission-card">
            <div className="commission-title">MY COMMISSION SCHEDULE</div>
            {commissionSchedule.map((c, i) => (
              <div className="commission-row" key={i}>
                <div className="comm-instr"><span>{c.icon}</span>{c.instrument}</div>
                <div className="comm-rate">{c.rate}</div>
              </div>
            ))}
            <div className="commission-footer">
              <div className="comm-footer-item">
                <div className="comm-footer-label">Sub-IB Override</div>
                <div className="comm-footer-val">20% of sub-IB earnings</div>
              </div>
              <div className="comm-footer-item">
                <div className="comm-footer-label">Payment Schedule</div>
                <div className="comm-footer-val">Monthly</div>
              </div>
              <div className="comm-footer-item">
                <div className="comm-footer-label">Min Payout</div>
                <div className="comm-footer-val">$100.00</div>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-title" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>MONTHLY COMPARISON — LAST 12 MONTHS</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Clients</th>
                      <th>Lots</th>
                      <th>Commission</th>
                      <th>vs Prev</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyEarnings.map((r, i) => (
                      <tr key={i}>
                        <td className="primary">{r.month}</td>
                        <td className="mono">{r.clients}</td>
                        <td className="mono">{r.lots.toLocaleString()}</td>
                        <td className="bull">${r.commission.toLocaleString()}</td>
                        <td className={r.change > 0 ? 'change-pos' : 'change-neg'}>{r.change > 0 ? '+' : ''}{r.change}%</td>
                        <td><Badge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="chart-card">
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>EARNINGS BY SOURCE</div>
              <DonutChart />
            </div>
          </div>
        </>
      )}

      {tab === 'statement' && (
        <>
          <div className="filter-row">
            <button className="btn btn-secondary btn-sm">📅 Mar 2026</button>
            <button className="btn btn-secondary btn-sm">All Instruments</button>
            <button className="btn btn-secondary btn-sm">All Types</button>
            <div className="ml-auto" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm">⬇ Export CSV</button>
              <button className="btn btn-primary btn-sm">⬇ Export PDF</button>
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Client</th><th>Instrument</th><th>Side</th>
                    <th>Lots</th><th>Rate</th><th>Commission</th><th>Type</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statementRows.map((r, i) => (
                    <tr key={i}>
                      <td className="mono">{r.date}</td>
                      <td className="primary">{r.client}</td>
                      <td className="mono">{r.instrument}</td>
                      <td style={{ color: r.side === 'BUY' ? 'var(--bull)' : 'var(--bear)', fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700 }}>{r.side}</td>
                      <td className="mono">{r.lots}</td>
                      <td className="mono">${r.rate}</td>
                      <td className="bull">${r.commission}</td>
                      <td style={{ fontSize: 11, color: r.type === 'Sub-IB' ? 'var(--accent)' : 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>{r.type}</td>
                      <td><Badge status={r.status} /></td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={4} style={{ color: 'var(--text-muted)', fontSize: 11 }}>TOTALS</td>
                    <td>9.5</td>
                    <td>—</td>
                    <td style={{ color: 'var(--bull)' }}>$100.50</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'payments' && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: 1, minWidth: 240 }}>
              <div className="card-title" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>PAYMENT METHOD ON FILE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 24 }}>🏦</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Chase Bank</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono', marginTop: 2 }}>••••4821</div>
                </div>
                <button className="btn btn-secondary btn-sm ml-auto">Change</button>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Available Balance</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, fontWeight: 700, color: 'var(--bull)' }}>${IB.earningsMTD.toLocaleString()}.00</div>
                <button className="btn btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={() => setShowPayoutModal(true)}>Request Payout</button>
              </div>
            </div>
            <div className="card" style={{ flex: 2, minWidth: 300 }}>
              <div className="card-title" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>ALL-TIME EARNINGS SUMMARY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[['Total Paid', '$34,560', 'var(--bull)'],['Pending', '$8,240', 'var(--warn)'],['Payments', '6 on time', 'var(--accent)']].map(([l, v, c], i) => (
                  <div key={i} style={{ background: 'var(--bg-surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">PAYMENT HISTORY</div></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Period</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date Paid</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i}>
                      <td className="primary">{p.period}</td>
                      <td className="bull">${p.amount.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p.method}</td>
                      <td className="mono" style={{ fontSize: 11 }}>{p.ref}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p.date}</td>
                      <td><Badge status={p.status} /></td>
                      <td><button className="btn btn-secondary btn-sm">Receipt</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'tax' && (
        <div className="card">
          <div className="card-header"><div className="card-title">TAX DOCUMENTS</div></div>
          <div style={{ padding: '8px 0 16px', fontSize: 12, color: 'var(--text-muted)' }}>
            Annual commission summaries for tax purposes. Consult your tax advisor regarding commission income.
          </div>
          <table>
            <thead><tr><th>Year</th><th>Total Paid</th><th>Form Type</th><th></th></tr></thead>
            <tbody>
              {[['2025', '$34,560', '1099-MISC'], ['2024', '$8,240', '1099-MISC']].map(([y, t, f], i) => (
                <tr key={i}>
                  <td className="primary">{y}</td>
                  <td className="bull">{t}</td>
                  <td className="mono">{f}</td>
                  <td><button className="btn btn-secondary btn-sm">⬇ Download PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPayoutModal && (
        <div className="modal-overlay" onClick={() => setShowPayoutModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPayoutModal(false)}>✕</button>
            <div className="modal-title">Request Payout</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your available balance will be sent to your registered payment method.</div>
            <div className="modal-amount">${IB.earningsMTD.toLocaleString()}.00</div>
            <div style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              To: <strong style={{ color: 'var(--text-primary)' }}>Chase Bank ••••4821</strong><br />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Processing time: 1–3 business days</span>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPayoutModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowPayoutModal(false)}>Confirm Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MODULE 3: MY CLIENTS
═══════════════════════════════════════════════ */
function MyClients() {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const filters = ['All', 'Active', 'Dormant', 'Unverified'];
  const filtered = filter === 'All' ? allClients : allClients.filter(c => c.status.toUpperCase() === filter.toUpperCase());
  const dormant = allClients.filter(c => c.status === 'DORMANT');

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">My Clients</div>
        <div className="page-subtitle">47 total referred clients · privacy protected view</div>
      </div>

      {dormant.length > 0 && (
        <div style={{ background: 'var(--warn-dim)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)' }}>{dormant.length} dormant clients detected</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Clients inactive for 30+ days. Re-engage to recover commission potential.</div>
          </div>
          <button className="btn btn-secondary btn-sm">Send Reactivation Campaign</button>
        </div>
      )}

      <div className="filter-row">
        {filters.map(f => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
        <input className="search-input ml-auto" placeholder="Search clients..." />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th><th>Joined</th><th>Type</th>
                <th>Volume MTD</th><th>Trades</th><th>Commission</th>
                <th>Last Trade</th><th>Status</th><th>Ref Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="clickable" onClick={() => setSelected(c)}>
                  <td className="primary">{c.name}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>{c.joined}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.type}</td>
                  <td className="mono">{c.volumeMTD > 0 ? fmt(c.volumeMTD) : '—'}</td>
                  <td className="mono">{c.tradesMTD || '—'}</td>
                  <td className="bull">{c.commission > 0 ? `$${c.commission.toLocaleString()}` : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.lastTrade}</td>
                  <td><Badge status={c.status} /></td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>{c.link}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <>
          <div className="drawer-overlay" onClick={() => setSelected(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <div className="drawer-title">{selected.name}</div>
              <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}><Badge status={selected.status} /></div>
            <div className="drawer-section">
              <div className="drawer-section-title">CLIENT DETAILS</div>
              <div className="info-grid">
                {[['Account Type', selected.type], ['Joined', selected.joined], ['Referral Link', selected.link], ['Last Trade', selected.lastTrade]].map(([l, v]) => (
                  <div key={l} className="info-item">
                    <div className="info-label">{l}</div>
                    <div className="info-val">{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-section">
              <div className="drawer-section-title">ACTIVITY (LAST 6 MONTHS)</div>
              <div style={{ background: 'var(--bg-surface2)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
                {[0.2,0.4,0.6,0.8,0.5,1].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h * 100}%`, background: selected.volumeMTD > 0 ? 'var(--bull)' : 'var(--bg-surface3)', borderRadius: '2px 2px 0 0', opacity: 0.8 }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', marginTop: 6 }}>
                {['Oct','Nov','Dec','Jan','Feb','Mar'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
            <div className="drawer-section">
              <div className="drawer-section-title">MTD PERFORMANCE</div>
              <div className="info-grid">
                {[['Volume MTD', selected.volumeMTD > 0 ? fmt(selected.volumeMTD) : '$0'], ['Trades MTD', selected.tradesMTD || '0'], ['Commission', selected.commission > 0 ? `$${selected.commission.toLocaleString()}` : '$0']].map(([l, v]) => (
                  <div key={l} className="info-item">
                    <div className="info-label">{l}</div>
                    <div className="info-val" style={{ color: l === 'Commission' ? 'var(--bull)' : 'var(--text-primary)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-section">
              <div className="drawer-section-title">ENGAGEMENT TOOLS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.status === 'DORMANT' && <button className="btn btn-bull" style={{ width: '100%', justifyContent: 'center' }}>📧 Send Reactivation Email</button>}
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>🚩 Flag for Support</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MODULE 4: SUB-IBs
═══════════════════════════════════════════════ */
function SubIBTree({ nodes, level = 0 }) {
  return (
    <>
      {nodes.map(node => (
        <div key={node.id} className={level > 0 ? 'tree-node-child' : 'tree-node'}>
          <div className="tree-card">
            <div className="tree-avatar">{node.initials}</div>
            <div className="tree-info">
              <div className="tree-name">{node.name}</div>
              <div className="tree-meta">Tier {node.tier} Sub-IB · {node.clients} clients · Since {node.joined}</div>
            </div>
            <div className="tree-stats">
              <div className="tree-stat">
                <div className="tree-stat-val">{fmt(node.volumeMTD)}</div>
                <div className="tree-stat-label">VOL MTD</div>
              </div>
              <div className="tree-stat">
                <div className="tree-stat-val">${node.earnings.toLocaleString()}</div>
                <div className="tree-stat-label">THEIR EARN</div>
              </div>
              <div className="tree-stat">
                <div className="tree-stat-val text-bull">${node.myOverride.toLocaleString()}</div>
                <div className="tree-stat-label">MY OVERRIDE</div>
              </div>
              <Badge status={node.status} />
            </div>
          </div>
          {node.children.length > 0 && <SubIBTree nodes={node.children} level={level + 1} />}
        </div>
      ))}
    </>
  );
}

function SubIBs() {
  const [view, setView] = useState('tree');
  const flat = [
    ...subIBs,
    ...subIBs.flatMap(s => s.children),
  ];
  const totalOverride = flat.reduce((a, s) => a + s.myOverride, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Sub-IB Network</div>
        <div className="page-subtitle">Your referral downline — earn overrides on every trade they generate</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[['Sub-IBs', '4 total', '👥'],['Active Clients', flat.reduce((a,s)=>a+s.clients,0), '🧑‍💼'],['Combined Volume', fmt(flat.reduce((a,s)=>a+s.volumeMTD,0)), '📊'],['My Override MTD', `$${totalOverride.toLocaleString()}`, '💰']].map(([l,v,ic],i) => (
          <div key={i} className="card">
            <div style={{ fontSize: 20, marginBottom: 8 }}>{ic}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 20, fontWeight: 700, color: i === 3 ? 'var(--bull)' : 'var(--text-primary)' }}>{v}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="override-card">
        <div className="override-title">MY OVERRIDE RATES</div>
        <div className="override-row">
          <div>
            <div className="override-tier">Tier 1 Sub-IBs (direct recruits)</div>
            <div className="override-desc">You earn this % of everything they earn</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="override-pct">20%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>of their commission</div>
          </div>
        </div>
        <div className="override-row">
          <div>
            <div className="override-tier">Tier 2 Sub-IBs (their recruits)</div>
            <div className="override-desc">Passive earnings from your sub-IBs' network</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="override-pct">10%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>of their commission</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">RECRUIT A SUB-IB</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: 'var(--bg-surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--accent)' }}>
            arcafx.com/ib/invite?ref=ARC-JL-4821
          </div>
          <button className="btn btn-secondary btn-sm">📋 Copy</button>
          <button className="btn btn-secondary btn-sm">📧 Email Template</button>
          <button className="btn btn-secondary btn-sm">💬 WhatsApp</button>
          <button className="btn btn-primary btn-sm">+ Generate New Link</button>
        </div>
      </div>

      <div className="card-header" style={{ marginBottom: 12 }}>
        <div className="card-title" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>NETWORK OVERVIEW</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className={`toggle-btn ${view === 'tree' ? 'active' : ''}`} onClick={() => setView('tree')}>Tree</button>
          <button className={`toggle-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>Table</button>
        </div>
      </div>

      {view === 'tree' && (
        <div className="card">
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="tree-avatar" style={{ background: 'linear-gradient(135deg, var(--bull), var(--accent))' }}>JL</div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>James Liu <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'IBM Plex Mono' }}>(You)</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Silver Tier IB · ArcaFX Markets</div>
            </div>
          </div>
          <div style={{ paddingLeft: 16 }}>
            <SubIBTree nodes={subIBs} level={0} />
          </div>
        </div>
      )}

      {view === 'table' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Tier</th><th>Clients</th><th>Vol MTD</th>
                  <th>Their Earnings</th><th>My Override</th><th>Joined</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {flat.map((s, i) => (
                  <tr key={i}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="tree-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{s.initials}</div>
                      <span className="primary">{s.name}</span>
                    </td>
                    <td><span className="override-pill">Tier {s.tier}</span></td>
                    <td className="mono">{s.clients}</td>
                    <td className="mono">{fmt(s.volumeMTD)}</td>
                    <td className="mono">${s.earnings.toLocaleString()}</td>
                    <td className="bull">${s.myOverride.toLocaleString()}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>{s.joined}</td>
                    <td><Badge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MODULE 5: REFERRAL LINKS
═══════════════════════════════════════════════ */
function ReferralLinks() {
  const [showModal, setShowModal] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const colors = ["var(--bull)", "var(--accent)", "var(--warn)", "#A78BFA"];
  const getConvClass = (c) => c > 4 ? 'conv-best' : c > 2 ? 'conv-good' : 'conv-avg';
  const bestLink = referralLinks.reduce((a, b) => a.conv > b.conv ? a : b);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Referral Links</div>
        <div className="page-subtitle">Track every channel — know exactly where your best clients come from</div>
      </div>

      {/* Default link */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>DEFAULT REFERRAL LINK</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: 'var(--bg-surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 13, color: 'var(--accent)' }}>
            https://arcafx.com/join?ref=ARC-JL-4821
          </div>
          <button className="btn btn-secondary btn-sm">📋 Copy</button>
          <button className="btn btn-secondary btn-sm">QR Code</button>
        </div>
      </div>

      {/* Best performer */}
      <div style={{ background: 'var(--bull-dim)', border: '1px solid rgba(16,217,150,0.2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🏆</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Best performer: <strong style={{ color: 'var(--bull)' }}>{bestLink.name}</strong> — <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{bestLink.conv}% click-to-deposit conversion</span></span>
      </div>

      {/* Link Performance Chart */}
      <div className="link-perf-chart">
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>SIGNUPS OVER TIME — MARCH 2026</div>
        <LinkPerformanceChart links={referralLinks} />
        <div className="chart-legend" style={{ marginTop: 10 }}>
          {referralLinks.map((l, i) => (
            <div key={i} className="legend-item"><div className="legend-dot" style={{ background: colors[i] }} />{l.name}</div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>CUSTOM LINKS ({referralLinks.length})</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Create New Link</button>
      </div>

      {referralLinks.map((l, i) => (
        <div className="link-row" key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div className="link-name">{l.name}</div>
                {i === referralLinks.findIndex(x => x.conv === Math.max(...referralLinks.map(r => r.conv))) && <span style={{ fontSize: 12 }}>🏆</span>}
              </div>
              <div className="link-url">{l.short}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className={`conv-badge ${getConvClass(l.conv)}`}>{l.conv}% conv.</span>
              <button className="btn btn-secondary btn-sm">📋 Copy</button>
              <button className="btn btn-secondary btn-sm">QR</button>
              <button className="btn btn-secondary btn-sm">Analytics</button>
            </div>
          </div>
          <div className="link-stats-row">
            {[['Clicks', l.clicks.toLocaleString()], ['Signups', l.signups], ['Verified', l.verified], ['Deposited', l.deposited], ['Volume', fmt(l.volume)], ['Commission', `$${l.commission.toLocaleString()}`]].map(([label, val], j) => (
              <div key={j} className="link-stat">
                <div className="link-stat-val" style={{ color: j === 5 ? 'var(--bull)' : 'var(--text-primary)' }}>{val}</div>
                <div className="link-stat-label">{label}</div>
              </div>
            ))}
          </div>
          <div className="funnel-bar">
            <div className="funnel-seg" style={{ width: `${(l.clicks/l.clicks)*100}%`, background: 'var(--accent)', opacity: 0.4 }} />
            <div className="funnel-seg" style={{ width: `${(l.signups/l.clicks)*100}%`, background: 'var(--accent)', opacity: 0.7 }} />
            <div className="funnel-seg" style={{ width: `${(l.verified/l.clicks)*100}%`, background: 'var(--warn)' }} />
            <div className="funnel-seg" style={{ width: `${(l.deposited/l.clicks)*100}%`, background: 'var(--bull)' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
            <span>■ Clicks</span><span style={{ color: 'var(--accent)' }}>■ Signups</span><span style={{ color: 'var(--warn)' }}>■ Verified</span><span style={{ color: 'var(--bull)' }}>■ Deposited</span>
          </div>
        </div>
      ))}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <div className="modal-title">Create New Referral Link</div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Link Name</label>
              <input className="form-input" placeholder="e.g. TikTok Bio" value={newLinkName} onChange={e => setNewLinkName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">UTM Campaign (optional)</label>
              <input className="form-input" placeholder="e.g. spring_2026" />
            </div>
            <div className="form-group">
              <label className="form-label">Landing Page</label>
              <select className="form-input" style={{ cursor: 'pointer' }}>
                <option>Default Registration</option>
                <option>Free Demo Account</option>
                <option>Webinar Registration</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Promo Code (optional)</label>
              <input className="form-input" placeholder="e.g. WELCOME50" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Create Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MODULE 6: MARKETING MATERIALS
═══════════════════════════════════════════════ */
function Marketing() {
  const [tab, setTab] = useState('banners');
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Marketing Materials</div>
        <div className="page-subtitle">Broker-approved assets with your referral link pre-embedded</div>
      </div>
      <div className="tabs">
        {['banners','emails','presentations','brand'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'banners' && (
        <>
          <div className="filter-row" style={{ marginBottom: 16 }}>
            <input className="search-input" placeholder="Search by size or name..." />
            <button className="btn btn-secondary btn-sm ml-auto">⬇ Download All</button>
          </div>
          <div className="banner-grid">
            {marketingBanners.map((b, i) => (
              <div className="banner-card" key={i}>
                <div className="banner-preview" style={{ background: `linear-gradient(135deg, #0a1628, #0d1f38)` }}>
                  <div style={{ textAlign: 'center', padding: 8 }}>
                    <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>ArcaFX</div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: 'var(--accent)' }}>{b.size}</div>
                  </div>
                </div>
                <div className="banner-info">
                  <div className="banner-name">{b.name}</div>
                  <div className="banner-size">{b.size} · {b.type}</div>
                  <div className="banner-actions">
                    <button className="btn btn-secondary btn-sm">PNG</button>
                    {b.type.includes('HTML') && <button className="btn btn-secondary btn-sm">HTML</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <div className="card-title">MY CUSTOM CREATIVES</div>
              <button className="btn btn-secondary btn-sm">+ Upload Creative</button>
            </div>
            <div className="empty-state" style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎨</div>
              No custom creatives yet. Upload your own banners for compliance review.
            </div>
          </div>
        </>
      )}

      {tab === 'emails' && (
        <>
          <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
            Your referral link and IB code are auto-inserted in all templates. Personalization tokens: <code style={{ fontFamily: 'IBM Plex Mono', color: 'var(--accent)' }}>&#123;&#123;first_name&#125;&#125;</code>, <code style={{ fontFamily: 'IBM Plex Mono', color: 'var(--accent)' }}>&#123;&#123;ib_link&#125;&#125;</code>
          </div>
          {emailTemplates.map((t, i) => (
            <div className="template-card" key={i}>
              <div className="template-icon">📧</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <div className="template-name">{t.name}</div>
                  <Badge status={t.tag} />
                </div>
                <div className="template-subject">"{t.subject}"</div>
              </div>
              <div className="template-actions">
                <button className="btn btn-secondary btn-sm">Preview</button>
                <button className="btn btn-secondary btn-sm">HTML</button>
                <button className="btn btn-secondary btn-sm">Plain</button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'presentations' && (
        <div className="card">
          {[['Introduction to Forex', 'FX basics for new clients', '42 slides'], ['CFD Trading Explained', 'What are CFDs and how to trade them', '28 slides'], ['Platform Walkthrough', 'ArcaFX platform feature guide', '36 slides']].map(([name, desc, slides], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 32 }}>📊</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 3 }}>{name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc} · {slides}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm">PPTX</button>
                <button className="btn btn-secondary btn-sm">PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'brand' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>LOGO VARIANTS</div>
            {[['Light Background','Light'],['Dark Background','Dark'],['Square Icon','Square'],['Horizontal','Horizontal']].map(([l,v]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{l}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm">SVG</button>
                  <button className="btn btn-secondary btn-sm">PNG</button>
                </div>
              </div>
            ))}
            <button className="btn btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>⬇ Download All Assets</button>
          </div>
          <div className="card">
            <div className="card-title" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>BRAND COLORS</div>
            {[['Primary Blue','#1A56DB'],['Accent Green','#10D996'],['Warning','#F59E0B'],['Background','#06080A']].map(([n,c]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: c, border: '1px solid var(--border)' }} />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>{c}</div>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>⬇ Brand Guidelines PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MODULE 7: LANDING PAGES
═══════════════════════════════════════════════ */
const LP_TEMPLATES = [
  { id: 'demo', icon: '🖥️', name: 'Free Demo Account', desc: 'High converting registration flow' },
  { id: 'classic', icon: '📝', name: 'Classic Register', desc: 'Simple, clean signup page' },
  { id: 'comparison', icon: '⚖️', name: 'Comparison', desc: 'Broker vs competitor overview' },
  { id: 'webinar', icon: '🎥', name: 'Webinar Registration', desc: 'Event signup with countdown' },
  { id: 'platform', icon: '🚀', name: 'Platform Tour', desc: 'Interactive platform showcase' },
  { id: 'analysis', icon: '📈', name: 'Market Analysis', desc: 'Weekly analysis lead magnet' },
];

function LandingPages() {
  const [selected, setSelected] = useState('demo');
  const [headline, setHeadline] = useState('Start Trading with a Free Demo Account');
  const [subline, setSubline] = useState('Trade 250+ instruments with $50,000 virtual funds. No risk, real markets.');
  const [slug, setSlug] = useState('james-liu-fx');
  const [lang, setLang] = useState('EN');

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Landing Pages</div>
        <div className="page-subtitle">Broker-hosted microsites personalized for your audience</div>
      </div>

      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>AVAILABLE TEMPLATES</div>
      <div className="lp-template-grid">
        {LP_TEMPLATES.map(t => (
          <div key={t.id} className={`lp-template-card ${selected === t.id ? 'selected' : ''}`} onClick={() => setSelected(t.id)}>
            <div className="lp-template-icon">{t.icon}</div>
            <div className="lp-template-name">{t.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>ACTIVE CONFIGURATION</div>

      <div className="landing-grid">
        <div className="lp-config">
          <div className="card">
            <div className="form-group">
              <label className="form-label">Headline (max 60 chars)</label>
              <input className="form-input" value={headline} onChange={e => setHeadline(e.target.value.slice(0, 60))} />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', marginTop: 4 }}>{headline.length}/60</div>
            </div>
            <div className="form-group">
              <label className="form-label">Sub-headline (max 120 chars)</label>
              <textarea className="form-input" rows={2} value={subline} onChange={e => setSubline(e.target.value.slice(0, 120))} style={{ resize: 'none' }} />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', marginTop: 4 }}>{subline.length}/120</div>
            </div>
            <div className="form-group">
              <label className="form-label">Custom URL Slug</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div style={{ background: 'var(--bg-surface3)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', whiteSpace: 'nowrap' }}>arcafx.com/</div>
                <input className="form-input" value={slug} onChange={e => setSlug(e.target.value)} style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', borderLeft: 'none' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['EN','AR','ES','DE','FR','PT'].map(l => (
                  <button key={l} className={`filter-btn ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)} style={{ padding: '4px 10px' }}>{l}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Promo Code (optional)</label>
              <input className="form-input" placeholder="e.g. JAMES50" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save & Publish</button>
              <button className="btn btn-secondary" style={{ justifyContent: 'center' }}>Reset</button>
            </div>
          </div>

          <div className="lp-stats-row" style={{ marginTop: 12 }}>
            {[['1,842', 'Views this month'], ['64', 'Conversions'], ['3.5%', 'Conv. Rate']].map(([v,l]) => (
              <div className="lp-stat" key={l}>
                <div className="lp-stat-val">{v}</div>
                <div className="lp-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-preview">
          <div className="lp-preview-header">
            <span><span className="lp-preview-live" />LIVE PREVIEW</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'var(--accent)' }}>arcafx.com/{slug}</span>
          </div>
          <div className="lp-preview-content">
            <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', letterSpacing: '2px', color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase' }}>ArcaFX Markets</div>
            <div className="lp-preview-headline">{headline || 'Enter a headline...'}</div>
            <div className="lp-preview-sub">{subline || 'Enter a sub-headline...'}</div>
            <div style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 24px', width: '100%', maxWidth: 280, marginBottom: 16 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                {['Full Name','Email Address','Phone Number'].map(f => (
                  <div key={f} style={{ background: 'var(--bg-surface3)', borderRadius: 4, padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>{f}</div>
                ))}
              </div>
            </div>
            <div className="lp-preview-cta">Open Free Demo →</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12 }}>Trading involves risk. Capital at risk.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
const NAV_SECTIONS = [
  { label: 'OVERVIEW', items: [
    { key: 'dashboard', icon: '◉', text: 'Dashboard' },
    { key: 'earnings', icon: '💳', text: 'Earnings' },
  ]},
  { label: 'MY NETWORK', items: [
    { key: 'clients', icon: '👥', text: 'My Clients' },
    { key: 'subibs', icon: '🌐', text: 'Sub-IBs' },
    { key: 'links', icon: '🔗', text: 'Referral Links' },
  ]},
  { label: 'MARKETING', items: [
    { key: 'marketing', icon: '🎨', text: 'Marketing Materials' },
    { key: 'landing', icon: '🖥️', text: 'Landing Pages' },
  ]},
  { label: 'SUPPORT', items: [
    { key: 'announcements', icon: '📢', text: 'Announcements' },
    { key: 'faq', icon: '❓', text: 'FAQ' },
    { key: 'contact', icon: '💬', text: 'Contact Manager' },
  ]},
];

function Sidebar({ active, onNavigate, collapsed, onToggle }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-profile">
        <div className="profile-row">
          <div className="profile-avatar">JL</div>
          {!collapsed && (
            <div className="profile-info">
              <div className="profile-name">{IB.name}</div>
              <div className="profile-broker">{IB.broker}</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <>
            <div className={`tier-badge tier-${IB.tier}`}>
              <span className="tier-dot" />{IB.tier}
            </div>
            <div className="ref-code-row">
              <div>
                <div className="ref-code-label">Ref Code</div>
                <div className="ref-code-value">{IB.code}</div>
              </div>
              <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
                {copied ? '✓' : '⎘'}
              </button>
            </div>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map(item => (
              <div
                key={item.key}
                className={`nav-item ${active === item.key ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.text : ''}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {!collapsed && <span className="nav-item-text">{item.text}</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-collapse-btn" onClick={onToggle}>
        <span>{collapsed ? '→' : '←'}</span>
        {!collapsed && <span style={{ fontSize: 11 }}>Collapse</span>}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════════ */
function TopBar({ onHamburger }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <button className="hamburger" onClick={onHamburger}>☰</button>
        <div className="topbar-logo">ArcaFX</div>
        <div className="topbar-divider" />
        <div className="topbar-label">Partner Portal</div>
      </div>
      <div className="topbar-actions">
        <button className="topbar-btn" title="Notifications">🔔</button>
        <button className="topbar-btn" title="Help">?</button>
        <button className="topbar-btn" title="Logout">⏻</button>
        <div className="topbar-avatar">JL</div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════
   PLACEHOLDER FOR EXTRA MODULES
═══════════════════════════════════════════════ */
function PlaceholderPage({ title, icon }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">{title}</div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: 'var(--text-secondary)' }}>
          {title} module is ready to be configured
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════ */
export default function ObsidianPartners() {
  const [active, setActive] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = globalStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const navigate = (key) => {
    setActive(key);
    setMobileSidebarOpen(false);
  };

  const renderModule = () => {
    switch (active) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'earnings': return <Earnings />;
      case 'clients': return <MyClients />;
      case 'subibs': return <SubIBs />;
      case 'links': return <ReferralLinks />;
      case 'marketing': return <Marketing />;
      case 'landing': return <LandingPages />;
      case 'announcements': return <PlaceholderPage title="Announcements" icon="📢" />;
      case 'faq': return <PlaceholderPage title="FAQ" icon="❓" />;
      case 'contact': return <PlaceholderPage title="Contact Manager" icon="💬" />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="obsidian-portal">
      <TopBar onHamburger={() => setMobileSidebarOpen(v => !v)} />
      <div className="portal-body">
        {mobileSidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} onClick={() => setMobileSidebarOpen(false)} />
        )}
        <Sidebar
          active={active}
          onNavigate={navigate}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
        />
        <main className="main-content">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
