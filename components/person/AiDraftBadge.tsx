/** Marks editorial content drafted with AI that an editor has not reviewed yet */
export default function AiDraftBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="Drafted with AI and awaiting editorial review. Spot an error? Let us know in the threads."
      className={`inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 ${className}`}
    >
      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 1l1.9 5.1L17 8l-5.1 1.9L10 15l-1.9-5.1L3 8l5.1-1.9L10 1z" />
      </svg>
      AI draft
    </span>
  );
}
