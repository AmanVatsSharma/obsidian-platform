/**
 * @file layout.tsx
 * @module dealer-workstation
 * @description Root layout for dealer workstation app
 * @author BharatERP
 * @created 2026-02-19
 */

import './global.css';

export const metadata = {
  title: 'NestTrade Dealer Workstation',
  description: 'Dealer trading and order management surface',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
