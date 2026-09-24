import { ParsedGINode, ParsedTransmissionLine } from '../../data/customSLDStore';
import { EngineRisk } from './types';
import { NodePosition } from './layout';

// ===========================================================================
// Engine SLD (port of opsys-ui useSldLayout — framework-free).
// Geometry constants, P2B voltage colors and orthogonal routing copied 1:1
// so the React canvas draws exactly like the latest SLD engine design:
// busbar per Tier, voltage colors (500 kV blue, 150 kV red), IBT 3-circle
// wheels, bay stubs, PMT boxes, numbered risk pins, tier guide lines.
// ===========================================================================

export const ENG_SLD = {
  sourceY: 80,
  tierTop: 150,
  tierGap: 220,
  busStroke: 6,
  wireStroke: 2.2,
  pitch: 14,
  pmt: 10,
  bayLen: 42,
  padX: 60
} as const;

export const engBusY = (tier: number): number =>
  tier === 0 ? ENG_SLD.sourceY : ENG_SLD.tierTop + ENG_SLD.tierGap * (tier - 1) + 60;

export const engTierLineY = (tier: number): number => ENG_SLD.tierTop + ENG_SLD.tierGap * (tier - 1);

/** P2B voltage colors: 500 kV blue, 150 kV red, anything else yellow. */
export function engVoltageHex(kv: number | null | undefined): string {
  const v = kv ?? 0;
  if (v >= 500) return '#0047AB';
  if (v >= 150) return '#C00000';
  return '#E0A400';
}

export type EngSldStatus = 'ENERGIZED' | 'DE_ENERGIZED' | 'PLANNED';
export type EngSldNodeType = 'GITET' | 'GI' | 'GIS' | 'GENERATING_UNIT' | 'BEBAN';
export type EngSldRole = 'SOURCE' | 'CORE' | 'BOUNDARY';

export interface EngSldNode {
  code: string;
  label: string;
  name: string;
  type: EngSldNodeType;
  voltageKv: number;
  role: EngSldRole;
  tier: number;
  status: EngSldStatus;
  x: number;
  halfWidth: number;
  labelTop: boolean;
}

export interface EngSldCircuit {
  id: string;
  /** `${from}-${to}` so risk pins resolve like the engine. */
  code: string;
  name: string;
  type: 'SUTT' | 'SKTT';
  voltageKv: number;
  from: string;
  to: string;
  fromPort: number;
  toPort: number;
  circuitCount: number;
  status: EngSldStatus;
  loadingPct: number;
}

export interface EngSldIbt {
  id: string;
  /** `${from}-${to}` so TRANSFORMER risk pins resolve. */
  code: string;
  name: string;
  from: string;
  to: string;
  x: number;
  status: EngSldStatus;
}

export interface EngSldBay {
  id: string;
  code: string;
  name: string;
  busCode: string;
  x: number;
  circuitCount: number;
  status: EngSldStatus;
}

export interface EngSldPin {
  seq: number;
  kind: 'SUBSTATION' | 'CIRCUIT' | 'TRANSFORMER';
  code: string;
}

export interface EngSldGraph {
  id: string;
  title: string;
  viewName: string;
  tierCount: number;
  nodes: EngSldNode[];
  circuits: EngSldCircuit[];
  ibts: EngSldIbt[];
  bays: EngSldBay[];
  pins: EngSldPin[];
}

// ---- view-model helpers ----------------------------------------------------

const kvOf = (label: string | undefined, fallback: number): number => {
  const m = String(label || '').match(/(\d[\d.,]*)/);
  if (!m) return fallback;
  const n = Number(m[1].replace(/,/g, '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
};

const opStatus = (v: string | undefined): EngSldStatus =>
  v === 'Rencana' ? 'PLANNED' : 'ENERGIZED';

const shortLabel = (code: string | undefined, name: string): string => {
  const c = code || '';
  // real GI codes (SLRDA, PENI, MCCI5, DEPOK) win, like the book figures
  if (c.length >= 3 && c.length <= 6 && /^[A-Z0-9]{3,6}$/.test(c.toUpperCase())) return c.toUpperCase();
  const stripped = (name || '').replace(/\s*\(.*?\)\s*/g, '').trim();
  if (stripped.length > 0 && stripped.length <= 16) return stripped;
  if (c.length > 0 && c.length <= 8) return c.toUpperCase();
  return stripped.slice(0, 26) || c;
};

const bebanLabel = (name: string, code: string): string => {
  const s = (name || '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/^\s*konsumen\s+/i, '')
    .trim();
  return s.slice(0, 24) || code.toUpperCase();
};

const cleanId = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const findTapPort = (pos: NodePosition | undefined, otherId: string): number => {
  if (!pos?.isWideBusbar || !pos.taps?.length) return 0;
  const want = cleanId(otherId);
  const tap = pos.taps.find((t) => {
    const c = cleanId(t.connectedNodeId);
    return want.includes(c) || c.includes(want);
  });
  if (!tap) return 0;
  const width = pos.busbarWidth || 150;
  const port = pos.x + tap.x - (pos.x + width / 2);
  const half = width / 2;
  return Math.max(-(half - 10), Math.min(half - 10, port));
};

/**
 * Convert the flat React view-model (giList + lineList + layout X + risks)
 * into an engine-style declarative SLD graph. Tiers are re-based so band 1
 * (500 kV sources) becomes tier 0 drawn above Tier 1, exactly like the
 * engine and the book figures.
 */
export function toEngSldGraph(
  giList: ParsedGINode[],
  lineList: ParsedTransmissionLine[],
  positions: Record<string, NodePosition>,
  risks: EngineRisk[],
  opts: { id?: string; title: string; viewName: string }
): EngSldGraph {
  const nodeById = new Map(giList.map((n) => [n.id, n]));
  const degree = new Map<string, number>();
  const validLines = lineList.filter((l) => nodeById.has(l.sourceId) && nodeById.has(l.targetId));
  for (const l of validLines) {
    degree.set(l.sourceId, (degree.get(l.sourceId) ?? 0) + 1);
    degree.set(l.targetId, (degree.get(l.targetId) ?? 0) + 1);
  }

  const bandOf = (n: ParsedGINode): number => {
    const t = typeof n.tier === 'number' ? n.tier : positions[n.id]?.tier;
    return typeof t === 'number' && t >= 0 ? Math.round(t) : 3;
  };

  // Bays render as stubs on the parent bus, not as standalone nodes.
  const bays: EngSldBay[] = [];
  const bayIds = new Set<string>();
  const baysByBus = new Map<string, ParsedGINode[]>();
  for (const n of giList) {
    if (n.isBay && n.feederKey && nodeById.has(n.feederKey)) {
      bayIds.add(n.id);
      const arr = baysByBus.get(n.feederKey) ?? [];
      arr.push(n);
      baysByBus.set(n.feederKey, arr);
    }
  }
  for (const [busCode, arr] of baysByBus) {
    const parent = nodeById.get(busCode)!;
    const px = positions[busCode]?.x ?? 0;
    const pw = positions[busCode]?.busbarWidth ?? 150;
    arr.forEach((b, i) => {
      bays.push({
        id: `bay-${b.id}`,
        code: b.code || b.id,
        name: b.name || b.id,
        busCode,
        x: px + pw / 2 + (i - (arr.length - 1) / 2) * 46,
        circuitCount: 1,
        status: 'ENERGIZED'
      });
    });
  }

  const nodes: EngSldNode[] = [];
  for (const n of giList) {
    if (bayIds.has(n.id)) continue;
    const band = bandOf(n);
    const tier = Math.max(0, band - 1);
    const aT = String(n.assetType || '').toLowerCase();
    const type: EngSldNodeType =
      aT === 'gitet' ? 'GITET' : aT === 'pembangkit' ? 'GENERATING_UNIT' : aT === 'beban' ? 'BEBAN' : aT === 'gis' ? 'GIS' : 'GI';
    const voltageKv = kvOf(n.primaryVoltage || n.voltage, type === 'BEBAN' ? 20 : 150);
    const pos = positions[n.id];
    const wide = Boolean(pos?.isWideBusbar);
    const posW = pos?.busbarWidth ?? 150;
    const halfWidth = Math.max(40, wide ? posW / 2 : 75);
    const deg = degree.get(n.id) ?? 0;
    const role: EngSldRole = tier === 0 || type === 'GENERATING_UNIT' ? 'SOURCE' : deg === 0 ? 'BOUNDARY' : 'CORE';
    const label =
      type === 'GENERATING_UNIT'
        ? (n.name || '').match(/unit\s*\d+/i)?.[0] || shortLabel(n.code, n.name)
        : type === 'BEBAN'
          ? bebanLabel(n.name || '', n.id)
          : shortLabel(n.code, n.name);
    nodes.push({
      code: n.id,
      label,
      name: n.name || n.id,
      type,
      voltageKv,
      role,
      tier,
      status: 'ENERGIZED',
      // our layout stores the left edge; the engine graph wants the center
      x: (pos?.x ?? 0) + posW / 2,
      halfWidth,
      labelTop: tier === 0
    });
  }
  const nodeSet = new Set(nodes.map((n) => n.code));

  // Parallel sirkit rows collapse into one bundled circuit (engine style).
  const pairGroups = new Map<string, ParsedTransmissionLine[]>();
  for (const l of validLines) {
    if (l.id.startsWith('INTERNAL_IBT')) continue;
    const key = [l.sourceId, l.targetId].sort().join('___');
    const arr = pairGroups.get(key) ?? [];
    arr.push(l);
    pairGroups.set(key, arr);
  }
  const circuits: EngSldCircuit[] = [];
  for (const group of pairGroups.values()) {
    const rep = group[0];
    const sldType = /sktt|kabel/i.test(rep.lineName || '') ? 'SKTT' : 'SUTT';
    circuits.push({
      id: `c-${rep.id}`,
      code: `${rep.sourceId}-${rep.targetId}`,
      name: rep.lineName || `${rep.sourceId} - ${rep.targetId}`,
      type: sldType,
      voltageKv: kvOf(rep.voltage, 150),
      from: rep.sourceId,
      to: rep.targetId,
      fromPort: findTapPort(positions[rep.sourceId], rep.targetId),
      toPort: findTapPort(positions[rep.targetId], rep.sourceId),
      circuitCount: Math.min(group.length, 2),
      status: opStatus(rep.operatingStatus),
      loadingPct: rep.loadingPct ?? 0
    });
  }

  const ibts: EngSldIbt[] = [];
  for (const l of validLines) {
    if (!l.id.startsWith('INTERNAL_IBT')) continue;
    const fx = positions[l.sourceId];
    const fw = fx?.busbarWidth ?? 150;
    ibts.push({
      id: l.id,
      code: `${l.sourceId}-${l.targetId}`,
      name: l.lineName || `IBT ${l.sourceId}-${l.targetId}`,
      from: l.sourceId,
      to: l.targetId,
      x: (fx?.x ?? 0) + fw / 2,
      status: opStatus(l.operatingStatus)
    });
  }

  const seenSeq = new Set<number>();
  const pins: EngSldPin[] = [];
  for (const r of risks) {
    if (typeof r.seq_no !== 'number' || seenSeq.has(r.seq_no)) continue;
    if (r.pin_kind === 'SUBSTATION' && r.pin_key && nodeSet.has(r.pin_key)) {
      seenSeq.add(r.seq_no);
      pins.push({ seq: r.seq_no, kind: 'SUBSTATION', code: r.pin_key });
    } else if ((r.pin_kind === 'CIRCUIT' || r.pin_kind === 'TRANSFORMER') && r.pin_key) {
      seenSeq.add(r.seq_no);
      pins.push({ seq: r.seq_no, kind: r.pin_kind, code: r.pin_key });
    }
  }

  const tierCount = Math.max(1, ...nodes.map((n) => n.tier));
  return {
    id: opts.id || 'upload',
    title: opts.title,
    viewName: opts.viewName,
    tierCount,
    nodes,
    circuits,
    ibts,
    bays,
    pins
  };
}

// ---- geometry (port of useSldLayout computed values) -----------------------

export interface EngWireGeom {
  d: string;
  mid: { x: number; y: number };
  pmts: { x: number; y: number }[];
}

export interface EngCircuitGeom {
  circuit: EngSldCircuit;
  color: string;
  dash?: string;
  wires: EngWireGeom[];
}

export interface EngNodeGeom {
  node: EngSldNode;
  y: number;
  x1: number;
  x2: number;
  color: string;
  labelX: number;
  labelY: number;
  labelAnchor: 'start' | 'middle';
}

export interface EngIbtGeom {
  ibt: EngSldIbt;
  y1: number;
  y2: number;
}

export interface EngBayGeom {
  bay: EngSldBay;
  y: number;
  color: string;
  xs: number[];
}

export interface EngPinGeom {
  pin: EngSldPin;
  x: number;
  y: number;
}

function engOrthoPath(x1: number, y1: number, x2: number, y2: number, bend: number): string {
  if (Math.abs(x1 - x2) < 0.5) return `M${x1},${y1} L${x2},${y2}`;
  return `M${x1},${y1} L${x1},${bend} L${x2},${bend} L${x2},${y2}`;
}

export function engNodeGeoms(graph: EngSldGraph): EngNodeGeom[] {
  return graph.nodes.map((node) => {
    const y = engBusY(node.tier);
    const x1 = node.x - node.halfWidth;
    const x2 = node.x + node.halfWidth;
    return {
      node,
      y,
      x1,
      x2,
      color: engVoltageHex(node.voltageKv),
      labelX: node.labelTop ? node.x : x2 + 6,
      labelY: node.labelTop ? y - 12 : y + 3,
      labelAnchor: node.labelTop ? 'middle' : 'start'
    };
  });
}

export function engCircuitGeoms(graph: EngSldGraph): EngCircuitGeom[] {
  const byCode = new Map(graph.nodes.map((n) => [n.code, n]));
  const out: EngCircuitGeom[] = [];
  for (const c of graph.circuits) {
    const a = byCode.get(c.from);
    const b = byCode.get(c.to);
    if (!a || !b) continue;
    const y1 = engBusY(a.tier);
    const y2 = engBusY(b.tier);
    const x1 = a.x + c.fromPort;
    const x2 = b.x + c.toPort;
    const sameRow = Math.abs(y1 - y2) < 1;
    const wires: EngWireGeom[] = [];
    for (let i = 0; i < c.circuitCount; i++) {
      const off = c.circuitCount === 1 ? 0 : (i === 0 ? -1 : 1) * (ENG_SLD.pitch / 2);
      const wx1 = x1 + off;
      const wx2 = x2 + off;
      const bend = sameRow
        ? y1 + 73 + (i === 0 ? 0 : ENG_SLD.pitch)
        : y1 + (y2 - y1) * 0.73 + (i === 0 ? 0 : ENG_SLD.pitch) * Math.sign(y2 - y1);
      const d = engOrthoPath(wx1, y1, wx2, y2, bend);
      const dir1 = sameRow ? 1 : Math.sign(y2 - y1);
      const pmts = [
        { x: wx1 - 5, y: y1 + dir1 * 7 - 5 },
        { x: wx2 - 5, y: y2 - (sameRow ? -1 : dir1) * 7 - 5 }
      ];
      const mid =
        Math.abs(wx1 - wx2) < 0.5 ? { x: wx1, y: (y1 + y2) / 2 } : { x: (wx1 + wx2) / 2, y: bend };
      wires.push({ d, mid, pmts });
    }
    const color = c.status === 'DE_ENERGIZED' || c.status === 'PLANNED' ? '#9AA0A6' : engVoltageHex(c.voltageKv);
    const dash = c.type === 'SKTT' ? '7 5' : c.status === 'PLANNED' ? '2 4' : undefined;
    out.push({ circuit: c, color, dash, wires });
  }
  return out;
}

export function engIbtGeoms(graph: EngSldGraph): EngIbtGeom[] {
  const byCode = new Map(graph.nodes.map((n) => [n.code, n]));
  const out: EngIbtGeom[] = [];
  for (const ibt of graph.ibts) {
    const a = byCode.get(ibt.from);
    const b = byCode.get(ibt.to);
    if (!a || !b) continue;
    out.push({ ibt, y1: engBusY(a.tier), y2: engBusY(b.tier) });
  }
  return out;
}

export function engBayGeoms(graph: EngSldGraph): EngBayGeom[] {
  const byCode = new Map(graph.nodes.map((n) => [n.code, n]));
  const out: EngBayGeom[] = [];
  for (const bay of graph.bays) {
    const bus = byCode.get(bay.busCode);
    if (!bus) continue;
    const xs = bay.circuitCount === 2 ? [bay.x - 7, bay.x + 7] : [bay.x];
    const color = bay.status === 'ENERGIZED' ? engVoltageHex(bus.voltageKv) : '#9AA0A6';
    out.push({ bay, y: engBusY(bus.tier), color, xs });
  }
  return out;
}

export function engPinGeoms(
  graph: EngSldGraph,
  nodeGeoms: EngNodeGeom[],
  circuitGeoms: EngCircuitGeom[],
  ibtGeoms: EngIbtGeom[],
  bayGeoms: EngBayGeom[]
): EngPinGeom[] {
  const out: EngPinGeom[] = [];
  for (const pin of graph.pins) {
    if (pin.kind === 'SUBSTATION') {
      const g = nodeGeoms.find((n) => n.node.code === pin.code);
      if (g) out.push({ pin, x: g.x2 + (g.node.labelTop ? 12 : 70), y: g.y + 22 });
    } else if (pin.kind === 'CIRCUIT') {
      const g = circuitGeoms.find((c) => c.circuit.code === pin.code);
      const w = g?.wires[g.wires.length - 1];
      if (w) {
        out.push({ pin, x: w.mid.x + 14, y: w.mid.y });
      } else {
        // IBT-edge risks are pinned CIRCUIT by the registry; resolve them
        // onto the IBT wheel like the engine's TRANSFORMER pins.
        const ig = ibtGeoms.find((i) => i.ibt.code === pin.code);
        if (ig) out.push({ pin, x: ig.ibt.x - 26, y: (ig.y1 + ig.y2) / 2 + 5 });
      }
    } else if (pin.kind === 'TRANSFORMER') {
      const g = ibtGeoms.find((i) => i.ibt.code === pin.code);
      if (g) out.push({ pin, x: g.ibt.x - 26, y: (g.y1 + g.y2) / 2 + 5 });
    }
  }
  void bayGeoms;
  return out;
}

export function engGraphTiers(graph: EngSldGraph): number[] {
  return Array.from({ length: graph.tierCount }, (_, i) => i + 1);
}

export function engGraphBounds(graph: EngSldGraph): { width: number; height: number } {
  if (!graph.nodes.length) return { width: 1200, height: 800 };
  const maxX = Math.max(...graph.nodes.map((n) => n.x + n.halfWidth + 120), 800);
  const maxTier = Math.max(...graph.nodes.map((n) => n.tier), graph.tierCount);
  return { width: maxX + ENG_SLD.padX, height: engBusY(maxTier) + 140 };
}
