'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const { signInWithKakao, signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

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
            로그인
          </h2>
          <p className="mt-1 text-center text-xs text-gray-400">
            소셜 계정으로 간편하게 시작하세요
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              로그인에 실패했습니다. 다시 시도해주세요.
            </div>
          )}

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
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
          계속 진행하면{' '}
          <span className="underline cursor-pointer hover:text-gray-600">서비스 이용약관</span> 및{' '}
          <span className="underline cursor-pointer hover:text-gray-600">개인정보 처리방침</span>에 동의하게 됩니다.
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
