'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal';
import { apiFetch } from '@/lib/fetcher';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/components/common/Toast';
import { SUGGESTION_KINDS, type SuggestionKind } from '@/lib/community';

/** "Suggest a fact" — sends additions or corrections to the editors' review queue */
export default function SuggestFactButton({ slug, personName }: { slug: string; personName: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SuggestionKind>('FACT');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/persons/${slug}/suggestions`, {
        method: 'POST',
        body: JSON.stringify({ kind, content: content.trim(), source_url: sourceUrl.trim() }),
      });
      toast('Thanks! Editors will review your suggestion.');
      setOpen(false);
      setContent('');
      setSourceUrl('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not submit', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => (user ? setOpen(true) : router.push('/login'))}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        ✎ Suggest a fact or correction
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Suggest a fact">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Help improve the page about <span className="font-medium text-gray-900">{personName}</span>. Please
            include a source when you can.
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Type</span>
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value as SuggestionKind)}>
              {SUGGESTION_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Details</span>
            <textarea
              className="input resize-none"
              rows={4}
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What should be added or corrected?"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Source URL (optional)</span>
            <input
              className="input"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://"
            />
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={saving || content.trim().length < 10}
            className="btn-primary w-full disabled:opacity-50"
          >
            {saving ? 'Submitting...' : 'Submit for review'}
          </button>
        </div>
      </Modal>
    </>
  );
}
