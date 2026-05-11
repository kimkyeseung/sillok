/**
 * 스레드 created_at 자연스럽게 분산
 * 최근 4주에 걸쳐 분포, 주말은 적게, 시간대는 09:00~23:00 KST 랜덤
 * 실행: npx tsx scripts/spread-thread-dates.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > -1 && !process.env[t.slice(0, i).trim()])
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateSlots(totalDays: number, totalThreads: number): Date[] {
  const slots: Date[] = [];
  const now = new Date();

  // Create date slots across the range
  for (let dayOffset = totalDays; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // More posts on weekdays, fewer on weekends
    // Gradually increase towards recent days
    const recencyWeight = 1 + (totalDays - dayOffset) / totalDays; // 1.0 → 2.0
    const baseCount = isWeekend ? 1 : 3;
    const count = Math.ceil(baseCount * recencyWeight);

    for (let j = 0; j < count; j++) {
      const hour = 9 + Math.floor(Math.random() * 14); // 09:00~22:59 KST
      const min = Math.floor(Math.random() * 60);
      const sec = Math.floor(Math.random() * 60);
      const slotDate = new Date(date);
      // KST = UTC+9, so subtract 9 hours for UTC storage
      slotDate.setHours(hour - 9, min, sec, 0);
      slots.push(slotDate);
    }
  }

  // Shuffle within each week to add randomness
  slots.sort((a, b) => a.getTime() - b.getTime());

  // Ensure we have exactly totalThreads slots
  if (slots.length >= totalThreads) {
    const step = slots.length / totalThreads;
    const sampled: Date[] = [];
    for (let i = 0; i < totalThreads; i++) {
      const idx = Math.min(Math.floor(i * step), slots.length - 1);
      sampled.push(slots[idx]);
    }
    return sampled;
  }

  // Not enough slots — fill remaining with random times on the last few days
  while (slots.length < totalThreads) {
    const dayOffset = Math.floor(Math.random() * Math.min(7, totalDays));
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const hour = 9 + Math.floor(Math.random() * 14);
    const min = Math.floor(Math.random() * 60);
    date.setHours(hour - 9, min, Math.floor(Math.random() * 60), 0);
    slots.push(date);
  }
  slots.sort((a, b) => a.getTime() - b.getTime());
  return slots;
}

async function main() {
  // Get all threads ordered by created_at ASC (oldest first)
  const { data: threads, error } = await sb
    .from('threads')
    .select('id, title, created_at')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error || !threads) {
    console.error('Failed to fetch threads:', error?.message);
    return;
  }

  console.log(`\n📅 Spreading ${threads.length} threads across 4 weeks...\n`);

  const SPREAD_DAYS = 28; // 4 weeks
  const slots = generateSlots(SPREAD_DAYS, threads.length);

  // Preview first
  console.log('── Preview (first 10 / last 10) ──');
  const preview = [
    ...slots.slice(0, 10).map((d, i) => ({ i, d, title: threads[i]?.title?.slice(0, 50) })),
    ...slots.slice(-10).map((d, i) => ({
      i: threads.length - 10 + i,
      d,
      title: threads[threads.length - 10 + i]?.title?.slice(0, 50),
    })),
  ];
  preview.forEach((p) => {
    const kst = new Date(p.d.getTime() + 9 * 3600000);
    console.log(`  [${p.i}] ${kst.toISOString().slice(0, 16)} KST  ${p.title}`);
  });

  console.log(`\n── Applying... ──\n`);

  let updated = 0;
  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const newDate = slots[i];

    const { error: updateError } = await sb
      .from('threads')
      .update({ created_at: newDate.toISOString() })
      .eq('id', thread.id);

    if (updateError) {
      console.log(`❌ FAIL: ${thread.title.slice(0, 40)} — ${updateError.message}`);
    } else {
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated}/${threads.length} threads`);

  // Show final distribution by date
  console.log('\n── Distribution by date ──');
  const dateCount = new Map<string, number>();
  slots.forEach((d) => {
    const kst = new Date(d.getTime() + 9 * 3600000);
    const key = kst.toISOString().slice(0, 10);
    dateCount.set(key, (dateCount.get(key) || 0) + 1);
  });
  [...dateCount.entries()].sort().forEach(([date, count]) => {
    const day = new Date(date).toLocaleDateString('en', { weekday: 'short' });
    console.log(`  ${date} (${day}): ${'█'.repeat(count)} ${count}`);
  });
}

main().catch(console.error);
