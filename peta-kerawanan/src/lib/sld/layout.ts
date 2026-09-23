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
export function computeEdgeRouteChannels(
  lines: ParsedTransmissionLine[],
  positions: Record<string, NodePosition>
): Record<string, number> {
  const groups = new Map<string, ParsedTransmissionLine[]>();
  for (const line of lines) {
    const source = positions[line.sourceId];
    const target = positions[line.targetId];
    if (!source || !target || source.tier === target.tier || Math.abs(source.y - target.y) < 80) continue;
    const key = [source.tier, target.tier].sort((a, b) => a - b).join(':');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(line);
  }

  const channels: Record<string, number> = {};
  for (const group of groups.values()) {
    group.sort((a, b) => a.id.localeCompare(b.id));
    const endpoints = group.flatMap((line) => [positions[line.sourceId].y, positions[line.targetId].y]);
    const top = Math.min(...endpoints) + 58;
    const bottom = Math.max(...endpoints) - 12;
    const room = Math.max(8, bottom - top);
    group.forEach((line, index) => {
      channels[line.id] = top + room * (index + 1) / (group.length + 1);
    });
  }
  return channels;
}
