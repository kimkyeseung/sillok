import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * SSR 서버 컴포넌트 전용 Supabase 클라이언트
 * - Server Component에서 읽기 요청 처리
 * - 유저 세션 기반 RLS 적용
 */
export function createSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: Record<string, unknown>;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서는 cookie set 불가 — 무시
          }
        },
      },
    }
  );
}
