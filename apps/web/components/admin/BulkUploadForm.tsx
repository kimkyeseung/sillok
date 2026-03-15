'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/components/common/Toast';
import { apiFetch } from '@/lib/fetcher';

interface BulkResult {
  slug: string;
  name_ko: string;
  success: boolean;
  error?: string;
}

interface BulkResponse {
  total: number;
  success_count: number;
  fail_count: number;
  results: BulkResult[];
}

const EXAMPLE_JSON = `[
  {
    "slug": "taejo-yi-seong-gye",
    "name_ko": "태조",
    "name_hanja": "太祖",
    "name_en": "Taejo of Joseon",
    "birth_year": 1335,
    "birth_date": "10-27",
    "death_year": 1408,
    "death_date": "06-18",
    "birth_place": "화령부",
    "summary": "조선의 건국자이자 제1대 국왕.",
    "is_controversial": false,
    "is_alive": false,
    "is_published": true,
    "tag_names": ["조선", "왕"],
    "timeline": [
      { "year": 1335, "title": "출생", "description": "고려에서 태어남" },
      { "year": 1392, "title": "조선 건국", "description": "즉위" }
    ]
  }
]`;

export default function BulkUploadForm() {
  const { toast } = useToast();
  const [jsonText, setJsonText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkResponse | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateJson = (text: string) => {
    setParseError(null);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setParseError('JSON은 배열 형태여야 합니다.');
        return null;
      }
      if (parsed.length === 0) {
        setParseError('최소 1건 이상의 인물 데이터가 필요합니다.');
        return null;
      }
      if (parsed.length > 100) {
        setParseError('한 번에 최대 100건까지 등록 가능합니다.');
        return null;
      }
      return parsed;
    } catch {
      setParseError('유효한 JSON 형식이 아닙니다.');
      return null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonText(text);
      validateJson(text);
      setResult(null);
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTextChange = (text: string) => {
    setJsonText(text);
    setResult(null);
    if (text.trim()) {
      validateJson(text);
    } else {
      setParseError(null);
    }
  };

  const handleSubmit = async () => {
    const parsed = validateJson(jsonText);
    if (!parsed) return;

    setUploading(true);
    setResult(null);
    try {
      const data = await apiFetch<BulkResponse>('/api/admin/persons/bulk', {
        method: 'POST',
        body: JSON.stringify(parsed),
      });
      setResult(data);
      if (data.fail_count === 0) {
        toast(`${data.success_count}건 등록 완료`, 'success');
      } else {
        toast(`${data.success_count}건 성공, ${data.fail_count}건 실패`, 'error');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다';
      toast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const parsedCount = (() => {
    try {
      const arr = JSON.parse(jsonText);
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <div className="space-y-4">
      <div className="card-flat p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">JSON 데이터</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setJsonText(EXAMPLE_JSON);
                validateJson(EXAMPLE_JSON);
                setResult(null);
              }}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              예시 보기
            </button>
            <label className="cursor-pointer text-xs text-brand-600 hover:text-brand-700 font-medium">
              파일 선택
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="JSON 배열을 붙여넣으세요..."
          rows={16}
          className="input resize-none font-mono text-xs"
          spellCheck={false}
        />

        {parseError && (
          <p className="text-xs text-red-600">{parseError}</p>
        )}

        {jsonText.trim() && !parseError && (
          <p className="text-xs text-gray-500">
            {parsedCount}건의 인물 데이터가 감지되었습니다.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={uploading || !jsonText.trim() || !!parseError}
          className="btn-primary disabled:opacity-50"
        >
          {uploading ? '등록 중...' : `대량 등록 (${parsedCount}건)`}
        </button>
        {jsonText.trim() && (
          <button
            type="button"
            onClick={() => {
              setJsonText('');
              setParseError(null);
              setResult(null);
            }}
            className="btn-ghost"
          >
            초기화
          </button>
        )}
      </div>

      {result && (
        <div className="card-flat p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">등록 결과</h2>

          <div className="flex gap-4 text-sm">
            <span className="text-gray-600">
              전체: <strong>{result.total}</strong>
            </span>
            <span className="text-green-600">
              성공: <strong>{result.success_count}</strong>
            </span>
            {result.fail_count > 0 && (
              <span className="text-red-600">
                실패: <strong>{result.fail_count}</strong>
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-3 font-medium">상태</th>
                  <th className="py-2 pr-3 font-medium">Slug</th>
                  <th className="py-2 pr-3 font-medium">이름</th>
                  <th className="py-2 font-medium">비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.results.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3">
                      {r.success ? (
                        <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                          성공
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                          실패
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-gray-600">
                      {r.slug}
                    </td>
                    <td className="py-2 pr-3 text-gray-900">{r.name_ko}</td>
                    <td className="py-2 text-gray-500">{r.error ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
