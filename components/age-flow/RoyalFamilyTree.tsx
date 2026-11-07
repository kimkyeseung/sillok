import Image from 'next/image';
import Link from 'next/link';
import PersonAvatar from '@/components/common/PersonAvatar';
import FamilyTreeScroller from '@/components/person/FamilyTreeScroller';
import { ROYAL_FAMILY, ROYAL_ROOT, type RoyalPerson, type RoyalRole } from '@/lib/joseon-royal-family';
import { layoutTree, type TreeInput } from '@/lib/royal-tree';
import type { RoyalRecord } from '@/lib/royal-family-data';

// Same card and connector look as the person page's FamilyTree
const NODE_W = 128;
const NODE_H = 136;
const GAP_X = 16;
const LINE_GAP = 12;
const ROW_GAP = 44;
const BOX_PAD = 6;
const PAD = 8;
const SLOT = NODE_W + GAP_X;
/** Childless siblings wrap at this many columns on each side of the heir */
const MAX_COLS = 4;

const ROLE_LABELS: Record<RoyalRole, string> = {
  king: 'King',
  queen: 'Queen',
  consort: 'Consort',
  'crown-prince': 'Crown Prince',
  prince: 'Prince',
  princess: 'Princess',
};

const personById = new Map(ROYAL_FAMILY.map((p) => [p.id, p]));
const childrenOf = new Map<string, RoyalPerson[]>();
const wivesOf = new Map<string, RoyalPerson[]>();
for (const person of ROYAL_FAMILY) {
  const [map, key] = person.spouseOf ? [wivesOf, person.spouseOf] : [childrenOf, person.parentId];
  if (key) map.set(key, [...(map.get(key) ?? []), person]);
}

const toInput = (id: string): TreeInput => ({
  id,
  spouses: wivesOf.get(id)?.length ?? 0,
  children: (childrenOf.get(id) ?? []).map((child) => toInput(child.id)),
});

const layout = layoutTree(toInput(ROYAL_ROOT), { maxCols: MAX_COLS });
const position = new Map(layout.positions.map((p) => [p.id, p]));
const boxes = layout.groups.filter((group) => group.rows > 1);
const boxed = new Set(boxes.flatMap((group) => group.memberIds));

const lineHeight = (lines: number) => lines * (NODE_H + LINE_GAP) - LINE_GAP;
const genTops = layout.rowSpans.reduce<number[]>(
  (tops, lines, gen) => [...tops, tops[gen] + lineHeight(lines) + ROW_GAP],
  [PAD]
);
const WIDTH = PAD * 2 + layout.columns * SLOT - GAP_X;
const HEIGHT = genTops[genTops.length - 1] - ROW_GAP + PAD;

const leftOf = (x: number) => PAD + x * SLOT;
const topOf = (gen: number, subRow = 0) => genTops[gen] + subRow * (NODE_H + LINE_GAP);

export default function RoyalFamilyTree({ records }: { records: RoyalRecord[] }) {
  const recordOf = new Map(records.map((r) => [r.slug, r]));
  const root = position.get(ROYAL_ROOT)!;
  const recordFor = (person: RoyalPerson) => (person.slug ? recordOf.get(person.slug) : undefined);

  return (
    <FamilyTreeScroller focusX={leftOf(root.x) + NODE_W / 2}>
      <div className="relative" style={{ width: WIDTH, height: HEIGHT }}>
        <svg className="absolute inset-0 text-gray-300" width={WIDTH} height={HEIGHT} aria-hidden="true">
          {/* A wrapped family: one light box, joined to the parent by one line */}
          {boxes.map((box) => (
            <rect
              key={box.memberIds[0]}
              x={leftOf(box.x) - BOX_PAD}
              y={topOf(box.gen) - BOX_PAD}
              width={box.cols * SLOT - GAP_X + BOX_PAD * 2}
              height={lineHeight(box.rows) + BOX_PAD * 2}
              rx={16}
              className="fill-gray-100/70"
              stroke="currentColor"
              strokeWidth={1.5}
            />
          ))}
          {boxes.map((box) => {
            const parent = position.get(box.parentId)!;
            const x1 = leftOf(parent.x) + NODE_W / 2;
            const yMid = topOf(box.gen) - ROW_GAP / 2;
            const x2 = leftOf(box.x) + (box.cols * SLOT - GAP_X) / 2;
            return (
              <path
                key={box.memberIds[0]}
                d={`M ${x1} ${topOf(parent.gen) + NODE_H} V ${yMid} H ${x2} V ${topOf(box.gen) - BOX_PAD}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              />
            );
          })}

          {layout.positions.map((p) => {
            const x1 = leftOf(p.x) + NODE_W / 2;
            const wives = wivesOf.get(p.id) ?? [];
            return (
              <g key={p.id}>
                {(childrenOf.get(p.id) ?? [])
                  .filter((child) => !boxed.has(child.id))
                  .map((child) => {
                    const c = position.get(child.id)!;
                    return (
                      <path
                        key={child.id}
                        d={`M ${x1} ${topOf(p.gen) + NODE_H} V ${topOf(c.gen) - ROW_GAP / 2} H ${
                          leftOf(c.x) + NODE_W / 2
                        } V ${topOf(c.gen)}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeDasharray={child.adopted ? '4 3' : undefined}
                      />
                    );
                  })}
                {/* Spouses sit to the right of the husband, joined by a double line */}
                {wives.length > 0 && (
                  <g className="text-rose-300" stroke="currentColor" strokeWidth={1.5}>
                    {wives.map((wife, i) => {
                      const from = leftOf(p.x + i) + NODE_W;
                      const y = topOf(p.gen) + NODE_H / 2;
                      return (
                        <g key={wife.id}>
                          <line x1={from} y1={y - 2} x2={from + GAP_X} y2={y - 2} />
                          <line x1={from} y1={y + 2} x2={from + GAP_X} y2={y + 2} />
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {layout.positions.flatMap((p) => {
          const person = personById.get(p.id)!;
          const wives = wivesOf.get(p.id) ?? [];
          return [
            <RoyalCard
              key={person.id}
              person={person}
              record={recordFor(person)}
              left={leftOf(p.x)}
              top={topOf(p.gen, p.subRow)}
            />,
            ...wives.map((wife, i) => (
              <RoyalCard
                key={wife.id}
                person={wife}
                record={recordFor(wife)}
                left={leftOf(p.x + i + 1)}
                top={topOf(p.gen)}
              />
            )),
          ];
        })}
      </div>
    </FamilyTreeScroller>
  );
}

function RoyalCard({
  person,
  record,
  left,
  top,
}: {
  person: RoyalPerson;
  record?: RoyalRecord;
  left: number;
  top: number;
}) {
  const name = record?.name_en || person.name;
  const birth = record?.birth_year ?? person.birth;
  const death = record?.death_year ?? person.death;
  const years = birth || death ? `${birth ?? '?'} – ${death ?? '?'}` : null;
  const isKing = person.role === 'king';
  const title = person.adopted
    ? `${name} — adopted into this line`
    : person.mother
      ? `${name} — mother: ${person.mother}`
      : undefined;

  const content = (
    <>
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {record?.thumbnail ? (
          <Image src={record.thumbnail} alt={name} fill sizes="44px" className="object-cover" />
        ) : (
          <PersonAvatar name={name} fieldTag="king" size="sm" />
        )}
      </span>
      <span className="mt-1.5 line-clamp-2 shrink-0 text-center text-xs font-medium leading-tight text-gray-900">
        {name}
      </span>
      {years && <span className="mt-0.5 shrink-0 text-[10px] text-gray-400">{years}</span>}
      <span className="mt-auto text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {person.adopted ? 'Adopted' : ROLE_LABELS[person.role]}
      </span>
    </>
  );

  const className = `absolute flex scroll-m-24 flex-col items-center rounded-xl border px-2 py-2.5 transition-colors ${
    isKing ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/30' : 'border-gray-200 bg-white'
  }`;
  const style = { left, top, width: NODE_W, height: NODE_H };

  return record ? (
    <Link
      id={person.id}
      href={`/persons/${record.slug}`}
      prefetch={false}
      title={title}
      style={style}
      className={`${className} hover:border-brand-300 hover:bg-brand-50/40`}
    >
      {content}
    </Link>
  ) : (
    <div id={person.id} title={title} style={style} className={className}>
      {content}
    </div>
  );
}
