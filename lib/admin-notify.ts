/**
 * 운영자 알림 — Discord 웹훅으로 가입·인물 요청·신고 등을 알린다.
 * 사용자용 앱 내 알림(lib/notifications.ts)과는 별개.
 *
 * DISCORD_WEBHOOK_URL이 없으면 아무것도 하지 않는다 (로컬 개발 등).
 * 알림 실패가 원래 요청을 실패시키면 안 되므로 절대 throw하지 않는다.
 */

export interface AdminNotice {
  title: string;
  description?: string;
  /** 클릭 시 이동할 경로 (예: '/admin/reports') 또는 전체 URL */
  url?: string;
  fields?: { name: string; value: string }[];
}

const COLOR = 0x8b5cf6;
const TIMEOUT_MS = 3000;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function absoluteUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  return `${base}${url}`;
}

/** Discord 웹훅 payload (순수 함수 — 테스트 대상) */
export function buildDiscordPayload(notice: AdminNotice) {
  return {
    username: '실록 알림',
    // 사용자 입력에 @everyone 등이 있어도 멘션되지 않게
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        title: truncate(notice.title, 256),
        ...(notice.description && {
          description: truncate(notice.description, 1000),
        }),
        ...(notice.url && { url: absoluteUrl(notice.url) }),
        ...(notice.fields?.length && {
          fields: notice.fields.slice(0, 10).map((f) => ({
            name: truncate(f.name, 256),
            value: truncate(f.value || '-', 1024),
            inline: true,
          })),
        }),
        color: COLOR,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function notifyAdmin(notice: AdminNotice): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildDiscordPayload(notice)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error('[admin-notify] Discord 응답 오류', res.status);
  } catch (err) {
    console.error('[admin-notify] 전송 실패', err);
  }
}
