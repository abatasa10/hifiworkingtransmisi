import { ParsedGINode, ParsedTransmissionLine } from '../../data/customSLDStore';

export interface BusbarTap {
  id: string;
  connectedNodeId: string;
  x: number;
  position: 'top' | 'bottom';
  label?: string;
}

export interface NodePosition {
  x: number;
  y: number;
  tier: number;
  isWideBusbar?: boolean;
  busbarWidth?: number;
  taps?: BusbarTap[];
}

const ROW_GUTTER = 110;
const TIER_Y_BASE = 90;
const TIER_Y_STEP = 200;
const IBT_Y_OFFSET = 95;

function isSideBusbar(n: ParsedGINode): boolean {
  const a = String(n.assetType || '');
  const nm = (n.name || '').toLowerCase();
  return (
    a !== 'ibt' &&
    a !== 'trafo' &&
    a !== 'pembangkit' &&
    a !== 'beban' &&
    !nm.includes('plt') &&
    !nm.includes('unit') &&
    !nm.includes('trafo') &&
    !nm.includes('ktt')
  );
}

function fallbackTier(node: ParsedGINode, tierMap: Map<string, number> | null | undefined): number {
  const explicit = tierMap?.get(node.id);
  if (typeof explicit === 'number' && explicit >= 0) return explicit;
  if (typeof node.tier === 'number' && node.tier >= 0) return node.tier;
  const a = String(node.assetType || '');
  const n = (node.name || '').toLowerCase();
  const v = String(node.voltage || '');
  if (a === 'pembangkit' || n.includes('plt') || n.includes('pembangkit') || n.includes('unit')) return 1;
  if (a === 'ibt' || a === 'trafo' || v.includes('/')) return 2;
  if (a === 'beban' || n.includes('ktt') || n.includes('konsumen')) return 4;
  if (v.includes('500') || v.includes('275')) return 1;
  return 3;
}

/**
 * Generic engine-style SLD layout.
 *
 * Mirrors the SLD engine rendering rules without any hardcoded subsystem
 * landmarks:
 *   * objects are grouped into 1-based Tier bands from the tier engine,
 *   * IBTs sit half a band below their HV busbar (between Tier t and t+1),
 *   * busbars (3+ connections, non-generator) are drawn as a wide horizontal
 *     bar spanning their attached terminals with per-bay taps,
 *   * X positions follow a parent barycenter then a left-to-right
 *     collision-avoidance sweep (min gap) so nothing overlaps.
 */
export function computeEngineLayout(
  nodes: ParsedGINode[],
  lines: ParsedTransmissionLine[],
  tierMap?: Map<string, number> | null
): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  if (!nodes || nodes.length === 0) return positions;

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  nodes.forEach((n) => {
    parentsOf.set(n.id, []);
    childrenOf.set(n.id, []);
  });
  // Several workbook rows may describe separate sirkit on one corridor.
  // They render separately, but form a single physical connection in the
  // topology, so don't let duplicates create extra busbar bays or weight a
  // barycenter more heavily.
  const physicalLines = [...new Map(
    lines.map((line) => [[line.sourceId, line.targetId].sort().join('___'), line] as const)
  ).values()];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const neighbors = new Map<string, Set<string>>(nodes.map((node) => [node.id, new Set()]));
  physicalLines.forEach((l) => {
    if (!parentsOf.has(l.sourceId) || !parentsOf.has(l.targetId)) return;
    const sT = fallbackTier(nodeById.get(l.sourceId)!, tierMap);
    const tT = fallbackTier(nodeById.get(l.targetId)!, tierMap);
    neighbors.get(l.sourceId)?.add(l.targetId);
    neighbors.get(l.targetId)?.add(l.sourceId);
    if (sT < tT) {
      parentsOf.get(l.targetId)?.push(l.sourceId);
      childrenOf.get(l.sourceId)?.push(l.targetId);
    } else if (tT < sT) {
      parentsOf.get(l.sourceId)?.push(l.targetId);
      childrenOf.get(l.targetId)?.push(l.sourceId);
    } else {
      // same band: keep the from->to direction only for cluster stability
      parentsOf.get(l.targetId)?.push(l.sourceId);
      childrenOf.get(l.sourceId)?.push(l.targetId);
    }
  });

  const tiers = new Map<number, ParsedGINode[]>();
  nodes.forEach((n) => {
    const t = fallbackTier(n, tierMap);
    if (!tiers.has(t)) tiers.set(t, []);
    tiers.get(t)!.push(n);
  });
  const tierKeys = [...tiers.keys()].sort((a, b) => a - b);
  const minTier = tierKeys[0] ?? 1;
  const tierY = (t: number) => TIER_Y_BASE + (t - minTier) * TIER_Y_STEP;

  const halfWidth = new Map<string, number>();
  nodes.forEach((node) => {
    const degree = neighbors.get(node.id)?.size || 0;
    const wide = isSideBusbar(node) && degree >= 3;
    halfWidth.set(node.id, wide ? Math.max(120, degree * 23) : 75);
  });
  const xOf = new Map<string, number>();
  const orderedTiers = new Map<number, ParsedGINode[]>();
  tierKeys.forEach((t) => {
    const ordered = [...(tiers.get(t) || [])].sort((a, b) => a.name.localeCompare(b.name));
    orderedTiers.set(t, ordered);
    const packedWidth = ordered.reduce((sum, node) => sum + 2 * (halfWidth.get(node.id) || 75), 0) + Math.max(0, ordered.length - 1) * ROW_GUTTER;
    let cursor = -packedWidth / 2;
    ordered.forEach((node) => {
      const half = halfWidth.get(node.id) || 75;
      xOf.set(node.id, cursor + half);
      cursor += 2 * half + ROW_GUTTER;
    });
  });

  const repackTier = (tier: number, center = false) => {
    const row = orderedTiers.get(tier) || [];
    const packedWidth = row.reduce((sum, node) => sum + 2 * (halfWidth.get(node.id) || 75), 0) + Math.max(0, row.length - 1) * ROW_GUTTER;
    let cursor = center ? -packedWidth / 2 : 0;
    row.forEach((node) => {
      const half = halfWidth.get(node.id) || 75;
      xOf.set(node.id, cursor + half);
      cursor += 2 * half + ROW_GUTTER;
    });
  };

  // Reorder the layered graph using alternating barycenter sweeps, as in SLD
  // Engine. Considering both sides of each connection reduces crossings when
  // a node has several incoming/outgoing circuits.
  for (let sweep = 0; sweep < 16; sweep++) {
    const rows = sweep % 2 === 0 ? tierKeys : [...tierKeys].reverse();
    rows.forEach((tier) => {
      const row = orderedTiers.get(tier) || [];
      const priorIndex = new Map(row.map((n, i) => [n.id, i]));
      row.sort((a, b) => {
        const ax = [...(neighbors.get(a.id) || [])].map((id) => xOf.get(id)).filter((x): x is number => x !== undefined);
        const bx = [...(neighbors.get(b.id) || [])].map((id) => xOf.get(id)).filter((x): x is number => x !== undefined);
        const ac = ax.length ? ax.reduce((sum, x) => sum + x, 0) / ax.length : xOf.get(a.id) ?? 0;
        const bc = bx.length ? bx.reduce((sum, x) => sum + x, 0) / bx.length : xOf.get(b.id) ?? 0;
        return ac - bc || (priorIndex.get(a.id)! - priorIndex.get(b.id)!);
      });
      repackTier(tier);
    });
  }

  // Center each tier after its order has converged, keeping a fixed minimum
  // bay gap like the engine's width-aware row packing.
  tierKeys.forEach((tier) => repackTier(tier, true));

  // Finalize: wide busbar detection + IBT vertical offset + taps
  nodes.forEach((n) => {
    const t = fallbackTier(n, tierMap);
    const parents = parentsOf.get(n.id) || [];
    const children = childrenOf.get(n.id) || [];
    const total = parents.length + children.length;
    const aT = String(n.assetType || '');
    const isIBT = aT === 'ibt';

    const centerX = xOf.get(n.id) ?? 120;
    let width = (halfWidth.get(n.id) || 75) * 2;
    let x = centerX - width / 2;
    let isWide = isSideBusbar(n) && total >= 3;
    let taps: BusbarTap[] | undefined = undefined;

    if (isWide) {
      taps = [];
      const addTaps = (connectedIds: string[], side: 'top' | 'bottom') => {
        [...connectedIds].sort((a, b) => (xOf.get(a) ?? 0) - (xOf.get(b) ?? 0)).forEach((connectedNodeId, index, sorted) => {
          const xTap = width * (index + 1) / (sorted.length + 1);
          taps?.push({ id: `tap-${side}-${connectedNodeId}`, connectedNodeId, x: xTap, position: side, label: `Bay ${connectedNodeId}` });
        });
      };
      addTaps(parents, 'top');
      addTaps(children, 'bottom');
    }

    const y = isIBT ? tierY(t) + IBT_Y_OFFSET : isWide ? tierY(t) - 40 : tierY(t);

    positions[n.id] = {
      x: Math.round(x),
      y: Math.round(y),
      tier: t,
      isWideBusbar: isWide,
      busbarWidth: Math.round(width),
      taps
    };
  });

  return positions;
}

/** Allocate a separate horizontal routing channel to each uploaded circuit
 * crossing the same pair of tiers. This keeps the long inter-tier runs from
 * stacking on top of one another while leaving within-tier links untouched. */
export interface SLDRoutePoint { x: number; y: number }

export function computeEdgeRouteChannels(
  nodes: ParsedGINode[],
  lines: ParsedTransmissionLine[],
  positions: Record<string, NodePosition>
): Record<string, SLDRoutePoint[]> {
  type Rect = { left: number; top: number; right: number; bottom: number; id: string };
  type Segment = [SLDRoutePoint, SLDRoutePoint];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const rects: Rect[] = nodes.flatMap((node) => {
    const pos = positions[node.id];
    if (!pos) return [];
    const width = pos.isWideBusbar ? pos.busbarWidth || 150 : 150;
    return [{ left: pos.x - 22, right: pos.x + width + 22, top: pos.y - 38, bottom: pos.y + 108, id: node.id }];
  });
  const routePoints: Record<string, SLDRoutePoint[]> = {};
  const used: Segment[] = [];
  const sortedLines = [...lines].sort((a, b) => {
    const span = (line: ParsedTransmissionLine) => Math.abs((positions[line.sourceId]?.tier || 0) - (positions[line.targetId]?.tier || 0));
    return span(b) - span(a) || a.id.localeCompare(b.id);
  });

  const escape = (line: ParsedTransmissionLine, nodeId: string, otherId: string): SLDRoutePoint => {
    const pos = positions[nodeId]!;
    const other = positions[otherId]!;
    const tap = pos.taps?.find((item) => item.connectedNodeId === otherId);
    const width = pos.isWideBusbar ? pos.busbarWidth || 150 : 150;
    const x = pos.x + (tap?.x ?? width / 2);
    let y: number;
    let direction: number;
    if (tap) {
      y = tap.position === 'top' ? pos.y : pos.y + 50;
      direction = tap.position === 'top' ? -1 : 1;
    } else if (pos.tier !== other.tier) {
      direction = pos.tier < other.tier ? 1 : -1;
      y = pos.y + (direction > 0 ? (nodeMap.get(nodeId)?.assetType === 'pembangkit' ? 90 : 50) : 0);
    } else {
      direction = nodeId === line.sourceId ? 1 : -1;
      y = pos.y + (direction > 0 ? 50 : 0);
    }
    return { x, y: y + direction * 66 };
  };
  const blocked = (point: SLDRoutePoint) => rects.some((r) => r.left < point.x && point.x < r.right && r.top < point.y && point.y < r.bottom);
  const clear = (a: SLDRoutePoint, b: SLDRoutePoint) => {
    if (a.x !== b.x && a.y !== b.y) return false;
    return !rects.some((r) => a.x === b.x
      ? r.left < a.x && a.x < r.right && Math.max(Math.min(a.y, b.y), r.top) < Math.min(Math.max(a.y, b.y), r.bottom)
      : r.top < a.y && a.y < r.bottom && Math.max(Math.min(a.x, b.x), r.left) < Math.min(Math.max(a.x, b.x), r.right));
  };
  const simplify = (points: SLDRoutePoint[]) => points.filter((point, index) => {
    if (index === 0 || index === points.length - 1) return true;
    const a = points[index - 1], c = points[index + 1];
    return !((a.x === point.x && point.x === c.x) || (a.y === point.y && point.y === c.y));
  });

  for (const line of sortedLines) {
    const source = positions[line.sourceId], target = positions[line.targetId];
    if (!source || !target) continue;
    const start = escape(line, line.sourceId, line.targetId);
    const end = escape(line, line.targetId, line.sourceId);
    const allX = new Set<number>([start.x, end.x]);
    const allY = new Set<number>([start.y, end.y]);
    for (const rect of rects) {
      [rect.left - 24, rect.right + 24].forEach((x) => allX.add(x));
      [rect.top - 18, rect.bottom + 18].forEach((y) => allY.add(y));
    }
    const minY = Math.min(start.y, end.y, ...rects.map((r) => r.top)) - 96;
    const maxY = Math.max(start.y, end.y, ...rects.map((r) => r.bottom)) + 96;
    for (let y = minY; y <= maxY; y += 32) allY.add(y);
    const minX = Math.min(start.x, end.x, ...rects.map((r) => r.left)) - 96;
    const maxX = Math.max(start.x, end.x, ...rects.map((r) => r.right)) + 96;
    for (let x = minX; x <= maxX; x += 48) { allX.add(x); allX.add(maxX + 96); allX.add(minX - 96); }
    const xs = [...allX].sort((a, b) => a - b), ys = [...allY].sort((a, b) => a - b);
    const ix = new Map(xs.map((x, i) => [x, i])), iy = new Map(ys.map((y, i) => [y, i]));
    const s = [ix.get(start.x)!, iy.get(start.y)!] as const;
    const e = [ix.get(end.x)!, iy.get(end.y)!] as const;
    const key = (i: number, j: number, d: number) => `${i},${j},${d}`;
    const dist = new Map<string, number>([[key(s[0], s[1], 0), 0]]);
    const prev = new Map<string, string>();
    const queue: Array<{ i: number; j: number; d: number; score: number }> = [];
    const push = (item: { i: number; j: number; d: number; score: number }) => {
      queue.push(item);
      let i = queue.length - 1;
      while (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        if (queue[parent].score <= item.score) break;
        queue[i] = queue[parent]; i = parent;
      }
      queue[i] = item;
    };
    const pop = () => {
      const first = queue[0];
      const last = queue.pop()!;
      if (queue.length) {
        let i = 0;
        while (true) {
          const left = i * 2 + 1, right = left + 1;
          if (left >= queue.length) break;
          const child = right < queue.length && queue[right].score < queue[left].score ? right : left;
          if (queue[child].score >= last.score) break;
          queue[i] = queue[child]; i = child;
        }
        queue[i] = last;
      }
      return first;
    };
    push({ i: s[0], j: s[1], d: 0, score: 0 });
    let goal: string | undefined;
    while (queue.length) {
      const current = pop()!;
      const currentKey = key(current.i, current.j, current.d);
      const currentCost = dist.get(currentKey)!;
      if (current.i === e[0] && current.j === e[1]) { goal = currentKey; break; }
      const a = { x: xs[current.i], y: ys[current.j] };
      for (const [ni, nj, direction] of [[current.i - 1, current.j, 0], [current.i + 1, current.j, 0], [current.i, current.j - 1, 1], [current.i, current.j + 1, 1]] as const) {
        if (ni < 0 || ni >= xs.length || nj < 0 || nj >= ys.length) continue;
        const b = { x: xs[ni], y: ys[nj] };
        if ((blocked(b) && !(ni === e[0] && nj === e[1])) || !clear(a, b)) continue;
        let penalty = direction === current.d ? 0 : 42;
        let forbidden = false;
        for (const [c, d] of used) {
          const vertical = a.x === b.x, otherVertical = c.x === d.x;
          if (vertical === otherVertical) {
            const axisGap = vertical ? Math.abs(a.x - c.x) : Math.abs(a.y - c.y);
            const overlap = vertical
              ? Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <= Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y))
              : Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <= Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x));
            if (axisGap < 24 && overlap) { forbidden = true; break; }
          } else penalty += 160;
        }
        if (forbidden) continue;
        const candidate = currentCost + Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + penalty;
        const nextKey = key(ni, nj, direction);
        if (candidate >= (dist.get(nextKey) ?? Infinity)) continue;
        dist.set(nextKey, candidate);
        prev.set(nextKey, currentKey);
        const heuristic = Math.abs(b.x - end.x) + Math.abs(b.y - end.y);
        push({ i: ni, j: nj, d: direction, score: candidate + heuristic });
      }
    }
    if (!goal) continue;
    const reversed: SLDRoutePoint[] = [];
    let cursor: string | undefined = goal;
    while (cursor) {
      const [i, j] = cursor.split(',').map(Number);
      reversed.push({ x: xs[i], y: ys[j] });
      cursor = prev.get(cursor);
    }
    const points = simplify(reversed.reverse());
    routePoints[line.id] = points;
    used.push(...points.slice(1).map((point, index) => [points[index], point] as Segment));
  }
  return routePoints;
}
