import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { ToastProvider } from '@/components/common/Toast';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://sillok.kr'),
  title: {
    default: 'Sillok - Korean Historical Figures Archive',
    template: '%s | Sillok',
  },
  description:
    'A graph-based archive platform connecting notable Korean figures from Dangun to the present as interconnected nodes',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '180x180' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Sillok - Korean Historical Figures Archive',
    description:
      'A graph-based archive platform connecting notable Korean figures from Dangun to the present as interconnected nodes',
    url: 'https://sillok.kr',
    siteName: 'Sillok',
    locale: 'en_US',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@sillok_kr',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
