'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/lib/hooks/use-auth';
import { fetcher } from '@/lib/fetcher';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/persons', label: 'Figures' },
  { href: '/search', label: 'Search' },
  { href: '/articles', label: 'Articles' },
];

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: unreadData } = useSWR<{ count: number }>(
    user ? '/api/notifications/unread-count' : null,
    fetcher,
    { refreshInterval: 30000 }
  );
  const unreadCount = unreadData?.count ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <Image src="/logo.png" alt="Sillok" width={80} height={30} priority />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 sm:flex">
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

        {/* Desktop Auth */}
        <div className="hidden items-center gap-2 sm:flex">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : user ? (
            <>
              <Link href="/collections" className="btn-ghost">
                Collections
              </Link>
              <Link
                href="/notifications"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <button onClick={signOut} className="btn-ghost">
                Log Out
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
              Log In
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 sm:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 sm:hidden">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
          <div className="mt-3 border-t border-gray-100 pt-3">
            {loading ? (
              <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ) : user ? (
              <div className="space-y-1">
                <Link
                  href="/collections"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  Collections
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  Profile
                </Link>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-700"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
