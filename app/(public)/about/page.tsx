import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Sillok is a graph-based archive platform connecting notable Korean figures from ancient times to the modern era as interconnected nodes.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">About Sillok</h1>
        <p className="mt-2 text-sm text-gray-500">
          A graph-based Korean historical figures archive
        </p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">What is Sillok?</h2>
        <p>
          Sillok is an interactive archive platform that connects notable Korean
          historical figures — from the ancient kingdom of Gojoseon to modern
          Korea — as interconnected nodes in a living graph.
        </p>
        <p>
          The name &ldquo;Sillok&rdquo; (meaning &ldquo;veritable records&rdquo;)
          is inspired by the Joseon Wangjo Sillok, one of the most comprehensive
          historical records in the world, documenting 472 years of Korean
          dynastic history.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Features</h2>
        <ul className="list-inside list-disc space-y-2 text-gray-600">
          <li>
            <strong>Age Flow</strong> — An interactive scroll-driven timeline
            visualizing historical figures across centuries, showing who lived
            alongside whom.
          </li>
          <li>
            <strong>Figure Profiles</strong> — Detailed pages for each figure
            with biography, relationships, and community discussions.
          </li>
          <li>
            <strong>Historical Events</strong> — Major events (wars, treaties,
            cultural milestones) displayed alongside the figures who shaped them.
          </li>
          <li>
            <strong>Community Threads</strong> — Open discussion threads where
            users can share perspectives on historical figures.
          </li>
          <li>
            <strong>Trending Rankings</strong> — See which figures are generating
            the most discussion, powered by a gravity-decay algorithm.
          </li>
        </ul>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Our Mission</h2>
        <p>
          We believe history becomes more meaningful when you can see how people
          were connected. Sillok aims to make Korean history accessible to a
          global audience by presenting it not as a list of dates and events,
          but as a network of human relationships and stories.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
        <p>
          For inquiries, feedback, or partnership opportunities:
        </p>
        <p>
          <a
            href="mailto:contact@sillok.kr"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            contact@sillok.kr
          </a>
        </p>
      </section>

      <div className="border-t border-gray-200 pt-6">
        <Link
          href="/"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
