import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * 서버 전용 Supabase 클라이언트 (Service Role Key 사용)
 * - API Routes에서 인증/쓰기 요청 처리
 * - SSG (generateStaticParams)에서 빌드 타임 데이터 조회
 * - 클라이언트 컴포넌트에서 절대 import 금지
 *
 * Lazy 초기화: 빌드 타임에 env 없어도 에러 발생하지 않음
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error(
          'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
        );
      }
      _supabaseAdmin = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    return (_supabaseAdmin as unknown as Record<string, unknown>)[
      prop as string
    ];
  },
});
