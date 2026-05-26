import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Obsidian Demo Hub',
  description: 'Unified showcase for all platform demos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}