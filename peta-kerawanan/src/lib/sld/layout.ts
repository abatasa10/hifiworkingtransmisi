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

const MIN_GAP = 210;
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
  physicalLines.forEach((l) => {
    if (!parentsOf.has(l.sourceId) || !parentsOf.has(l.targetId)) return;
    const sT = fallbackTier(nodes.find((n) => n.id === l.sourceId) as ParsedGINode, tierMap);
    const tT = fallbackTier(nodes.find((n) => n.id === l.targetId) as ParsedGINode, tierMap);
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

  const xOf = new Map<string, number>();
  const orderedTiers = new Map<number, ParsedGINode[]>();
  tierKeys.forEach((t) => {
    const ordered = [...(tiers.get(t) || [])].sort((a, b) => a.name.localeCompare(b.name));
    orderedTiers.set(t, ordered);
    ordered.forEach((n, i) => xOf.set(n.id, i * MIN_GAP));
  });

  // Reorder the layered graph using alternating barycenter sweeps, as in SLD
  // Engine. Considering both sides of each connection reduces crossings when
  // a node has several incoming/outgoing circuits.
  for (let sweep = 0; sweep < 16; sweep++) {
    const rows = sweep % 2 === 0 ? tierKeys : [...tierKeys].reverse();
    rows.forEach((tier) => {
      const row = orderedTiers.get(tier) || [];
      const priorIndex = new Map(row.map((n, i) => [n.id, i]));
      row.sort((a, b) => {
        const connectedX = (n: ParsedGINode) => [...(parentsOf.get(n.id) || []), ...(childrenOf.get(n.id) || [])]
          .map((id) => xOf.get(id)).filter((x): x is number => x !== undefined);
        const ax = connectedX(a);
        const bx = connectedX(b);
        const ac = ax.length ? ax.reduce((sum, x) => sum + x, 0) / ax.length : xOf.get(a.id) ?? 0;
        const bc = bx.length ? bx.reduce((sum, x) => sum + x, 0) / bx.length : xOf.get(b.id) ?? 0;
        return ac - bc || (priorIndex.get(a.id)! - priorIndex.get(b.id)!);
      });
      row.forEach((n, i) => xOf.set(n.id, i * MIN_GAP));
    });
  }

  // Center each tier after its order has converged, keeping a fixed minimum
  // bay gap like the engine's width-aware row packing.
  tierKeys.forEach((tier) => {
    const row = orderedTiers.get(tier) || [];
    const shift = Math.max(0, (row.length - 1) * MIN_GAP) / 2;
    row.forEach((n, i) => xOf.set(n.id, i * MIN_GAP - shift));
  });

  // Finalize: wide busbar detection + IBT vertical offset + taps
  nodes.forEach((n) => {
    const t = fallbackTier(n, tierMap);
    const parents = parentsOf.get(n.id) || [];
    const children = childrenOf.get(n.id) || [];
    const total = parents.length + children.length;
    const aT = String(n.assetType || '');
    const isIBT = aT === 'ibt';
    const isBusbarLike = isSideBusbar(n);

    let x = xOf.get(n.id) ?? 120;
    let width = 150;
    let isWide = false;
    let taps: BusbarTap[] | undefined = undefined;

    if (total >= 3 && isBusbarLike) {
      const connected = [...parents, ...children];
      const connXs = connected.map((c) => xOf.get(c)).filter((v): v is number => typeof v === 'number');
      if (connXs.length) {
        const minC = Math.min(...connXs);
        const maxC = Math.max(...connXs);
        x = Math.min(x - 30, minC - 60);
        width = Math.max(240, Math.max(xOf.get(n.id) ?? 0, maxC + 60) - x);
        isWide = true;
        taps = [];
        parents.forEach((p) => {
          const px = xOf.get(p) ?? x + 40;
          const tx = Math.min(width - 24, Math.max(24, px - x));
          taps?.push({ id: `tap-top-${p}`, connectedNodeId: p, x: tx, position: 'top', label: `Bay ${p}` });
        });
        children.forEach((c) => {
          const cx = xOf.get(c) ?? x + 60;
          const tx = Math.min(width - 24, Math.max(24, cx - x));
          taps?.push({ id: `tap-bot-${c}`, connectedNodeId: c, x: tx, position: 'bottom', label: `Bay ${c}` });
        });
      }
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
