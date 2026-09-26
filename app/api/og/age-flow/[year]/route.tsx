import { ImageResponse } from 'next/og';
import { getAgeFlowData } from '@/lib/age-flow-data';
import { getYearSnapshot, parseYearSegment, type YearSnapshot } from '@/lib/age-flow';

// ─── GET /api/og/age-flow/:year — Share card (1200×630) ───
// Used by /age-flow/[year] and /age-flow?year= (stable URL; file-based
// opengraph-image gets a hashed path inside route groups).
// "1592 · Reigning: Seonjo, age 40 · At war: Imjin War · Yi Sun-sin 47 …"
// No emoji — @vercel/og would fetch emoji images from a CDN at render time.

const size = { width: 1200, height: 630 };

export async function GET(_req: Request, { params }: { params: { year: string } }) {
  const year = parseYearSegment(params.year);
  if (year === null) return new Response('Not found', { status: 404 });

  let snapshot: YearSnapshot | null = null;
  try {
    snapshot = getYearSnapshot(await getAgeFlowData(), year);
  } catch (err) {
    console.error('[og/age-flow] data unavailable:', err); // still render the year
  }

  const name = (p: { name_en: string | null; name_ko: string }) => p.name_en || p.name_ko;
  const figures = snapshot
    ? snapshot.alive.filter((p) => p.id !== snapshot.king?.id).slice(0, 5)
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 60%, #3b2f1a 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 28, color: '#9ca3af' }}>
            {snapshot ? `${snapshot.era} era · ${snapshot.alive.length} figures alive` : 'Age Flow'}
          </div>
          <div style={{ display: 'flex', fontSize: 168, fontWeight: 800, color: '#fbbf24', lineHeight: 1.05 }}>
            {year}
          </div>
          {snapshot?.king && (
            <div style={{ display: 'flex', fontSize: 40, marginTop: 8 }}>
              {`Reigning: ${name(snapshot.king)}, age ${Math.max(1, snapshot.year - snapshot.king.birth_year)}`}
            </div>
          )}
          {snapshot && snapshot.wars.length > 0 && (
            <div style={{ display: 'flex', fontSize: 34, color: '#f87171', marginTop: 8 }}>
              {`At war: ${snapshot.wars.map((w) => w.name).join(' · ')}`}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {figures.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
              {figures.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    fontSize: 26,
                    padding: '8px 18px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.1)',
                  }}
                >
                  {`${name(p)} ${Math.max(1, snapshot!.year - p.birth_year)}`}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', fontSize: 28, color: '#9ca3af' }}>Sillok · Who was alive in Korean history</div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    }
  );
}
