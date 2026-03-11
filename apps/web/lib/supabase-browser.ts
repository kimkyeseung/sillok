import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * 클라이언트 컴포넌트 전용 Supabase 클라이언트 (싱글턴)
 * - CSR에서 인증 상태 확인, 실시간 구독 등에 사용
 * - ANON_KEY만 사용 (Service Role Key 절대 접근 금지)
 */
export function createSupabaseBrowser(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!url || !key) {
    // 빌드 타임에는 env가 없을 수 있음 — 더미 반환 (CSR에서만 실제 사용)
    return new Proxy({} as SupabaseClient, {
      get() {
        return () => ({ data: null, error: null });
      },
    });
  }

  _client = createBrowserClient(url, key);
  return _client;
}
