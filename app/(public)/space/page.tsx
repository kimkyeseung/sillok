import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SpaceSimulator from '@/components/space/SpaceSimulator';

export const metadata: Metadata = {
  title: 'Space Simulator',
  description: 'Explore a 3D solar system simulator with orbit controls and planetary milestones.',
  alternates: { canonical: '/space' },
};

// Hidden for now — set to true to re-enable /space (and re-add the Header nav item)
const SPACE_ENABLED = false;

export default function SpacePage() {
  if (!SPACE_ENABLED) notFound();
  return <SpaceSimulator />;
}
