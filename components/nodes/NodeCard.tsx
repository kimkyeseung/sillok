import Link from 'next/link';
import Image from 'next/image';
import type { NodeItem } from '@/app/(public)/nodes/page';

export const NODE_TYPES = [
  { key: 'all', label: 'All', icon: '🔍', color: 'bg-gray-100 text-gray-700' },
  {
    key: 'ARTIFACT',
    label: 'Artifacts',
    icon: '🏺',
    color: 'bg-amber-50 text-amber-700',
  },
  { key: 'EVENT', label: 'Events', icon: '⚔', color: 'bg-red-50 text-red-700' },
  {
    key: 'MEDIA',
    label: 'Media',
    icon: '🎬',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    key: 'GROUP',
    label: 'Groups',
    icon: '👥',
    color: 'bg-purple-50 text-purple-700',
  },
] as const;

const TYPE_MAP: Record<string, (typeof NODE_TYPES)[number]> = {};
for (const t of NODE_TYPES) {
  TYPE_MAP[t.key] = t;
}

export function getTypeConfig(type: string) {
  return TYPE_MAP[type] ?? TYPE_MAP['all'];
}

/* ── Period color ── */

function getPeriodColor(period?: string): string {
  if (!period) return 'text-gray-400';
  if (period.includes('Silla')) return 'text-yellow-600';
  if (period.includes('Goryeo')) return 'text-teal-600';
  if (period.includes('Joseon')) return 'text-indigo-600';
  if (period.includes('Baekje')) return 'text-sky-600';
  if (period.includes('Goguryeo')) return 'text-red-600';
  return 'text-gray-500';
}

function formatYear(year: number): string {
  return year < 0 ? `${-year} BCE` : String(year);
}

/** "National Treasure No. 24" → { label: 'National Treasure', num: '24' } */
function parseDesignation(designation?: string) {
  const m = designation?.match(/^(National Treasure|Treasure) No\.\s*([\d-]+)/);
  return m
    ? { label: m[1], num: m[2], isNational: m[1] === 'National Treasure' }
    : null;
}

const CATEGORY_ICONS: Record<string, string> = {
  architecture: '🏯',
  sculpture: '🪷',
  painting: '🖼️',
  craft: '🏺',
  book: '📜',
  calligraphy: '🖌️',
  other: '✦',
};

// Heritage API images are served as-is (not mirrored) — skip the optimizer for hosts outside next.config
function isOptimizable(url: string): boolean {
  return /^https:\/\/([a-z0-9-]+\.supabase\.co|img\.youtube\.com|lh3\.googleusercontent\.com|upload\.wikimedia\.org)\//.test(
    url
  );
}

export default function NodeCard({ node }: { node: NodeItem }) {
  const typeConfig = getTypeConfig(node.node_type);
  const isArtifact = node.node_type === 'ARTIFACT';
  const meta = node.metadata as Record<string, unknown> | null;
  const period = meta?.created_period as string | undefined;
  const year = meta?.created_year as number | undefined;
  const location = meta?.location as string | undefined;
  const groupSize = (meta?.designation_group_size as number | undefined) ?? 1;
  const designation = parseDesignation(meta?.designation as string | undefined);
  const linkedPersons = (node.person_node_links ?? [])
    .map((l) => l.persons)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const designationBadge = designation && (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
        designation.isNational
          ? 'bg-amber-500 text-white'
          : 'bg-slate-700 text-white'
      }`}
      title={`${designation.label} No. ${designation.num}`}
    >
      {designation.isNational ? 'National Treasure' : 'Treasure'}{' '}
      {designation.num}
    </span>
  );

  return (
    <Link
      href={`/nodes/${node.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md"
    >
      {/* Thumbnail */}
      {node.thumbnail ? (
        <div className="relative h-40 w-full overflow-hidden bg-gray-100">
          <Image
            src={node.thumbnail}
            alt={node.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            unoptimized={!isOptimizable(node.thumbnail)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {designationBadge && (
            <span className="absolute left-2 top-2 flex">
              {designationBadge}
            </span>
          )}
          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm ${typeConfig.color}`}
          >
            {typeConfig.icon} {typeConfig.label}
          </span>
        </div>
      ) : isArtifact ? (
        // No commercially licensed photo — keep the card height so the grid stays aligned
        <div className="relative flex h-40 w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-amber-50 via-stone-50 to-stone-100">
          <span className="text-4xl opacity-60" aria-hidden>
            {CATEGORY_ICONS[(meta?.category as string) ?? 'other'] ??
              CATEGORY_ICONS.other}
          </span>
          {period && (
            <span className="text-[11px] font-medium text-stone-400">
              {period}
            </span>
          )}
          {designationBadge && (
            <span className="absolute left-2 top-2 flex">
              {designationBadge}
            </span>
          )}
          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${typeConfig.color}`}
          >
            {typeConfig.icon} {typeConfig.label}
          </span>
        </div>
      ) : (
        <div className={`h-1 w-full ${typeConfig.color.split(' ')[0]}`} />
      )}

      <div className="flex flex-1 flex-col p-4">
        {/* Badge row (no thumbnail) */}
        {!node.thumbnail && !isArtifact && (
          <div className="mb-2.5 flex items-center gap-2">
            {designationBadge}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${typeConfig.color}`}
            >
              {typeConfig.icon} {typeConfig.label}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand-600">
          {node.title}
        </h3>

        {location && <p className="mt-0.5 text-xs text-gray-400">{location}</p>}

        {/* Description */}
        {node.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {node.description}
          </p>
        )}

        {/* Meta info */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-[11px] text-gray-400">
          {period && (
            <span className={`font-medium ${getPeriodColor(period)}`}>
              {period}
              {year != null ? ` (${formatYear(year)})` : ''}
            </span>
          )}
          {!!meta?.start_year && !period && (
            <span className="font-medium text-gray-500">
              {String(meta.start_year)}
            </span>
          )}
          {groupSize > 1 && (
            <span
              className="rounded bg-stone-100 px-1.5 py-0.5 font-medium text-stone-500"
              title={`Part of a designation with ${groupSize} items`}
            >
              +{groupSize - 1} in this set
            </span>
          )}
          {node.view_count > 0 && (
            <span className="flex items-center gap-0.5">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {node.view_count.toLocaleString()}
            </span>
          )}
        </div>

        {/* Linked persons */}
        {linkedPersons.length > 0 && (
          <div className="mt-2 flex items-center gap-1 border-t border-gray-100 pt-2">
            <div className="flex -space-x-1.5">
              {linkedPersons.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white bg-gray-100 text-[8px] font-bold text-gray-500"
                  title={p.name_en || p.name_ko}
                >
                  {p.thumbnail ? (
                    <Image
                      src={p.thumbnail}
                      alt={p.name_en || p.name_ko}
                      width={20}
                      height={20}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (p.name_en || p.name_ko || '?').charAt(0)
                  )}
                </div>
              ))}
            </div>
            <span className="ml-1 text-[11px] text-gray-400">
              {linkedPersons.length === 1
                ? linkedPersons[0].name_en || linkedPersons[0].name_ko
                : `${linkedPersons[0].name_en || linkedPersons[0].name_ko} +${linkedPersons.length - 1}`}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
