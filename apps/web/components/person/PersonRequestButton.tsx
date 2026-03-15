'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import Modal from '@/components/common/Modal';

export default function PersonRequestButton() {
  const [open, setOpen] = useState(false);
  const [nameKo, setNameKo] = useState('');
  const [nameHanja, setNameHanja] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!nameKo.trim() || reason.trim().length < 10) return;
    setSaving(true);
    try {
      await apiFetch('/api/person-requests', {
        method: 'POST',
        body: JSON.stringify({
          name_ko: nameKo.trim(),
          name_hanja: nameHanja.trim() || undefined,
          reason: reason.trim(),
        }),
      });
      toast('Person request has been submitted');
      setOpen(false);
      setNameKo('');
      setNameHanja('');
      setReason('');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'An error occurred';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost text-xs">
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
            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
          />
        </svg>
        Request Person
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request Person"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Request a person not yet registered on Sillok. It will be
            reviewed by an admin.
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Name (Korean) *
            </label>
            <input
              type="text"
              value={nameKo}
              onChange={(e) => setNameKo(e.target.value)}
              placeholder="e.g. Yi Sun-sin"
              maxLength={100}
              className="input"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Hanja Name (Optional)
            </label>
            <input
              type="text"
              value={nameHanja}
              onChange={(e) => setNameHanja(e.target.value)}
              placeholder="e.g. 李舜臣"
              maxLength={100}
              className="input"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Reason * (10+ characters)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why this person should be registered"
              maxLength={2000}
              rows={4}
              className="input resize-none"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {reason.length}/2000
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              saving || !nameKo.trim() || reason.trim().length < 10
            }
            className="btn-primary w-full disabled:opacity-50"
          >
            {saving ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </Modal>
    </>
  );
}
