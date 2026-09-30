'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import PersonContentEditor from '@/components/admin/PersonContentEditor';

export default function AdminPersonContentPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">페이지 콘텐츠</h1>
          <p className="text-sm text-gray-500">인물 페이지에 표시되는 사실·하이라이트·출처입니다.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/persons/${slug}/edit`} className="btn-ghost text-xs">
            프로필 수정
          </Link>
          <Link href={`/persons/${slug}`} target="_blank" className="btn-ghost text-xs">
            View page ↗
          </Link>
        </div>
      </div>
      <PersonContentEditor slug={slug} />
    </div>
  );
}
