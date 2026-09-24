/**
 * Validate a post-login redirect target (e.g. `?next=`).
 * Only same-origin absolute paths are allowed — prevents open redirects like
 * `@evil.com`, `//evil.com`, `/\evil.com` or `https://evil.com`.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback;
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(next)) return fallback;
  return next;
}
