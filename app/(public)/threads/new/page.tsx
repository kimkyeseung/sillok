'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const ThreadForm = dynamic(() => import('@/components/thread/ThreadForm'), {
  ssr: false,
});

function NewThreadContent() {
  const searchParams = useSearchParams();
  const personId = searchParams.get('person_id') ?? undefined;
  const personName = searchParams.get('person_name') ?? undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">New Thread</h1>
      <ThreadForm personId={personId} personName={personName} />
    </div>
  );
}

export default function NewThreadPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">New Thread</h1>
        <div className="card-flat flex items-center gap-2 p-5 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    }>
      <NewThreadContent />
    </Suspense>
  );
}
