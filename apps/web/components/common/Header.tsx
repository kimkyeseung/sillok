'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';

const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/persons', label: '인물' },
  { href: '/search', label: '검색' },
  { href: '/articles', label: '아티클' },
];

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-8 px-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="실록" width={80} height={30} priority />
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auth */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : user ? (
            <>
              <Link href="/collections" className="btn-ghost">
                컬렉션
              </Link>
              <Link
                href="/notifications"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </Link>
              <button onClick={signOut} className="btn-ghost">
                로그아웃
              </button>
              <Link
                href="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700"
              >
                {user.email?.charAt(0).toUpperCase() ?? 'U'}
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-primary">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
