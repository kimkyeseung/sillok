'use client';

import { useState } from 'react';
import PersonForm from '@/components/admin/PersonForm';
import BulkUploadForm from '@/components/admin/BulkUploadForm';

export default function AdminNewPersonPage() {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">인물 등록</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          새 인물을 등록합니다
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'single'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          개별 등록
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'bulk'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          대량 등록 (JSON)
        </button>
      </div>

      {mode === 'single' ? <PersonForm mode="create" /> : <BulkUploadForm />}
    </div>
  );
}
