import FeedLeftRail from '@/components/feed/FeedLeftRail';

/**
 * Three-column feed layout. Breaks out of the 5xl public container on large screens
 * (rail · feed · sidebar), stacks to a single column on mobile.
 */
export default function FeedShell({
  active,
  sidebar,
  children,
}: {
  active?: { kind: 'home' | 'board' | 'topic'; slug?: string };
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="lg:relative lg:left-1/2 lg:w-[min(calc(100vw-2rem),80rem)] lg:-translate-x-1/2">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[200px_minmax(0,1fr)_300px]">
        <aside className="hidden xl:block">
          <FeedLeftRail active={active} />
        </aside>
        <div className="min-w-0 space-y-3">{children}</div>
        <aside className="hidden lg:block">{sidebar}</aside>
      </div>
    </div>
  );
}
