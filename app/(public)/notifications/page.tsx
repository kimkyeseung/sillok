import dynamic from 'next/dynamic';

const NotificationsClient = dynamic(
  () => import('@/components/notification/NotificationsClient'),
  { ssr: false }
);

export default function NotificationsPage() {
  return <NotificationsClient />;
}
