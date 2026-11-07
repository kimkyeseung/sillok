'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PersonAvatar from '@/components/common/PersonAvatar';
import AgeFlowTabs from '@/components/age-flow/AgeFlowTabs';
import DensityBar from '@/components/age-flow/DensityBar';
import RoyalFamilyJump from '@/components/age-flow/RoyalFamilyJump';
import Sheet from '@/components/age-flow/Sheet';
import TimelinePanel from '@/components/age-flow/TimelinePanel';
import { ERA_BG_COLORS, useAgeFlow, type AgeFlowInitialData, type AgeFlowPerson } from '@/components/age-flow/useAgeFlow';
import { ROYAL_FAMILY, type RoyalPerson, type RoyalRole } from '@/lib/joseon-royal-family';
import { DYNASTIES } from '@/lib/monarchs';
import {
  aliveTree,
  fitScale,
  groupLabel,
  groupSections,
  groupTitle,
  resolveLifespans,
  royalDensity,
  VIRTUAL_ROOT,
  type RoyalGroup,
} from '@/lib/royal-timeline';
import { layoutTree, type TreeInput } from '@/lib/royal-tree';

const NODE_W = 120;
const NODE_H = 128;
const GAP_X = 12;
const ROW_GAP = 32;
const PAD = 8;
const SLOT = NODE_W + GAP_X;
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

const leftOf = (x: number) => PAD + x * SLOT;
/** The virtual root's row is dropped: generation 1 is the top row */
const topOf = (gen: number) => PAD + (gen - 1) * (NODE_H + ROW_GAP);

/** Only recorded dates are shown; estimated ones just place the person on the timeline */
function lifeDetail(birth: number | null, death: number | null, year: number) {
  if (birth) return `Age ${Math.max(year - birth, 1)}`;
  return death ? `? – ${death}` : null;
}

function layoutYear(year: number, spans: ReturnType<typeof resolveLifespans>) {
  const { tree, wives, groups } = aliveTree(year, spans);
  const layout = layoutTree(tree);

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
    groups,
    edges,
    position: new Map(layout.positions.map((p) => [p.id, p])),
    positions: layout.positions.filter((p) => p.id !== VIRTUAL_ROOT),
    width: PAD * 2 + layout.columns * SLOT - GAP_X,
    height: PAD * 2 + (layout.rows - 1) * (NODE_H + ROW_GAP) - ROW_GAP,
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
  const yearLayout = useMemo(() => layoutYear(currentYear, spans), [currentYear, spans]);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

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

  const scale = fitScale(yearLayout, stage ?? DEFAULT_STAGE, MIN_WIDTH_SCALE);

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
  const kingLeft = kingPosition ? leftOf(kingPosition.x) * scale : null;
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

  const { positions, position, wives, groups, edges, width, height } = yearLayout;
  const openGroup = openGroupId ? groups.get(openGroupId) ?? null : null;

  const renderSlot = (id: string, x: number, gen: number) => {
    const group = groups.get(id);
    if (group) {
      return <GroupCard key={id} group={group} left={leftOf(x)} top={topOf(gen)} onOpen={() => setOpenGroupId(id)} />;
    }
    const person = personById.get(id);
    if (!person) return null;
    return (
      <RoyalCard
        key={id}
        person={person}
        record={person.slug ? recordOf.get(person.slug) : undefined}
        year={currentYear}
        isReigning={!!kingSlug && person.slug === kingSlug}
        reign={reignSpan(person.slug)}
        left={leftOf(x)}
        top={topOf(gen)}
      />
    );
  };

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
                <div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>
                  <svg className="absolute inset-0 text-gray-300" width={width} height={height} aria-hidden="true">
                    {edges.map(({ parent, child }) => {
                      const p = position.get(parent);
                      const c = position.get(child);
                      if (!p || !c) return null;
                      // Dashed: adopted, or a generation in between has died
                      const person = personById.get(child);
                      const direct = person
                        ? person.parentId === parent && !person.adopted
                        : groups.get(child)?.ownerId === parent;
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
                        (wives.get(p.id) ?? []).map((slot, i) => {
                          const from = leftOf(p.x + i) + NODE_W;
                          const y = topOf(p.gen) + NODE_H / 2;
                          return (
                            <g key={slot}>
                              <line x1={from} y1={y - 2} x2={from + GAP_X} y2={y - 2} />
                              <line x1={from} y1={y + 2} x2={from + GAP_X} y2={y + 2} />
                            </g>
                          );
                        })
                      )}
                    </g>
                  </svg>

                  {positions.flatMap((p) => [
                    renderSlot(p.id, p.x, p.gen),
                    ...(wives.get(p.id) ?? []).map((slot, i) => renderSlot(slot, p.x + i + 1, p.gen)),
                  ])}
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

      <Sheet
        open={!!openGroup}
        onClose={() => setOpenGroupId(null)}
        title={openGroup ? `${groupTitle(openGroup)} in ${currentYear}` : ''}
      >
        {openGroup &&
          groupSections(openGroup).map((section) => (
            <section key={section.title ?? 'all'}>
              {section.title && (
                <h3 className="sticky top-0 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-500">{section.title}</h3>
              )}
              <ul className="divide-y divide-gray-100">
                {section.members.map((member) => (
                  <li key={member.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{member.name}</span>
                      <span className="text-[11px] uppercase tracking-wide text-gray-400">{ROLE_LABELS[member.role]}</span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {lifeDetail(member.birth, member.death, currentYear)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </Sheet>
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

const CARD_CLASS =
  'animate-card-appear absolute flex flex-col items-center rounded-xl border px-2 py-2 transition-[left,top,background-color,border-color] duration-300';

function GroupCard({
  group,
  left,
  top,
  onOpen,
}: {
  group: RoyalGroup;
  left: number;
  top: number;
  onOpen: () => void;
}) {
  const count = group.members.length;

  // Births and deaths inside a group would go unseen, so flash the change on the card
  const previous = useRef(count);
  const [delta, setDelta] = useState(0);
  useEffect(() => {
    const change = count - previous.current;
    previous.current = count;
    if (change === 0) return;
    setDelta(change);
    const timer = setTimeout(() => setDelta(0), 1200);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${groupTitle(group)}: view all ${count}`}
      style={{ left, top, width: NODE_W, height: NODE_H }}
      className={`${CARD_CLASS} border-dashed border-gray-300 bg-gray-50 hover:border-brand-300 hover:bg-white`}
    >
      {delta !== 0 && (
        <span
          key={`${count}-${delta}`}
          aria-hidden="true"
          className={`animate-card-appear absolute -right-1.5 -top-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold text-white ${
            delta > 0 ? 'bg-emerald-500' : 'bg-gray-500'
          }`}
        >
          {delta > 0 ? `+${delta}` : `−${-delta}`}
        </span>
      )}
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-600 ring-1 ring-gray-200">
        +{count}
      </span>
      <span className="mt-1 line-clamp-2 shrink-0 text-center text-xs font-medium leading-tight text-gray-900">
        {groupLabel(group)}
      </span>
      <span className="mt-auto text-[10px] font-medium uppercase leading-tight tracking-wide text-brand-600">View all</span>
    </button>
  );
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
  const detail = lifeDetail(record?.birth_year ?? person.birth, record?.death_year ?? person.death, year);
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

  const className = `${CARD_CLASS} ${
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
