// 유물 노드 전체의 metadata.featured_rank · designation_group_size · group_primary 재계산
// 규칙은 lib/heritage.ts (featuredRank, assignGroups). import/enrich 로 썸네일·그룹이 바뀐 뒤 실행
// 파이프라인: fetch-heritage → translate-heritage → import-heritage → fetch-heritage-images → enrich-heritage → heritage-ranks
// 사용: npx tsx --env-file=.env.local scripts/heritage-ranks.mts [--dry-run]

import { createClient } from '@supabase/supabase-js';
import { assignGroups, featuredRank, type RankInput } from '../lib/heritage';

const DRY = process.argv.includes('--dry-run');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const nodes: RankInput[] = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('nodes')
    .select('id, thumbnail, metadata')
    .eq('node_type', 'ARTIFACT')
    .eq('is_deleted', false)
    .range(from, from + 999);
  if (error) throw error;
  nodes.push(...(data as RankInput[]));
  if (data.length < 1000) break;
}

const groups = assignGroups(nodes);
let changed = 0;
for (const n of nodes) {
  const next: Record<string, unknown> = {
    ...n.metadata,
    featured_rank: featuredRank(n),
    ...groups.get(n.id),
  };
  const dirty = [
    'featured_rank',
    'designation_group_size',
    'group_primary',
  ].some((k) => next[k] !== n.metadata[k]);
  if (!dirty) continue;
  changed++;
  if (DRY) continue;
  const { error } = await supabase
    .from('nodes')
    .update({ metadata: next })
    .eq('id', n.id);
  if (error) throw error;
}

const primaries = [...groups.values()].filter((g) => g.group_primary).length;
const withPhoto = nodes.filter((n) => n.thumbnail).length;
console.log(DRY ? '[dry-run]' : '', {
  nodes: nodes.length,
  changed,
  withPhoto,
  groups: primaries,
  hiddenInGroups: groups.size - primaries,
});
