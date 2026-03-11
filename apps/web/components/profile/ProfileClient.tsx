'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

export default function ProfileClient() {
  const { user, loading } = useAuth();
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowser();
    supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.nickname) setNickname(data.nickname);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-gray-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <span className="text-sm">로딩 중...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-gray-500">로그인이 필요합니다</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: nickname.trim() })
        .eq('id', user.id);
      if (error) throw error;
      toast('프로필이 저장되었습니다');
    } catch {
      toast('저장에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">프로필 설정</h1>

      <div className="card-flat p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
            {user.email?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={20}
            className="input"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !nickname.trim()}
          className="btn-primary w-full disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
