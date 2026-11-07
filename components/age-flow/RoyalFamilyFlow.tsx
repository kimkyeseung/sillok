'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PersonAvatar from '@/components/common/PersonAvatar';
import AgeFlowTabs from '@/components/age-flow/AgeFlowTabs';
import DensityBar from '@/components/age-flow/DensityBar';
import RoyalFamilyJump from '@/components/age-flow/RoyalFamilyJump';
import TimelinePanel from '@/components/age-flow/TimelinePanel';
import { ERA_BG_COLORS, useAgeFlow, type AgeFlowInitialData, type AgeFlowPerson } from '@/components/age-flow/useAgeFlow';
import { ROYAL_FAMILY, type RoyalPerson, type RoyalRole } from '@/lib/joseon-royal-family';
import { DYNASTIES } from '@/lib/monarchs';
import { aliveTree, fitScale, resolveLifespans, royalDensity, VIRTUAL_ROOT } from '@/lib/royal-timeline';
import { layoutTree, type TreeInput } from '@/lib/royal-tree';

const NODE_W = 120;
const NODE_H = 128;
const GAP_X = 12;
const LINE_GAP = 10;
const ROW_GAP = 32;
const BOX_PAD = 5;
const PAD = 8;
const SLOT = NODE_W + GAP_X;
/** How childless siblings may wrap, per side of the heir. Each year uses whichever comes out largest. */
const WRAP_OPTIONS = [1, 2, 3, 4, 6];
/** Below this the names are hard to read, so a wide year scrolls sideways instead */
const MIN_WIDTH_SCALE = 0.85;
/** Until the stage is measured (the tree stays hidden until then) */
const DEFAULT_STAGE = { width: 1100, height: 700 };

const ROLE_LABELS: Record<RoyalRole, string> = {
  king: 'King',
  queen: 'Queen',
  consort: 'Consort',
  'crown-prince': 'Crown Prince',
  prince: 'Prince',
  princess: 'Princess',
};

const personById = new Map(ROYAL_FAMILY.map((p) => [p.id, p]));
const NO_TAGS: never[] = [];
const NO_HIDDEN = new Set<string>();
const noop = () => {};

const lineHeight = (lines: number) => lines * (NODE_H + LINE_GAP) - LINE_GAP;

/** Positions for one year. The virtual root's row is dropped: gen 1 becomes the top row. */
function layoutYear(year: number, spans: ReturnType<typeof resolveLifespans>, maxCols: number) {
  const { tree, wives } = aliveTree(year, spans);
  const layout = layoutTree(tree, { maxCols });
  const rowSpans = layout.rowSpans.slice(1);
  const genTops = rowSpans.reduce<number[]>(
    (tops, lines, i) => [...tops, tops[i] + lineHeight(lines) + ROW_GAP],
    [PAD]
  );

  const leftOf = (x: number) => PAD + x * SLOT;
  const topOf = (gen: number, subRow = 0) => genTops[gen - 1] + subRow * (NODE_H + LINE_GAP);
  const position = new Map(layout.positions.map((p) => [p.id, p]));

  const realGroups = layout.groups.filter((group) => group.parentId !== VIRTUAL_ROOT);
  const boxes = realGroups.filter((group) => group.rows > 1);
  const boxed = new Set(boxes.flatMap((group) => group.memberIds));

  const edges: { parent: string; child: string }[] = [];
  const walk = (node: TreeInput) => {
    for (const child of node.children) {
      if (node.id !== VIRTUAL_ROOT) edges.push({ parent: node.id, child: child.id });
      walk(child);
    }
  };
  walk(tree);

  return {
    wives,
    edges,
    boxes,
    boxed,
    position,
    positions: layout.positions.filter((p) => p.id !== VIRTUAL_ROOT),
    leftOf,
    topOf,
    width: PAD * 2 + layout.columns * SLOT - GAP_X,
    height: genTops[genTops.length - 1] - ROW_GAP + PAD,
  };
}

export default function RoyalFamilyFlow({
  initialData,
  initialYear,
}: {
  initialData?: AgeFlowInitialData;
  initialYear: number;
}) {
  const {
    currentYear,
    currentEra,
    allPersons,
    reigns,
    currentKing,
    currentWars,
    isLoading,
    totalHeight,
    minYear,
    maxYear,
    scrollToYear,
    containerRef,
  } = useAgeFlow(initialData, initialYear);

  const recordOf = useMemo(() => new Map(allPersons.map((p) => [p.slug, p])), [allPersons]);
  const spans = useMemo(() => resolveLifespans(Object.fromEntries(recordOf)), [recordOf]);
  const density = useMemo(() => royalDensity(spans, minYear, maxYear), [spans, minYear, maxYear]);

  // Measured below; the wrap that gives the largest cards depends on the screen
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

  // The page column is max-w-5xl, but a family tree needs the whole window. Measured rather than
  // 100vw, which counts a classic scrollbar and would make the page scroll sideways.
  const hostRef = useRef<HTMLDivElement>(null);
  const [bleed, setBleed] = useState<{ left: number; width: number } | null>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () =>
      setBleed({ left: -host.getBoundingClientRect().left, width: document.documentElement.clientWidth });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isLoading]);

  const { yearLayout, scale } = useMemo(() => {
    let best: { yearLayout: ReturnType<typeof layoutYear>; scale: number } | null = null;
    for (const maxCols of WRAP_OPTIONS) {
      const candidate = layoutYear(currentYear, spans, maxCols);
      const fit = fitScale(candidate, stage ?? DEFAULT_STAGE, MIN_WIDTH_SCALE);
      // Strictly larger: on a tie the earlier, narrower option stays and needs less sideways scrolling
      if (!best || fit > best.scale + 0.001) best = { yearLayout: candidate, scale: fit };
    }
    return best!;
  }, [currentYear, spans, stage]);

  const kings = useMemo(() => {
    const monarchs = DYNASTIES.find((d) => d.id === 'joseon')?.monarchs ?? [];
    return monarchs.flatMap((monarch) => {
      const first = reigns.find((r) => r.slug === monarch.slug);
      if (!first || !monarch.slug) return [];
      // In a handover year the predecessor still counts as reigning, so land a year in
      const year = Math.min(first.reign_start + 1, first.reign_end);
      return [{ slug: monarch.slug, name: `${monarch.en} (${first.reign_start})`, year }];
    });
  }, [reigns]);

  const reignSpan = (slug: string | null) => {
    const own = reigns.filter((r) => r.slug === slug);
    return own.length > 0 ? { start: own[0].reign_start, end: own[own.length - 1].reign_end } : null;
  };

  // A year wider than the stage scrolls sideways: bring the reigning monarch back whenever
  // they leave the view, but otherwise leave the visitor's sideways scroll alone
  const kingSlug = currentKing?.slug ?? null;
  const kingPosition = kingSlug ? yearLayout.position.get(kingSlug) : undefined;
  const kingLeft = kingPosition ? yearLayout.leftOf(kingPosition.x) * scale : null;
  useEffect(() => {
    const el = stageRef.current;
    if (!el || kingLeft === null || el.scrollWidth <= el.clientWidth) return;
    const cardWidth = NODE_W * scale;
    const inView = kingLeft >= el.scrollLeft && kingLeft + cardWidth <= el.scrollLeft + el.clientWidth;
    if (!inView) el.scrollLeft = kingLeft + cardWidth / 2 - el.clientWidth / 2;
  }, [kingLeft, scale]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const { positions, position, wives, edges, boxes, boxed, leftOf, topOf, width, height } = yearLayout;

  return (
    <div className="-mx-4 -mt-4">
      <div className="sticky top-14 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2">
          <AgeFlowTabs active="royal-family" />
          <RoyalFamilyJump kings={kings} current={kingSlug} onJump={scrollToYear} />
        </div>
      </div>

      <div ref={containerRef as React.RefObject<HTMLDivElement>} style={{ height: totalHeight }} className="relative">
        <div ref={hostRef} className="sticky top-[96px] h-[calc(100dvh-96px)]">
          <div
            className={`absolute inset-y-0 pb-14 transition-colors duration-1000 md:pb-4 md:pl-52 md:pr-24 ${ERA_BG_COLORS[currentEra]}`}
            style={bleed ?? { left: 0, width: '100%' }}
          >
          <div ref={stageRef} className="h-full overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div
              className={`relative mx-auto ${stage && bleed ? '' : 'invisible'}`}
              style={{ width: width * scale, height: height * scale }}
            >
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{ width, height, transform: `scale(${scale})` }}
              >
                <svg className="absolute inset-0 text-gray-300" width={width} height={height} aria-hidden="true">
                  {boxes.map((box) => {
                    const parent = position.get(box.parentId);
                    if (!parent) return null;
                    const boxWidth = box.cols * SLOT - GAP_X;
                    const yMid = topOf(box.gen) - ROW_GAP / 2;
                    return (
                      <g key={box.memberIds[0]}>
                        <rect
                          x={leftOf(box.x) - BOX_PAD}
                          y={topOf(box.gen) - BOX_PAD}
                          width={boxWidth + BOX_PAD * 2}
                          height={lineHeight(box.rows) + BOX_PAD * 2}
                          rx={14}
                          className="fill-gray-100/70"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        />
                        <path
                          d={`M ${leftOf(parent.x) + NODE_W / 2} ${topOf(parent.gen) + NODE_H} V ${yMid} H ${
                            leftOf(box.x) + boxWidth / 2
                          } V ${topOf(box.gen) - BOX_PAD}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  })}

                  {edges
                    .filter((edge) => !boxed.has(edge.child))
                    .map(({ parent, child }) => {
                      const p = position.get(parent);
                      const c = position.get(child);
                      if (!p || !c) return null;
                      // Dashed: adopted, or a generation in between has died
                      const direct = personById.get(child)?.parentId === parent && !personById.get(child)?.adopted;
                      return (
                        <path
                          key={child}
                          d={`M ${leftOf(p.x) + NODE_W / 2} ${topOf(p.gen) + NODE_H} V ${topOf(c.gen) - ROW_GAP / 2} H ${
                            leftOf(c.x) + NODE_W / 2
                          } V ${topOf(c.gen)}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeDasharray={direct ? undefined : '4 3'}
                        />
                      );
                    })}

                  <g className="text-rose-300" stroke="currentColor" strokeWidth={1.5}>
                    {positions.flatMap((p) =>
                      (wives.get(p.id) ?? []).map((wife, i) => {
                        const from = leftOf(p.x + i) + NODE_W;
                        const y = topOf(p.gen) + NODE_H / 2;
                        return (
                          <g key={wife.id}>
                            <line x1={from} y1={y - 2} x2={from + GAP_X} y2={y - 2} />
                            <line x1={from} y1={y + 2} x2={from + GAP_X} y2={y + 2} />
                          </g>
                        );
                      })
                    )}
                  </g>
                </svg>

                {positions.flatMap((p) => {
                  const person = personById.get(p.id);
                  if (!person) return [];
                  const cards = [{ person, x: p.x, top: topOf(p.gen, p.subRow) }];
                  (wives.get(p.id) ?? []).forEach((wife, i) => {
                    cards.push({ person: wife, x: p.x + i + 1, top: topOf(p.gen) });
                  });
                  return cards.map((card) => (
                    <RoyalCard
                      key={card.person.id}
                      person={card.person}
                      record={card.person.slug ? recordOf.get(card.person.slug) : undefined}
                      year={currentYear}
                      isReigning={!!kingSlug && card.person.slug === kingSlug}
                      reign={reignSpan(card.person.slug)}
                      left={leftOf(card.x)}
                      top={card.top}
                    />
                  ));
                })}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <TimelinePanel
        currentYear={currentYear}
        currentEra={currentEra}
        aliveCount={density[currentYear - minYear] ?? 0}
        currentKing={currentKing}
        currentWars={currentWars}
        fieldTags={NO_TAGS}
        hiddenFieldTags={NO_HIDDEN}
        onFieldTagToggle={noop}
        onYearChange={scrollToYear}
      />
      <DensityBar
        densityMap={density}
        currentYear={currentYear}
        minYear={minYear}
        totalYears={density.length}
        onYearClick={scrollToYear}
      />
    </div>
  );
}

function roleLabel(person: RoyalPerson, year: number, reign: { start: number; end: number } | null, isReigning: boolean) {
  if (person.adopted) return 'Adopted';
  if (person.role !== 'king') return ROLE_LABELS[person.role];
  if (isReigning) return 'King';
  // <=: in a handover year the predecessor is the one counted as reigning
  if (reign && year <= reign.start) return 'Prince';
  return reign ? 'Former King' : 'King';
}

function RoyalCard({
  person,
  record,
  year,
  isReigning,
  reign,
  left,
  top,
}: {
  person: RoyalPerson;
  record?: AgeFlowPerson;
  year: number;
  isReigning: boolean;
  reign: { start: number; end: number } | null;
  left: number;
  top: number;
}) {
  const name = record?.name_en || person.name;
  const birth = record?.birth_year ?? person.birth;
  const death = record?.death_year ?? person.death;
  // Only recorded dates are shown; estimated ones just place the card on the timeline
  const detail = birth ? `Age ${Math.max(year - birth, 1)}` : death ? `? – ${death}` : null;
  const title = person.adopted
    ? `${name} — adopted into this line`
    : person.mother
      ? `${name} — mother: ${person.mother}`
      : name;

  const content = (
    <>
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {record?.thumbnail ? (
          <Image src={record.thumbnail} alt="" fill sizes="44px" className="object-cover" />
        ) : (
          <PersonAvatar name={name} fieldTag="king" size="sm" />
        )}
      </span>
      <span className="mt-1 line-clamp-2 shrink-0 text-center text-xs font-medium leading-tight text-gray-900">
        {name}
      </span>
      {detail && <span className="shrink-0 text-[10px] leading-tight text-gray-500">{detail}</span>}
      <span className="mt-auto text-[10px] font-medium uppercase leading-tight tracking-wide text-gray-400">
        {roleLabel(person, year, reign, isReigning)}
      </span>
    </>
  );

  const className = `animate-card-appear absolute flex flex-col items-center rounded-xl border px-2 py-2 transition-[left,top,background-color,border-color] duration-300 ${
    isReigning ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/40' : 'border-gray-200 bg-white'
  }`;
  const style = { left, top, width: NODE_W, height: NODE_H };

  return record ? (
    <Link
      href={`/persons/${record.slug}`}
      prefetch={false}
      title={title}
      style={style}
      className={`${className} hover:border-brand-300`}
    >
      {content}
    </Link>
  ) : (
    <div title={title} style={style} className={className}>
      {content}
    </div>
  );
}
