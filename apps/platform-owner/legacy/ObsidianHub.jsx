import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid
} from "recharts";

// ═══════════════════════════════════════════════════════════════════
// STYLES INJECTION
// ═══════════════════════════════════════════════════════════════════
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg-base:#06080A;--bg-1:#0C0E12;--bg-2:#0F1216;--bg-3:#141820;
  --border:#1C2230;--border-hi:#2A3445;
  --bull:#10D996;--bear:#FF3B5C;--accent:#3B82F6;--warn:#F59E0B;--purple:#A855F7;
  --text-pri:#E2E8F0;--text-sec:#8A95A8;--text-muted:#4A5568;
  --font-data:'IBM Plex Mono',monospace;--font-disp:'Syne',sans-serif;--font-ui:'DM Sans',sans-serif;
  --r:6px;--r-lg:10px;
}
html,body,#root{height:100%;background:var(--bg-base);color:var(--text-pri);font-family:var(--font-ui);font-size:14px}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:var(--bg-1)}
::-webkit-scrollbar-thumb{background:var(--border-hi);border-radius:2px}

/* ── LAYOUT ── */
.hub{display:flex;flex-direction:column;height:100vh;overflow:hidden}
.hub-body{display:flex;flex:1;overflow:hidden}
.hub-main{flex:1;overflow-y:auto;background:var(--bg-base)}
.page{padding:24px;max-width:1600px}
.page-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
.page-title{font-family:var(--font-disp);font-size:20px;font-weight:700;color:var(--text-pri)}
.page-sub{font-size:12px;color:var(--text-sec);margin-top:2px}

/* ── TOPBAR ── */
.topbar{height:52px;background:var(--bg-1);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:0;z-index:100;flex-shrink:0}
.topbar-logo{font-family:var(--font-disp);font-weight:800;font-size:16px;letter-spacing:0.08em;color:var(--text-pri);padding-right:20px;border-right:1px solid var(--border);margin-right:16px}
.topbar-logo span{color:var(--accent)}
.topbar-pill{display:flex;align-items:center;gap:6px;padding:4px 10px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r);font-size:11px;font-family:var(--font-data);color:var(--text-sec);margin-right:8px}
.topbar-pill .dot{width:6px;height:6px;border-radius:50%;background:var(--bull);animation:pulse 2s infinite}
.topbar-pill.warn .dot{background:var(--warn)}
.topbar-sep{width:1px;height:20px;background:var(--border);margin:0 12px}
.topbar-stat{font-size:11px;font-family:var(--font-data);color:var(--text-sec);margin-right:16px}
.topbar-stat strong{color:var(--text-pri);font-weight:500}
.topbar-right{margin-left:auto;display:flex;align-items:center;gap:8px}
.topbar-btn{height:30px;padding:0 12px;background:transparent;border:1px solid var(--border);border-radius:var(--r);color:var(--text-sec);font-size:11px;font-family:var(--font-ui);cursor:pointer;transition:all .15s}
.topbar-btn:hover{border-color:var(--border-hi);color:var(--text-pri)}
.topbar-btn.alert{background:rgba(245,158,11,.1);border-color:var(--warn);color:var(--warn)}
.topbar-user{display:flex;align-items:center;gap:8px;padding:4px 10px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r);font-size:12px;cursor:pointer}
.topbar-avatar{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--purple));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}

/* ── SIDEBAR ── */
.sidebar{width:240px;background:var(--bg-1);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;flex-shrink:0;transition:width .2s ease}
.sidebar.collapsed{width:56px}
.sidebar-logo{padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer}
.sidebar-logo-icon{width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,var(--accent) 0%,var(--purple) 100%);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.sidebar-logo-text{font-family:var(--font-disp);font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden}
.sidebar-logo-ver{font-size:10px;color:var(--text-muted);font-family:var(--font-data);white-space:nowrap}
.sidebar-section{padding:12px 8px 4px;font-size:9px;font-weight:600;letter-spacing:.12em;color:var(--text-muted);text-transform:uppercase;overflow:hidden;white-space:nowrap}
.sidebar-item{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:var(--r);cursor:pointer;transition:all .15s;margin:1px 4px;color:var(--text-sec);font-size:13px}
.sidebar-item:hover{background:var(--bg-3);color:var(--text-pri)}
.sidebar-item.active{background:rgba(59,130,246,.12);color:var(--accent);border:1px solid rgba(59,130,246,.2)}
.sidebar-item-icon{width:20px;text-align:center;font-size:14px;flex-shrink:0}
.sidebar-item-label{white-space:nowrap;overflow:hidden;font-size:12px;flex:1}
.sidebar-badge{background:var(--bg-3);border:1px solid var(--border);border-radius:10px;padding:0 6px;font-size:10px;font-family:var(--font-data);color:var(--text-sec);white-space:nowrap}
.sidebar-badge.warn{background:rgba(245,158,11,.1);border-color:var(--warn);color:var(--warn)}
.collapsed .sidebar-logo-text,.collapsed .sidebar-logo-ver,.collapsed .sidebar-section,.collapsed .sidebar-item-label,.collapsed .sidebar-badge{display:none}
.collapsed .sidebar-item{justify-content:center}

/* ── CARDS / KPI ── */
.kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px}
.kpi-card{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;position:relative;overflow:hidden}
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.kpi-card.bull::before{background:linear-gradient(90deg,var(--bull),transparent)}
.kpi-card.accent::before{background:linear-gradient(90deg,var(--accent),transparent)}
.kpi-card.warn::before{background:linear-gradient(90deg,var(--warn),transparent)}
.kpi-card.bear::before{background:linear-gradient(90deg,var(--bear),transparent)}
.kpi-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:6px;font-weight:600}
.kpi-value{font-family:var(--font-data);font-size:22px;font-weight:600;color:var(--text-pri);line-height:1}
.kpi-sub{font-size:11px;color:var(--text-sec);margin-top:5px}
.kpi-sub.up{color:var(--bull)}
.kpi-sub.down{color:var(--bear)}
.kpi-sub.warn{color:var(--warn)}

.card{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.card-hd{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.card-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-sec)}
.card-body{padding:16px}

/* ── CHARTS ROW ── */
.charts-row{display:grid;grid-template-columns:50% 25% 25%;gap:12px;margin-bottom:20px}
.chart-wrap{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.chart-hd{padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between}
.chart-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-sec)}
.chart-meta{font-family:var(--font-data);font-size:18px;font-weight:600;color:var(--text-pri)}
.chart-meta-sub{font-size:11px;color:var(--bull)}
.chart-body{padding:0 16px 16px}

/* ── HEALTH STRIP ── */
.health-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.health-card{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px}
.health-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:10px;font-weight:600}
.health-big{font-family:var(--font-data);font-size:28px;font-weight:600;color:var(--text-pri);line-height:1}
.health-sub{font-size:11px;color:var(--text-sec);margin-top:4px;font-family:var(--font-data)}
.health-row{display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--text-sec);font-family:var(--font-data)}
.gauge-bar{height:6px;background:var(--bg-3);border-radius:3px;margin:8px 0;overflow:hidden}
.gauge-fill{height:100%;border-radius:3px;transition:width .5s ease}

/* ── BOTTOM ROW ── */
.bottom-row{display:grid;grid-template-columns:55% 45%;gap:12px}

/* ── TABLE ── */
.tbl{width:100%;border-collapse:collapse}
.tbl th{padding:8px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border);white-space:nowrap}
.tbl td{padding:9px 12px;font-size:12px;border-bottom:1px solid var(--border);color:var(--text-sec);vertical-align:middle}
.tbl td.mono{font-family:var(--font-data);color:var(--text-pri)}
.tbl tr:hover td{background:rgba(255,255,255,.02)}
.tbl tr:last-child td{border-bottom:none}
.tbl tr.clickable{cursor:pointer}
.tbl td.name-cell{color:var(--text-pri);font-weight:500}

/* ── BADGES ── */
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:.04em;white-space:nowrap}
.badge-starter{background:rgba(100,116,139,.15);border:1px solid rgba(100,116,139,.3);color:#94A3B8}
.badge-growth{background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);color:var(--accent)}
.badge-pro{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:var(--warn)}
.badge-enterprise{background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.25);color:var(--purple)}
.badge-active{background:rgba(16,217,150,.1);border:1px solid rgba(16,217,150,.2);color:var(--bull)}
.badge-trial{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);color:var(--accent)}
.badge-suspended{background:rgba(255,59,92,.1);border:1px solid rgba(255,59,92,.2);color:var(--bear)}
.badge-onboarding{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);color:var(--warn)}
.badge-churned{background:rgba(74,85,104,.2);border:1px solid rgba(74,85,104,.3);color:var(--text-muted)}
.badge-operational{background:rgba(16,217,150,.1);border:1px solid rgba(16,217,150,.2);color:var(--bull)}
.badge-degraded{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);color:var(--warn)}
.badge-outage{background:rgba(255,59,92,.1);border:1px solid rgba(255,59,92,.2);color:var(--bear)}
.badge-maintenance{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);color:var(--accent)}
.badge-connected{background:rgba(16,217,150,.1);border:1px solid rgba(16,217,150,.2);color:var(--bull)}
.badge-disconnected{background:rgba(255,59,92,.1);border:1px solid rgba(255,59,92,.2);color:var(--bear)}

/* ── STATUS DOT ── */
.sdot{display:inline-block;width:7px;height:7px;border-radius:50%;flex-shrink:0}
.sdot-bull{background:var(--bull)}
.sdot-bear{background:var(--bear)}
.sdot-warn{background:var(--warn)}
.sdot-accent{background:var(--accent)}
.sdot-muted{background:var(--text-muted)}
.sdot-pulse{animation:pulse 2s infinite}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;border:1px solid transparent;font-family:var(--font-ui)}
.btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}
.btn-primary:hover{background:#2563EB}
.btn-ghost{background:transparent;color:var(--text-sec);border-color:var(--border)}
.btn-ghost:hover{border-color:var(--border-hi);color:var(--text-pri)}
.btn-danger{background:rgba(255,59,92,.1);color:var(--bear);border-color:rgba(255,59,92,.3)}
.btn-danger:hover{background:rgba(255,59,92,.2)}
.btn-bull{background:rgba(16,217,150,.1);color:var(--bull);border-color:rgba(16,217,150,.3)}
.btn-bull:hover{background:rgba(16,217,150,.2)}
.btn-warn{background:rgba(245,158,11,.1);color:var(--warn);border-color:rgba(245,158,11,.3)}
.btn-sm{padding:4px 10px;font-size:11px}

/* ── ACTIVITY FEED ── */
.feed{display:flex;flex-direction:column;gap:0;overflow-y:auto;max-height:320px}
.feed-item{display:flex;align-items:flex-start;gap:10px;padding:7px 12px;border-bottom:1px solid var(--border);transition:background .1s;font-size:11px}
.feed-item:hover{background:rgba(255,255,255,.02)}
.feed-time{font-family:var(--font-data);color:var(--text-muted);white-space:nowrap;font-size:10px;padding-top:1px}
.feed-type{display:inline-flex;align-items:center;justify-content:center;width:44px;height:16px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:.04em;flex-shrink:0}
.feed-type-info{background:rgba(59,130,246,.12);color:var(--accent)}
.feed-type-warn{background:rgba(245,158,11,.12);color:var(--warn)}
.feed-type-bear{background:rgba(255,59,92,.12);color:var(--bear)}
.feed-type-bull{background:rgba(16,217,150,.12);color:var(--bull)}
.feed-tenant{font-weight:600;color:var(--text-pri);white-space:nowrap}
.feed-msg{color:var(--text-sec);flex:1}
.feed-controls{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--border)}

/* ── SERVICES GRID ── */
.services-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:16px}
.service-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r);padding:12px}
.service-name{font-size:12px;font-weight:500;color:var(--text-pri);margin-bottom:4px}
.service-meta{font-family:var(--font-data);font-size:10px;color:var(--text-muted)}

/* ── NODE MAP ── */
.node-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:16px}
.node-card{border:1px solid var(--border);border-radius:var(--r);padding:12px;position:relative;overflow:hidden}
.node-card.load-ok{background:rgba(16,217,150,.04);border-color:rgba(16,217,150,.15)}
.node-card.load-warn{background:rgba(245,158,11,.04);border-color:rgba(245,158,11,.2)}
.node-card.load-crit{background:rgba(255,59,92,.04);border-color:rgba(255,59,92,.2)}
.node-id{font-family:var(--font-data);font-size:13px;font-weight:500;color:var(--text-pri)}
.node-loc{font-size:11px;color:var(--text-sec);margin-bottom:8px}
.node-metrics{display:flex;gap:12px;font-family:var(--font-data);font-size:11px;color:var(--text-sec)}
.node-metric-val{font-size:14px;font-weight:600}
.node-metric-val.ok{color:var(--bull)}
.node-metric-val.warn{color:var(--warn)}
.node-metric-val.crit{color:var(--bear)}
.node-actions{display:flex;gap:4px;margin-top:10px}

/* ── KANBAN ── */
.kanban{display:flex;gap:12px;overflow-x:auto;padding:4px 0 12px}
.kanban-col{min-width:200px;background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);display:flex;flex-direction:column;flex-shrink:0}
.kanban-col-hd{padding:10px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.kanban-col-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-sec)}
.kanban-col-count{font-family:var(--font-data);font-size:11px;background:var(--bg-3);border:1px solid var(--border);border-radius:10px;padding:0 7px;color:var(--text-muted)}
.kanban-cards{padding:8px;display:flex;flex-direction:column;gap:6px;min-height:80px}
.kanban-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r);padding:10px;cursor:pointer;transition:all .15s}
.kanban-card:hover{border-color:var(--border-hi);transform:translateY(-1px)}
.kanban-card-name{font-size:12px;font-weight:600;color:var(--text-pri);margin-bottom:4px}
.kanban-card-meta{font-size:11px;color:var(--text-sec)}
.kanban-card-days{font-size:10px;font-family:var(--font-data);color:var(--warn);margin-top:4px}

/* ── TABS ── */
.tab-bar{display:flex;gap:0;border-bottom:1px solid var(--border);padding:0 24px;background:var(--bg-1)}
.tab-item{padding:12px 16px;font-size:12px;font-weight:500;color:var(--text-sec);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap}
.tab-item:hover{color:var(--text-pri)}
.tab-item.active{color:var(--accent);border-bottom-color:var(--accent)}

/* ── LP CARDS ── */
.lp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px}
.lp-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px}
.lp-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.lp-name{font-size:14px;font-weight:700;color:var(--text-pri);font-family:var(--font-disp)}
.lp-type{font-size:10px;color:var(--text-muted);margin-top:2px}
.lp-metric{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px}
.lp-metric:last-of-type{border-bottom:none}
.lp-metric-label{color:var(--text-muted)}
.lp-metric-val{font-family:var(--font-data);color:var(--text-pri);font-weight:500}
.credit-bar{height:4px;background:var(--bg-3);border-radius:2px;overflow:hidden;margin-top:8px}
.credit-fill{height:100%;border-radius:2px;background:var(--accent)}
.lp-actions{display:flex;gap:6px;margin-top:12px}

/* ── REVENUE ── */
.rev-header{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.rev-kpi{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;text-align:center}
.rev-kpi-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:8px}
.rev-kpi-val{font-family:var(--font-data);font-size:26px;font-weight:600;color:var(--text-pri)}
.rev-kpi-sub{font-size:11px;margin-top:4px}

/* ── PLAN CARDS ── */
.plan-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.plan-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px}
.plan-card.enterprise{border-color:rgba(168,85,247,.3);background:rgba(168,85,247,.04)}
.plan-name{font-family:var(--font-disp);font-size:15px;font-weight:700;color:var(--text-pri);margin-bottom:4px}
.plan-price{font-family:var(--font-data);font-size:22px;font-weight:600;color:var(--text-pri)}
.plan-price span{font-size:12px;color:var(--text-sec)}
.plan-feature{font-size:11px;color:var(--text-sec);padding:3px 0;border-bottom:1px solid var(--border)}
.plan-feature:last-child{border-bottom:none}

/* ── TENANT DETAIL ── */
.td-header{background:var(--bg-1);border-bottom:1px solid var(--border);padding:20px 24px;display:flex;align-items:flex-start;gap:16px}
.td-logo{width:52px;height:52px;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--bg-2);border:1px solid var(--border);flex-shrink:0}
.td-info{flex:1}
.td-name{font-family:var(--font-disp);font-size:20px;font-weight:700;color:var(--text-pri);margin-bottom:4px}
.td-meta{font-size:12px;color:var(--text-sec);display:flex;gap:12px;flex-wrap:wrap}
.td-actions{display:flex;gap:8px;flex-wrap:wrap}

/* ── CHECKLIST ── */
.checklist{display:flex;flex-direction:column;gap:6px}
.check-item{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r);font-size:12px}
.check-item.done{border-color:rgba(16,217,150,.2);background:rgba(16,217,150,.04)}
.check-icon{font-size:14px}

/* ── JURISDICTION ── */
.jur-row-blocked td{opacity:.5}
.tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:500}
.tag-allowed{background:rgba(16,217,150,.1);color:var(--bull)}
.tag-blocked{background:rgba(255,59,92,.1);color:var(--bear)}

/* ── MODALS ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.modal{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);padding:24px;max-width:460px;width:90%;box-shadow:0 25px 60px rgba(0,0,0,.8)}
.modal-title{font-family:var(--font-disp);font-size:16px;font-weight:700;margin-bottom:8px}
.modal-body{font-size:13px;color:var(--text-sec);line-height:1.6;margin-bottom:20px}
.modal-footer{display:flex;gap:10px;justify-content:flex-end}
.impersonate-banner{background:rgba(245,158,11,.12);border-bottom:1px solid var(--warn);padding:8px 24px;font-size:12px;color:var(--warn);display:flex;align-items:center;gap:8px;font-family:var(--font-data)}

/* ── DEVELOPER ── */
.changelog-item{padding:14px 0;border-bottom:1px solid var(--border)}
.changelog-item:last-child{border-bottom:none}
.changelog-ver{font-family:var(--font-data);font-size:13px;font-weight:600;color:var(--accent)}
.changelog-date{font-size:11px;color:var(--text-muted);margin-left:8px}
.changelog-desc{font-size:12px;color:var(--text-sec);margin-top:4px}
.sdk-item{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)}
.sdk-item:last-child{border-bottom:none}
.sdk-name{font-size:12px;font-weight:500;color:var(--text-pri)}
.sdk-ver{font-family:var(--font-data);font-size:11px;color:var(--text-sec)}

/* ── INCIDENT TIMELINE ── */
.incident-grid{display:flex;flex-wrap:wrap;gap:3px;padding:16px}
.inc-dot{width:14px;height:14px;border-radius:3px;cursor:pointer;transition:transform .1s}
.inc-dot:hover{transform:scale(1.3)}
.inc-dot-ok{background:rgba(16,217,150,.3)}
.inc-dot-minor{background:rgba(245,158,11,.5)}
.inc-dot-major{background:rgba(255,140,0,.7)}
.inc-dot-out{background:var(--bear)}

/* ── FILTERS / SEARCH ── */
.filters{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.search-input{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r);padding:7px 12px;font-size:12px;color:var(--text-pri);font-family:var(--font-ui);outline:none;width:220px}
.search-input:focus{border-color:var(--border-hi)}
.search-input::placeholder{color:var(--text-muted)}
select.filter-sel{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;font-size:12px;color:var(--text-sec);cursor:pointer;outline:none;font-family:var(--font-ui)}
select.filter-sel:focus{border-color:var(--border-hi);color:var(--text-pri)}

/* ── SPARKLINES (inline) ── */
.sparkline{display:inline-block;vertical-align:middle}

/* ── TOGGLE ── */
.toggle-wrap{display:flex;gap:4px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r);padding:3px}
.toggle-btn{padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;color:var(--text-sec);background:transparent;border:none;font-family:var(--font-ui);transition:all .15s}
.toggle-btn.active{background:var(--bg-3);color:var(--text-pri);border:1px solid var(--border-hi)}

/* ── MISC ── */
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.mt-4{margin-top:4px}.mt-8{margin-top:8px}.mt-12{margin-top:12px}.mt-16{margin-top:16px}.mt-20{margin-top:20px}
.mb-4{margin-bottom:4px}.mb-8{margin-bottom:8px}.mb-12{margin-bottom:12px}.mb-16{margin-bottom:16px}
.flex{display:flex}.items-center{align-items:center}.justify-between{justify-content:space-between}.gap-8{gap:8px}.gap-12{gap:12px}.gap-16{gap:16px}
.text-bull{color:var(--bull)}.text-bear{color:var(--bear)}.text-warn{color:var(--warn)}.text-accent{color:var(--accent)}.text-muted{color:var(--text-muted)}.text-sec{color:var(--text-sec)}
.mono{font-family:var(--font-data)}.disp{font-family:var(--font-disp)}
.section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:12px}
.divider{height:1px;background:var(--border);margin:16px 0}
.empty{padding:40px;text-align:center;color:var(--text-muted);font-size:13px}
.w-full{width:100%}
.feature-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px}
.feature-row:last-child{border-bottom:none}
.mini-toggle{width:36px;height:20px;border-radius:10px;cursor:pointer;transition:background .2s;position:relative;border:none;flex-shrink:0}
.mini-toggle.on{background:var(--bull)}
.mini-toggle.off{background:var(--bg-3);border:1px solid var(--border)}
.mini-toggle::after{content:'';position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;top:3px;transition:left .2s}
.mini-toggle.on::after{left:19px}
.mini-toggle.off::after{left:3px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn .2s ease forwards}
@keyframes ticker{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
.tick-enter{animation:ticker .3s ease forwards}
`;

// ═══════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════
const TENANTS = [
  { id:1,  name:"ArcaFX Markets",    plan:"PRO",        country:"UK",              flag:"🇬🇧", clients:1247, aum:8200000,  volumeMTD:124000000, rev:12400, growth:8.2,   status:"ACTIVE",    since:"Jan 2023", am:"Sarah K.",  contact:"james@arcafx.com",       trades:45230, api:892000,  wsConn:1247, healthScore:88, allTimeRev:142000, subFee:2500, city:"London" },
  { id:2,  name:"GlobalFX Pro",      plan:"ENTERPRISE", country:"UAE",             flag:"🇦🇪", clients:3400, aum:18500000, volumeMTD:380000000, rev:38000, growth:15.4,  status:"ACTIVE",    since:"Jun 2022", am:"Mike R.",   contact:"ops@globalfxpro.ae",     trades:89450, api:2100000, wsConn:3400, healthScore:94, allTimeRev:392000, subFee:8000, city:"Dubai" },
  { id:3,  name:"NovaTrade",         plan:"GROWTH",     country:"Australia",       flag:"🇦🇺", clients:412,  aum:2800000,  volumeMTD:42000000,  rev:4200,  growth:22.1,  status:"ACTIVE",    since:"Aug 2023", am:"Sarah K.",  contact:"hello@novatrade.au",     trades:18920, api:320000,  wsConn:412,  healthScore:79, allTimeRev:28400,  subFee:1200, city:"Sydney" },
  { id:4,  name:"PeakFX",            plan:"STARTER",    country:"Seychelles",      flag:"🇸🇨", clients:89,   aum:420000,   volumeMTD:8500000,   rev:850,   growth:-2.3,  status:"TRIAL",     since:"Feb 2024", am:"Tom L.",    contact:"admin@peakfx.sc",        trades:3240,  api:48000,   wsConn:89,   healthScore:51, allTimeRev:4250,   subFee:500,  city:"Victoria" },
  { id:5,  name:"AlphaStream",       plan:"PRO",        country:"Cyprus",          flag:"🇨🇾", clients:890,  aum:5400000,  volumeMTD:87000000,  rev:8700,  growth:11.3,  status:"ACTIVE",    since:"Mar 2023", am:"Mike R.",   contact:"ops@alphastream.cy",     trades:32100, api:650000,  wsConn:890,  healthScore:82, allTimeRev:94600,  subFee:2500, city:"Limassol" },
  { id:6,  name:"BlueSky Traders",   plan:"GROWTH",     country:"South Africa",    flag:"🇿🇦", clients:234,  aum:980000,   volumeMTD:18000000,  rev:1800,  growth:31.2,  status:"ACTIVE",    since:"Jan 2024", am:"Tom L.",    contact:"info@bluesky.co.za",     trades:8900,  api:180000,  wsConn:234,  healthScore:73, allTimeRev:10800,  subFee:1200, city:"Cape Town" },
  { id:7,  name:"SkyFX Ltd",         plan:"PRO",        country:"Cayman Islands",  flag:"🇰🇾", clients:567,  aum:3100000,  volumeMTD:0,         rev:0,     growth:-100,  status:"SUSPENDED", since:"Nov 2022", am:"Sarah K.",  contact:"compliance@skyfx.ky",    trades:0,     api:0,       wsConn:0,    healthScore:12, allTimeRev:67400,  subFee:2500, city:"George Town" },
  { id:8,  name:"TradeNest",         plan:"GROWTH",     country:"Nigeria",         flag:"🇳🇬", clients:318,  aum:1200000,  volumeMTD:21000000,  rev:2100,  growth:44.7,  status:"ACTIVE",    since:"Nov 2023", am:"Tom L.",    contact:"hello@tradenest.ng",     trades:11200, api:240000,  wsConn:318,  healthScore:70, allTimeRev:12600,  subFee:1200, city:"Lagos" },
  { id:9,  name:"MarketPulse FX",    plan:"PRO",        country:"Singapore",       flag:"🇸🇬", clients:723,  aum:4800000,  volumeMTD:72000000,  rev:7200,  growth:9.8,   status:"ACTIVE",    since:"Sep 2022", am:"Mike R.",   contact:"ops@marketpulse.sg",     trades:28900, api:580000,  wsConn:723,  healthScore:86, allTimeRev:84000,  subFee:2500, city:"Singapore" },
  { id:10, name:"OmegaTrade",        plan:"ENTERPRISE", country:"UK",              flag:"🇬🇧", clients:1890, aum:9200000,  volumeMTD:195000000, rev:19500, growth:6.2,   status:"ACTIVE",    since:"Dec 2021", am:"Sarah K.",  contact:"admin@omegatrade.co.uk", trades:67800, api:1400000, wsConn:1890, healthScore:91, allTimeRev:274000, subFee:8000, city:"London" },
  { id:11, name:"SwiftFX Global",    plan:"STARTER",    country:"Mauritius",       flag:"🇲🇺", clients:145,  aum:580000,   volumeMTD:12000000,  rev:1200,  growth:18.9,  status:"ACTIVE",    since:"Mar 2024", am:"Tom L.",    contact:"info@swiftfx.mu",        trades:5400,  api:96000,   wsConn:145,  healthScore:65, allTimeRev:3600,   subFee:500,  city:"Port Louis" },
  { id:12, name:"CrestCapital FX",   plan:"GROWTH",     country:"Bahrain",         flag:"🇧🇭", clients:289,  aum:1600000,  volumeMTD:24000000,  rev:2400,  growth:27.5,  status:"ACTIVE",    since:"Jun 2023", am:"Mike R.",   contact:"ops@crestcapital.bh",    trades:9800,  api:210000,  wsConn:289,  healthScore:76, allTimeRev:19200,  subFee:1200, city:"Manama" },
  { id:13, name:"ZenithFX",          plan:"PRO",        country:"New Zealand",     flag:"🇳🇿", clients:456,  aum:2400000,  volumeMTD:38000000,  rev:3800,  growth:13.4,  status:"ACTIVE",    since:"May 2023", am:"Sarah K.",  contact:"info@zenithfx.nz",       trades:16700, api:340000,  wsConn:456,  healthScore:83, allTimeRev:41800,  subFee:2500, city:"Auckland" },
  { id:14, name:"PrimeAxis",         plan:"GROWTH",     country:"Canada",          flag:"🇨🇦", clients:203,  aum:890000,   volumeMTD:15000000,  rev:1500,  growth:35.8,  status:"ACTIVE",    since:"Feb 2024", am:"Tom L.",    contact:"hello@primeaxis.ca",     trades:7200,  api:156000,  wsConn:203,  healthScore:68, allTimeRev:7500,   subFee:1200, city:"Toronto" },
];

const genRevData = () => {
  const d=[];
  for(let i=29;i>=0;i--){
    const dt=new Date(); dt.setDate(dt.getDate()-i);
    const base=4800+Math.sin(i/5)*400;
    d.push({
      date:dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}),
      subscriptions:Math.round(base+Math.random()*600),
      revShare:Math.round(1800+Math.random()*600),
      setup:Math.random()>.85?Math.round(2000+Math.random()*3000):0,
      premium:Math.round(380+Math.random()*160),
    });
  }
  return d;
};
const REVENUE_DATA = genRevData();

const GROWTH_DATA = [
  {m:'Apr',new:1,churn:0},{m:'May',new:2,churn:0},{m:'Jun',new:1,churn:1},
  {m:'Jul',new:2,churn:0},{m:'Aug',new:3,churn:0},{m:'Sep',new:1,churn:1},
  {m:'Oct',new:2,churn:0},{m:'Nov',new:2,churn:0},{m:'Dec',new:1,churn:0},
  {m:'Jan',new:3,churn:0},{m:'Feb',new:2,churn:1},{m:'Mar',new:2,churn:0},
];

const NODES = [
  {id:'node-01',loc:'London (EU-W)',   load:42, mem:61, status:'OPERATIONAL', tenants:5},
  {id:'node-02',loc:'New York (US-E)', load:78, mem:84, status:'WARNING',     tenants:4},
  {id:'node-03',loc:'Singapore (AP)',  load:35, mem:48, status:'OPERATIONAL', tenants:3},
  {id:'node-04',loc:'Dubai (ME)',      load:29, mem:42, status:'OPERATIONAL', tenants:2},
  {id:'node-05',loc:'Sydney (AP-AU)',  load:55, mem:67, status:'OPERATIONAL', tenants:2},
  {id:'node-06',loc:'Toronto (US-CA)', load:18, mem:31, status:'OPERATIONAL', tenants:1},
];

const SERVICES = [
  {name:'Trading Engine',    status:'OPERATIONAL', uptime:'99.99%', lat:'4ms'},
  {name:'Price Feed',        status:'OPERATIONAL', uptime:'99.97%', lat:'2ms'},
  {name:'Order Matching',    status:'OPERATIONAL', uptime:'99.99%', lat:'6ms'},
  {name:'WebSocket Gateway', status:'OPERATIONAL', uptime:'99.95%', lat:'8ms'},
  {name:'REST API',          status:'OPERATIONAL', uptime:'99.98%', lat:'12ms'},
  {name:'Auth Service',      status:'OPERATIONAL', uptime:'100%',   lat:'3ms'},
  {name:'KYC Service',       status:'DEGRADED',    uptime:'98.2%',  lat:'340ms'},
  {name:'Payment Gateway',   status:'OPERATIONAL', uptime:'99.94%', lat:'45ms'},
  {name:'Email Service',     status:'OPERATIONAL', uptime:'99.89%', lat:'120ms'},
  {name:'Database Primary',  status:'OPERATIONAL', uptime:'99.99%', lat:'2ms'},
  {name:'Database Replica',  status:'OPERATIONAL', uptime:'99.97%', lat:'4ms'},
  {name:'Cache Layer',       status:'OPERATIONAL', uptime:'99.99%', lat:'1ms'},
  {name:'CDN',               status:'OPERATIONAL', uptime:'99.99%', lat:'18ms'},
  {name:'Mobile API',        status:'OPERATIONAL', uptime:'99.96%', lat:'22ms'},
  {name:'FIX Gateway',       status:'MAINTENANCE', uptime:'99.91%', lat:'5ms'},
  {name:'LP Bridge',         status:'OPERATIONAL', uptime:'99.93%', lat:'8ms'},
];

const LPS = [
  {id:1,name:'LMAX Digital',type:'Prime Broker',  status:'CONNECTED',    lat:8,  inst:847, uptime:'99.94%',credit:10000000,used:2400000},
  {id:2,name:'Integral',    type:'ECN',            status:'CONNECTED',    lat:12, inst:612, uptime:'99.87%',credit:8000000, used:1800000},
  {id:3,name:'Currenex',    type:'Prime Broker',   status:'DISCONNECTED', lat:0,  inst:524, uptime:'97.2%', credit:5000000, used:0},
];

const ROUTING_RULES = [
  {id:1,rule:'EUR/USD volume > 10 lots',action:'Route to LMAX Digital',priority:'HIGH'},
  {id:2,rule:'XAU/USD — all orders',   action:'Always route to Integral',priority:'MEDIUM'},
  {id:3,rule:'LP latency > 100ms',     action:'Failover to next LP',priority:'CRITICAL'},
  {id:4,rule:'BTC/USD — all orders',   action:'Route to LMAX Digital',priority:'MEDIUM'},
];

const ONBOARDING = [
  {id:'ob1',name:'Vertex Capital FX',country:'UAE',     flag:'🇦🇪',plan:'ENTERPRISE',contact:'Ahmed Al-Rashid',email:'ahmed@vertexcapital.ae',stage:'UAT',           days:3, checklist:{contract:true,aml:true,domain:true,ssl:true,email:true,instruments:true,testAccounts:true,uat:false,golive:false}},
  {id:'ob2',name:'TradeSphere',      country:'Canada',  flag:'🇨🇦',plan:'PRO',        contact:'Lisa Chen',      email:'lisa@tradesphere.ca',   stage:'CONTRACT SIGNED',days:7, checklist:{contract:true,aml:false,domain:false,ssl:false,email:false,instruments:false,testAccounts:false,uat:false,golive:false}},
];

const KANBAN_STAGES = ['APPLIED','CONTRACT SENT','CONTRACT SIGNED','TECHNICAL SETUP','UAT','GO LIVE READY','LIVE'];

const INSTRUMENTS = [
  {sym:'EUR/USD',name:'Euro / US Dollar',          cat:'Forex',       lp:'LMAX',     price:'1.08456', status:'ACTIVE', tenants:14},
  {sym:'GBP/USD',name:'British Pound / US Dollar', cat:'Forex',       lp:'LMAX',     price:'1.26834', status:'ACTIVE', tenants:14},
  {sym:'USD/JPY',name:'US Dollar / Japanese Yen',  cat:'Forex',       lp:'Integral', price:'149.234', status:'ACTIVE', tenants:13},
  {sym:'EUR/JPY',name:'Euro / Japanese Yen',        cat:'Forex',       lp:'LMAX',     price:'161.840', status:'ACTIVE', tenants:11},
  {sym:'AUD/USD',name:'Australian Dollar / USD',    cat:'Forex',       lp:'Integral', price:'0.64523', status:'ACTIVE', tenants:11},
  {sym:'USD/CAD',name:'US Dollar / Canadian Dollar',cat:'Forex',       lp:'LMAX',     price:'1.36234', status:'ACTIVE', tenants:10},
  {sym:'EUR/GBP',name:'Euro / British Pound',       cat:'Forex',       lp:'LMAX',     price:'0.85634', status:'ACTIVE', tenants:12},
  {sym:'XAU/USD',name:'Gold / US Dollar',           cat:'Commodities', lp:'Integral', price:'2,324.50',status:'ACTIVE', tenants:12},
  {sym:'XAG/USD',name:'Silver / US Dollar',         cat:'Commodities', lp:'Integral', price:'27.340',  status:'ACTIVE', tenants:9},
  {sym:'WTI/USD',name:'Crude Oil WTI',              cat:'Commodities', lp:'Integral', price:'78.340',  status:'ACTIVE', tenants:10},
  {sym:'BTC/USD',name:'Bitcoin / US Dollar',        cat:'Crypto',      lp:'LMAX',     price:'68,420',  status:'ACTIVE', tenants:10},
  {sym:'ETH/USD',name:'Ethereum / US Dollar',       cat:'Crypto',      lp:'LMAX',     price:'3,456',   status:'ACTIVE', tenants:8},
  {sym:'XRP/USD',name:'Ripple / US Dollar',         cat:'Crypto',      lp:'LMAX',     price:'0.6234',  status:'ACTIVE', tenants:6},
  {sym:'US30',   name:'Dow Jones Industrial',       cat:'Indices',     lp:'LMAX',     price:'39,234',  status:'ACTIVE', tenants:11},
  {sym:'NAS100', name:'NASDAQ 100',                  cat:'Indices',     lp:'LMAX',     price:'18,456',  status:'ACTIVE', tenants:11},
  {sym:'SPX500', name:'S&P 500 Index',               cat:'Indices',     lp:'LMAX',     price:'5,234',   status:'ACTIVE', tenants:11},
  {sym:'GER40',  name:'DAX 40 Index',                cat:'Indices',     lp:'Integral', price:'17,842',  status:'ACTIVE', tenants:9},
  {sym:'AAPL',   name:'Apple Inc.',                  cat:'Stocks',      lp:'LMAX',     price:'178.23',  status:'ACTIVE', tenants:6},
  {sym:'TSLA',   name:'Tesla Inc.',                  cat:'Stocks',      lp:'LMAX',     price:'245.60',  status:'ACTIVE', tenants:5},
  {sym:'NVDA',   name:'NVIDIA Corp.',                cat:'Stocks',      lp:'LMAX',     price:'822.40',  status:'ACTIVE', tenants:4},
];

const JURISDICTIONS = [
  {country:'United Kingdom',  body:'FCA',      leverage:'1:30',  kyc:'Enhanced', allowed:true,  restrict:true},
  {country:'European Union',  body:'ESMA',     leverage:'1:30',  kyc:'Enhanced', allowed:true,  restrict:true},
  {country:'Australia',       body:'ASIC',     leverage:'1:30',  kyc:'Standard', allowed:true,  restrict:true},
  {country:'UAE',             body:'DFSA/SCA', leverage:'1:50',  kyc:'Enhanced', allowed:true,  restrict:false},
  {country:'Seychelles',      body:'FSA',      leverage:'1:500', kyc:'Basic',    allowed:true,  restrict:false},
  {country:'Cayman Islands',  body:'CIMA',     leverage:'1:500', kyc:'Standard', allowed:true,  restrict:false},
  {country:'Bahrain',         body:'CBB',      leverage:'1:50',  kyc:'Enhanced', allowed:true,  restrict:false},
  {country:'Singapore',       body:'MAS',      leverage:'1:20',  kyc:'Enhanced', allowed:true,  restrict:true},
  {country:'New Zealand',     body:'FMA',      leverage:'1:200', kyc:'Standard', allowed:true,  restrict:false},
  {country:'Russia',          body:'CBR',      leverage:'1:50',  kyc:'Enhanced', allowed:false, restrict:true},
  {country:'Iran',            body:'N/A',      leverage:'N/A',   kyc:'N/A',      allowed:false, restrict:true},
  {country:'North Korea',     body:'N/A',      leverage:'N/A',   kyc:'N/A',      allowed:false, restrict:true},
  {country:'Cuba',            body:'N/A',      leverage:'N/A',   kyc:'N/A',      allowed:false, restrict:true},
  {country:'Syria',           body:'N/A',      leverage:'N/A',   kyc:'N/A',      allowed:false, restrict:true},
];

const ACTIVITY_POOL = [
  {type:'CLIENT', severity:'info', tenant:'ArcaFX Markets',  msg:'New client registered (total: 1,248)'},
  {type:'DEPOSIT',severity:'bull', tenant:'GlobalFX Pro',    msg:'Deposit $50,000 processed'},
  {type:'TRADE',  severity:'info', tenant:'NovaTrade',       msg:'EUR/USD 10 lots @ 1.08456 executed'},
  {type:'KYC',    severity:'info', tenant:'NovaTrade',       msg:'KYC document uploaded for review'},
  {type:'ALERT',  severity:'warn', tenant:'PeakFX',          msg:'API error rate spike >1% detected'},
  {type:'TRADE',  severity:'info', tenant:'GlobalFX Pro',    msg:'XAU/USD 5 lots @ 2324.50 executed'},
  {type:'BILLING',severity:'bull', tenant:'AlphaStream',     msg:'Invoice #INV-2024-089 paid — $8,700'},
  {type:'SYSTEM', severity:'warn', tenant:'Platform',        msg:'Node node-02 load reached 78%'},
  {type:'CLIENT', severity:'info', tenant:'BlueSky Traders', msg:'New client registered (total: 235)'},
  {type:'TRADE',  severity:'info', tenant:'MarketPulse FX',  msg:'BTC/USD 2 lots @ 68420 executed'},
  {type:'WITHDRAW',severity:'info',tenant:'OmegaTrade',      msg:'Withdrawal $12,500 approved'},
  {type:'ALERT',  severity:'bear', tenant:'SkyFX Ltd',       msg:'Account suspended — 3 months overdue'},
  {type:'CONFIG', severity:'info', tenant:'TradeNest',       msg:'Feature "Copy Trading" enabled'},
  {type:'ONBOARD',severity:'info', tenant:'Vertex Capital',  msg:'UAT stage — 3 days remaining'},
  {type:'TRADE',  severity:'info', tenant:'ZenithFX',        msg:'GBP/USD 8 lots @ 1.26834 executed'},
  {type:'CLIENT', severity:'info', tenant:'PrimeAxis',       msg:'New client registered (total: 204)'},
  {type:'DEPOSIT',severity:'bull', tenant:'AlphaStream',     msg:'Deposit $125,000 processed'},
  {type:'TRADE',  severity:'info', tenant:'OmegaTrade',      msg:'NAS100 3 lots @ 18456 executed'},
];

const CHANGELOG = [
  {ver:'v2.4.1',date:'Mar 15, 2026',type:'FIX',    desc:'Fixed WebSocket reconnection under high load causing duplicate subscriptions'},
  {ver:'v2.4.0',date:'Mar 10, 2026',type:'FEATURE',desc:'Added Copy Trading module — full leader/follower architecture with risk controls'},
  {ver:'v2.3.9',date:'Feb 28, 2026',type:'FIX',    desc:'Resolved KYC service timeout issue for documents >10MB'},
  {ver:'v2.3.8',date:'Feb 15, 2026',type:'FEATURE',desc:'Prop Desk module — challenge-based funding system with drawdown limits'},
  {ver:'v2.3.7',date:'Feb 2, 2026', type:'FIX',    desc:'Fixed margin calculation for crypto pairs during high volatility'},
  {ver:'v2.3.6',date:'Jan 20, 2026',type:'BREAKING',desc:'API v1 deprecated — all tenants must migrate to v2 by Apr 1 2026'},
  {ver:'v2.3.5',date:'Jan 8, 2026', type:'FEATURE',desc:'Multi-brand support for Enterprise tenants — up to 5 sub-brands per account'},
];

const WEBHOOKS = [
  {tenant:'GlobalFX Pro',   event:'trade.executed',    url:'https://api.globalfxpro.ae/wh/***', status:'ACTIVE',  last:'2m ago'},
  {tenant:'ArcaFX Markets', event:'client.registered', url:'https://api.arcafx.com/wh/***',     status:'ACTIVE',  last:'8m ago'},
  {tenant:'OmegaTrade',     event:'deposit.completed', url:'https://hooks.omegatrade.co.uk/***',status:'ACTIVE',  last:'4m ago'},
  {tenant:'NovaTrade',      event:'kyc.updated',       url:'https://api.novatrade.au/wh/***',   status:'FAILING', last:'3h ago'},
  {tenant:'AlphaStream',    event:'withdrawal.approved',url:'https://wh.alphastream.cy/***',    status:'ACTIVE',  last:'1h ago'},
  {tenant:'MarketPulse FX', event:'trade.executed',    url:'https://api.marketpulse.sg/wh/***', status:'ACTIVE',  last:'12m ago'},
];

const TEAM = [
  {name:'Alex Chen',    role:'CEO',              access:'Super Admin', email:'alex@obsidian.io',      last:'Just now'},
  {name:'Jordan Lee',   role:'CTO',              access:'Super Admin', email:'jordan@obsidian.io',    last:'2m ago'},
  {name:'Marcus Webb',  role:'Head of Sales',    access:'Sales',       email:'marcus@obsidian.io',    last:'34m ago'},
  {name:'Sarah Kim',    role:'Customer Success', access:'CS',          email:'sarah@obsidian.io',     last:'1h ago'},
  {name:'Tom Larson',   role:'Customer Success', access:'CS',          email:'tom@obsidian.io',       last:'3h ago'},
  {name:'Dev Ops Bot',  role:'DevOps',           access:'Technical',   email:'devops@obsidian.io',    last:'Automated'},
];

const AUDIT_LOG = [
  {time:'14:24:11',user:'Alex Chen',  action:'Viewed impersonation session for GlobalFX Pro',         type:'SECURITY'},
  {time:'14:18:33',user:'Sarah Kim',  action:'Enabled Copy Trading module for TradeNest',             type:'CONFIG'},
  {time:'14:02:17',user:'Alex Chen',  action:'Changed SkyFX Ltd status → SUSPENDED',                  type:'BILLING'},
  {time:'13:55:40',user:'Marcus Webb',action:'Created discount 15% for NovaTrade (expires Jun 2026)', type:'BILLING'},
  {time:'13:30:09',user:'Jordan Lee', action:'Updated LMAX Digital FIX credentials',                  type:'INFRA'},
  {time:'12:48:22',user:'Tom Larson', action:'Moved Vertex Capital FX → UAT stage',                   type:'ONBOARD'},
  {time:'11:24:55',user:'Alex Chen',  action:'Published changelog v2.4.1',                            type:'DEV'},
  {time:'10:15:33',user:'Jordan Lee', action:'Restarted node-02 WebSocket service',                   type:'INFRA'},
  {time:'09:44:18',user:'Sarah Kim',  action:'Sent onboarding welcome kit to TradeSphere',             type:'ONBOARD'},
  {time:'09:02:47',user:'Alex Chen',  action:'Approved TradeSphere contract — upgraded to PRO',       type:'SALES'},
];

// ═══════════════════════════════════════════════════════════════════
// HELPERS & SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════
const fmt = n => {
  if(n>=1e9) return '$'+(n/1e9).toFixed(1)+'B';
  if(n>=1e6) return '$'+(n/1e6).toFixed(1)+'M';
  if(n>=1e3) return '$'+(n/1e3).toFixed(0)+'K';
  return '$'+n;
};
const fmtN = n => {
  if(n>=1e9) return (n/1e9).toFixed(1)+'B';
  if(n>=1e6) return (n/1e6).toFixed(1)+'M';
  if(n>=1e3) return (n/1e3).toFixed(0)+'K';
  return String(n);
};
const now = () => {
  const d=new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};

const Badge = ({plan}) => {
  const cls = {STARTER:'badge-starter',GROWTH:'badge-growth',PRO:'badge-pro',ENTERPRISE:'badge-enterprise'}[plan]||'badge-starter';
  return <span className={`badge ${cls}`}>{plan}</span>;
};
const StatusBadge = ({s}) => {
  const cls = {ACTIVE:'badge-active',TRIAL:'badge-trial',SUSPENDED:'badge-suspended',ONBOARDING:'badge-onboarding',CHURNED:'badge-churned',OPERATIONAL:'badge-operational',DEGRADED:'badge-degraded',OUTAGE:'badge-outage',MAINTENANCE:'badge-maintenance',CONNECTED:'badge-connected',DISCONNECTED:'badge-disconnected',WARNING:'badge-degraded'}[s]||'badge-active';
  return <span className={`badge ${cls}`}>{s}</span>;
};
const Dot = ({color='bull', pulse=false}) => (
  <span className={`sdot sdot-${color}${pulse?' sdot-pulse':''}`}/>
);
const Btn = ({children, variant='ghost', size='', onClick, style}) => (
  <button className={`btn btn-${variant}${size?' btn-'+size:''}`} onClick={onClick} style={style}>{children}</button>
);
const MiniToggle = ({on, onToggle}) => (
  <button className={`mini-toggle ${on?'on':'off'}`} onClick={onToggle}/>
);
const GaugeBar = ({pct, color}) => {
  const c = pct>=80?'var(--bear)':pct>=60?'var(--warn)':color||'var(--bull)';
  return <div className="gauge-bar"><div className="gauge-fill" style={{width:`${pct}%`,background:c}}/></div>;
};
const SmallSparkline = ({data, color='#3B82F6'}) => {
  const max=Math.max(...data), min=Math.min(...data);
  const pts=data.map((v,i)=>{
    const x=(i/(data.length-1))*60;
    const y=20-((v-min)/(max-min||1))*18;
    return `${x},${y}`;
  }).join(' ');
  return <svg width="60" height="20" className="sparkline"><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>;
};
const CustomTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',fontFamily:'var(--font-data)',fontSize:11}}>
      <div style={{color:'var(--text-muted)',marginBottom:4}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color,display:'flex',justifyContent:'space-between',gap:12}}>
          <span>{p.name}</span><span style={{fontWeight:600}}>${Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// TOPBAR
// ═══════════════════════════════════════════════════════════════════
function TopBar() {
  const [time,setTime] = useState(now());
  useEffect(()=>{const t=setInterval(()=>setTime(now()),1000);return()=>clearInterval(t);},[]);
  return (
    <div className="topbar">
      <div className="topbar-logo">OBSIDIAN<span>HUB</span></div>
      <div className="topbar-pill"><Dot color="bull" pulse/> Platform v2.4.1 LIVE</div>
      <div className="topbar-sep"/>
      <div className="topbar-stat"><strong>14</strong> tenants</div>
      <div className="topbar-stat"><strong>8,412</strong> end clients</div>
      <div className="topbar-stat"><strong>$42.4M</strong> AUM</div>
      <div className="topbar-sep"/>
      <div className="topbar-pill"><Dot color="bull" pulse/> ALL SYSTEMS OPERATIONAL</div>
      <div className="topbar-right">
        <div style={{fontFamily:'var(--font-data)',fontSize:11,color:'var(--text-muted)'}}>{time}</div>
        <button className="topbar-btn alert">⚠ 2 Alerts</button>
        <button className="topbar-btn">Changelog</button>
        <button className="topbar-btn">Docs</button>
        <div className="topbar-user">
          <div className="topbar-avatar">AC</div>
          <span style={{fontSize:12,color:'var(--text-pri)'}}>Alex Chen — CEO</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════
const NAV = [
  {section:'OVERVIEW', items:[
    {id:'dashboard',  icon:'◈', label:'Dashboard'},
    {id:'health',     icon:'⬡', label:'Platform Health'},
    {id:'activity',   icon:'◉', label:'Live Activity Feed'},
  ]},
  {section:'TENANTS', items:[
    {id:'brokers',    icon:'▦', label:'All Brokers',      badge:'14'},
    {id:'onboarding', icon:'⊕', label:'Onboarding Queue', badge:'2', badgeWarn:false},
    {id:'suspended',  icon:'⊗', label:'Suspended',        badge:'1', badgeWarn:true},
    {id:'features',   icon:'✦', label:'Feature Requests', badge:'7'},
  ]},
  {section:'PLATFORM', items:[
    {id:'instruments', icon:'⊞', label:'Instruments Master'},
    {id:'lps',         icon:'⬡', label:'Liquidity Providers'},
    {id:'pricing',     icon:'◈', label:'Pricing Engine'},
    {id:'fees',        icon:'◎', label:'Fee Schedules'},
  ]},
  {section:'INFRA', items:[
    {id:'nodes',    icon:'⬡', label:'Server Nodes'},
    {id:'gateway',  icon:'⊕', label:'API Gateway'},
    {id:'ws',       icon:'◉', label:'WebSocket Feeds'},
    {id:'db',       icon:'▦', label:'Database Health'},
  ]},
  {section:'FINANCE', items:[
    {id:'revenue',  icon:'◈', label:'SaaS Revenue'},
    {id:'billing',  icon:'◎', label:'Tenant Billing'},
    {id:'invoices', icon:'⊞', label:'Invoices'},
  ]},
  {section:'COMPLIANCE', items:[
    {id:'compliance', icon:'⬡', label:'Global Limits & Regs'},
    {id:'aml',        icon:'⊗', label:'Platform AML Rules'},
    {id:'incidents',  icon:'⚠', label:'Incident Log'},
  ]},
  {section:'DEVELOPER', items:[
    {id:'developer',  icon:'⊕', label:'Dev Portal & Docs'},
    {id:'webhooks',   icon:'◉', label:'Webhook Registry'},
    {id:'sdks',       icon:'▦', label:'SDK Versions'},
  ]},
  {section:'SETTINGS', items:[
    {id:'team',   icon:'◎', label:'Team & Permissions'},
    {id:'audit',  icon:'⊞', label:'Audit Log'},
    {id:'settings',icon:'⬡',label:'Platform Settings'},
  ]},
];

const ROUTED_IDS = new Set(['dashboard','health','brokers','onboarding','instruments','lps','revenue','compliance','developer','team','audit','activity']);

function Sidebar({nav, setNav, collapsed, setCollapsed}) {
  return (
    <div className={`sidebar${collapsed?' collapsed':''}`}>
      <div className="sidebar-logo" onClick={()=>setCollapsed(c=>!c)}>
        <div className="sidebar-logo-icon">⬡</div>
        <div><div className="sidebar-logo-text">OBSIDIAN HUB</div><div className="sidebar-logo-ver">v2.4.1 — Platform</div></div>
      </div>
      {NAV.map(group=>(
        <div key={group.section}>
          <div className="sidebar-section">{group.section}</div>
          {group.items.map(item=>(
            <div
              key={item.id}
              className={`sidebar-item${nav===item.id?' active':''}`}
              onClick={()=>setNav(item.id)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
              {item.badge && <span className={`sidebar-badge${item.badgeWarn?' warn':''}`}>{item.badge}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 1: DASHBOARD
// ═══════════════════════════════════════════════════════════════════
const TRADE_PIE = TENANTS.filter(t=>t.status!=='SUSPENDED').sort((a,b)=>b.volumeMTD-a.volumeMTD).slice(0,5).map(t=>({name:t.name,value:t.volumeMTD}));
TRADE_PIE.push({name:'Other', value: TENANTS.filter((_,i)=>i>=5).reduce((s,t)=>s+t.volumeMTD,0)});
const PIE_COLORS = ['#3B82F6','#10D996','#F59E0B','#A855F7','#FF3B5C','#2A3445'];

function Dashboard({setNav, setSelectedTenant}) {
  const [chartMode, setChartMode] = useState('daily');
  const [leaderSort, setLeaderSort] = useState('volume');
  const [feedItems, setFeedItems] = useState(() => ACTIVITY_POOL.slice(0,8).map((e,i)=>({...e,id:i,time:now()})));
  const [feedPaused, setFeedPaused] = useState(false);
  const feedRef = useRef(0);

  useEffect(()=>{
    if(feedPaused) return;
    const t = setInterval(()=>{
      feedRef.current = (feedRef.current+1)%ACTIVITY_POOL.length;
      const ev = {...ACTIVITY_POOL[feedRef.current], id:Date.now(), time:now()};
      setFeedItems(prev=>[ev,...prev.slice(0,14)]);
    }, 2200);
    return ()=>clearInterval(t);
  },[feedPaused]);

  const sorted = [...TENANTS].filter(t=>t.status!=='SUSPENDED').sort((a,b)=>{
    if(leaderSort==='volume') return b.volumeMTD-a.volumeMTD;
    if(leaderSort==='revenue') return b.rev-a.rev;
    if(leaderSort==='users') return b.clients-a.clients;
    return b.growth-a.growth;
  }).slice(0,10);

  const totalRev = REVENUE_DATA.reduce((s,d)=>s+d.subscriptions+d.revShare+d.setup+d.premium,0);

  return (
    <div className="page fade-in">
      {/* KPI ROW */}
      <div className="kpi-grid">
        <div className="kpi-card accent">
          <div className="kpi-label">Active Tenants</div>
          <div className="kpi-value">14</div>
          <div className="kpi-sub up">+2 this month</div>
        </div>
        <div className="kpi-card bull">
          <div className="kpi-label">Total End Users</div>
          <div className="kpi-value">8,412</div>
          <div className="kpi-sub up">+234 vs yesterday</div>
        </div>
        <div className="kpi-card accent">
          <div className="kpi-label">Combined AUM</div>
          <div className="kpi-value">$42.4M</div>
          <div className="kpi-sub up">+$1.2M today</div>
        </div>
        <div className="kpi-card warn">
          <div className="kpi-label">Platform Rev MTD</div>
          <div className="kpi-value">$184.2K</div>
          <div className="kpi-sub up">vs $162K avg</div>
        </div>
        <div className="kpi-card bull">
          <div className="kpi-label">Trades Today</div>
          <div className="kpi-value">124,847</div>
          <div className="kpi-sub" style={{color:'var(--text-sec)'}}>$890M notional</div>
        </div>
        <div className="kpi-card accent">
          <div className="kpi-label">Uptime (30d)</div>
          <div className="kpi-value">99.97%</div>
          <div className="kpi-sub" style={{color:'var(--text-sec)'}}>11s downtime</div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="charts-row">
        {/* Revenue Area */}
        <div className="chart-wrap">
          <div className="chart-hd">
            <div>
              <div className="chart-title">Platform Revenue (30d)</div>
              <div className="chart-meta">$184,200 <span className="chart-meta-sub">MRR ↑12%</span></div>
            </div>
            <div className="toggle-wrap">
              {['daily','weekly'].map(m=><button key={m} className={`toggle-btn${chartMode===m?' active':''}`} onClick={()=>setChartMode(m)}>{m}</button>)}
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={REVENUE_DATA} margin={{top:4,right:0,bottom:0,left:0}}>
                <defs>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10D996" stopOpacity={0.3}/><stop offset="100%" stopColor="#10D996" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A855F7" stopOpacity={0.3}/><stop offset="100%" stopColor="#A855F7" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2}/><stop offset="100%" stopColor="#F59E0B" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1C2230" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:'#4A5568',fontSize:9,fontFamily:'IBM Plex Mono'}} tickLine={false} axisLine={false} interval={6}/>
                <YAxis tick={{fill:'#4A5568',fontSize:9,fontFamily:'IBM Plex Mono'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v/1000}k`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="subscriptions" stackId="1" stroke="#3B82F6" fill="url(#gs)" strokeWidth={1.5} name="Subscriptions"/>
                <Area type="monotone" dataKey="revShare"      stackId="1" stroke="#10D996" fill="url(#gr)" strokeWidth={1.5} name="Rev Share"/>
                <Area type="monotone" dataKey="premium"       stackId="1" stroke="#A855F7" fill="url(#gp)" strokeWidth={1.5} name="Premium"/>
                <Area type="monotone" dataKey="setup"         stackId="1" stroke="#F59E0B" fill="url(#gw)" strokeWidth={1.5} name="Setup Fees"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tenant Growth */}
        <div className="chart-wrap">
          <div className="chart-hd">
            <div>
              <div className="chart-title">Tenant Growth</div>
              <div className="chart-meta">14 <span style={{fontSize:12,color:'var(--text-sec)'}}>net active</span></div>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={GROWTH_DATA} margin={{top:4,right:0,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1C2230" vertical={false}/>
                <XAxis dataKey="m" tick={{fill:'#4A5568',fontSize:9,fontFamily:'IBM Plex Mono'}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fill:'#4A5568',fontSize:9}} tickLine={false} axisLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="new"   name="New Tenants" fill="#3B82F6" radius={[3,3,0,0]}/>
                <Bar dataKey="churn" name="Churned"     fill="#FF3B5C" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trades Ring */}
        <div className="chart-wrap">
          <div className="chart-hd">
            <div>
              <div className="chart-title">Volume by Tenant</div>
              <div className="chart-meta">$1.04B <span style={{fontSize:12,color:'var(--text-sec)'}}>MTD</span></div>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={TRADE_PIE} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {TRADE_PIE.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]} stroke="transparent"/>)}
                </Pie>
                <Tooltip formatter={(v)=>`$${(v/1e6).toFixed(0)}M`}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              {TRADE_PIE.slice(0,4).map((t,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:10,color:'var(--text-sec)'}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:PIE_COLORS[i],flexShrink:0,display:'inline-block'}}/>
                  <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</span>
                  <span style={{fontFamily:'var(--font-data)',color:'var(--text-pri)'}}>${(t.value/1e6).toFixed(0)}M</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HEALTH STRIP */}
      <div className="health-strip">
        <div className="health-card">
          <div className="health-label">Server Load (avg)</div>
          <div className="health-big" style={{color:'var(--bull)'}}>42<span style={{fontSize:14,color:'var(--text-sec)'}}>%</span></div>
          <GaugeBar pct={42}/>
          <div className="health-row"><span>API</span><span>38%</span></div>
          <div className="health-row"><span>WebSocket</span><span>55%</span></div>
          <div className="health-row"><span>DB</span><span>29%</span></div>
        </div>
        <div className="health-card">
          <div className="health-label">Active Connections</div>
          <div className="health-big">3,847</div>
          <div className="health-sub">WebSocket connections</div>
          <div className="health-row mt-8"><span>API calls/min</span><span style={{color:'var(--text-pri)'}}>24,200</span></div>
          <div className="health-row"><span>DB queries/sec</span><span style={{color:'var(--text-pri)'}}>8,940</span></div>
        </div>
        <div className="health-card">
          <div className="health-label">Trade Latency</div>
          <div className="health-big" style={{color:'var(--bull)'}}>12<span style={{fontSize:14,color:'var(--text-sec)'}}>ms</span></div>
          <div className="health-sub">avg order processing</div>
          <div className="health-row mt-8"><span>P95</span><span style={{color:'var(--warn)'}}>28ms</span></div>
          <div className="health-row"><span>P99</span><span style={{color:'var(--bear)'}}>67ms</span></div>
          <div className="health-row"><span>Target</span><span style={{color:'var(--text-muted)'}}>&lt;50ms</span></div>
        </div>
        <div className="health-card">
          <div className="health-label">Error Rate</div>
          <div className="health-big" style={{color:'var(--bull)'}}>0.03<span style={{fontSize:14,color:'var(--text-sec)'}}>%</span></div>
          <div className="health-sub">last 5 minutes</div>
          <div className="health-row mt-8"><span>Failed trades</span><span style={{color:'var(--bear)'}}>3</span></div>
          <div className="health-row"><span>Failed logins</span><span style={{color:'var(--warn)'}}>47</span></div>
          <div className="health-row"><span>4xx/5xx</span><span style={{color:'var(--text-pri)'}}>12 / 4</span></div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="bottom-row">
        {/* Leaderboard */}
        <div className="card">
          <div className="card-hd">
            <span className="card-title">Tenant Leaderboard</span>
            <div className="toggle-wrap">
              {['volume','revenue','users','growth'].map(s=><button key={s} className={`toggle-btn${leaderSort===s?' active':''}`} onClick={()=>setLeaderSort(s)}>{s}</button>)}
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th><th>Broker</th><th>Plan</th><th>Users</th>
                {leaderSort==='volume'  && <th>Vol MTD</th>}
                {leaderSort==='revenue' && <th>Rev MTD</th>}
                {leaderSort==='users'   && <th>Clients</th>}
                {leaderSort==='growth'  && <th>MoM %</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t,i)=>(
                <tr key={t.id} className="clickable" onClick={()=>{setSelectedTenant(t);setNav('tenant-detail');}}>
                  <td className="mono" style={{color:'var(--text-muted)'}}>{i+1}</td>
                  <td className="name-cell">{t.flag} {t.name}</td>
                  <td><Badge plan={t.plan}/></td>
                  <td className="mono">{t.clients.toLocaleString()}</td>
                  {leaderSort==='volume'  && <td className="mono">{fmt(t.volumeMTD)}</td>}
                  {leaderSort==='revenue' && <td className="mono text-bull">{fmt(t.rev)}</td>}
                  {leaderSort==='users'   && <td className="mono">{t.clients.toLocaleString()}</td>}
                  {leaderSort==='growth'  && <td className={`mono ${t.growth>0?'text-bull':'text-bear'}`}>{t.growth>0?'+':''}{t.growth}%</td>}
                  <td><StatusBadge s={t.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="card-hd">
            <span className="card-title">Live Activity Feed</span>
            <div style={{display:'flex',gap:6}}>
              <Dot color={feedPaused?'muted':'bull'} pulse={!feedPaused}/>
              <Btn variant="ghost" size="sm" onClick={()=>setFeedPaused(p=>!p)}>{feedPaused?'▶ Resume':'⏸ Pause'}</Btn>
            </div>
          </div>
          <div className="feed-controls">
            <select className="filter-sel" style={{fontSize:11}}>
              <option>All tenants</option>
              {TENANTS.map(t=><option key={t.id}>{t.name}</option>)}
            </select>
            <select className="filter-sel" style={{fontSize:11}}>
              <option>All events</option>
              <option>TRADE</option><option>DEPOSIT</option><option>CLIENT</option>
              <option>ALERT</option><option>BILLING</option><option>KYC</option>
            </select>
          </div>
          <div className="feed">
            {feedItems.map(e=>(
              <div key={e.id} className="feed-item tick-enter">
                <span className="feed-time">{e.time}</span>
                <span className={`feed-type feed-type-${e.severity}`}>{e.type}</span>
                <div style={{flex:1,display:'flex',gap:4,flexWrap:'wrap'}}>
                  <span className="feed-tenant">{e.tenant} —</span>
                  <span className="feed-msg">{e.msg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 2: PLATFORM HEALTH
// ═══════════════════════════════════════════════════════════════════
function PlatformHealth() {
  const [activeNode, setActiveNode] = useState(null);
  const ok = NODES.filter(n=>n.load<70).length;
  const warn = NODES.filter(n=>n.load>=70).length;

  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div>
          <div className="page-title">Platform Health</div>
          <div className="page-sub">Last checked 14 seconds ago</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',background:'rgba(16,217,150,.08)',border:'1px solid rgba(16,217,150,.2)',borderRadius:6}}>
            <Dot color="bull" pulse/><span style={{fontSize:12,color:'var(--bull)',fontWeight:600}}>ALL SYSTEMS OPERATIONAL</span>
          </div>
          <Btn variant="ghost">⟳ Refresh</Btn>
        </div>
      </div>

      {/* Services Grid */}
      <div className="card mb-16">
        <div className="card-hd"><span className="card-title">Service Status — 16 Services</span><span style={{fontSize:11,color:'var(--bull)',fontFamily:'var(--font-data)'}}>15 operational · 1 degraded · 1 maintenance</span></div>
        <div className="services-grid">
          {SERVICES.map(s=>(
            <div key={s.name} className="service-card">
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                <Dot color={s.status==='OPERATIONAL'?'bull':s.status==='DEGRADED'?'warn':s.status==='MAINTENANCE'?'accent':'bear'}/>
                <div className="service-name">{s.name}</div>
              </div>
              <div className="service-meta">{s.uptime} uptime · {s.lat} avg</div>
              <StatusBadge s={s.status}/>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Timeline */}
      <div className="card mb-16">
        <div className="card-hd"><span className="card-title">Incident History — 90 days</span><span style={{fontSize:11,color:'var(--text-muted)'}}>99.97% uptime</span></div>
        <div className="incident-grid">
          {Array.from({length:90},(_,i)=>{
            const r=Math.random(); 
            const cls=r>0.98?'inc-dot-out':r>0.95?'inc-dot-major':r>0.92?'inc-dot-minor':'inc-dot-ok';
            return <div key={i} className={`inc-dot ${cls}`} title={`Day ${90-i}`}/>;
          })}
        </div>
        <div style={{display:'flex',gap:16,padding:'8px 16px',fontSize:11,color:'var(--text-sec)'}}>
          {[['inc-dot-ok','No incidents'],['inc-dot-minor','Minor'],['inc-dot-major','Major'],['inc-dot-out','Outage']].map(([cls,label])=>(
            <div key={cls} style={{display:'flex',alignItems:'center',gap:6}}>
              <div className={`inc-dot ${cls}`}/>{label}
            </div>
          ))}
        </div>
      </div>

      {/* Performance KPIs */}
      <div className="grid-3 mb-16">
        {[
          {label:'API Response P50',val:'12ms',sub:'P95: 28ms · P99: 67ms',color:'var(--bull)'},
          {label:'WS Messages/sec',val:'48,204',sub:'Peak: 72,000/sec today',color:'var(--accent)'},
          {label:'Cache Hit Rate',val:'97.4%',sub:'Target: >95% ✓',color:'var(--bull)'},
        ].map(m=>(
          <div key={m.label} className="kpi-card accent">
            <div className="kpi-label">{m.label}</div>
            <div className="kpi-value" style={{color:m.color,fontSize:26}}>{m.val}</div>
            <div className="kpi-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Node Map */}
      <div className="card">
        <div className="card-hd">
          <span className="card-title">Server Node Map — {ok}/{NODES.length} healthy</span>
          {warn>0 && <span style={{fontSize:11,color:'var(--warn)'}}>⚠ {warn} node{warn>1?'s':''} under elevated load</span>}
        </div>
        <div className="node-grid">
          {NODES.map(n=>{
            const cls=n.load>=80?'load-crit':n.load>=65?'load-warn':'load-ok';
            const valCol=n.load>=80?'crit':n.load>=65?'warn':'ok';
            return (
              <div key={n.id} className={`node-card ${cls}`} onClick={()=>setActiveNode(activeNode===n.id?null:n.id)} style={{cursor:'pointer'}}>
                <div className="flex items-center justify-between mb-4">
                  <div className="node-id">{n.id}</div>
                  <StatusBadge s={n.status}/>
                </div>
                <div className="node-loc">{n.loc} · {n.tenants} tenants</div>
                <div className="node-metrics">
                  <div>
                    <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>CPU</div>
                    <div className={`node-metric-val ${valCol}`}>{n.load}%</div>
                    <GaugeBar pct={n.load}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>MEM</div>
                    <div className={`node-metric-val ${n.mem>=80?'crit':n.mem>=65?'warn':'ok'}`}>{n.mem}%</div>
                    <GaugeBar pct={n.mem}/>
                  </div>
                </div>
                {activeNode===n.id && (
                  <div className="node-actions">
                    <Btn variant="ghost" size="sm">↳ Drain</Btn>
                    <Btn variant="ghost" size="sm">↺ Restart</Btn>
                    <Btn variant="bull" size="sm">+ Scale</Btn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 3: ALL BROKERS
// ═══════════════════════════════════════════════════════════════════
function AllBrokers({setSelectedTenant, setNav}) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = TENANTS.filter(t=>{
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.country.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter==='ALL' || t.plan===planFilter;
    const matchStatus = statusFilter==='ALL' || t.status===statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div>
          <div className="page-title">All Brokers</div>
          <div className="page-sub">{TENANTS.length} tenants · $42.4M combined AUM</div>
        </div>
        <Btn variant="primary">⊕ Onboard New Broker</Btn>
      </div>

      <div className="filters">
        <input className="search-input" placeholder="Search brokers, countries..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="filter-sel" value={planFilter} onChange={e=>setPlanFilter(e.target.value)}>
          <option value="ALL">All Plans</option>
          {['STARTER','GROWTH','PRO','ENTERPRISE'].map(p=><option key={p}>{p}</option>)}
        </select>
        <select className="filter-sel" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          {['ACTIVE','TRIAL','SUSPENDED','ONBOARDING'].map(s=><option key={s}>{s}</option>)}
        </select>
        <span style={{fontSize:11,color:'var(--text-muted)',marginLeft:'auto'}}>{filtered.length} results</span>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Broker</th><th>Plan</th><th>Country</th><th>Clients</th>
              <th>AUM</th><th>Vol MTD</th><th>Rev to Platform</th><th>Since</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t=>(
              <tr key={t.id} className="clickable" onClick={()=>{setSelectedTenant(t);setNav('tenant-detail');}}>
                <td className="name-cell">{t.flag} {t.name}</td>
                <td><Badge plan={t.plan}/></td>
                <td className="text-sec">{t.country}</td>
                <td className="mono">{t.clients.toLocaleString()}</td>
                <td className="mono">{fmt(t.aum)}</td>
                <td className="mono">{t.status==='SUSPENDED'?<span style={{color:'var(--bear)'}}>—</span>:fmt(t.volumeMTD)}</td>
                <td className="mono text-bull">{t.status==='SUSPENDED'?<span style={{color:'var(--bear)'}}>$0</span>:fmt(t.rev)}</td>
                <td className="text-sec">{t.since}</td>
                <td><StatusBadge s={t.status}/></td>
                <td onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:4}}>
                    <Btn variant="ghost" size="sm" onClick={()=>{setSelectedTenant(t);setNav('tenant-detail');}}>View</Btn>
                    {t.status==='SUSPENDED' && <Btn variant="bull" size="sm">Restore</Btn>}
                    {t.status!=='SUSPENDED' && <Btn variant="danger" size="sm">Suspend</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TENANT DETAIL
// ═══════════════════════════════════════════════════════════════════
function TenantDetail({tenant, setNav}) {
  const [tab, setTab] = useState('overview');
  const [showImpersonate, setShowImpersonate] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [features, setFeatures] = useState({copyTrading:true, propDesk:false, whitelabelApi:true, multiBrand:false, apiAccess:true, fixAccess:false, mt5Bridge:true, socialTrading:false, signals:false});

  if(!tenant) return <div className="page"><div className="empty">Select a tenant to view details</div></div>;

  const healthColor = tenant.healthScore>=80?'var(--bull)':tenant.healthScore>=50?'var(--warn)':'var(--bear)';

  return (
    <div className="fade-in" style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {impersonating && (
        <div className="impersonate-banner">
          ⚠ IMPERSONATING: {tenant.name} — All actions logged — <button style={{marginLeft:'auto',background:'transparent',border:'1px solid var(--warn)',color:'var(--warn)',padding:'2px 10px',borderRadius:4,cursor:'pointer',fontSize:11}} onClick={()=>setImpersonating(false)}>Exit Session</button>
        </div>
      )}
      <div className="td-header">
        <div className="td-logo">{tenant.flag}</div>
        <div className="td-info">
          <div className="td-name">{tenant.name}</div>
          <div className="td-meta">
            <span><Badge plan={tenant.plan}/></span>
            <span><StatusBadge s={tenant.status}/></span>
            <span>📍 {tenant.city}, {tenant.country}</span>
            <span>Since {tenant.since}</span>
            <span>AM: {tenant.am}</span>
            <span style={{fontFamily:'var(--font-data)',fontSize:11}}>{tenant.contact}</span>
          </div>
        </div>
        <div className="td-actions">
          <Btn variant="ghost" size="sm">✎ Edit</Btn>
          <Btn variant="ghost" size="sm">⬆ Change Plan</Btn>
          {tenant.status!=='SUSPENDED' && <Btn variant="danger" size="sm">⊗ Suspend</Btn>}
          <Btn variant="warn" size="sm" onClick={()=>setShowImpersonate(true)}>👁 Impersonate ⚠</Btn>
          <Btn variant="ghost" size="sm" onClick={()=>setNav('brokers')}>← Back</Btn>
        </div>
      </div>

      <div className="tab-bar">
        {['overview','configuration','billing','support','audit'].map(t=>(
          <div key={t} className={`tab-item${tab===t?' active':''}`} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </div>
        ))}
      </div>

      <div style={{flex:1,overflow:'auto'}}>
        {tab==='overview' && (
          <div className="page">
            <div className="grid-2 mb-16">
              {/* Usage Stats */}
              <div className="card">
                <div className="card-hd"><span className="card-title">Platform Usage</span></div>
                <div className="card-body">
                  <div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                    {[{l:'End Clients',v:tenant.clients.toLocaleString()},{l:'Trades Today',v:fmtN(tenant.trades)},{l:'API Calls Today',v:fmtN(tenant.api)}].map(k=>(
                      <div key={k.l} style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'12px'}}>
                        <div className="kpi-label">{k.l}</div>
                        <div className="kpi-value" style={{fontSize:18}}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="divider"/>
                  <div className="flex justify-between" style={{fontSize:12,color:'var(--text-sec)'}}>
                    <span>WS Connections Now</span><span className="mono" style={{color:'var(--accent)'}}>{tenant.wsConn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-8" style={{fontSize:12,color:'var(--text-sec)'}}>
                    <span>Volume MTD</span><span className="mono text-bull">{fmt(tenant.volumeMTD)}</span>
                  </div>
                  <div className="flex justify-between mt-8" style={{fontSize:12,color:'var(--text-sec)'}}>
                    <span>AUM</span><span className="mono" style={{color:'var(--text-pri)'}}>{fmt(tenant.aum)}</span>
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="card">
                <div className="card-hd"><span className="card-title">Revenue to Platform</span></div>
                <div className="card-body">
                  <div style={{display:'flex',gap:10,marginBottom:12}}>
                    {[{l:'MTD',v:fmt(tenant.rev),c:'var(--bull)'},{l:'Last Month',v:fmt(Math.round(tenant.rev*.95)),c:'var(--text-sec)'},{l:'All Time',v:fmt(tenant.allTimeRev),c:'var(--accent)'}].map(m=>(
                      <div key={m.l} style={{flex:1,background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px',textAlign:'center'}}>
                        <div className="kpi-label">{m.l}</div>
                        <div style={{fontFamily:'var(--font-data)',fontSize:16,fontWeight:600,color:m.c}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="divider"/>
                  <div className="flex justify-between" style={{fontSize:12,color:'var(--text-sec)'}}>
                    <span>Subscription Fee</span><span className="mono">${tenant.subFee.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between mt-8" style={{fontSize:12,color:'var(--text-sec)'}}>
                    <span>Rev Share</span><span className="mono">{fmt(Math.round(tenant.rev-tenant.subFee))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Health + Subscription */}
            <div className="grid-2">
              <div className="card">
                <div className="card-hd"><span className="card-title">Account Health</span></div>
                <div className="card-body">
                  <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
                    <div style={{fontSize:48,fontFamily:'var(--font-data)',fontWeight:700,color:healthColor}}>{tenant.healthScore}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:healthColor}}>{tenant.healthScore>=80?'Healthy':tenant.healthScore>=50?'Needs Attention':'At Risk'}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>Out of 100</div>
                    </div>
                  </div>
                  <GaugeBar pct={tenant.healthScore} color={healthColor}/>
                  {[['Activity Level',tenant.healthScore>70?'High':'Medium'],['Payment History',tenant.status==='SUSPENDED'?'Poor':'Good'],['Growth Trend',tenant.growth>0?'Positive':'Declining'],['Support Tickets','Low (2 open)']].map(([l,v])=>(
                    <div key={l} className="flex justify-between mt-8" style={{fontSize:12}}>
                      <span style={{color:'var(--text-sec)'}}>{l}</span>
                      <span style={{color:v==='Poor'||v==='Declining'?'var(--bear)':v==='Good'||v==='Positive'||v==='High'?'var(--bull)':'var(--warn)'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-hd"><span className="card-title">Add-on Modules</span></div>
                <div className="card-body">
                  {[['Copy Trading',features.copyTrading,'copyTrading'],['Prop Desk',features.propDesk,'propDesk'],['White Label API',features.whitelabelApi,'whitelabelApi'],['Multi-brand',features.multiBrand,'multiBrand'],['API Access',features.apiAccess,'apiAccess'],['FIX Access',features.fixAccess,'fixAccess'],['MT5 Bridge',features.mt5Bridge,'mt5Bridge'],['Social Trading',features.socialTrading,'socialTrading'],['Signals Marketplace',features.signals,'signals']].map(([label,val,key])=>(
                    <div key={key} className="feature-row">
                      <span style={{color:'var(--text-sec)'}}>{label}</span>
                      <MiniToggle on={val} onToggle={()=>setFeatures(f=>({...f,[key]:!f[key]}))}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab==='configuration' && (
          <div className="page">
            <div className="grid-2 mb-16">
              <div className="card">
                <div className="card-hd"><span className="card-title">White-label Settings</span></div>
                <div className="card-body">
                  {[['Brand Name',tenant.name],['Custom Domain',tenant.name.toLowerCase().replace(/ /g,'')+'.com'],['Accent Color','#3B82F6'],['Support Email','support@'+tenant.name.toLowerCase().replace(/ /g,'')+'.com']].map(([l,v])=>(
                    <div key={l} className="flex justify-between" style={{marginBottom:10,fontSize:12}}>
                      <span style={{color:'var(--text-muted)'}}>{l}</span>
                      <span style={{fontFamily:'var(--font-data)',color:'var(--text-pri)'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-hd"><span className="card-title">Rate Limits</span></div>
                <div className="card-body">
                  {[['Max API calls/min','2,000'],['Max WS connections','2,000'],['Max clients','2,000'],['Max instruments','500']].map(([l,v])=>(
                    <div key={l} className="flex justify-between" style={{marginBottom:10,fontSize:12}}>
                      <span style={{color:'var(--text-muted)'}}>{l}</span>
                      <span className="mono" style={{color:'var(--accent)'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card mb-16">
              <div className="card-hd"><span className="card-title">LP Routing</span><Btn variant="ghost" size="sm">⊕ Override</Btn></div>
              <div className="card-body">
                {[['EUR/USD','LMAX Digital','Primary'],['GBP/USD','LMAX Digital','Primary'],['XAU/USD','Integral','Primary'],['BTC/USD','LMAX Digital','Primary'],['XAG/USD','Integral','Primary']].map(([sym,lp,type])=>(
                  <div key={sym} className="flex justify-between" style={{marginBottom:8,fontSize:12}}>
                    <span className="mono" style={{color:'var(--text-pri)',width:80}}>{sym}</span>
                    <span style={{color:'var(--text-sec)',flex:1}}>{lp}</span>
                    <span style={{color:'var(--accent)',fontSize:10}}>{type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-hd"><span className="card-title">Feature Flags</span></div>
              <div className="card-body">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
                  {Object.entries(features).map(([k,v])=>(
                    <div key={k} className="feature-row">
                      <span style={{color:'var(--text-sec)',fontSize:12}}>{k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())}</span>
                      <MiniToggle on={v} onToggle={()=>setFeatures(f=>({...f,[k]:!f[k]}))}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab==='billing' && (
          <div className="page">
            <div className="rev-header" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
              {[{l:'Monthly Fee',v:`$${tenant.subFee.toLocaleString()}/mo`,s:tenant.plan+' plan'},{l:'Revenue MTD',v:fmt(tenant.rev),s:'incl. rev share'},{l:'All-time Revenue',v:fmt(tenant.allTimeRev),s:'since '+tenant.since}].map(m=>(
                <div key={m.l} className="rev-kpi">
                  <div className="rev-kpi-label">{m.l}</div>
                  <div className="rev-kpi-val">{m.v}</div>
                  <div className="rev-kpi-sub text-sec">{m.s}</div>
                </div>
              ))}
            </div>

            <div className="card mb-16">
              <div className="card-hd">
                <span className="card-title">Invoice History</span>
                <div style={{display:'flex',gap:6}}>
                  <Btn variant="ghost" size="sm">⬇ Export</Btn>
                  <Btn variant="primary" size="sm">⊕ Generate Invoice</Btn>
                </div>
              </div>
              <table className="tbl">
                <thead><tr><th>Invoice #</th><th>Period</th><th>Amount</th><th>Status</th><th>Due</th><th></th></tr></thead>
                <tbody>
                  {Array.from({length:8},(_,i)=>{
                    const d=new Date(); d.setMonth(d.getMonth()-i);
                    const amt=tenant.subFee+Math.round(Math.random()*2000);
                    const status=i===0?'PENDING':i===3&&tenant.status==='SUSPENDED'?'OVERDUE':'PAID';
                    return (
                      <tr key={i}>
                        <td className="mono" style={{color:'var(--accent)'}}>INV-{String(2026-Math.floor(i/12))}-{String(100+i).padStart(3,'0')}</td>
                        <td className="text-sec">{d.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</td>
                        <td className="mono text-bull">${amt.toLocaleString()}</td>
                        <td><span className={`badge badge-${status==='PAID'?'active':status==='PENDING'?'trial':'suspended'}`}>{status}</span></td>
                        <td className="text-sec text-muted" style={{fontSize:11}}>{d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                        <td><Btn variant="ghost" size="sm">⬇ PDF</Btn></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {tenant.status==='SUSPENDED' && (
              <div style={{background:'rgba(255,59,92,.08)',border:'1px solid rgba(255,59,92,.2)',borderRadius:'var(--r-lg)',padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{color:'var(--bear)',fontWeight:600,fontSize:13}}>⚠ Outstanding Balance: $7,500</div>
                  <div style={{fontSize:11,color:'var(--text-sec)',marginTop:4}}>Account suspended — 3 months overdue. Last payment: Dec 2024.</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <Btn variant="ghost" size="sm">Send Reminder</Btn>
                  <Btn variant="bull" size="sm">Collect Now</Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='support' && (
          <div className="page">
            <div className="grid-2 mb-16">
              <div className="card">
                <div className="card-hd"><span className="card-title">Open Tickets</span><Btn variant="primary" size="sm">⊕ New Ticket</Btn></div>
                <div className="card-body">
                  {[{id:'#4421',title:'API rate limit confusion on batch endpoints',priority:'MEDIUM',age:'2d'},{id:'#4398',title:'WebSocket drops after 24h session',priority:'LOW',age:'5d'}].map(t=>(
                    <div key={t.id} style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px',marginBottom:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span className="mono" style={{fontSize:11,color:'var(--accent)'}}>{t.id}</span>
                        <span style={{fontSize:10,color:t.priority==='HIGH'?'var(--bear)':t.priority==='MEDIUM'?'var(--warn)':'var(--text-muted)',fontWeight:600}}>{t.priority}</span>
                      </div>
                      <div style={{fontSize:12,color:'var(--text-pri)'}}>{t.title}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{t.age} ago</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-hd"><span className="card-title">Account Manager Notes</span><Btn variant="ghost" size="sm">⊕ Add Note</Btn></div>
                <div className="card-body">
                  {[{date:'Mar 14',note:`Spoke with ${tenant.contact.split('@')[0]} — discussed upgrading to next plan tier in Q2. Strong growth trajectory.`},{date:'Mar 1',note:'Monthly check-in completed. Requested copy trading module demo.'}].map((n,i)=>(
                    <div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
                      <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:4}}>{n.date}</div>
                      <div style={{fontSize:12,color:'var(--text-sec)',lineHeight:1.5}}>{n.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <Btn variant="accent">📅 Schedule Call</Btn>
              <Btn variant="ghost">📋 Send Onboarding Checklist</Btn>
              <Btn variant="ghost">📊 Request Feedback</Btn>
            </div>
          </div>
        )}

        {tab==='audit' && (
          <div className="page">
            <div className="card">
              <div className="card-hd"><span className="card-title">Tenant Audit Trail</span><Btn variant="ghost" size="sm">⬇ Export</Btn></div>
              <table className="tbl">
                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Type</th></tr></thead>
                <tbody>
                  {[
                    {time:'14:18:33',user:'Sarah Kim',   action:'Enabled Copy Trading module',                      type:'CONFIG'},
                    {time:'14:02:17',user:'Alex Chen',   action:'Viewed billing details',                           type:'BILLING'},
                    {time:'13:30:09',user:'Alex Chen',   action:'Impersonation session started (12 min)',            type:'SECURITY'},
                    {time:'12:48:22',user:'Marcus Webb', action:'Applied 10% discount — expires Jun 2026',          type:'BILLING'},
                    {time:'11:24:55',user:'Sarah Kim',   action:'Changed plan: GROWTH → PRO',                       type:'PLAN'},
                    {time:'10:15:33',user:'Tom Larson',  action:'Updated LP routing for XAU/USD → Integral',        type:'CONFIG'},
                    {time:'09:44:18',user:'Jordan Lee',  action:'Rate limit override: API calls/min 1000→2000',     type:'INFRA'},
                  ].map((a,i)=>(
                    <tr key={i}>
                      <td className="mono" style={{color:'var(--text-muted)'}}>{a.time}</td>
                      <td style={{color:'var(--text-pri)',fontWeight:500}}>{a.user}</td>
                      <td style={{color:'var(--text-sec)'}}>{a.action}</td>
                      <td><span style={{fontSize:10,fontFamily:'var(--font-data)',color:'var(--accent)'}}>{a.type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showImpersonate && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title" style={{color:'var(--warn)'}}>⚠ Impersonate Broker Admin</div>
            <div className="modal-body">
              You are about to view <strong style={{color:'var(--text-pri)'}}>{tenant.name}</strong> as their admin. All actions will be logged. This is for support purposes only.
              <div style={{marginTop:12,padding:'10px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:'var(--r)',fontSize:11}}>
                Session will be logged under your name: <strong>Alex Chen</strong>
              </div>
            </div>
            <div className="modal-footer">
              <Btn variant="ghost" onClick={()=>setShowImpersonate(false)}>Cancel</Btn>
              <Btn variant="warn" onClick={()=>{setShowImpersonate(false);setImpersonating(true);}}>Confirm — I Understand</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 4: ONBOARDING QUEUE
// ═══════════════════════════════════════════════════════════════════
const CHECKLIST_ITEMS = [
  ['contract','Contract signed'],['aml','AML/KYC review'],['domain','Domain configured'],
  ['ssl','SSL certificate'],['email','Email templates'],['instruments','Instruments configured'],
  ['testAccounts','Test accounts created'],['uat','UAT sign-off'],['golive','Go-live approved'],
];

function OnboardingQueue() {
  const [selected, setSelected] = useState(null);
  const [prospects, setProspects] = useState([
    ...ONBOARDING,
    {id:'p1',name:'NexGen Capital',country:'UK',flag:'🇬🇧',plan:'PRO',contact:'Oliver Smith',email:'o.smith@nexgen.co.uk',stage:'APPLIED',days:2,checklist:{contract:false,aml:false,domain:false,ssl:false,email:false,instruments:false,testAccounts:false,uat:false,golive:false}},
    {id:'p2',name:'Apex Markets',country:'Singapore',flag:'🇸🇬',plan:'ENTERPRISE',contact:'Wei Chen',email:'wei@apexmarkets.sg',stage:'CONTRACT SENT',days:5,checklist:{contract:false,aml:false,domain:false,ssl:false,email:false,instruments:false,testAccounts:false,uat:false,golive:false}},
  ]);

  const advance = (id) => {
    setProspects(prev=>prev.map(p=>{
      if(p.id!==id) return p;
      const idx=KANBAN_STAGES.indexOf(p.stage);
      return idx<KANBAN_STAGES.length-1?{...p,stage:KANBAN_STAGES[idx+1],days:0}:p;
    }));
  };

  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div>
          <div className="page-title">Onboarding Queue</div>
          <div className="page-sub">{prospects.length} prospects in pipeline</div>
        </div>
        <Btn variant="primary">⊕ Add Prospect</Btn>
      </div>

      <div className="kanban">
        {KANBAN_STAGES.map(stage=>{
          const cards = prospects.filter(p=>p.stage===stage);
          return (
            <div key={stage} className="kanban-col">
              <div className="kanban-col-hd">
                <span className="kanban-col-title">{stage}</span>
                <span className="kanban-col-count">{cards.length}</span>
              </div>
              <div className="kanban-cards">
                {cards.map(p=>(
                  <div key={p.id} className="kanban-card" onClick={()=>setSelected(selected?.id===p.id?null:p)}>
                    <div className="kanban-card-name">{p.flag} {p.name}</div>
                    <div className="kanban-card-meta">{p.country} · <Badge plan={p.plan}/></div>
                    <div className="kanban-card-meta mt-4">{p.contact}</div>
                    {p.days>0 && <div className="kanban-card-days">⏱ {p.days}d in stage</div>}
                  </div>
                ))}
                {cards.length===0 && <div style={{padding:'20px 8px',textAlign:'center',color:'var(--text-muted)',fontSize:11}}>—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="card mt-16 fade-in">
          <div className="card-hd">
            <span className="card-title">{selected.flag} {selected.name} — Onboarding Checklist</span>
            <div style={{display:'flex',gap:6}}>
              <Btn variant="ghost" size="sm">Assign Manager</Btn>
              <Btn variant="ghost" size="sm">📧 Send Welcome Kit</Btn>
              <Btn variant="bull" size="sm" onClick={()=>advance(selected.id)}>→ Next Stage</Btn>
              <Btn variant="primary" size="sm">⚙ Provision Tenant</Btn>
            </div>
          </div>
          <div style={{padding:16,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {CHECKLIST_ITEMS.map(([key,label])=>(
              <div key={key} className={`check-item${selected.checklist[key]?' done':''}`}>
                <span className="check-icon">{selected.checklist[key]?'✅':'⬜'}</span>
                <span style={{fontSize:12,color:selected.checklist[key]?'var(--bull)':'var(--text-sec)'}}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{padding:'0 16px 16px',display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-muted)'}}>
            <span>Contact: {selected.email}</span>
            <span>{CHECKLIST_ITEMS.filter(([k])=>selected.checklist[k]).length}/{CHECKLIST_ITEMS.length} complete</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 5: INSTRUMENTS MASTER
// ═══════════════════════════════════════════════════════════════════
function InstrumentsMaster() {
  const [catFilter, setCatFilter] = useState('ALL');
  const cats = ['ALL','Forex','Crypto','Indices','Commodities','Stocks'];
  const filtered = catFilter==='ALL'?INSTRUMENTS:INSTRUMENTS.filter(i=>i.cat===catFilter);

  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div>
          <div className="page-title">Instruments Master</div>
          <div className="page-sub">847 total instruments · source of truth for all tenants</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn variant="ghost">⬇ Export CSV</Btn>
          <Btn variant="primary">⊕ Add Instrument</Btn>
        </div>
      </div>

      <div className="filters">
        {cats.map(c=><button key={c} className={`toggle-btn${catFilter===c?' active':''}`} style={{padding:'5px 12px',background:catFilter===c?'var(--bg-3)':'transparent',border:`1px solid ${catFilter===c?'var(--border-hi)':'var(--border)'}`,borderRadius:'var(--r)',color:catFilter===c?'var(--text-pri)':'var(--text-sec)',cursor:'pointer',fontSize:11,fontFamily:'var(--font-ui)'}} onClick={()=>setCatFilter(c)}>{c}</button>)}
        <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-muted)'}}>{filtered.length} shown of 847</span>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr><th>Symbol</th><th>Name</th><th>Category</th><th>LP Source</th><th>Last Price</th><th>Tenants Using</th><th>LP Status</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map(i=>(
              <tr key={i.sym}>
                <td className="mono" style={{color:'var(--accent)',fontWeight:600}}>{i.sym}</td>
                <td className="name-cell">{i.name}</td>
                <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:'var(--bg-2)',border:'1px solid var(--border)',color:'var(--text-sec)'}}>{i.cat}</span></td>
                <td className="text-sec">{i.lp}</td>
                <td className="mono" style={{color:'var(--bull)'}}>{i.price}</td>
                <td className="mono">{i.tenants}<span style={{color:'var(--text-muted)',fontSize:10}}>/14</span></td>
                <td><Dot color={i.lp==='LMAX'||i.lp==='Integral'?'bull':'bear'}/></td>
                <td><StatusBadge s={i.status}/></td>
                <td><Btn variant="ghost" size="sm">Edit</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 6: LIQUIDITY PROVIDERS
// ═══════════════════════════════════════════════════════════════════
function LiquidityProviders() {
  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div>
          <div className="page-title">Liquidity Providers</div>
          <div className="page-sub">3 LPs configured · 2 connected · 1 disconnected</div>
        </div>
        <Btn variant="primary">⊕ Add LP</Btn>
      </div>

      <div className="lp-grid mb-16">
        {LPS.map(lp=>(
          <div key={lp.id} className="lp-card">
            <div className="lp-hd">
              <div>
                <div className="lp-name">{lp.name}</div>
                <div className="lp-type">{lp.type}</div>
              </div>
              <StatusBadge s={lp.status}/>
            </div>
            <div className="divider"/>
            {[['Latency',lp.status==='DISCONNECTED'?'—':lp.lat+'ms'],['Instruments',lp.inst.toLocaleString()],['Uptime',lp.uptime],['Credit Limit',fmt(lp.credit)],['Used',fmt(lp.used)]].map(([l,v])=>(
              <div key={l} className="lp-metric">
                <span className="lp-metric-label">{l}</span>
                <span className="lp-metric-val">{v}</span>
              </div>
            ))}
            {lp.status==='CONNECTED' && (
              <>
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:8}}>Credit utilization</div>
                <div className="credit-bar"><div className="credit-fill" style={{width:`${(lp.used/lp.credit)*100}%`}}/></div>
                <div style={{fontSize:10,color:'var(--text-sec)',textAlign:'right',marginTop:2}}>{((lp.used/lp.credit)*100).toFixed(0)}%</div>
              </>
            )}
            <div className="lp-actions">
              <Btn variant="ghost" size="sm">Configure</Btn>
              <Btn variant="ghost" size="sm">Test</Btn>
              {lp.status==='CONNECTED'?<Btn variant="danger" size="sm">Disconnect</Btn>:<Btn variant="bull" size="sm">Connect</Btn>}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-hd">
          <span className="card-title">Smart Order Routing Rules</span>
          <Btn variant="primary" size="sm">⊕ Add Rule</Btn>
        </div>
        <table className="tbl">
          <thead><tr><th>Rule Condition</th><th>Action</th><th>Priority</th><th></th></tr></thead>
          <tbody>
            {ROUTING_RULES.map(r=>(
              <tr key={r.id}>
                <td style={{color:'var(--text-sec)'}}>{r.rule}</td>
                <td style={{color:'var(--text-pri)'}}>{r.action}</td>
                <td><span style={{fontSize:10,fontFamily:'var(--font-data)',color:r.priority==='CRITICAL'?'var(--bear)':r.priority==='HIGH'?'var(--warn)':'var(--accent)'}}>{r.priority}</span></td>
                <td><div style={{display:'flex',gap:4}}><Btn variant="ghost" size="sm">Edit</Btn><Btn variant="danger" size="sm">Delete</Btn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 7: SAAS REVENUE
// ═══════════════════════════════════════════════════════════════════
const MRR_DATA = Array.from({length:24},(_,i)=>{
  const d=new Date(2024,2+i,1);
  const base=80000+i*4200+Math.sin(i/3)*5000;
  return {month:d.toLocaleDateString('en-US',{month:'short',year:'2-digit'}),mrr:Math.round(base)};
});

const PLAN_RING = [
  {name:'Starter',value:2},{name:'Growth',value:5},{name:'Pro',value:5},{name:'Enterprise',value:2}
];

function SaasRevenue() {
  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div><div className="page-title">SaaS Revenue</div><div className="page-sub">Financial overview — platform monetization</div></div>
        <div style={{display:'flex',gap:8}}>
          <Btn variant="ghost">⬇ Export to Accounting</Btn>
          <Btn variant="primary">Generate All Invoices</Btn>
        </div>
      </div>

      <div className="rev-header">
        {[{l:'MRR',v:'$184,200',s:'+12% MoM',c:'var(--bull)'},{l:'ARR',v:'$2.21M',s:'annualized',c:'var(--accent)'},{l:'Growth Rate',v:'+12%',s:'month-over-month',c:'var(--bull)'},{l:'Avg Rev / Tenant',v:'$13,157',s:'per active tenant',c:'var(--text-pri)'}].map(m=>(
          <div key={m.l} className="rev-kpi">
            <div className="rev-kpi-label">{m.l}</div>
            <div className="rev-kpi-val" style={{color:m.c}}>{m.v}</div>
            <div className="rev-kpi-sub text-bull">{m.s}</div>
          </div>
        ))}
      </div>

      <div className="charts-row mb-16" style={{gridTemplateColumns:'60% 40%'}}>
        <div className="chart-wrap">
          <div className="chart-hd"><div className="chart-title">MRR Growth — 24 months</div></div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MRR_DATA} margin={{top:4,right:0,bottom:0,left:0}}>
                <defs><linearGradient id="gmrr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4}/><stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1C2230" vertical={false}/>
                <XAxis dataKey="month" tick={{fill:'#4A5568',fontSize:9}} tickLine={false} axisLine={false} interval={3}/>
                <YAxis tick={{fill:'#4A5568',fontSize:9}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v/1000}k`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#3B82F6" fill="url(#gmrr)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-wrap">
          <div className="chart-hd"><div className="chart-title">Tenants by Plan</div></div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={PLAN_RING} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {PLAN_RING.map((_,i)=><Cell key={i} fill={['#4A5568','#3B82F6','#F59E0B','#A855F7'][i]} stroke="transparent"/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
              {PLAN_RING.map((p,i)=>(
                <div key={p.name} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--text-sec)'}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:['#4A5568','#3B82F6','#F59E0B','#A855F7'][i],flexShrink:0,display:'inline-block'}}/>
                  {p.name} ({p.value})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="card mb-16">
        <div className="card-hd"><span className="card-title">Plan Management</span><Btn variant="ghost" size="sm">⊕ Create Plan</Btn></div>
        <div className="plan-grid" style={{padding:16}}>
          {[
            {name:'STARTER',price:'$500',sub:'/mo',clients:'100 clients',features:['Basic white-label','5 instruments','Email support','REST API'],color:'#4A5568',cls:''},
            {name:'GROWTH',price:'$1,200',sub:'/mo',clients:'500 clients',features:['Full white-label','50 instruments','Copy Trading','Priority support'],color:'#3B82F6',cls:''},
            {name:'PRO',price:'$2,500',sub:'/mo',clients:'2,000 clients',features:['All features','500 instruments','Prop Desk add-on','Dedicated AM'],color:'#F59E0B',cls:''},
            {name:'ENTERPRISE',price:'Custom',sub:'',clients:'Unlimited clients',features:['Dedicated infra','All instruments','Multi-brand','SLA guarantee'],color:'#A855F7',cls:'enterprise'},
          ].map(p=>(
            <div key={p.name} className={`plan-card ${p.cls}`}>
              <div className="plan-name" style={{color:p.color}}>{p.name}</div>
              <div className="plan-price">{p.price}<span>{p.sub}</span></div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:10}}>{p.clients}</div>
              {p.features.map(f=><div key={f} className="plan-feature">✓ {f}</div>)}
              <div style={{marginTop:10}}><Btn variant="ghost" size="sm" style={{width:'100%'}}>Edit Plan</Btn></div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Ledger */}
      <div className="card">
        <div className="card-hd"><span className="card-title">Subscription Ledger</span></div>
        <table className="tbl">
          <thead><tr><th>Tenant</th><th>Plan</th><th>MRR</th><th>Next Invoice</th><th>Payment Status</th><th>Since</th><th></th></tr></thead>
          <tbody>
            {TENANTS.filter(t=>t.status!=='SUSPENDED').map(t=>(
              <tr key={t.id}>
                <td className="name-cell">{t.flag} {t.name}</td>
                <td><Badge plan={t.plan}/></td>
                <td className="mono text-bull">${t.subFee.toLocaleString()}</td>
                <td className="text-sec">Apr 1, 2026</td>
                <td><span className="badge badge-active">PAID</span></td>
                <td className="text-sec">{t.since}</td>
                <td><Btn variant="ghost" size="sm">Invoice</Btn></td>
              </tr>
            ))}
            {TENANTS.filter(t=>t.status==='SUSPENDED').map(t=>(
              <tr key={t.id}>
                <td className="name-cell" style={{opacity:.6}}>{t.flag} {t.name}</td>
                <td><Badge plan={t.plan}/></td>
                <td className="mono" style={{color:'var(--bear)'}}>$0</td>
                <td className="text-sec" style={{color:'var(--bear)'}}>Overdue</td>
                <td><span className="badge badge-suspended">OVERDUE</span></td>
                <td className="text-sec">{t.since}</td>
                <td><div style={{display:'flex',gap:4}}><Btn variant="ghost" size="sm">Remind</Btn><Btn variant="danger" size="sm">Collect</Btn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 8: COMPLIANCE
// ═══════════════════════════════════════════════════════════════════
function Compliance() {
  const [jurTab, setJurTab] = useState('jurisdictions');

  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div><div className="page-title">Global Compliance & Regulatory</div><div className="page-sub">Platform-wide rules enforced across all tenants</div></div>
        <Btn variant="danger">⊕ Create Incident Report</Btn>
      </div>

      <div className="tab-bar" style={{margin:'-4px -24px 20px',padding:'0 24px',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--r-lg) var(--r-lg) 0 0'}}>
        {[['jurisdictions','Jurisdiction Matrix'],['blacklist','Global Blacklist'],['aml','AML Rules'],['incidents','Incident Log']].map(([id,label])=>(
          <div key={id} className={`tab-item${jurTab===id?' active':''}`} onClick={()=>setJurTab(id)}>{label}</div>
        ))}
      </div>

      {jurTab==='jurisdictions' && (
        <div className="card">
          <div className="card-hd"><span className="card-title">Regulatory Jurisdiction Matrix</span><Btn variant="ghost" size="sm">⊕ Add Jurisdiction</Btn></div>
          <table className="tbl">
            <thead><tr><th>Country</th><th>Regulatory Body</th><th>Max Leverage</th><th>KYC Level</th><th>Allowed</th><th>Auto-restrict</th><th></th></tr></thead>
            <tbody>
              {JURISDICTIONS.map(j=>(
                <tr key={j.country} className={!j.allowed?'jur-row-blocked':''}>
                  <td className="name-cell">{j.country}</td>
                  <td className="text-sec">{j.body}</td>
                  <td className="mono">{j.leverage}</td>
                  <td><span style={{fontSize:11,color:j.kyc==='Enhanced'?'var(--warn)':j.kyc==='Basic'?'var(--text-muted)':'var(--text-sec)'}}>{j.kyc}</span></td>
                  <td><span className={`tag ${j.allowed?'tag-allowed':'tag-blocked'}`}>{j.allowed?'✓ Allowed':'✗ Blocked'}</span></td>
                  <td><MiniToggle on={j.restrict} onToggle={()=>{}}/></td>
                  <td><Btn variant="ghost" size="sm">Edit</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {jurTab==='blacklist' && (
        <div className="card">
          <div className="card-hd"><span className="card-title">Global Blacklist — OFAC/FATF Enforced</span><Btn variant="ghost" size="sm">⊕ Add Entry</Btn></div>
          <div style={{padding:16}}>
            <div style={{marginBottom:12,padding:'10px 14px',background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.15)',borderRadius:'var(--r)',fontSize:12,color:'var(--text-sec)'}}>
              This list is automatically enforced across all tenants. Clients attempting to register from blacklisted countries are rejected at the point of signup. Enterprise tenants may request country-specific overrides.
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {['Russia','North Korea','Iran','Cuba','Syria','Yemen','Libya','Sudan','Somalia','Myanmar','Zimbabwe','Venezuela','Belarus','Afghanistan','Eritrea','South Sudan'].map(c=>(
                <div key={c} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'rgba(255,59,92,.06)',border:'1px solid rgba(255,59,92,.15)',borderRadius:'var(--r)',fontSize:11}}>
                  <span style={{color:'var(--bear)'}}>{c}</span>
                  <span style={{fontSize:9,color:'var(--text-muted)'}}>OFAC</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {jurTab==='aml' && (
        <div>
          <div className="card mb-12">
            <div className="card-hd"><span className="card-title">Platform AML Thresholds</span><span style={{fontSize:11,color:'var(--text-muted)'}}>Applied to ALL tenants automatically</span></div>
            <div style={{padding:16}}>
              {[
                {rule:'Deposit velocity',threshold:'> $50,000 in 24h from single client',action:'Flag for review',severity:'MEDIUM'},
                {rule:'Withdrawal timing',threshold:'Withdraw within 48h of deposit',action:'Hold + review',severity:'HIGH'},
                {rule:'Round-number transactions',threshold:'3+ transactions of exact round amounts',action:'Alert compliance',severity:'LOW'},
                {rule:'Cross-account patterns',threshold:'Same IP, different accounts',action:'Flag + escalate',severity:'HIGH'},
                {rule:'Geographic mismatch',threshold:'IP country ≠ registered country',action:'Enhanced KYC required',severity:'MEDIUM'},
                {rule:'Rapid fund movement',threshold:'>$200K moved in 7 days',action:'Suspend + review',severity:'CRITICAL'},
              ].map(r=>(
                <div key={r.rule} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)',gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--text-pri)'}}>{r.rule}</div>
                    <div style={{fontSize:11,color:'var(--text-sec)',marginTop:2}}>{r.threshold}</div>
                  </div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{r.action}</div>
                  <span style={{fontSize:10,fontFamily:'var(--font-data)',color:r.severity==='CRITICAL'?'var(--bear)':r.severity==='HIGH'?'var(--bear)':r.severity==='MEDIUM'?'var(--warn)':'var(--text-muted)',width:60,textAlign:'right'}}>{r.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {jurTab==='incidents' && (
        <div className="card">
          <div className="card-hd"><span className="card-title">Incident Log</span></div>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Type</th><th>Severity</th><th>Tenant</th><th>Description</th><th>Status</th></tr></thead>
            <tbody>
              {[
                {date:'Mar 15',type:'API Error',sev:'MINOR',tenant:'PeakFX',desc:'Error rate spike >1% for 8 minutes',status:'RESOLVED'},
                {date:'Mar 10',type:'KYC Timeout',sev:'MINOR',tenant:'Platform',desc:'KYC service latency >300ms for 2 hours',status:'RESOLVED'},
                {date:'Feb 28',type:'Payment Failure',sev:'MEDIUM',tenant:'SkyFX Ltd',desc:'Invoice payment declined — third consecutive month',status:'OPEN'},
                {date:'Feb 14',type:'Auth Anomaly',sev:'HIGH',tenant:'GlobalFX Pro',desc:'Multiple failed admin login attempts from unknown IP',status:'RESOLVED'},
                {date:'Jan 22',type:'DB Latency',sev:'MINOR',tenant:'Platform',desc:'Read replica lag >200ms during peak hours',status:'RESOLVED'},
              ].map((inc,i)=>(
                <tr key={i}>
                  <td className="text-sec">{inc.date}</td>
                  <td style={{color:'var(--text-pri)',fontSize:12}}>{inc.type}</td>
                  <td><span style={{fontSize:10,fontFamily:'var(--font-data)',color:inc.sev==='HIGH'?'var(--bear)':inc.sev==='MEDIUM'?'var(--warn)':'var(--text-muted)'}}>{inc.sev}</span></td>
                  <td className="text-sec">{inc.tenant}</td>
                  <td style={{fontSize:11,color:'var(--text-sec)',maxWidth:280}}>{inc.desc}</td>
                  <td><span className={`badge badge-${inc.status==='RESOLVED'?'active':'trial'}`}>{inc.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 9: DEVELOPER PORTAL
// ═══════════════════════════════════════════════════════════════════
function DeveloperPortal() {
  const [devTab, setDevTab] = useState('changelog');

  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div><div className="page-title">Developer Portal</div><div className="page-sub">Internal — platform API, SDKs, webhooks, changelog</div></div>
        <Btn variant="primary">⊕ Publish Changelog Entry</Btn>
      </div>

      <div className="tab-bar" style={{margin:'-4px -24px 20px',padding:'0 24px',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--r-lg) var(--r-lg) 0 0'}}>
        {[['changelog','Changelog'],['sdks','SDK Status'],['webhooks','Webhook Registry'],['api','API Docs']].map(([id,label])=>(
          <div key={id} className={`tab-item${devTab===id?' active':''}`} onClick={()=>setDevTab(id)}>{label}</div>
        ))}
      </div>

      {devTab==='changelog' && (
        <div className="card">
          <div className="card-hd"><span className="card-title">Platform Changelog</span></div>
          <div style={{padding:'0 16px'}}>
            {CHANGELOG.map((c,i)=>(
              <div key={i} className="changelog-item">
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <span className="changelog-ver">{c.ver}</span>
                  <span className="changelog-date">{c.date}</span>
                  <span style={{marginLeft:'auto',fontSize:10,padding:'2px 8px',borderRadius:3,fontFamily:'var(--font-data)',background:c.type==='FEATURE'?'rgba(16,217,150,.1)':c.type==='BREAKING'?'rgba(255,59,92,.1)':'rgba(59,130,246,.1)',color:c.type==='FEATURE'?'var(--bull)':c.type==='BREAKING'?'var(--bear)':'var(--accent)'}}>{c.type}</span>
                </div>
                <div className="changelog-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {devTab==='sdks' && (
        <div className="card">
          <div className="card-hd"><span className="card-title">SDK Versions</span></div>
          <div style={{padding:'0 16px'}}>
            {[
              {name:'Web SDK',ver:'v2.4.1',status:'CURRENT',platform:'Browser/Node.js'},
              {name:'Mobile SDK (iOS)',ver:'v2.3.8',status:'UPDATE AVAILABLE',platform:'iOS 14+'},
              {name:'Mobile SDK (Android)',ver:'v2.4.0',status:'CURRENT',platform:'Android 8+'},
              {name:'Desktop SDK',ver:'v2.4.1',status:'CURRENT',platform:'Electron'},
              {name:'FIX Adapter',ver:'v1.2.3',status:'STABLE',platform:'FIX 4.4/5.0'},
              {name:'REST API Client (Python)',ver:'v2.4.1',status:'CURRENT',platform:'Python 3.8+'},
              {name:'REST API Client (JavaScript)',ver:'v2.4.1',status:'CURRENT',platform:'Node.js 16+'},
            ].map((sdk,i)=>(
              <div key={i} className="sdk-item">
                <div>
                  <div className="sdk-name">{sdk.name}</div>
                  <div className="sdk-ver">{sdk.platform}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span className="mono" style={{fontSize:12,color:'var(--text-pri)'}}>{sdk.ver}</span>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:3,background:sdk.status==='CURRENT'||sdk.status==='STABLE'?'rgba(16,217,150,.1)':'rgba(245,158,11,.1)',color:sdk.status==='CURRENT'||sdk.status==='STABLE'?'var(--bull)':'var(--warn)'}}>{sdk.status}</span>
                  <Btn variant="ghost" size="sm">⬇ Download</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {devTab==='webhooks' && (
        <div className="card">
          <div className="card-hd">
            <span className="card-title">Webhook Registry — {WEBHOOKS.length} registered</span>
            <div style={{display:'flex',gap:6}}>
              <Btn variant="ghost" size="sm">Test All</Btn>
              <Btn variant="danger" size="sm">Disable Failed</Btn>
            </div>
          </div>
          <table className="tbl">
            <thead><tr><th>Tenant</th><th>Event</th><th>Endpoint</th><th>Status</th><th>Last Triggered</th><th></th></tr></thead>
            <tbody>
              {WEBHOOKS.map((w,i)=>(
                <tr key={i}>
                  <td className="text-pri" style={{fontWeight:500}}>{w.tenant}</td>
                  <td className="mono" style={{color:'var(--accent)',fontSize:11}}>{w.event}</td>
                  <td className="mono" style={{color:'var(--text-muted)',fontSize:11}}>{w.url}</td>
                  <td><StatusBadge s={w.status}/></td>
                  <td className="text-sec">{w.last}</td>
                  <td><Btn variant="ghost" size="sm">Test</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {devTab==='api' && (
        <div className="card">
          <div className="card-hd"><span className="card-title">API Reference — v2</span><span style={{fontSize:11,color:'var(--text-muted)'}}>Base URL: api.obsidian.io/v2</span></div>
          <div style={{padding:16}}>
            {[
              {group:'Tenants',endpoints:[['GET','/tenants','List all tenants'],['POST','/tenants','Create tenant'],['GET','/tenants/:id','Get tenant'],['PUT','/tenants/:id','Update tenant'],['DELETE','/tenants/:id/suspend','Suspend tenant']]},
              {group:'Instruments',endpoints:[['GET','/instruments','List instruments'],['POST','/instruments','Add instrument'],['PUT','/instruments/:sym','Update instrument']]},
              {group:'Prices',endpoints:[['GET','/prices','Get all prices'],['GET','/prices/:sym','Get symbol price'],['WS','/ws/prices','Stream price feed']]},
              {group:'Trades',endpoints:[['GET','/trades','List trades'],['POST','/trades','Execute trade'],['GET','/trades/:id','Get trade']]},
            ].map(group=>(
              <div key={group.group} style={{marginBottom:16}}>
                <div className="section-title">{group.group}</div>
                {group.endpoints.map(([method,path,desc])=>(
                  <div key={path} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 8px',borderRadius:'var(--r)',marginBottom:4,background:'var(--bg-2)',border:'1px solid var(--border)'}}>
                    <span style={{fontSize:10,fontFamily:'var(--font-data)',width:36,textAlign:'center',padding:'2px 4px',borderRadius:3,background:method==='GET'?'rgba(16,217,150,.15)':method==='POST'?'rgba(59,130,246,.15)':method==='PUT'?'rgba(245,158,11,.15)':method==='WS'?'rgba(168,85,247,.15)':'rgba(255,59,92,.15)',color:method==='GET'?'var(--bull)':method==='POST'?'var(--accent)':method==='PUT'?'var(--warn)':method==='WS'?'var(--purple)':'var(--bear)'}}>{method}</span>
                    <span className="mono" style={{color:'var(--text-pri)',fontSize:12}}>{path}</span>
                    <span style={{fontSize:11,color:'var(--text-muted)',marginLeft:'auto'}}>{desc}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 10: TEAM & AUDIT
// ═══════════════════════════════════════════════════════════════════
function TeamAudit({activeTab}) {
  const [tab, setTab] = useState(activeTab||'team');

  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div><div className="page-title">{tab==='team'?'Team & Permissions':'Audit Log'}</div></div>
        {tab==='team' && <Btn variant="primary">⊕ Invite Member</Btn>}
        {tab==='audit' && <Btn variant="ghost">⬇ Export Log</Btn>}
      </div>

      <div className="tab-bar" style={{margin:'-4px -24px 20px',padding:'0 24px',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--r-lg) var(--r-lg) 0 0'}}>
        {[['team','Team Members'],['audit','Audit Log']].map(([id,label])=>(
          <div key={id} className={`tab-item${tab===id?' active':''}`} onClick={()=>setTab(id)}>{label}</div>
        ))}
      </div>

      {tab==='team' && (
        <>
          <div className="card mb-16">
            <div className="card-hd"><span className="card-title">Platform Team — 6 members</span></div>
            <table className="tbl">
              <thead><tr><th>Name</th><th>Role</th><th>Access Level</th><th>Email</th><th>Last Active</th><th></th></tr></thead>
              <tbody>
                {TEAM.map((m,i)=>(
                  <tr key={i}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:`hsl(${i*40+200},60%,40%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
                          {m.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <span style={{color:'var(--text-pri)',fontWeight:500,fontSize:12}}>{m.name}</span>
                      </div>
                    </td>
                    <td className="text-sec">{m.role}</td>
                    <td><span style={{fontSize:10,padding:'2px 8px',borderRadius:3,background:m.access==='Super Admin'?'rgba(168,85,247,.12)':'rgba(59,130,246,.08)',border:`1px solid ${m.access==='Super Admin'?'rgba(168,85,247,.3)':'rgba(59,130,246,.2)'}`,color:m.access==='Super Admin'?'var(--purple)':'var(--accent)'}}>{m.access}</span></td>
                    <td className="mono" style={{fontSize:11,color:'var(--text-muted)'}}>{m.email}</td>
                    <td className="text-sec">{m.last}</td>
                    <td><div style={{display:'flex',gap:4}}><Btn variant="ghost" size="sm">Edit</Btn><Btn variant="danger" size="sm">Remove</Btn></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-hd"><span className="card-title">Permissions Matrix</span></div>
            <div style={{padding:16,overflowX:'auto'}}>
              <table className="tbl" style={{minWidth:600}}>
                <thead>
                  <tr>
                    <th>Permission</th>
                    {['Super Admin','Sales','CS','Technical','Finance','Read-only'].map(r=><th key={r} style={{textAlign:'center'}}>{r}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['View Dashboard',       true,true,true,true,true,true],
                    ['Manage Tenants',       true,false,true,false,false,false],
                    ['Billing & Invoices',   true,false,false,false,true,false],
                    ['Platform Config',      true,false,false,true,false,false],
                    ['Impersonate Tenant',   true,false,true,false,false,false],
                    ['Compliance Settings',  true,false,false,false,false,false],
                    ['Team Management',      true,false,false,false,false,false],
                    ['View Audit Log',       true,false,false,false,false,true],
                  ].map(([perm,...vals])=>(
                    <tr key={perm}>
                      <td style={{color:'var(--text-sec)',fontSize:12}}>{perm}</td>
                      {vals.map((v,i)=>(
                        <td key={i} style={{textAlign:'center'}}>{v?<span style={{color:'var(--bull)'}}>✓</span>:<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab==='audit' && (
        <div className="card">
          <div className="card-hd"><span className="card-title">Platform Audit Trail — Immutable</span><span style={{fontSize:11,color:'var(--text-muted)'}}>Today · 47 events</span></div>
          <table className="tbl">
            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Type</th></tr></thead>
            <tbody>
              {AUDIT_LOG.map((a,i)=>(
                <tr key={i}>
                  <td className="mono" style={{color:'var(--text-muted)',fontSize:11}}>{a.time}</td>
                  <td style={{color:'var(--text-pri)',fontWeight:500,fontSize:12}}>{a.user}</td>
                  <td style={{color:'var(--text-sec)',fontSize:12}}>{a.action}</td>
                  <td><span style={{fontSize:10,fontFamily:'var(--font-data)',color:a.type==='SECURITY'?'var(--bear)':a.type==='INFRA'?'var(--accent)':a.type==='BILLING'?'var(--bull)':'var(--text-muted)'}}>{a.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LIVE ACTIVITY PAGE
// ═══════════════════════════════════════════════════════════════════
function ActivityFeedPage() {
  const [items, setItems] = useState(()=>ACTIVITY_POOL.map((e,i)=>({...e,id:i,time:now()})));
  const [paused, setPaused] = useState(false);
  const idxRef = useRef(0);

  useEffect(()=>{
    if(paused) return;
    const t=setInterval(()=>{
      idxRef.current=(idxRef.current+1)%ACTIVITY_POOL.length;
      const ev={...ACTIVITY_POOL[idxRef.current],id:Date.now(),time:now()};
      setItems(prev=>[ev,...prev.slice(0,49)]);
    },1500);
    return()=>clearInterval(t);
  },[paused]);

  return (
    <div className="page fade-in">
      <div className="page-hd">
        <div><div className="page-title">Live Activity Feed</div><div className="page-sub">Real-time platform event stream</div></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <Dot color={paused?'muted':'bull'} pulse={!paused}/>
          <Btn variant="ghost" onClick={()=>setPaused(p=>!p)}>{paused?'▶ Resume':'⏸ Pause'}</Btn>
          <Btn variant="danger" size="sm" onClick={()=>setItems([])}>Clear</Btn>
        </div>
      </div>
      <div className="card">
        <div className="feed-controls">
          <select className="filter-sel"><option>All tenants</option>{TENANTS.map(t=><option key={t.id}>{t.name}</option>)}</select>
          <select className="filter-sel"><option>All events</option><option>TRADE</option><option>DEPOSIT</option><option>CLIENT</option><option>ALERT</option><option>BILLING</option></select>
          <select className="filter-sel"><option>All severity</option><option>warn</option><option>bear</option><option>bull</option><option>info</option></select>
          <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-muted)'}}>{items.length} events</span>
        </div>
        <div className="feed" style={{maxHeight:600}}>
          {items.map(e=>(
            <div key={e.id} className="feed-item tick-enter">
              <span className="feed-time">{e.time}</span>
              <span className={`feed-type feed-type-${e.severity}`}>{e.type}</span>
              <span className="feed-tenant">{e.tenant}</span>
              <span className="feed-msg">— {e.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PLACEHOLDER for unimplemented nav items
// ═══════════════════════════════════════════════════════════════════
function Placeholder({title}) {
  return (
    <div className="page fade-in">
      <div className="page-hd"><div className="page-title">{title}</div></div>
      <div className="card"><div className="empty">📊 Module ready — content coming soon</div></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function ObsidianHub() {
  const [nav, setNav] = useState('dashboard');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Inject styles once
  useEffect(()=>{
    const el=document.createElement('style');
    el.textContent=STYLES;
    document.head.appendChild(el);
    return ()=>document.head.removeChild(el);
  },[]);

  const renderModule = () => {
    switch(nav) {
      case 'dashboard':     return <Dashboard setNav={setNav} setSelectedTenant={setSelectedTenant}/>;
      case 'health':        return <PlatformHealth/>;
      case 'activity':      return <ActivityFeedPage/>;
      case 'brokers':       return <AllBrokers setSelectedTenant={setSelectedTenant} setNav={setNav}/>;
      case 'tenant-detail': return <TenantDetail tenant={selectedTenant} setNav={setNav}/>;
      case 'onboarding':    return <OnboardingQueue/>;
      case 'instruments':   return <InstrumentsMaster/>;
      case 'lps':           return <LiquidityProviders/>;
      case 'revenue':       return <SaasRevenue/>;
      case 'compliance':    return <Compliance/>;
      case 'developer':     return <DeveloperPortal/>;
      case 'webhooks':      return <DeveloperPortal/>;
      case 'sdks':          return <DeveloperPortal/>;
      case 'team':          return <TeamAudit activeTab="team"/>;
      case 'audit':         return <TeamAudit activeTab="audit"/>;
      default:              return <Placeholder title={nav.charAt(0).toUpperCase()+nav.slice(1).replace(/-/g,' ')}/>;
    }
  };

  return (
    <div className="hub">
      <TopBar/>
      <div className="hub-body">
        <Sidebar nav={nav} setNav={setNav} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}/>
        <main className="hub-main">{renderModule()}</main>
      </div>
    </div>
  );
}
