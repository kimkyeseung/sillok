import Link from 'next/link';
import { BOARDS, TOPICS } from '@/lib/feed';

interface Props {
  /** Highlights the current feed/board/topic */
  active?: { kind: 'home' | 'board' | 'topic'; slug?: string };
}

const EXPLORE = [
  { href: '/persons', label: 'All figures', icon: '👤' },
  { href: '/age-flow', label: 'Age Flow', icon: '🕰' },
  { href: '/nodes?type=ARTIFACT', label: 'Artifacts', icon: '🏺' },
  { href: '/nodes?type=MEDIA', label: 'Film & Books', icon: '🎞' },
  { href: '/articles', label: 'Articles', icon: '📰' },
];

function RailLink({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span aria-hidden="true" className="w-5 text-center">
        {icon}
      </span>
      {label}
    </Link>
  );
}

/** Left navigation rail for feed pages (desktop) */
export default function FeedLeftRail({ active }: Props) {
  return (
    <nav aria-label="Feeds and boards" className="sticky top-20 space-y-5 text-sm">
      <div className="space-y-0.5">
        <RailLink href="/" icon="🏠" label="Home" active={active?.kind === 'home'} />
        <RailLink href="/?sort=top&t=week" icon="🔥" label="Popular this week" />
        <RailLink href="/?sort=new" icon="🆕" label="Newest" />
      </div>
      <div>
        <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Boards</p>
        <div className="space-y-0.5">
          {BOARDS.map((b) => (
            <RailLink
              key={b.slug}
              href={`/b/${b.slug}`}
              icon={b.icon}
              label={b.label}
              active={active?.kind === 'board' && active.slug === b.slug}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Topics</p>
        <div className="space-y-0.5">
          {TOPICS.map((t) => (
            <RailLink
              key={t.slug}
              href={`/t/${t.slug}`}
              icon={t.icon}
              label={t.label}
              active={active?.kind === 'topic' && active.slug === t.slug}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Explore</p>
        <div className="space-y-0.5">
          {EXPLORE.map((e) => (
            <RailLink key={e.href} {...e} />
          ))}
        </div>
      </div>
    </nav>
  );
}
