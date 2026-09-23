import { ParsedGINode, ParsedTransmissionLine } from '../../../data/customSLDStore';
import { computeEngineLayout, computeEngineRouteChannels, BusbarTap, NodePosition } from '../../../lib/sld/layout';
import { computeTiers } from '../../../lib/sld/tier';
import { EnginePayload } from '../../../lib/sld/types';

export type { BusbarTap, NodePosition };
export { computeEngineRouteChannels };

/**
 * Suralaya - Cilegon blueprint (hand-authored, like the engine's persisted
 * per-view positions). Only used when the dataset is *exactly* the legacy
 * demo shape; anything else falls through to the generic engine layout.
 */
const SURALAYA_BLUEPRINT: Record<string, NodePosition> = {
  unit3: { x: 100, y: 60, tier: 1, },
  pltusuralayaunit3: { x: 100, y: 60, tier: 1, },
  suralayabaru: { x: 260, y: 60, tier: 1, },
  suralaya: { x: 480, y: 60, tier: 1, },
  cilegonbaru: { x: 920, y: 60, tier: 1, },

  ibt2: { x: 260, y: 195, tier: 2, },
  ibt2srlbaru: { x: 260, y: 195, tier: 2, },
  ibt2suralayabaru: { x: 260, y: 195, tier: 2, },
  ibt1: { x: 480, y: 195, tier: 2, },
  ibt1srlya: { x: 480, y: 195, tier: 2, },
  ibt1suralaya: { x: 480, y: 195, tier: 2, },
  ibt4: { x: 920, y: 195, tier: 2, },
  ibt4clbru: { x: 920, y: 195, tier: 2, },
  ibt4cilegonbaru: { x: 920, y: 195, tier: 2, },

  srlya: {
    x: 60, y: 330, tier: 2, isWideBusbar: true, busbarWidth: 670,
    taps: [
      { id: 'tap-unit3', connectedNodeId: 'unit3', x: 40, position: 'top', label: 'Bay Unit 3' },
      { id: 'tap-ibt2', connectedNodeId: 'ibt2', x: 200, position: 'top', label: 'Bay IBT 2' },
      { id: 'tap-ibt1', connectedNodeId: 'ibt1', x: 420, position: 'top', label: 'Bay IBT 1' },
      { id: 'tap-slrda', connectedNodeId: 'slrda', x: 60, position: 'bottom', label: 'Bay SLRDA' },
      { id: 'tap-pendo', connectedNodeId: 'pendo', x: 220, position: 'bottom', label: 'Bay PENDO' },
      { id: 'tap-peni', connectedNodeId: 'peni', x: 420, position: 'bottom', label: 'Bay PENI' },
      { id: 'tap-mcci5', connectedNodeId: 'mcci5', x: 630, position: 'bottom', label: 'Bay MCCI5' }
    ]
  },
  garduinduksrlya: { x: 60, y: 330, tier: 2, isWideBusbar: true, busbarWidth: 670 },
  garduinduksrlya150kv: { x: 60, y: 330, tier: 2, isWideBusbar: true, busbarWidth: 670 },
  gitesrlya: { x: 60, y: 330, tier: 2, isWideBusbar: true, busbarWidth: 670 },

  clbru: {
    x: 820, y: 330, tier: 2, isWideBusbar: true, busbarWidth: 230,
    taps: [
      { id: 'tap-ibt4', connectedNodeId: 'ibt4', x: 100, position: 'top', label: 'Bay IBT 4' },
      { id: 'tap-kstel', connectedNodeId: 'kstel', x: 40, position: 'bottom', label: 'Bay KSTEL' },
      { id: 'tap-kstelclgon', connectedNodeId: 'kstelclgon', x: 40, position: 'bottom', label: 'Bay KSTEL' },
      { id: 'tap-clgon', connectedNodeId: 'clgon', x: 100, position: 'bottom', label: 'Bay CLGON' },
      { id: 'tap-posco', connectedNodeId: 'posco', x: 160, position: 'bottom', label: 'Bay POSCO' }
    ]
  },
  garduindukclbru: { x: 820, y: 330, tier: 2, isWideBusbar: true, busbarWidth: 230 },
  garduindukclbru150kv: { x: 820, y: 330, tier: 2, isWideBusbar: true, busbarWidth: 230 },
  giteclbru: { x: 820, y: 330, tier: 2, isWideBusbar: true, busbarWidth: 230 },

  slrda: { x: 120, y: 480, tier: 3 },
  garduindukslrda150kv: { x: 120, y: 480, tier: 3 },
  pendo: { x: 280, y: 480, tier: 3 },
  garduindukpendo150kv: { x: 280, y: 480, tier: 3 },
  peni: { x: 480, y: 480, tier: 3 },
  garduindukpeni150kv: { x: 480, y: 480, tier: 3 },
  mcci5: { x: 690, y: 480, tier: 3 },
  garduindukmcci5150kv: { x: 690, y: 480, tier: 3 },
  clgon: { x: 920, y: 480, tier: 3 },
  garduindukclgon150kv: { x: 920, y: 480, tier: 3 },

  kttslfdo1: { x: 60, y: 640, tier: 4 },
  kttslfdo2: { x: 180, y: 640, tier: 4 },
  kttpendo: { x: 280, y: 640, tier: 4 },
  kttpeni: { x: 400, y: 640, tier: 4 },
  mtsui: { x: 480, y: 640, tier: 4 },
  garduindukmtsui150kv: { x: 480, y: 640, tier: 4 },
  kttlci: { x: 570, y: 640, tier: 4 },
  kttmcci: { x: 690, y: 640, tier: 4 },
  kstel: { x: 860, y: 640, tier: 4 },
  kstelclgon: { x: 860, y: 640, tier: 4 },
  kstelclbru: { x: 860, y: 640, tier: 4 },
  posco: { x: 980, y: 640, tier: 4 },

  kttmtsui: { x: 480, y: 800, tier: 5 }
};

function looksLikeSuralayaCilegon(nodes: ParsedGINode[], lines: ParsedTransmissionLine[]): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const known = Object.keys(SURALAYA_BLUEPRINT).map(clean);
  let matched = 0;
  const ids = new Set(nodes.map((n) => clean(n.id)));
  const names = new Set(nodes.map((n) => clean(n.name || '')));
  for (const n of ids) {
    for (const k of known) {
      if (n.includes(k) || k.includes(n)) {
        matched++;
        break;
      }
    }
  }
  for (const n of names) {
    if (known.some((k) => n.includes(k) || k.includes(n))) {
      matched++;
      break;
    }
  }
  void lines;
  return matched >= Math.min(nodes.length, 12) && nodes.length >= 10;
}

/**
 * Intelligent SLD layout engine.
 *
 * For the legacy Suralaya–Cilegon demo dataset the hand-authored blueprint
 * (the engine's equivalent of a persisted per-view position) is honoured so
 * the flagship subsystem keeps its authentic look. Every other dataset --
 * including anything uploaded through the Excel template -- is laid out
 * generically by the engine: tier BFS + barycentric alignment + wide busbars
 * with per-bay taps, no hardcoded landmarks.
 */
export function computeCleanSLDLayout(
  nodes: ParsedGINode[],
  lines: ParsedTransmissionLine[]
): Record<string, NodePosition> {
  if (!nodes || nodes.length === 0) return {};

  if (looksLikeSuralayaCilegon(nodes, lines)) {
    const positions: Record<string, NodePosition> = {};
    let matchedCount = 0;
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    nodes.forEach((n) => {
      const variants = [clean(n.id), clean(n.name || ''), clean(n.code || '')];
      for (const [k, coord] of Object.entries(SURALAYA_BLUEPRINT)) {
        if (variants.some((v) => v === k || v === `gi${k}` || v === `gitet${k}` || v === `garduinduk${k}`)) {
          positions[n.id] = coord;
          matchedCount++;
          break;
        }
      }
    });
    if (matchedCount >= Math.min(nodes.length, 8)) {
      nodes.forEach((n, idx) => {
        if (!positions[n.id]) {
          positions[n.id] = { x: 1050 + idx * 160, y: 480, tier: n.tier ?? 3 };
        }
      });
      return positions;
    }
  }

  return computeTieredLayout(nodes, lines);
}

/**
 * Layout a flat node/line model through the engine tier + generic layout.
 */
export function computeTieredLayout(
  nodes: ParsedGINode[],
  lines: ParsedTransmissionLine[]
): Record<string, NodePosition> {
  const tierMap = new Map<string, number>();
  nodes.forEach((n) => {
    if (typeof n.tier === 'number' && n.tier > 0) tierMap.set(n.id, n.tier);
  });
  return computeEngineLayout(nodes, lines, tierMap);
}

/**
 * Layout an engine payload (objects + connections) end-to-end: tier BFS then
 * generic placement.
 */
export function computePayloadLayout(
  payload: EnginePayload,
  viewModel: {
    giList: ParsedGINode[];
    lineList: ParsedTransmissionLine[];
  }
): { positions: Record<string, NodePosition>; tierMap: Map<string, number> } {
  const tierMap = computeTiers(payload);
  const positions = computeEngineLayout(viewModel.giList, [...viewModel.lineList], tierMap);
  return { positions, tierMap };
}
