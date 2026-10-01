import Link from 'next/link';
import type { TextSegment } from '@/lib/autolink';

/** Text with auto-linked mentions (see lib/autolink.ts) */
export default function LinkedText({ segments }: { segments: TextSegment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        typeof s === 'string' ? (
          s
        ) : (
          <Link key={i} href={s.href} className="text-brand-700 hover:underline">
            {s.text}
          </Link>
        )
      )}
    </>
  );
}
