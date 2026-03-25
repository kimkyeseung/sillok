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
  const [selectedPerson, setSelectedPerson] = useState<SelectedPerson | null>(
    personId && personName
      ? { id: personId, slug: '', name_en: personName, thumbnail: null }
      : null
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const resolvedPersonId = selectedPerson?.id ?? personId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedPersonId) {
      toast('Please select a figure', 'error');
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
          person_id: resolvedPersonId,
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

  return (
    <form onSubmit={handleSubmit} className="card-flat p-5 space-y-4">
      {personId && personName ? (
        <div className="flex items-center gap-1.5 text-sm text-brand-600">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-100 text-[10px] font-bold text-brand-700">
            {personName.charAt(0)}
          </span>
          <span className="font-medium">{personName}</span>
          <span className="text-gray-400">— Thread</span>
        </div>
      ) : (
        <PersonPicker value={selectedPerson} onChange={setSelectedPerson} />
      )}

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
          disabled={submitting || !resolvedPersonId || !title.trim() || !content.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post Thread'}
        </button>
      </div>
    </form>
  );
}
