import Link from 'next/link';
import { ERA_HUBS, FIELD_HUBS, hubPath, type Hub } from '@/lib/person-directory';

interface Props {
  /** Figure count per hub path; hubs with no figures are not shown */
  counts: Map<string, number>;
  /** Path of the hub being viewed (highlighted, not a link) */
  current?: string;
}

/** "Browse by era / by field" chips linking to the hub pages */
export default function HubLinks({ counts, current }: Props) {
  const row = (title: string, hubs: Hub[]) => {
    const shown = hubs.filter((h) => (counts.get(hubPath(h)) ?? 0) > 0);
    if (shown.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        {shown.map((hub) => {
          const path = hubPath(hub);
          const text = (
            <>
              {hub.label} <span className="text-gray-400">{counts.get(path)}</span>
            </>
          );
          return path === current ? (
            <span key={path} aria-current="page" className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white">
              {hub.label} <span className="text-brand-100">{counts.get(path)}</span>
            </span>
          ) : (
            <Link
              key={path}
              href={path}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-brand-300 hover:text-brand-700"
            >
              {text}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <nav aria-label="Browse figures" className="space-y-2">
      {row('By era', ERA_HUBS)}
      {row('By field', FIELD_HUBS)}
    </nav>
  );
}
