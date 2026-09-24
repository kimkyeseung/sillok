import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Write a Thread',
  robots: { index: false, follow: false },
};

export default function NewThreadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
