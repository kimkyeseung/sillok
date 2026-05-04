import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/persons/age-flow — Lightweight endpoint for age-flow page ───
// Returns only the fields needed by the age-flow visualization.
// Fetches persons, events, and artifacts in parallel from one endpoint.

export async function GET() {
  const [personsResult, eventsResult, artifactsResult] = await Promise.all([
    supabaseAdmin
      .from('persons')
      .select(
        `id, slug, name_en, name_ko, birth_year, death_year, is_alive,
         thumbnail, view_count, follow_count,
         person_tags ( tag_id, tags ( id, name_en, type ) )`
      )
      .eq('is_deleted', false)
      .eq('is_published', true)
      .not('birth_year', 'is', null)
      .order('birth_year', { ascending: true })
      .limit(1000),

    supabaseAdmin
      .from('nodes')
      .select(
        `id, slug, title, metadata,
         person_node_links ( persons:person_id ( id, slug, name_ko, name_en, thumbnail ) )`
      )
      .eq('is_deleted', false)
      .eq('is_published', true)
      .eq('node_type', 'EVENT')
      .order('created_at', { ascending: false })
      .limit(100),

    supabaseAdmin
      .from('nodes')
      .select('id, slug, title, thumbnail, metadata')
      .eq('is_deleted', false)
      .eq('is_published', true)
      .eq('node_type', 'ARTIFACT')
      .not('metadata->created_year', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (personsResult.error || eventsResult.error || artifactsResult.error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load age-flow data' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        persons: personsResult.data,
        events: eventsResult.data,
        artifacts: artifactsResult.data,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
