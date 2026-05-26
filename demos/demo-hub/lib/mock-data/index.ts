/**
 * Centralized mock data for all demo panels
 * Single source of truth - no duplication across demos
 */

// ========================
// TRADER TERMINAL DATA
// ========================

export const traderPortfolio = {
  totalValue: 1247583.50,
  dayPnL: 8342.75,
  buyingPower: 2495167.00,
};

export const traderPositions = [
  { symbol: 'RELIANCE', qty: 50, avgPrice: 2850.25, ltp: 2912.40, pnl: 3107.50, pnlPct: 2.18 },
  { symbol: 'TCS', qty: 25, avgPrice: 3850.00, ltp: 3920.50, pnl: 1762.50, pnlPct: 1.83 },
  { symbol: 'HDFCBANK', qty: 100, avgPrice: 1620.00, ltp: 1585.25, pnl: -3475.00, pnlPct: -2.15 },
  { symbol: 'INFY', qty: 75, avgPrice: 1480.00, ltp: 1512.75, pnl: 2456.25, pnlPct: 2.21 },
  { symbol: 'SBIN', qty: 200, avgPrice: 580.00, ltp: 572.15, pnl: -1570.00, pnlPct: -1.35 },
];

export const traderOrders = [
  { id: 'ORD001', symbol: 'RELIANCE', type: 'BUY', qty: 10, price: 2905.00, status: 'EXECUTED', time: '10:32:15' },
  { id: 'ORD002', symbol: 'TCS', type: 'BUY', qty: 5, price: 3918.50, status: 'EXECUTED', time: '10:28:42' },
  { id: 'ORD003', symbol: 'HDFCBANK', type: 'SELL', qty: 50, price: 1592.00, status: 'PENDING', time: '10:25:03' },
  { id: 'ORD004', symbol: 'INFY', type: 'BUY', qty: 25, price: 1508.00, status: 'EXECUTED', time: '10:18:55' },
  { id: 'ORD005', symbol: 'SBIN', type: 'SELL', qty: 100, price: 575.00, status: 'CANCELLED', time: '10:15:22' },
];

export const marketWatch = [
  { symbol: 'RELIANCE', ltp: 2912.40, change: 62.15, changePct: 2.18, volume: '12.5L', high: 2945.00, low: 2850.00 },
  { symbol: 'TCS', ltp: 3920.50, change: 70.50, changePct: 1.83, volume: '8.2L', high: 3950.00, low: 3850.00 },
  { symbol: 'HDFCBANK', ltp: 1585.25, change: -34.75, changePct: -2.15, volume: '15.8L', high: 1625.00, low: 1580.00 },
  { symbol: 'INFY', ltp: 1512.75, change: 32.75, changePct: 2.21, volume: '9.4L', high: 1525.00, low: 1480.00 },
  { symbol: 'SBIN', ltp: 572.15, change: -7.85, changePct: -1.35, volume: '22.1L', high: 585.00, low: 570.00 },
  { symbol: 'NIFTY50', ltp: 24892.35, change: 145.20, changePct: 0.59, volume: '-', high: 24950.00, low: 24750.00 },
];

// ========================
// BROKER ADMIN DATA
// ========================

export const brokerDashboard = {
  totalClients: 1247,
  activeClients: 1089,
  totalAUM: 4582300000,
  dailyVolume: 892450000,
  marginUtilized: 67.5,
  activeAlerts: 12,
};

export const brokerClients = [
  { id: 'C1001', name: 'Rajesh Mehta', type: 'Retail', aum: 4500000, margin: 1800000, status: 'Active', kyc: 'Verified' },
  { id: 'C1002', name: 'Priya Sharma', type: 'HNI', aum: 12500000, margin: 5000000, status: 'Active', kyc: 'Verified' },
  { id: 'C1003', name: 'Amit Verma', type: 'Retail', aum: 2100000, margin: 840000, status: 'Active', kyc: 'Pending' },
  { id: 'C1004', name: 'Sunita Patel', type: 'Corporate', aum: 28000000, margin: 11200000, status: 'Active', kyc: 'Verified' },
  { id: 'C1005', name: 'Vikram Singh', type: 'Retail', aum: 950000, margin: 380000, status: 'Inactive', kyc: 'Verified' },
  { id: 'C1006', name: 'Neha Gupta', type: 'HNI', aum: 8500000, margin: 3400000, status: 'Active', kyc: 'Verified' },
  { id: 'C1007', name: 'Arun Joshi', type: 'Retail', aum: 1800000, margin: 720000, status: 'Active', kyc: 'Verified' },
  { id: 'C1008', name: 'Kavita Reddy', type: 'Corporate', aum: 45000000, margin: 18000000, status: 'Active', kyc: 'Verified' },
];

export const brokerOrders = [
  { id: 'B001', client: 'C1001', symbol: 'RELIANCE', type: 'BUY', qty: 100, price: 2910.00, value: 291000, status: 'Executed' },
  { id: 'B002', client: 'C1003', symbol: 'TCS', type: 'SELL', qty: 50, price: 3925.00, value: 196250, status: 'Executed' },
  { id: 'B003', client: 'C1002', symbol: 'INFY', type: 'BUY', qty: 200, price: 1508.00, value: 301600, status: 'Pending' },
  { id: 'B004', client: 'C1005', symbol: 'HDFCBANK', type: 'SELL', qty: 75, price: 1595.00, value: 119625, status: 'Executed' },
  { id: 'B005', client: 'C1004', symbol: 'SBIN', type: 'BUY', qty: 500, price: 572.00, value: 286000, status: 'Executed' },
];

export const brokerRiskMetrics = [
  { client: 'C1004', exposure: 28000000, limit: 35000000, utilized: 80, alerts: 0 },
  { client: 'C1008', exposure: 45000000, limit: 50000000, utilized: 90, alerts: 2 },
  { client: 'C1002', exposure: 12500000, limit: 20000000, utilized: 62.5, alerts: 0 },
  { client: 'C1001', exposure: 4500000, limit: 8000000, utilized: 56.25, alerts: 0 },
];

// ========================
// DEALER WORKSTATION DATA
// ========================

export const dealerQuotes = [
  { symbol: 'RELIANCE', bid: 2911.50, ask: 2913.25, spread: 1.75, volume: '45K', lastTrade: '10:42:18' },
  { symbol: 'TCS', bid: 3919.00, ask: 3922.00, spread: 3.00, volume: '28K', lastTrade: '10:42:15' },
  { symbol: 'HDFCBANK', bid: 1584.50, ask: 1586.00, spread: 1.50, volume: '62K', lastTrade: '10:42:12' },
  { symbol: 'INFY', bid: 1511.75, ask: 1513.50, spread: 1.75, volume: '35K', lastTrade: '10:42:08' },
  { symbol: 'NIFTY50', bid: 24890.00, ask: 24894.75, spread: 4.75, volume: '180K', lastTrade: '10:42:05' },
];

export const dealerRiskBook = [
  { desk: 'EQ-D1', pnl: 125000, exposure: 45000000, var: 225000, limit: 50000000, status: 'Normal' },
  { desk: 'EQ-D2', pnl: -45000, exposure: 38000000, var: 190000, limit: 45000000, status: 'Warning' },
  { desk: 'F&O-D1', pnl: 210000, exposure: 85000000, var: 425000, limit: 100000000, status: 'Normal' },
  { desk: 'FX-D1', pnl: 35000, exposure: 15000000, var: 75000, limit: 20000000, status: 'Normal' },
];

export const dealerPnL = {
  realized: 325000,
  unrealized: -45000,
  total: 280000,
  dailyTarget: 500000,
  progress: 56,
};

// ========================
// IB PORTAL DATA
// ========================

export const ibHierarchy = [
  {
    id: 'IB001',
    name: 'Alpha Brokers',
    type: 'Master IB',
    clients: 45,
    revenue: 2450000,
    children: [
      { id: 'IB002', name: 'Beta Trading', type: 'Sub IB', clients: 18, revenue: 890000 },
      { id: 'IB003', name: 'Gamma Capital', type: 'Sub IB', clients: 12, revenue: 650000 },
      { id: 'IB004', name: 'Delta Markets', type: 'Sub IB', clients: 15, revenue: 910000 },
    ],
  },
  {
    id: 'IB005',
    name: 'Omega Securities',
    type: 'Master IB',
    clients: 32,
    revenue: 1850000,
    children: [
      { id: 'IB006', name: 'Sigma Trades', type: 'Sub IB', clients: 20, revenue: 1100000 },
      { id: 'IB007', name: 'Theta Investments', type: 'Sub IB', clients: 12, revenue: 750000 },
    ],
  },
];

export const ibCommission = [
  { period: 'Jan 2026', brokerage: 450000, shared: 225000, net: 225000 },
  { period: 'Feb 2026', brokerage: 520000, shared: 260000, net: 260000 },
  { period: 'Mar 2026', brokerage: 480000, shared: 240000, net: 240000 },
  { period: 'Apr 2026', brokerage: 610000, shared: 305000, net: 305000 },
  { period: 'May 2026', brokerage: 385000, shared: 192500, net: 192500 },
];

export const ibSubBrokers = [
  { id: 'SB001', name: 'Beta Trading', clients: 18, activeClients: 16, monthRevenue: 890000, status: 'Active' },
  { id: 'SB002', name: 'Gamma Capital', clients: 12, activeClients: 11, monthRevenue: 650000, status: 'Active' },
  { id: 'SB003', name: 'Delta Markets', clients: 15, activeClients: 14, monthRevenue: 910000, status: 'Active' },
  { id: 'SB004', name: 'Epsilon Group', clients: 8, activeClients: 7, monthRevenue: 420000, status: 'Pending KYC' },
  { id: 'SB005', name: 'Zeta Finance', clients: 22, activeClients: 19, monthRevenue: 1150000, status: 'Active' },
];

// ========================
// UTILITY FUNCTIONS
// ========================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatCompact(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)} K`;
  return value.toString();
}