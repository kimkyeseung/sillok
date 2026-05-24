import type { Metadata } from 'next';
import SpaceSimulator from '@/components/space/SpaceSimulator';

export const metadata: Metadata = {
  title: 'Space Simulator | Sillok',
  description: 'Explore a 3D solar system simulator with orbit controls and planetary milestones.',
  alternates: { canonical: '/space' },
};

export default function SpacePage() {
  return <SpaceSimulator />;
}
