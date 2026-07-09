import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

export const metadata: Metadata = {
  title: 'Peds Anesthesia Logbook',
  description: 'Personal training case log — de-identified, single-user.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A121C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-base text-paper font-display antialiased">
        <SideNav />
        <div className="min-h-screen flex flex-col pb-20 md:pb-0 md:pl-20">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
