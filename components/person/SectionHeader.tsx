import Link from 'next/link';

/** Section title with an optional "See all" link or custom action */
export default function SectionHeader({
  title,
  href,
  linkLabel = 'See all',
  action,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      <div className="flex items-center gap-2">
        {action}
        {href && (
          <Link href={href} className="text-xs font-medium text-brand-600 hover:text-brand-700">
            {linkLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}
