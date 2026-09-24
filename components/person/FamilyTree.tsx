import Link from 'next/link';
import Image from 'next/image';
import PersonAvatar from '@/components/common/PersonAvatar';
import FamilyTreeScroller from '@/components/person/FamilyTreeScroller';
import type { FamilyTree as FamilyTreeData, FamilyTreeNode, FamilyTreeRole } from '@/lib/family-tree';

export interface FamilyTreePerson {
  id: string;
  slug: string;
  name_en: string;
  thumbnail: string | null;
  birth_year: number | null;
  death_year: number | null;
}

interface Props {
  tree: FamilyTreeData;
  persons: Record<string, FamilyTreePerson>;
}

const NODE_W = 128;
const NODE_H = 136;
const GAP_X = 16;
const ROW_GAP = 44;
const PAD = 8;

const ROLE_LABELS: Record<FamilyTreeRole, string> = {
  self: '',
  grandparent: 'Grandparent',
  parent: 'Parent',
  sibling: 'Sibling',
  spouse: 'Spouse',
  child: 'Child',
  grandchild: 'Grandchild',
};

export default function FamilyTree({ tree, persons }: Props) {
  const rows = tree.maxGen - tree.minGen + 1;
  const width = PAD * 2 + tree.columns * (NODE_W + GAP_X) - GAP_X;
  const height = PAD * 2 + rows * (NODE_H + ROW_GAP) - ROW_GAP;

  const left = (n: FamilyTreeNode) => PAD + n.x * (NODE_W + GAP_X);
  const top = (n: FamilyTreeNode) => PAD + (n.gen - tree.minGen) * (NODE_H + ROW_GAP);
  const byId = Object.fromEntries(tree.nodes.map((n) => [n.id, n]));
  const self = tree.nodes.find((n) => n.role === 'self')!;

  return (
    <FamilyTreeScroller focusX={left(self) + NODE_W / 2}>
      <div className="relative mx-auto" style={{ width, height }}>
        <svg
          className="absolute inset-0 text-gray-300"
          width={width}
          height={height}
          aria-hidden="true"
        >
          {tree.edges.map((e) => {
            const a = byId[e.from];
            const b = byId[e.to];
            if (!a || !b) return null;
            const key = `${e.kind}-${e.from}-${e.to}`;

            if (e.kind === 'parent') {
              const x1 = left(a) + NODE_W / 2;
              const y1 = top(a) + NODE_H;
              const x2 = left(b) + NODE_W / 2;
              const y2 = top(b);
              const yMid = y1 + ROW_GAP / 2;
              return (
                <path
                  key={key}
                  d={`M ${x1} ${y1} V ${yMid} H ${x2} V ${y2}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              );
            }

            // Same-row connectors (spouse / sibling) between facing edges
            const [l, r] = left(a) < left(b) ? [a, b] : [b, a];
            const x1 = left(l) + NODE_W;
            const x2 = left(r);
            const y = top(l) + NODE_H / 2;
            return e.kind === 'spouse' ? (
              <g key={key} className="text-rose-300" stroke="currentColor" strokeWidth={1.5}>
                <line x1={x1} y1={y - 2} x2={x2} y2={y - 2} />
                <line x1={x1} y1={y + 2} x2={x2} y2={y + 2} />
              </g>
            ) : (
              <line
                key={key}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke="currentColor"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })}
        </svg>

        {tree.nodes.map((n) => {
          const p = persons[n.id];
          if (!p) return null;
          return (
            <FamilyTreeCard
              key={n.id}
              person={p}
              role={n.role}
              style={{ left: left(n), top: top(n), width: NODE_W, height: NODE_H }}
            />
          );
        })}
      </div>
    </FamilyTreeScroller>
  );
}

function FamilyTreeCard({
  person,
  role,
  style,
}: {
  person: FamilyTreePerson;
  role: FamilyTreeRole;
  style: React.CSSProperties;
}) {
  const isSelf = role === 'self';
  const years =
    person.birth_year || person.death_year
      ? `${person.birth_year ?? '?'} – ${person.death_year ?? '?'}`
      : null;

  const content = (
    <>
      {person.thumbnail ? (
        <Image
          src={person.thumbnail}
          alt={person.name_en}
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
          <PersonAvatar name={person.name_en} size="sm" />
        </div>
      )}
      <span className="mt-1.5 line-clamp-2 shrink-0 text-center text-xs font-medium leading-tight text-gray-900">
        {person.name_en}
      </span>
      {years && <span className="mt-0.5 shrink-0 text-[10px] text-gray-400">{years}</span>}
      {!isSelf && (
        <span className="mt-auto text-[10px] font-medium uppercase tracking-wide text-gray-400">
          {ROLE_LABELS[role]}
        </span>
      )}
    </>
  );

  const base =
    'absolute flex flex-col items-center rounded-xl border px-2 py-2.5 transition-colors';

  if (isSelf) {
    return (
      <div
        style={style}
        aria-current="page"
        className={`${base} border-brand-500 bg-brand-50 ring-2 ring-brand-500/30`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/persons/${person.slug}`}
      style={style}
      className={`${base} border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/40`}
    >
      {content}
    </Link>
  );
}
