'use client';

import { useState, useEffect } from 'react';
import { AgeFlowPerson, RELATION_STYLES } from './useAgeFlow';
import { usePersonRelations, type AgeFlowRelation } from './usePersonDetail';

const EMPTY: AgeFlowRelation[] = [];

interface RelationLinesProps {
  hoveredPersonId: string | null;
  hoveredPersonSlug: string | null;
  visiblePersons: AgeFlowPerson[];
  cardRefs: Map<string, HTMLElement>;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export default function RelationLines({
  hoveredPersonId,
  hoveredPersonSlug,
  visiblePersons,
  cardRefs,
  gridRef,
}: RelationLinesProps) {
  const { data: relations = EMPTY } = usePersonRelations(hoveredPersonSlug);
  const [lines, setLines] = useState<
    Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      cx: number;
      cy: number;
      color: string;
      dashed: boolean;
    }>
  >([]);

  // Calculate line positions
  useEffect(() => {
    if (!hoveredPersonId || relations.length === 0 || !gridRef.current) {
      setLines([]);
      return;
    }

    const gridRect = gridRef.current.getBoundingClientRect();
    const visibleIds = new Set(visiblePersons.map((p) => p.id));

    const sourceEl = cardRefs.get(hoveredPersonId);
    if (!sourceEl) {
      setLines([]);
      return;
    }
    const sourceRect = sourceEl.getBoundingClientRect();
    const sx = sourceRect.left + sourceRect.width / 2 - gridRect.left;
    const sy = sourceRect.top + sourceRect.height / 2 - gridRect.top;

    const newLines: typeof lines = [];

    relations.forEach((rel) => {
      const targetId = rel.other_person?.id ?? rel.other_person_id;
      if (!visibleIds.has(targetId)) return;

      const targetEl = cardRefs.get(targetId);
      if (!targetEl) return;

      const targetRect = targetEl.getBoundingClientRect();
      const tx = targetRect.left + targetRect.width / 2 - gridRect.left;
      const ty = targetRect.top + targetRect.height / 2 - gridRect.top;

      const style = RELATION_STYLES[rel.rel_type] ?? {
        color: '#94a3b8',
        dashed: false,
      };

      // Control point for quadratic bezier — offset perpendicular to line
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      const dx = tx - sx;
      const dy = ty - sy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return; // skip overlapping cards
      const offset = Math.min(40, len * 0.2);
      const cx = mx + (-dy / len) * offset;
      const cy = my + (dx / len) * offset;

      newLines.push({
        key: rel.relation_id,
        x1: sx,
        y1: sy,
        x2: tx,
        y2: ty,
        cx,
        cy,
        color: style.color,
        dashed: style.dashed,
      });
    });

    setLines(newLines);
  }, [hoveredPersonId, relations, visiblePersons, cardRefs, gridRef]);

  if (lines.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 10 }}
    >
      {lines.map((line) => (
        <path
          key={line.key}
          d={`M ${line.x1} ${line.y1} Q ${line.cx} ${line.cy} ${line.x2} ${line.y2}`}
          fill="none"
          stroke={line.color}
          strokeWidth={2}
          strokeOpacity={0.6}
          strokeDasharray={line.dashed ? '6 4' : undefined}
        />
      ))}
    </svg>
  );
}
