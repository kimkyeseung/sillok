'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
});

const signupSchema = loginSchema.extend({
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하여야 합니다.'),
});

function LoginContent() {
  const { signInWithKakao, signInWithGoogle, signInWithEmail, signUpWithEmail } =
    useAuth();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const schema = mode === 'signup' ? signupSchema : loginSchema;
    const parsed = schema.safeParse(
      mode === 'signup' ? { email, password, nickname } : { email, password },
    );

    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setSubmitting(true);

    if (mode === 'signup') {
      const { error: authError } = await signUpWithEmail(
        email,
        password,
        nickname,
      );
      if (authError) {
        setError(authError.message);
      } else {
        setMessage(
          '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
        );
        setEmail('');
        setPassword('');
        setNickname('');
      }
    } else {
      const { error: authError } = await signInWithEmail(email, password);
      if (authError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
              실
            </div>
            <span className="text-2xl font-bold text-gray-900">실록</span>
          </Link>
          <p className="mt-3 text-sm text-gray-500">
            한국 인물 아카이브에 오신 것을 환영합니다
          </p>
        </div>

        {/* 카드 */}
        <div className="card-flat p-6">
          <h2 className="text-center text-lg font-semibold text-gray-900">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <p className="mt-1 text-center text-xs text-gray-400">
            {mode === 'login'
              ? '소셜 계정 또는 이메일로 로그인하세요'
              : '이메일로 새 계정을 만드세요'}
          </p>

          {(urlError || error) && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {error || '로그인에 실패했습니다. 다시 시도해주세요.'}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-center text-sm text-green-600">
              {message}
            </div>
          )}

          {/* 소셜 로그인 */}
          <div className="mt-6 space-y-3">
            <button
              onClick={signInWithKakao}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition-colors hover:bg-[#FDD835]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#191919"
                  d="M9 1C4.58 1 1 3.79 1 7.24c0 2.2 1.46 4.13 3.66 5.23l-.93 3.43c-.08.3.26.54.52.37l4.1-2.72c.22.02.43.03.65.03 4.42 0 8-2.79 8-6.24S13.42 1 9 1z"
                />
              </svg>
              카카오로 시작하기
            </button>

            <button
              onClick={signInWithGoogle}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                />
              </svg>
              Google로 시작하기
            </button>
          </div>

          {/* 구분선 */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* 이메일 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            )}
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting
                ? '처리 중...'
                : mode === 'login'
                  ? '이메일로 로그인'
                  : '회원가입'}
            </button>
          </form>

          {/* 모드 전환 */}
          <p className="mt-4 text-center text-xs text-gray-500">
            {mode === 'login' ? (
              <>
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setMessage('');
                  }}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  회원가입
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setMessage('');
                  }}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  로그인
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
          계속 진행하면{' '}
          <span className="underline cursor-pointer hover:text-gray-600">
            서비스 이용약관
          </span>{' '}
          및{' '}
          <span className="underline cursor-pointer hover:text-gray-600">
            개인정보 처리방침
          </span>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
