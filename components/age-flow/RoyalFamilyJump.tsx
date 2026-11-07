'use client';

/** The tree is far wider than the screen — jump straight to a monarch's card */
export default function RoyalFamilyJump({ kings }: { kings: { id: string; name: string }[] }) {
  return (
    <label className="min-w-0 flex-1 sm:flex-none">
      <span className="sr-only">Jump to a monarch</span>
      <select
        defaultValue=""
        onChange={(event) => {
          document
            .getElementById(event.target.value)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }}
        className="w-full rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 md:text-sm"
      >
        <option value="" disabled>
          Jump to a monarch
        </option>
        {kings.map((king) => (
          <option key={king.id} value={king.id}>
            {king.name}
          </option>
        ))}
      </select>
    </label>
  );
}
