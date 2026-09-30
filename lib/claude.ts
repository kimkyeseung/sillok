import Anthropic from '@anthropic-ai/sdk';

// ─── Shared Claude call with JSON structured output (server only) ───
// Used by AI Drafts (lib/meme-ai.ts) and the Share kit (lib/promo-ai.ts).
// Structured outputs guarantee the JSON shape; callers re-check limits with
// zod (the API doesn't enforce constraints like maxLength).

const MODEL = 'claude-opus-5-5';

export class AiError extends Error {
  constructor(
    public code: 'NOT_CONFIGURED' | 'REFUSED' | 'INVALID_OUTPUT' | 'SKIPPED' | 'API_ERROR',
    message: string,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiError('NOT_CONFIGURED', 'ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  }
  client ??= new Anthropic();
  return client;
}

export async function claudeJson(params: {
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
  schema: Record<string, unknown>;
  effort: 'low' | 'medium' | 'high';
}): Promise<unknown> {
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // On a safety decline the API retries on a fallback model inside the same call
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: params.system,
      messages: [{ role: 'user', content: params.content }],
      output_config: { effort: params.effort, format: { type: 'json_schema', schema: params.schema } },
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      throw new AiError('API_ERROR', `Claude API 오류 ${err.status ?? ''}: ${err.message}`);
    }
    throw err;
  }

  if (response.stop_reason === 'refusal') {
    throw new AiError('REFUSED', 'AI가 요청을 거절했습니다.');
  }
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text;
  if (!text || response.stop_reason === 'max_tokens') {
    throw new AiError('INVALID_OUTPUT', 'AI가 쓸 수 있는 결과를 돌려주지 않았습니다.');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new AiError('INVALID_OUTPUT', 'AI가 올바르지 않은 JSON을 돌려주었습니다.');
  }
}
