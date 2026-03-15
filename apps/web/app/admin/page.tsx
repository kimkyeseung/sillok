'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface Stats {
  today_views: number;
  new_users_7d: number;
  new_threads_7d: number;
  pending_requests: number;
  pending_reports: number;
  top_persons_7d: Array<{
    id: string;
    slug: string;
    name_ko: string;
    view_count: number;
  }>;
}

export default function AdminDashboard() {
  const { data, isLoading } = useSWR<Stats>('/api/admin/stats', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-gray-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        Failed to load data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">Overview of Sillok operations at a glance</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Today's Views" value={data.today_views} icon="eye" />
        <StatCard label="New Users (7d)" value={data.new_users_7d} icon="user" />
        <StatCard label="New Threads (7d)" value={data.new_threads_7d} icon="chat" />
        <StatCard
          label="Pending Requests"
          value={data.pending_requests}
          highlight={data.pending_requests > 0}
          icon="plus"
        />
        <StatCard
          label="Pending Reports"
          value={data.pending_reports}
          highlight={data.pending_reports > 0}
          icon="flag"
        />
      </div>

      {/* Popular figures */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Top 5 Popular Figures
        </h2>
        <div className="card-flat overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Figure</th>
                <th className="px-4 py-3 text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.top_persons_7d.map((p, i) => (
                <tr key={p.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.name_ko}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {p.view_count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  icon,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  icon: string;
}) {
  return (
    <div
      className={`card-flat p-4 ${
        highlight ? 'border-red-200 bg-red-50/50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          highlight ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {icon === 'eye' && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
          {icon === 'user' && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
          {icon === 'chat' && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
          {icon === 'plus' && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          )}
          {icon === 'flag' && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          )}
        </div>
      </div>
      <p className={`mt-2 text-2xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
