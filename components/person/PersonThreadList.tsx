import Link from 'next/link';
import Image from 'next/image';
import type { PersonThread } from '@/lib/person-page';

export default function PersonThreadList({ threads }: { threads: PersonThread[] }) {
  if (!threads.length)
    return (
      <div className="card-flat py-8 text-center">
        <p className="text-sm text-gray-400">No threads yet — start the first discussion.</p>
      </div>
    );

  return (
    <div className="card-flat divide-y divide-gray-100">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          href={`/threads/${thread.id}`}
          className="block px-4 py-3.5 transition-colors hover:bg-gray-50"
        >
          {thread.image && (
            <div className="mb-2.5 overflow-hidden rounded-lg">
              <Image
                src={thread.image}
                alt=""
                width={640}
                height={288}
                className="h-36 w-full object-cover"
              />
            </div>
          )}
          <p className={`font-medium text-gray-900 ${thread.image ? 'text-base' : 'text-sm'}`}>
            {thread.title}
          </p>
          <div className="mt-1 flex gap-3 text-xs text-gray-400">
            <span>{thread.author ?? 'Anonymous'}</span>
            <span>Likes {thread.like_count}</span>
            <span>Replies {thread.reply_count}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function WriteThreadLink({ personId, personName }: { personId: string; personName: string }) {
  return (
    <Link
      href={`/threads/new?person_id=${personId}&person_name=${encodeURIComponent(personName)}`}
      className="btn-ghost text-xs"
    >
      + Write
    </Link>
  );
}
