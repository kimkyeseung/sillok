import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Client component Supabase client (singleton)
 * - Used for auth state, real-time subscriptions in CSR
 * - Uses ANON_KEY only (NEVER access Service Role Key)
 */
export function createSupabaseBrowser(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!url || !key) {
    // Env may be missing at build time — return dummy (only used in CSR)
    return new Proxy({} as SupabaseClient, {
      get() {
        return () => ({ data: null, error: null });
      },
    });
  }

  _client = createBrowserClient(url, key);
  return _client;
}
