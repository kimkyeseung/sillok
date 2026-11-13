import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDiscordPayload, notifyAdmin } from '@/lib/admin-notify';

describe('buildDiscordPayload', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('disables all mentions so user input cannot ping @everyone', () => {
    const payload = buildDiscordPayload({ title: '@everyone hi' });
    expect(payload.allowed_mentions).toEqual({ parse: [] });
  });

  it('turns a relative path into an absolute URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://sillok.kr/');
    const payload = buildDiscordPayload({ title: 't', url: '/admin/reports' });
    expect(payload.embeds[0].url).toBe('https://sillok.kr/admin/reports');
  });

  it('truncates long descriptions and fills empty field values', () => {
    const payload = buildDiscordPayload({
      title: 't',
      description: 'x'.repeat(5000),
      fields: [{ name: 'a', value: '' }],
    });
    expect(payload.embeds[0].description).toHaveLength(1000);
    expect(payload.embeds[0].fields?.[0].value).toBe('-');
  });
});

describe('notifyAdmin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('does nothing without DISCORD_WEBHOOK_URL', async () => {
    vi.stubEnv('DISCORD_WEBHOOK_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await notifyAdmin({ title: 't' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws when Discord is unreachable', async () => {
    vi.stubEnv('DISCORD_WEBHOOK_URL', 'https://discord.example/hook');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(notifyAdmin({ title: 't' })).resolves.toBeUndefined();
  });
});
