import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const ProfileClient = dynamic(
  () => import('@/components/profile/ProfileClient'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
