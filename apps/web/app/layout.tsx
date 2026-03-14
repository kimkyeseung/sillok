import type { Metadata } from 'next';
import { ToastProvider } from '@/components/common/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sillok - Korean Historical Figures Archive',
  description:
    'A graph-based archive platform connecting notable Korean figures from Dangun to the present as interconnected nodes',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '180x180' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Sillok - Korean Historical Figures Archive',
    description:
      'A graph-based archive platform connecting notable Korean figures from Dangun to the present as interconnected nodes',
    url: 'https://sillok.net',
    siteName: 'Sillok',
    locale: 'en_US',
    type: 'website',
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
      </body>
    </html>
  );
}
