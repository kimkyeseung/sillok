import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const NotificationsClient = dynamic(
  () => import('@/components/notification/NotificationsClient'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Notifications',
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
