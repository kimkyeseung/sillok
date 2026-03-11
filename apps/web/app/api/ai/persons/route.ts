import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/ai/persons — AI 인물 자동 추가 (시크릿 키 인증) ───
// 단건: { slug, name_ko, ... }
// 복수: [{ slug, name_ko, ... }, { slug, name_ko, ... }]  (최대 50건)

const TimelineItemSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sort_order: z.number().int().optional(),
});

const AiCreatePersonSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, '영문 소문자, 숫자, 하이픈만 허용'),
  name_ko: z.string().min(1).max(100),
  name_hanja: z.string().max(100).optional(),
  name_en: z.string().max(200).optional(),
  birth_year: z.number().int().optional(),
  birth_date: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .optional(),
  death_year: z.number().int().optional(),
  death_date: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .optional(),
  birth_place: z.string().max(200).optional(),
  summary: z.string().max(5000).optional(),
  thumbnail: z.string().url().optional(),
  is_controversial: z.boolean().default(false),
  is_alive: z.boolean().default(false),
  is_published: z.boolean().default(false),
  tag_names: z.array(z.string().min(1).max(50)).max(10).optional(),
  timeline: z.array(TimelineItemSchema).max(100).optional(),
});

const AiCreatePersonsSchema = z.union([
  AiCreatePersonSchema,
  z.array(AiCreatePersonSchema).min(1).max(50),
]);

type PersonInput = z.infer<typeof AiCreatePersonSchema>;

async function createPerson(input: PersonInput): Promise<{
  success: true;
  person: Record<string, unknown>;
} | {
  success: false;
  slug: string;
  error: string;
}> {
  const { tag_names, timeline, ...personData } = input;

  // persons insert
  const { data: person, error } = await supabaseAdmin
    .from('persons')
    .insert(personData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, slug: input.slug, error: '이미 존재하는 slug입니다.' };
    }
    return { success: false, slug: input.slug, error: '처리 중 오류가 발생했습니다.' };
  }

  // tag_names → tags 조회 → person_tags insert
  if (tag_names && tag_names.length > 0) {
    const { data: tags } = await supabaseAdmin
      .from('tags')
      .select('id, name')
      .in('name', tag_names);

    if (tags && tags.length > 0) {
      const tagLinks = tags.map((tag) => ({
        person_id: person.id,
        tag_id: tag.id,
      }));
      await supabaseAdmin.from('person_tags').insert(tagLinks);
    }
  }

  // timeline bulk insert
  if (timeline && timeline.length > 0) {
    const timelineRows = timeline.map((item, index) => ({
      person_id: person.id,
      year: item.year,
      month: item.month,
      title: item.title,
      description: item.description,
      sort_order: item.sort_order ?? index,
    }));
    await supabaseAdmin.from('person_timeline').insert(timelineRows);
  }

  return { success: true, person };
}

export async function POST(request: Request) {
  // 1. 시크릿 키 인증
  const apiKey = request.headers.get('X-API-Key');
  const secretKey = process.env.AI_API_SECRET_KEY;

  if (!secretKey || !apiKey || apiKey !== secretKey) {
    return apiError('UNAUTHORIZED', 'API 키가 유효하지 않습니다.', 401);
  }

  // 2. 입력 검증
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = AiCreatePersonsSchema.safeParse(body);
  if (!result.success) {
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422, result.error.issues);
  }

  const items = Array.isArray(result.data) ? result.data : [result.data];
  const isBulk = Array.isArray(body);

  // 3. 인물 생성 (순차 처리 — 개별 에러 추적)
  const results = await Promise.all(items.map(createPerson));

  // 4. 응답
  if (!isBulk) {
    const r = results[0];
    if (!r.success) {
      const status = r.error === '이미 존재하는 slug입니다.' ? 409 : 500;
      return apiError('VALIDATION_ERROR', r.error, status);
    }
    return apiSuccess(r.person);
  }

  const created = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return apiSuccess({
    total: items.length,
    created: created.length,
    failed: failed.length,
    results,
  });
}
