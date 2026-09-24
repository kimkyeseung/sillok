'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PersonTab } from '@/lib/person-sections';

/** Tab bar for person detail pages — each tab is its own URL */
export default function PersonTabs({ tabs }: { tabs: PersonTab[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Person sections"
      className="-mx-4 overflow-x-auto border-b border-gray-200 px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                scroll={false}
                className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {tab.label}
                {tab.count != null && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-semibold ${
                      active ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
