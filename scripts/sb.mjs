// Service-role Supabase client for agent one-off DB work (skills, ad-hoc checks).
// Usage: node --input-type=module -e "import { sb } from './scripts/sb.mjs'; ..."
// Server-only key from .env.local — never import this from app code.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

export const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

export const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Sillok admin account (author of operator threads/articles) */
export const ADMIN_ID = 'e9517e9f-511d-4b0d-a8e9-ff22a3346758';

/** Print `{ data }` as JSON or exit 1 with the error */
export function out({ data, error }) {
  if (error) {
    console.error('ERROR:', error.message ?? error);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
  return data;
}
