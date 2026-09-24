'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { apiFetch, fetcher } from '@/lib/fetcher';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/components/common/Toast';
import { PERSON_STATUSES, type PersonStatus } from '@/lib/community';

interface StatusData {
  counts: Record<PersonStatus, number>;
  mine: PersonStatus[];
}

/** Personal statuses (Studied / Visited / Want to learn) with public counts */
export default function PersonStatusButtons({ slug }: { slug: string }) {
  const key = `/api/persons/${slug}/status`;
  const { data, mutate } = useSWR<StatusData>(key, fetcher);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const toggle = async (status: PersonStatus) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const next = await apiFetch<StatusData>(key, { method: 'POST', body: JSON.stringify({ status }) });
      await mutate(next, { revalidate: false });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {PERSON_STATUSES.map((s) => {
        const active = data?.mine.includes(s.value) ?? false;
        const count = data?.counts[s.value] ?? 0;
        return (
          <button
            key={s.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(s.value)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span aria-hidden="true">{s.icon}</span>
            {s.label}
            {count > 0 && <span className="text-gray-400">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
