/**
 * Tidy tree layout (pure — no DB access).
 *
 * Each person is a block: their own slot followed by one slot per spouse. Children sit
 * one generation below; subtrees only push apart on the generations they share.
 *
 * With `maxCols`, a parent's childless, unmarried children wrap into groups beside the
 * children who carry the line on. A large family then grows downward, not sideways.
 *
 * Positions are in slots: `x` is the person's slot, spouses follow at x+1, x+2, ...
 * `subRow` is the line within a generation (0 unless a group wraps).
 */

export interface TreeInput {
  id: string;
  spouses: number;
  children: TreeInput[];
}

export interface TreePosition {
  id: string;
  x: number;
  gen: number;
  subRow: number;
}

/** Children wrapped together under `parentId` */
export interface TreeGroup {
  parentId: string;
  memberIds: string[];
  x: number;
  gen: number;
  cols: number;
  rows: number;
}

export interface TreeLayout {
  positions: TreePosition[];
  groups: TreeGroup[];
  /** Width in slots */
  columns: number;
  /** Lines used by each generation */
  rowSpans: number[];
}

/** Gap between neighbouring blocks, in slots */
const SIBLING_GAP = 0.15;

interface Laid {
  id: string;
  /** Offset from the parent's slot, set when the parent places this subtree */
  offset: number;
  children: Laid[];
  spouses: number;
  /** Set on a wrapped group, which stands in for its members */
  members?: string[];
  cols: number;
  /** Per generation (0 = this node): leftmost and rightmost edge, relative to this node's slot */
  left: number[];
  right: number[];
}

const makeGroup = (parentId: string, side: string, members: Laid[], cols: number): Laid => {
  const width = Math.min(cols, members.length);
  return {
    id: `${parentId}:${side}`,
    offset: 0,
    children: [],
    spouses: 0,
    members: members.map((m) => m.id),
    cols: width,
    left: [0],
    right: [width],
  };
};

/**
 * Children who carry the line on go in the middle, the others split evenly around them
 * (each side keeps its order). Otherwise the lines are held apart by the siblings between
 * them, on every generation below.
 */
function arrange(parentId: string, children: Laid[], maxCols: number | undefined): Laid[] {
  const isLone = (child: Laid) => child.children.length === 0 && child.spouses === 0;
  const lone = children.filter(isLone);
  const carriers = children.filter((child) => !isLone(child));
  if (!maxCols) {
    const half = Math.ceil(lone.length / 2);
    return [...lone.slice(0, half), ...carriers, ...lone.slice(half)];
  }
  if (lone.length === 0) return carriers;
  // With no one to stand beside, a family can use both sides' width
  if (carriers.length === 0) return [makeGroup(parentId, 'all', lone, maxCols * 2)];

  const half = Math.ceil(lone.length / 2);
  const before = lone.slice(0, half);
  const after = lone.slice(half);
  return [
    makeGroup(parentId, 'before', before, maxCols),
    ...carriers,
    ...(after.length > 0 ? [makeGroup(parentId, 'after', after, maxCols)] : []),
  ];
}

function lay(node: TreeInput, maxCols: number | undefined): Laid {
  const children = arrange(
    node.id,
    node.children.map((child) => lay(child, maxCols)),
    maxCols
  );
  const left: number[] = [0];
  const right: number[] = [1 + node.spouses];

  if (children.length > 0) {
    const rowLeft: number[] = [];
    const rowRight: number[] = [];
    for (const child of children) {
      let shift = 0;
      if (rowRight.length > 0) {
        shift = -Infinity;
        const shared = Math.min(rowRight.length, child.left.length);
        for (let row = 0; row < shared; row++) {
          shift = Math.max(shift, rowRight[row] + SIBLING_GAP - child.left[row]);
        }
      }
      child.offset = shift;
      child.left.forEach((edge, row) => {
        if (row >= rowLeft.length) rowLeft.push(edge + shift);
        else rowLeft[row] = Math.min(rowLeft[row], edge + shift);
      });
      child.right.forEach((edge, row) => {
        if (row >= rowRight.length) rowRight.push(edge + shift);
        else rowRight[row] = Math.max(rowRight[row], edge + shift);
      });
    }

    // Center the parent over the children who carry the line on, so it runs down the
    // page instead of drifting sideways with each generation's childless siblings
    const carriers = children.filter((child) => child.children.length > 0);
    const anchors = carriers.length > 0 ? carriers : children;
    const middle = (child: Laid) => child.offset + (child.cols - 1) / 2;
    const center = (middle(anchors[0]) + middle(anchors[anchors.length - 1])) / 2;
    for (const child of children) child.offset -= center;
    rowLeft.forEach((edge) => left.push(edge - center));
    rowRight.forEach((edge) => right.push(edge - center));
  }

  return { id: node.id, offset: 0, children, spouses: node.spouses, cols: 1, left, right };
}

export function layoutTree(root: TreeInput, options: { maxCols?: number } = {}): TreeLayout {
  const laid = lay(root, options.maxCols);
  const minX = Math.min(...laid.left);
  const maxX = Math.max(...laid.right);

  const positions: TreePosition[] = [];
  const groups: TreeGroup[] = [];
  const rowSpans: number[] = [];
  const stack: { node: Laid; parentId: string; x: number; gen: number }[] = [
    { node: laid, parentId: '', x: 0 - minX, gen: 0 },
  ];
  while (stack.length > 0) {
    const { node, parentId, x, gen } = stack.pop()!;
    let span = 1;
    if (node.members) {
      const rows = Math.ceil(node.members.length / node.cols);
      span = rows;
      groups.push({ parentId, memberIds: node.members, x, gen, cols: node.cols, rows });
      node.members.forEach((id, i) => {
        positions.push({ id, x: x + (i % node.cols), gen, subRow: Math.floor(i / node.cols) });
      });
    } else {
      positions.push({ id: node.id, x, gen, subRow: 0 });
    }
    rowSpans[gen] = Math.max(rowSpans[gen] ?? 1, span);
    for (const child of node.children) {
      stack.push({ node: child, parentId: node.id, x: x + child.offset, gen: gen + 1 });
    }
  }

  return { positions, groups, columns: maxX - minX, rowSpans };
}
