import Link from 'next/link';
import Image from 'next/image';
import type { LinkedNode } from '@/lib/person-page';

export const NODE_TYPE_LABELS: Record<string, string> = {
  ARTIFACT: 'Artifact',
  MEDIA: 'Media',
  EVENT: 'Event',
  GROUP: 'Group',
  TOPIC: 'Topic',
};

const NODE_TYPE_COLORS: Record<string, string> = {
  ARTIFACT: 'bg-amber-50 text-amber-700',
  MEDIA: 'bg-blue-50 text-blue-700',
  EVENT: 'bg-purple-50 text-purple-700',
  GROUP: 'bg-indigo-50 text-indigo-700',
  TOPIC: 'bg-teal-50 text-teal-700',
};

const NODE_TYPE_ICONS: Record<string, string> = {
  ARTIFACT: '🏛',
  MEDIA: '🎬',
  EVENT: '📅',
  GROUP: '👥',
  TOPIC: '📚',
};

export default function LinkedNodeGrid({ nodes }: { nodes: LinkedNode[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {nodes.map((node) => (
        <Link
          key={node.id}
          href={`/nodes/${node.slug}`}
          className="card-flat flex items-center gap-3 p-3 transition-colors hover:bg-gray-50"
        >
          {node.thumbnail ? (
            <Image
              src={node.thumbnail}
              alt={node.title}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
              {NODE_TYPE_ICONS[node.node_type] ?? '📄'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  NODE_TYPE_COLORS[node.node_type] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {NODE_TYPE_LABELS[node.node_type] ?? node.node_type}
              </span>
              {node.year != null && <span className="text-[10px] text-gray-400">{node.year}</span>}
            </div>
            <p className="mt-0.5 truncate text-sm font-medium text-gray-900">{node.title}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
