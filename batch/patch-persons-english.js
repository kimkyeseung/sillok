const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env from apps/web/.env.local
const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)`, 'm'));
  return match ? match[1].split('#')[0].trim() : null;
}

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function main() {
  console.log('Fetching person translations...');

  // Get all English translations
  const { data: translations, error: tErr } = await supabase
    .from('person_translations')
    .select('person_id, summary, birth_place')
    .eq('locale', 'en');

  if (tErr) { console.error('Failed to fetch translations:', tErr); return; }
  console.log(`Found ${translations.length} translations\n`);

  let success = 0;
  let failed = 0;

  for (const t of translations) {
    const update = {};
    if (t.summary) update.summary = t.summary;
    if (t.birth_place) update.birth_place = t.birth_place;

    if (Object.keys(update).length === 0) continue;

    const { error } = await supabase
      .from('persons')
      .update(update)
      .eq('id', t.person_id);

    if (error) {
      console.error(`  FAIL ${t.person_id}: ${error.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Success: ${success}, Failed: ${failed}`);

  // Verify a few
  const { data: sample } = await supabase
    .from('persons')
    .select('name_ko, name_en, summary, birth_place')
    .order('birth_year')
    .limit(3);
  console.log('\nSample after patch:');
  console.log(JSON.stringify(sample, null, 2));
}

main();
