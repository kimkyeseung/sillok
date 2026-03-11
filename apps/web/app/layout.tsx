import type { Metadata } from 'next';
import { ToastProvider } from '@/components/common/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: '실록 - 한국 인물 아카이브',
  description:
    '단군부터 현재까지, 한국의 이름있는 인물을 하나의 노드로 연결하는 그래프형 인물 아카이브 플랫폼',
  openGraph: {
    title: '실록 - 한국 인물 아카이브',
    description:
      '단군부터 현재까지, 한국의 이름있는 인물을 하나의 노드로 연결하는 그래프형 인물 아카이브 플랫폼',
    url: 'https://sillok.net',
    siteName: '실록',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
