/**
 * @file layout.tsx
 * @module ib-portal
 * @description Root layout for introducing broker portal app
 * @author BharatERP
 * @created 2026-02-19
 */

import './global.css';

export const metadata = {
  title: 'NestTrade IB Portal',
  description: 'Introducing broker portal and sub-broker management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
