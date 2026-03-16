'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const signupSchema = loginSchema.extend({
  nickname: z
    .string()
    .min(2, 'Nickname must be at least 2 characters.')
    .max(20, 'Nickname must be 20 characters or less.'),
});

function LoginContent() {
  const { signInWithGoogle, signInWithDiscord, signInWithTwitter, signInWithEmail, signUpWithEmail } =
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
          'Sign up complete. Please verify your email to continue.',
        );
        setEmail('');
        setPassword('');
        setNickname('');
      }
    } else {
      const { error: authError } = await signInWithEmail(email, password);
      if (authError) {
        setError('Invalid email or password.');
      } else {
        window.location.href = '/';
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
              S
            </div>
            <span className="text-2xl font-bold text-gray-900">Sillok</span>
          </Link>
          <p className="mt-3 text-sm text-gray-500">
            Welcome to the Korean Historical Figures Archive
          </p>
        </div>

        {/* Card */}
        <div className="card-flat p-6">
          <h2 className="text-center text-lg font-semibold text-gray-900">
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </h2>
          <p className="mt-1 text-center text-xs text-gray-400">
            {mode === 'login'
              ? 'Log in with social account or email'
              : 'Create a new account with email'}
          </p>

          {(urlError || error) && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {error || 'Login failed. Please try again.'}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-center text-sm text-green-600">
              {message}
            </div>
          )}

          {/* Social Login */}
          <div className="mt-6 space-y-3">
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
              Continue with Google
            </button>

            <button
              onClick={signInWithDiscord}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#5865F2] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#fff"
                  d="M14.82 3.76a13.07 13.07 0 0 0-3.28-1.03.05.05 0 0 0-.05.02c-.14.25-.3.58-.41.84a12.1 12.1 0 0 0-3.66 0 8.48 8.48 0 0 0-.42-.84.05.05 0 0 0-.05-.02c-1.15.2-2.24.54-3.28 1.03a.04.04 0 0 0-.02.02C1.76 6.57 1.22 9.28 1.49 11.96a.05.05 0 0 0 .02.04 13.2 13.2 0 0 0 4 2.04.05.05 0 0 0 .06-.02c.31-.42.58-.87.82-1.34a.05.05 0 0 0-.03-.07 8.7 8.7 0 0 1-1.25-.6.05.05 0 0 1 0-.09c.08-.06.17-.13.25-.19a.05.05 0 0 1 .05-.01c2.63 1.21 5.47 1.21 8.07 0a.05.05 0 0 1 .05 0c.08.07.17.13.25.2a.05.05 0 0 1 0 .08c-.4.23-.81.43-1.25.6a.05.05 0 0 0-.03.07c.24.47.52.92.82 1.34a.05.05 0 0 0 .05.02 13.16 13.16 0 0 0 4.01-2.04.05.05 0 0 0 .02-.04c.32-3.34-.54-6.03-2.26-8.18a.04.04 0 0 0-.02-.02zM6.68 10.35c-.7 0-1.28-.65-1.28-1.45s.57-1.45 1.28-1.45c.72 0 1.29.66 1.28 1.45 0 .8-.57 1.45-1.28 1.45zm4.73 0c-.7 0-1.28-.65-1.28-1.45s.56-1.45 1.28-1.45c.72 0 1.29.66 1.28 1.45 0 .8-.56 1.45-1.28 1.45z"
                />
              </svg>
              Continue with Discord
            </button>

            <button
              onClick={signInWithTwitter}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-900"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#fff"
                  d="M10.53 7.87 16.2 1.5h-1.35l-4.93 5.54L5.76 1.5H1.18l5.95 8.37L1.18 16.5h1.35l5.2-5.84 4.15 5.84h4.58l-6.17-8.67.24.04zm-1.84 2.07-.6-.83L3.2 2.5h2.07l3.87 5.35.6.83 5.03 6.95h-2.07l-4.1-5.69z"
                />
              </svg>
              Continue with X
            </button>
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="password"
              placeholder="Password (6+ characters)"
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
                ? 'Processing...'
                : mode === 'login'
                  ? 'Log in with Email'
                  : 'Sign Up'}
            </button>
          </form>

          {/* Mode Switch */}
          <p className="mt-4 text-center text-xs text-gray-500">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setMessage('');
                  }}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setMessage('');
                  }}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  Log In
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
          By continuing, you agree to our{' '}
          <span className="underline cursor-pointer hover:text-gray-600">
            Terms of Service
          </span>{' '}
          and{' '}
          <span className="underline cursor-pointer hover:text-gray-600">
            Privacy Policy
          </span>
          .
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
