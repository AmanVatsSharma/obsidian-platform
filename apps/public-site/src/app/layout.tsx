/**
 * @file layout.tsx
 * @module public-site
 * @description Root layout for public marketing site
 * @author BharatERP
 * @created 2026-02-19
 */

import './global.css';

export const metadata = {
  title: 'NestTrade',
  description: 'Enterprise trading platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
