/**
 * Tidy tree layout (pure — no DB access).
 *
 * Each person is a block: their own slot followed by one slot per spouse. Children sit
 * one generation below; subtrees only push apart on the generations they share.
 * Positions are in slots: `x` is the person's slot, spouses follow at x+1, x+2, ...
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
}

export interface TreeLayout {
  positions: TreePosition[];
  /** Width in slots */
  columns: number;
  /** Number of generations */
  rows: number;
}

/** Gap between neighbouring blocks, in slots */
const SIBLING_GAP = 0.15;

interface Laid {
  id: string;
  /** Offset from the parent's slot, set when the parent places this subtree */
  offset: number;
  children: Laid[];
  spouses: number;
  /** Per generation (0 = this node): leftmost and rightmost edge, relative to this node's slot */
  left: number[];
  right: number[];
}

/**
 * Children who carry the line on go in the middle, the others split evenly around them
 * (each side keeps its order). Otherwise the lines are held apart by the siblings between
 * them, on every generation below.
 */
function arrange(children: Laid[]): Laid[] {
  const isLone = (child: Laid) => child.children.length === 0 && child.spouses === 0;
  const lone = children.filter(isLone);
  const carriers = children.filter((child) => !isLone(child));
  const half = Math.ceil(lone.length / 2);
  return [...lone.slice(0, half), ...carriers, ...lone.slice(half)];
}

function lay(node: TreeInput): Laid {
  const children = arrange(node.children.map(lay));
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
    const center = (anchors[0].offset + anchors[anchors.length - 1].offset) / 2;
    for (const child of children) child.offset -= center;
    rowLeft.forEach((edge) => left.push(edge - center));
    rowRight.forEach((edge) => right.push(edge - center));
  }

  return { id: node.id, offset: 0, children, spouses: node.spouses, left, right };
}

export function layoutTree(root: TreeInput): TreeLayout {
  const laid = lay(root);
  const minX = Math.min(...laid.left);
  const maxX = Math.max(...laid.right);

  const positions: TreePosition[] = [];
  const stack: { node: Laid; x: number; gen: number }[] = [{ node: laid, x: 0 - minX, gen: 0 }];
  while (stack.length > 0) {
    const { node, x, gen } = stack.pop()!;
    positions.push({ id: node.id, x, gen });
    for (const child of node.children) stack.push({ node: child, x: x + child.offset, gen: gen + 1 });
  }

  return { positions, columns: maxX - minX, rows: laid.left.length };
}
