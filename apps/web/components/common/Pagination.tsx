'use client';

interface PaginationProps {
  hasNext: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export default function Pagination({
  hasNext,
  loading,
  onLoadMore,
}: PaginationProps) {
  if (!hasNext) return null;

  return (
    <div className="mt-6 flex justify-center">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? '로딩 중...' : '더 보기'}
      </button>
    </div>
  );
}
