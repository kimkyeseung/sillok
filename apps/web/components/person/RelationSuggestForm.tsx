'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import Modal from '@/components/common/Modal';

const RELATION_TYPES = [
  { value: 'FAMILY', label: '가족' },
  { value: 'TEACHER', label: '스승/제자' },
  { value: 'ALLY', label: '동맹' },
  { value: 'RIVAL', label: '라이벌' },
  { value: 'LORD_VASSAL', label: '군신' },
  { value: 'INFLUENCE', label: '영향' },
] as const;

interface RelationSuggestFormProps {
  personId: string;
  personName: string;
}

export default function RelationSuggestForm({
  personId,
  personName,
}: RelationSuggestFormProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { id: string; name_ko: string; slug: string }[]
  >([]);
  const [selectedPerson, setSelectedPerson] = useState<{
    id: string;
    name_ko: string;
  } | null>(null);
  const [relationType, setRelationType] = useState('FAMILY');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiFetch<{
        persons: { id: string; name_ko: string; slug: string }[];
      }>(`/api/search?q=${encodeURIComponent(q)}&type=person&limit=5`);
      setSearchResults(
        (res.persons ?? []).filter((p) => p.id !== personId)
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPerson) return;
    setSaving(true);
    try {
      await apiFetch('/api/relations/suggest', {
        method: 'POST',
        body: JSON.stringify({
          person_a_id: personId,
          person_b_id: selectedPerson.id,
          relation_type: relationType,
          description: description.trim() || undefined,
        }),
      });
      toast('관계 제안이 접수되었습니다');
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '오류가 발생했습니다';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPerson(null);
    setRelationType('FAMILY');
    setDescription('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost text-xs"
      >
        <svg
          className="mr-1 inline h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        관계 제안
      </button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="인물 관계 제안"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{personName}</span>
            과(와) 관련된 인물을 제안해주세요.
          </p>

          {/* 인물 검색 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              관련 인물 검색
            </label>
            {selectedPerson ? (
              <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
                <span className="text-sm font-medium text-brand-700">
                  {selectedPerson.name_ko}
                </span>
                <button
                  onClick={() => {
                    setSelectedPerson(null);
                    setSearchQuery('');
                  }}
                  className="ml-auto text-brand-400 hover:text-brand-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="인물 이름을 검색하세요"
                  className="input"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPerson({
                            id: p.id,
                            name_ko: p.name_ko,
                          });
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {p.name_ko}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 관계 유형 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              관계 유형
            </label>
            <div className="flex flex-wrap gap-2">
              {RELATION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setRelationType(t.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    relationType === t.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="관계에 대한 설명을 적어주세요"
              maxLength={500}
              rows={2}
              className="input resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !selectedPerson}
            className="btn-primary w-full disabled:opacity-50"
          >
            {saving ? '제출 중...' : '관계 제안하기'}
          </button>
        </div>
      </Modal>
    </>
  );
}
