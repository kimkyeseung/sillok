import dynamic from 'next/dynamic';

const ThreadForm = dynamic(() => import('@/components/thread/ThreadForm'), {
  ssr: false,
});

export default function NewThreadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">New Thread</h1>
      <ThreadForm />
    </div>
  );
}
