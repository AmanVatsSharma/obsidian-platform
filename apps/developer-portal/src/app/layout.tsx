/**
 * @file layout.tsx
 * @module developer-portal
 * @description Root layout for developer portal app
 * @author BharatERP
 * @created 2026-02-19
 */

import './global.css';

export const metadata = {
  title: 'NestTrade Developer Portal',
  description: 'API docs and developer resources',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
