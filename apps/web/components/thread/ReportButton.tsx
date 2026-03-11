'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface ReportButtonProps {
  targetType: 'thread' | 'reply' | 'node_comment';
  targetId: string;
}

const REASONS = [
  { value: 'SPAM', label: '스팸' },
  { value: 'ABUSE', label: '욕설/비방' },
  { value: 'HATE_SPEECH', label: '혐오 표현' },
  { value: 'MISINFORMATION', label: '허위 정보' },
  { value: 'OFF_TOPIC', label: '주제 무관' },
  { value: 'OTHER', label: '기타' },
];

export default function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast('신고 사유를 선택해주세요', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          ...(detail ? { detail } : {}),
        }),
      });
      toast('신고가 접수되었습니다');
      setOpen(false);
      setReason('');
      setDetail('');
    } catch {
      toast('로그인이 필요합니다', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        신고
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="신고하기">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  reason === r.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="상세 내용 (선택)"
            rows={3}
            className="input resize-none text-xs"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary text-xs"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !reason}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? '접수 중...' : '신고하기'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
