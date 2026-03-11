import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase-admin';

interface AuthUser {
  id: string;
  email: string;
}

interface AdminUser extends AuthUser {
  role: 'ADMIN';
}

/**
 * API Route에서 JWT 검증 후 유저 반환
 * 실패 시 null 반환 — 호출부에서 apiError 처리
 */
export async function requireUser(
  request: Request
): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) return null;
    return { id: user.id, email: user.email ?? '' };
  }

  // Cookie 기반 인증 (SSR 페이지에서 API 호출 시)
  const cookieStore = cookies();
  const supabase = createServerClient(
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
            // 무시
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { id: user.id, email: user.email ?? '' };
}

/**
 * API Route에서 JWT + ADMIN 권한 검증
 * profiles.role === 'ADMIN' 확인
 * 실패 시 null 반환
 */
export async function requireAdmin(
  request: Request
): Promise<AdminUser | null> {
  const user = await requireUser(request);
  if (!user) return null;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || profile?.role !== 'ADMIN') return null;

  return { ...user, role: 'ADMIN' };
}
