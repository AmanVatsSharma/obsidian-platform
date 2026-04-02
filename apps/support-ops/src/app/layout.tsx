/**
 * @file layout.tsx
 * @module support-ops
 * @description Root layout for support ops app
 * @author BharatERP
 * @created 2026-02-19
 */

import './global.css';

export const metadata = {
  title: 'NestTrade Support Ops',
  description: 'Support operations and customer service surface',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
