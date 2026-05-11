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

const LOCALHOST_ADMIN: AdminUser = {
  id: 'e9517e9f-511d-4b0d-a8e9-ff22a3346758',
  email: 'localhost@dev',
  role: 'ADMIN',
};

function isLocalhostAdminEnabled(request: Request): boolean {
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.ENABLE_LOCALHOST_ADMIN !== 'true'
  ) {
    return false;
  }

  const host = request.headers.get('host') ?? '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

/**
 * Verify JWT in API Route and return user
 * Returns null on failure — caller handles apiError
 */
export async function requireUser(
  request: Request
): Promise<AuthUser | null> {
  if (isLocalhostAdminEnabled(request)) return LOCALHOST_ADMIN;

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

  // Cookie-based auth (for API calls from SSR pages)
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
            // ignore
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
 * Verify JWT + ADMIN role in API Route
 * Checks profiles.role === 'ADMIN'
 * Returns null on failure
 */
export async function requireAdmin(
  request: Request
): Promise<AdminUser | null> {
  if (isLocalhostAdminEnabled(request)) return LOCALHOST_ADMIN;

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
