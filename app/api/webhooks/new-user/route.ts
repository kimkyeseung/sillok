import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { notifyAdmin } from '@/lib/admin-notify';

// ─── POST /api/webhooks/new-user — Supabase Database Webhook (profiles INSERT) ───
// 가입은 auth 트리거(handle_new_user)로 profiles가 생성되어 우리 API를 거치지 않으므로
// Supabase 대시보드의 Database Webhook이 이 라우트를 호출한다.
// 인증: 웹훅 설정의 HTTP 헤더 `x-webhook-secret` = NOTIFY_WEBHOOK_SECRET

const PayloadSchema = z.object({
  type: z.literal('INSERT'),
  table: z.literal('profiles'),
  record: z.object({
    id: z.string().uuid(),
    nickname: z.string().nullable().optional(),
  }),
});

function isAuthorized(request: Request): boolean {
  const expected = process.env.NOTIFY_WEBHOOK_SECRET;
  const given = request.headers.get('x-webhook-secret');
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request))
    return apiError('UNAUTHORIZED', 'Invalid webhook secret.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = PayloadSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Unexpected payload.', 422);

  const { record } = result.data;

  await notifyAdmin({
    title: `새 회원: ${record.nickname ?? record.id.slice(0, 8)}`,
    url: '/admin/members',
  });

  return apiSuccess({ ok: true });
}
