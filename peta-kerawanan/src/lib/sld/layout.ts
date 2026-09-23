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
  if (typeof explicit === 'number' && explicit > 0) return explicit;
  if (typeof node.tier === 'number' && node.tier > 0) return node.tier;
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

  // Tier placement order: source bands first.
  tierKeys.forEach((t) => {
    const tierNodes = [...(tiers.get(t) || [])];

    // barycenter of parents (already placed)
    tierNodes.forEach((n) => {
      const pxs = (parentsOf.get(n.id) || [])
        .map((p) => xOf.get(p))
        .filter((v): v is number => typeof v === 'number');
      xOf.set(n.id, pxs.length ? pxs.reduce((a, b) => a + b, 0) / pxs.length : 120 + t * 60);
    });

    // siblings sharing one parent fan out around the parent
    const cluster = new Map<string, ParsedGINode[]>();
    tierNodes.forEach((n) => {
      const p = parentsOf.get(n.id) || [];
      if (p.length === 1) {
        if (!cluster.has(p[0])) cluster.set(p[0], []);
        cluster.get(p[0])!.push(n);
      }
    });
    for (const [pid, sibs] of cluster) {
      if (sibs.length > 1) {
        const px = xOf.get(pid) ?? 150;
        const span = 120;
        sibs.forEach((sib, i) => {
          xOf.set(sib.id, px + (i - (sibs.length - 1) / 2) * span);
        });
      }
    }

    // collision-avoidance sweep
    const ordered = [...tierNodes].sort((a, b) => (xOf.get(a.id) ?? 0) - (xOf.get(b.id) ?? 0));
    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1];
      const curr = ordered[i];
      const prevX = xOf.get(prev.id) ?? 0;
      const currX = xOf.get(curr.id) ?? 0;
      if (currX < prevX + MIN_GAP) xOf.set(curr.id, prevX + MIN_GAP);
    }
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
