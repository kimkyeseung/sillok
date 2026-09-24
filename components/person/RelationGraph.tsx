import type { RelationGraph as RelationGraphData } from '@/lib/person-sections';
import type { PersonSummary } from '@/lib/person-page';

const TYPE_COLORS: Record<string, string> = {
  FAMILY: '#fb7185',
  TEACHER: '#60a5fa',
  ALLY: '#4ade80',
  RIVAL: '#f87171',
  LORD_VASSAL: '#a78bfa',
  INFLUENCE: '#fbbf24',
  MEMBER_OF: '#818cf8',
  FOUNDED: '#2dd4bf',
  AFFILIATED: '#94a3b8',
};

const TYPE_LABELS: Record<string, string> = {
  FAMILY: 'Family',
  TEACHER: 'Teacher/Student',
  ALLY: 'Ally',
  RIVAL: 'Rival',
  LORD_VASSAL: 'Lord/Vassal',
  INFLUENCE: 'Influence',
  MEMBER_OF: 'Member',
  FOUNDED: 'Founded',
  AFFILIATED: 'Affiliated',
};

const RADIUS = { 0: 34, 1: 24, 2: 17 } as const;

/** Radial 2-hop relation network (server-rendered SVG, every node links to its page) */
export default function RelationGraph({
  graph,
  persons,
}: {
  graph: RelationGraphData;
  persons: Record<string, PersonSummary>;
}) {
  const byId = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
  const types = Array.from(new Set(graph.edges.map((e) => e.type)));

  return (
    <div>
      <svg
        viewBox={`0 0 ${graph.size} ${graph.size}`}
        className="mx-auto block w-full max-w-[640px]"
        role="img"
        aria-label="Relation network"
      >
        <defs>
          {graph.nodes.map((n) => (
            <clipPath key={n.id} id={`clip-${n.id}`}>
              <circle cx={n.x} cy={n.y} r={RADIUS[n.ring]} />
            </clipPath>
          ))}
        </defs>

        {graph.edges.map((e) => {
          const a = byId[e.from];
          const b = byId[e.to];
          const touchesCenter = a.ring === 0 || b.ring === 0;
          return (
            <line
              key={`${e.from}-${e.to}-${e.type}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={TYPE_COLORS[e.type] ?? '#cbd5e1'}
              strokeWidth={touchesCenter ? 2 : 1.25}
              strokeOpacity={touchesCenter ? 0.9 : 0.5}
            />
          );
        })}

        {graph.nodes.map((n) => {
          const p = persons[n.id];
          if (!p) return null;
          const r = RADIUS[n.ring];
          const label = p.name_en.length > 18 ? `${p.name_en.slice(0, 17)}…` : p.name_en;
          const circle = (
            <>
              <circle
                cx={n.x}
                cy={n.y}
                r={r + 2}
                fill="white"
                stroke={n.ring === 0 ? '#4f46e5' : '#e5e7eb'}
                strokeWidth={n.ring === 0 ? 3 : 1.5}
              />
              {p.thumbnail ? (
                <image
                  href={p.thumbnail}
                  x={n.x - r}
                  y={n.y - r}
                  width={r * 2}
                  height={r * 2}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#clip-${n.id})`}
                />
              ) : (
                <>
                  <circle cx={n.x} cy={n.y} r={r} fill="#f3f4f6" />
                  <text
                    x={n.x}
                    y={n.y + r * 0.3}
                    textAnchor="middle"
                    fontSize={r * 0.8}
                    fontWeight={700}
                    fill="#6b7280"
                  >
                    {p.name_en.charAt(0)}
                  </text>
                </>
              )}
              <text
                x={n.x}
                y={n.y + r + 13}
                textAnchor="middle"
                fontSize={n.ring === 2 ? 10 : 11.5}
                fontWeight={n.ring === 0 ? 700 : 500}
                fill={n.ring === 2 ? '#6b7280' : '#111827'}
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
              >
                {label}
              </text>
            </>
          );

          return n.ring === 0 ? (
            <g key={n.id} aria-current="page">
              {circle}
            </g>
          ) : (
            <a key={n.id} href={`/persons/${p.slug}`} className="cursor-pointer hover:opacity-80">
              <title>{p.name_en}</title>
              {circle}
            </a>
          );
        })}
      </svg>

      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
        {types.map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ backgroundColor: TYPE_COLORS[t] ?? '#cbd5e1' }} />
            {TYPE_LABELS[t] ?? t}
          </li>
        ))}
      </ul>
    </div>
  );
}
