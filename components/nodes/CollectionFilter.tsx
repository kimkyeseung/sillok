'use client';

const TOP_CHIPS = 6;

interface CollectionCount {
  collection: string;
  count: number;
}

/**
 * Custodian filter — museums, temples, city governments ("Private collection" groups individuals).
 * The largest collections are chips; the rest (~600) sit in a select, most-held first.
 */
export default function CollectionFilter({
  collections,
  selected,
  onSelect,
}: {
  collections: CollectionCount[] | undefined;
  selected: string;
  onSelect: (collection: string) => void;
}) {
  if (!collections) return <div className="h-7" aria-hidden />;

  const top = collections.slice(0, TOP_CHIPS);
  const rest = collections.slice(TOP_CHIPS);
  // A selection outside the top list (or filtered out by other filters) still gets a chip
  const selectedChip =
    selected && !top.some((c) => c.collection === selected)
      ? (collections.find((c) => c.collection === selected) ?? {
          collection: selected,
          count: 0,
        })
      : null;

  const chip = (c: CollectionCount) => {
    const active = selected === c.collection;
    return (
      <button
        key={c.collection}
        onClick={() => onSelect(active ? '' : c.collection)}
        aria-pressed={active}
        title={c.collection}
        className={`max-w-[16rem] truncate rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          active
            ? 'bg-amber-100 text-amber-800'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {c.collection}{' '}
        <span className="tabular-nums opacity-60">
          {c.count.toLocaleString()}
        </span>
      </button>
    );
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="Filter by collection"
    >
      <button
        onClick={() => onSelect('')}
        aria-pressed={!selected}
        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          !selected
            ? 'bg-amber-100 text-amber-800'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        All collections
      </button>
      {top.map(chip)}
      {selectedChip && chip(selectedChip)}
      {rest.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && onSelect(e.target.value)}
          aria-label="More collections"
          className="max-w-[14rem] rounded-full border border-gray-200 bg-white py-1 pl-2.5 pr-7 text-xs text-gray-500 focus:border-brand-300 focus:outline-none"
        >
          <option value="">
            More collections ({rest.length.toLocaleString()})…
          </option>
          {rest.map((c) => (
            <option key={c.collection} value={c.collection}>
              {c.collection} ({c.count})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
