import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { safeRedirectPath } from '@/lib/safe-redirect';

// ─── GET /callback — OAuth callback (Supabase Auth PKCE) ───

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = safeRedirectPath(searchParams.get('next'));

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
            // Ignore in Server Components
          }
        },
      },
    }
  );

  let failure = 'auth_failed';

  // OAuth callback (PKCE flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Code verifier lives in the browser that started the flow —
    // e.g. email confirmation link opened on another device
    if (
      error.code === 'pkce_code_verifier_not_found' ||
      error.code === 'bad_code_verifier' ||
      error.code === 'flow_state_not_found' ||
      error.code === 'flow_state_expired'
    ) {
      failure = 'link_browser_mismatch';
    }
  }

  // Email confirmation (token_hash flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email',
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    if (error.code === 'otp_expired') failure = 'link_expired';
  }

  return NextResponse.redirect(`${origin}/login?error=${failure}`);
}
