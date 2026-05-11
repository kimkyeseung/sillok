'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import ImageUpload from '@/components/common/ImageUpload';
import PersonPicker from '@/components/person/PersonPicker';

interface SelectedPerson {
  id: string;
  slug: string;
  name_en: string;
  thumbnail: string | null;
}

interface ThreadFormProps {
  personId?: string;
  personName?: string;
}

const ALLOWED_VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'tv.naver.com'];

function isValidVideoUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return ALLOWED_VIDEO_HOSTS.some((h) => hostname.includes(h));
  } catch {
    return false;
  }
}

export default function ThreadForm({ personId, personName }: ThreadFormProps) {
  const [persons, setPersons] = useState<SelectedPerson[]>(
    personId && personName
      ? [{ id: personId, slug: '', name_en: personName, thumbnail: null }]
      : []
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const primaryPersonId = persons[0]?.id ?? personId;
  const figureIds = persons.map((p) => p.id);

  const handleAddPerson = (person: SelectedPerson | null) => {
    if (!person) return;
    if (persons.some((p) => p.id === person.id)) return;
    if (persons.length >= 6) return; // 1 primary + 5 related
    setPersons((prev) => [...prev, person]);
  };

  const handleRemovePerson = (id: string) => {
    setPersons((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryPersonId) {
      toast('Please select at least one figure', 'error');
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast('Please enter a title and content', 'error');
      return;
    }
    if (videoUrl && !isValidVideoUrl(videoUrl)) {
      toast('Only YouTube or Naver TV URLs are allowed', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ id: string }>('/api/threads', {
        method: 'POST',
        body: JSON.stringify({
          figures: figureIds,
          title: title.trim(),
          content: content.trim(),
          ...(videoUrl ? { video_url: videoUrl } : {}),
          ...(imageIds.length > 0 ? { image_ids: imageIds } : {}),
        }),
      });
      toast('Thread has been posted');
      router.push(`/threads/${res.id}`);
    } catch {
      toast('Failed to post. Login required.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Fixed person from props (e.g. writing from person page)
  const isFixed = !!(personId && personName);

  return (
    <form onSubmit={handleSubmit} className="card-flat p-5 space-y-4">
      {/* Selected Persons */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-500">
          Figures <span className="text-red-400">*</span>
          <span className="ml-1 font-normal text-gray-400">(up to 6)</span>
        </label>

        {persons.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {persons.map((p, i) => (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  i === 0
                    ? 'border border-brand-200 bg-brand-50 text-brand-700'
                    : 'border border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    i === 0
                      ? 'bg-brand-200 text-brand-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {p.name_en.charAt(0)}
                </span>
                {p.name_en}
                {!(isFixed && i === 0) && (
                  <button
                    type="button"
                    onClick={() => handleRemovePerson(p.id)}
                    className="ml-0.5 text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {persons.length < 6 && (
          <PersonPicker
            value={null}
            onChange={handleAddPerson}
          />
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title"
        maxLength={200}
        className="input text-base font-semibold"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        rows={8}
        maxLength={10000}
        className="input resize-none"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">
            Video URL (Optional)
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="YouTube or Naver TV URL"
            className="input text-xs"
          />
        </div>
      </div>

      <ImageUpload
        bucket="threads"
        maxFiles={3}
        onUpload={(imgs) => setImageIds(imgs.map((i) => i.id))}
      />

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          {content.length.toLocaleString()} / 10,000
        </p>
        <button
          type="submit"
          disabled={submitting || !primaryPersonId || !title.trim() || !content.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post Thread'}
        </button>
      </div>
    </form>
  );
}
