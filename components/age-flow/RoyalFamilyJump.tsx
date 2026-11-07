'use client';

/** Follows the reigning monarch; picking one jumps to their accession */
export default function RoyalFamilyJump({
  kings,
  current,
  onJump,
}: {
  kings: { slug: string; name: string; year: number }[];
  current: string | null;
  onJump: (year: number) => void;
}) {
  return (
    <label className="min-w-0 flex-1 sm:flex-none">
      <span className="sr-only">Jump to a monarch</span>
      <select
        value={current ?? ''}
        onChange={(event) => {
          const king = kings.find((k) => k.slug === event.target.value);
          if (king) onJump(king.year);
        }}
        className="w-full rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 md:text-sm"
      >
        <option value="" disabled>
          Jump to a monarch
        </option>
        {kings.map((king) => (
          <option key={king.slug} value={king.slug}>
            {king.name}
          </option>
        ))}
      </select>
    </label>
  );
}
