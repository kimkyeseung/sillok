'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfileClient() {
  const { user, loading } = useAuth();
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowser();
    supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.nickname) setNickname(data.nickname);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-gray-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-gray-500">Login required</p>
      </div>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast('JPG, PNG, WebP only', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast('File must be 5MB or less', 'error');
      return;
    }

    setUploading(true);
    try {
      // 1. Get presigned URL
      const { upload_url, path } = await apiFetch<{
        upload_url: string;
        path: string;
      }>('/api/upload/presigned-url', {
        method: 'POST',
        body: JSON.stringify({
          bucket: 'avatars',
          content_type: file.type,
          file_size: file.size,
        }),
      });

      // 2. Upload file
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      // 3. Build public URL & update profile
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
      const supabase = createSupabaseBrowser();
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarUrl(publicUrl);
      toast('Avatar updated');
    } catch {
      toast('Failed to upload', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

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
      toast('Profile saved');
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const initials = (nickname || user.email?.charAt(0) || 'U').charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Profile Settings</h1>

      <div className="card-flat p-5 space-y-4">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-brand-100 text-xl font-bold text-brand-700">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
              <svg
                className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            </div>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-1 text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Change avatar'}
            </button>
          </div>
        </div>

        {/* Nickname */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter Nickname"
            maxLength={20}
            className="input"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !nickname.trim()}
          className="btn-primary w-full disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
