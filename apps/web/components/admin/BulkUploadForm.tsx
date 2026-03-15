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
        setParseError('JSON must be an array.');
        return null;
      }
      if (parsed.length === 0) {
        setParseError('At least 1 person entry is required.');
        return null;
      }
      if (parsed.length > 100) {
        setParseError('Maximum 100 entries per upload.');
        return null;
      }
      return parsed;
    } catch {
      setParseError('Invalid JSON format.');
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
        toast(`${data.success_count} entries uploaded`, 'success');
      } else {
        toast(`${data.success_count} succeeded, ${data.fail_count} failed`, 'error');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
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
          <h2 className="text-sm font-semibold text-gray-900">JSON Data</h2>
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
              Show Example
            </button>
            <label className="cursor-pointer text-xs text-brand-600 hover:text-brand-700 font-medium">
              Choose File
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
          placeholder="Paste JSON array here..."
          rows={16}
          className="input resize-none font-mono text-xs"
          spellCheck={false}
        />

        {parseError && (
          <p className="text-xs text-red-600">{parseError}</p>
        )}

        {jsonText.trim() && !parseError && (
          <p className="text-xs text-gray-500">
            {parsedCount} person entries detected.
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
          {uploading ? 'Uploading...' : `Bulk Upload (${parsedCount})`}
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
            Reset
          </button>
        )}
      </div>

      {result && (
        <div className="card-flat p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Upload Results</h2>

          <div className="flex gap-4 text-sm">
            <span className="text-gray-600">
              Total: <strong>{result.total}</strong>
            </span>
            <span className="text-green-600">
              Success: <strong>{result.success_count}</strong>
            </span>
            {result.fail_count > 0 && (
              <span className="text-red-600">
                Failed: <strong>{result.fail_count}</strong>
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Slug</th>
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.results.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3">
                      {r.success ? (
                        <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                          OK
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                          Fail
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
