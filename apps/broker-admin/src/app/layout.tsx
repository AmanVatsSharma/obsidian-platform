import './global.css';

export const metadata = {
  title: 'NestTrade Broker Admin',
  description: 'Broker hierarchy and operations control surface',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
