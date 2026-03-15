/**
 * @file layout.tsx
 * @module platform-owner
 * @description Root layout with mock data provider and sidebar navigation
 * @author BharatERP
 * @created 2026-03-15
 */

import './global.css';
import { MockDataProvider } from '../lib/mock-data-context';
import { Sidebar } from './sidebar';

export const metadata = {
  title: 'NestTrade Platform Owner',
  description: 'Global SaaS governance and tenant control plane',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, display: 'flex', minHeight: '100vh' }}>
        <MockDataProvider>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </MockDataProvider>
      </body>
    </html>
  );
}
