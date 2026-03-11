'use client';

import PersonForm from '@/components/admin/PersonForm';

export default function AdminNewPersonPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">인물 등록</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          새 인물을 등록합니다
        </p>
      </div>
      <PersonForm mode="create" />
    </div>
  );
}
