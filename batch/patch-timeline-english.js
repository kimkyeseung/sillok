const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)`, 'm'));
  return match ? match[1].split('#')[0].trim() : null;
}

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function main() {
  console.log('Fetching timeline translations...');

  const { data: translations, error: tErr } = await supabase
    .from('person_timeline_translations')
    .select('timeline_id, title, description')
    .eq('locale', 'en');

  if (tErr) { console.error('Failed to fetch translations:', tErr); return; }
  console.log(`Found ${translations.length} timeline translations\n`);

  let success = 0;
  let failed = 0;

  for (const t of translations) {
    const update = {};
    if (t.title) update.title = t.title;
    if (t.description) update.description = t.description;

    if (Object.keys(update).length === 0) continue;

    const { error } = await supabase
      .from('person_timeline')
      .update(update)
      .eq('id', t.timeline_id);

    if (error) {
      console.error(`  FAIL ${t.timeline_id}: ${error.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Success: ${success}, Failed: ${failed}`);

  // Verify
  const { data: sample } = await supabase
    .from('person_timeline')
    .select('year, title, description')
    .order('year')
    .limit(5);
  console.log('\nSample after patch:');
  console.log(JSON.stringify(sample, null, 2));
}

main();
