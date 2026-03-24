import dynamic from 'next/dynamic';

const ProfileClient = dynamic(
  () => import('@/components/profile/ProfileClient'),
  { ssr: false }
);

export default function ProfilePage() {
  return <ProfileClient />;
}
