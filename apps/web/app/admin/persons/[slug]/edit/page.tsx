'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import PersonForm from '@/components/admin/PersonForm';

interface PersonDetail {
  slug: string;
  name_ko: string;
  name_hanja: string | null;
  name_en: string | null;
  birth_year: number | null;
  death_year: number | null;
  birth_place: string | null;
  summary: string | null;
  thumbnail: string | null;
  is_controversial: boolean;
  is_alive: boolean;
  is_published: boolean;
  person_tags: Array<{ tag_id: string; tags: { id: string; name: string; type: string } }>;
}

export default function AdminEditPersonPage() {
  const params = useParams<{ slug: string }>();
  const { data, isLoading } = useSWR<PersonDetail>(
    params.slug ? `/api/persons/${params.slug}` : null,
    fetcher
  );

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
        Person not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Person</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {data.name_ko}'s information
        </p>
      </div>
      <PersonForm mode="edit" initialData={data} slug={params.slug} />
    </div>
  );
}
