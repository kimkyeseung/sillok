import Link from 'next/link';

const TABS = [
  { key: 'timeline', label: 'Timeline', href: '/age-flow' },
  { key: 'royal-family', label: 'Royal Family', href: '/age-flow/royal-family' },
] as const;

/** Age Flow views. Fits inside the sticky bar without changing its height (timeline offsets depend on it). */
export default function AgeFlowTabs({ active }: { active: (typeof TABS)[number]['key'] }) {
  return (
    <nav aria-label="Age Flow views" className="flex shrink-0 items-center rounded-full bg-gray-100 p-0.5">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          prefetch={false}
          aria-current={tab.key === active ? 'page' : undefined}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors md:px-3 md:text-sm ${
            tab.key === active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
