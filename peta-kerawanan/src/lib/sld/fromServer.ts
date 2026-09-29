import { EngSldGraph, EngSldNode, EngSldCircuit, EngSldIbt, EngSldBay, EngSldPin } from './engineSld';

const num = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const str = (v: unknown, fallback: string): string =>
  typeof v === 'string' && v.length ? v : fallback;

const nodeType = (v: unknown): EngSldNode['type'] =>
  v === 'GITET' || v === 'GIS' || v === 'GENERATING_UNIT' || v === 'BEBAN' ? v : 'GI';

const sldStatus = (v: unknown): EngSldNode['status'] =>
  v === 'PLANNED' || v === 'DE_ENERGIZED' ? v : 'ENERGIZED';

const role = (v: unknown): EngSldNode['role'] =>
  v === 'SOURCE' || v === 'BOUNDARY' ? v : 'CORE';

const circuitType = (v: unknown): EngSldCircuit['type'] =>
  v === 'SKTT' ? 'SKTT' : 'SUTT';

const pinKind = (v: unknown): EngSldPin['kind'] =>
  v === 'SUBSTATION' || v === 'TRANSFORMER' ? v : 'CIRCUIT';

/**
 * Coerce a JSON payload coming from the Java SLD engine into the EngSldGraph
 * shape the React canvas consumes. Unknown/malformed fields fall back to
 * safe defaults instead of throwing.
 */
export function coerceServerGraph(json: unknown): EngSldGraph {
  const g = (json ?? {}) as Record<string, unknown>;
  const rawNodes = Array.isArray(g.nodes) ? g.nodes : [];
  const nodes: EngSldNode[] = rawNodes.map((n, idx) => {
    const r = (n ?? {}) as Record<string, unknown>;
    return {
      code: str(r.code, `N${idx + 1}`),
      label: str(r.label, str(r.code, '')),
      name: str(r.name, str(r.code, '')),
      type: nodeType(r.type),
      voltageKv: num(r.voltageKv, 150),
      role: role(r.role),
      tier: Math.max(0, Math.floor(num(r.tier, 1))),
      status: sldStatus(r.status),
      x: num(r.x, 0),
      halfWidth: Math.max(20, num(r.halfWidth, 75)),
      labelTop: r.labelTop === true,
      stackedAbove: r.stackedAbove === true
    };
  });

  const circuits: EngSldCircuit[] = Array.isArray(g.circuits)
    ? g.circuits.map((c) => {
        const r = (c ?? {}) as Record<string, unknown>;
        return {
          id: str(r.id, 'c'),
          code: str(r.code, ''),
          name: str(r.name, str(r.code, '')),
          type: circuitType(r.type),
          voltageKv: num(r.voltageKv, 150),
          from: str(r.from, ''),
          to: str(r.to, ''),
          fromPort: num(r.fromPort, 0),
          toPort: num(r.toPort, 0),
          circuitCount: Math.max(1, Math.floor(num(r.circuitCount, 1))),
          status: sldStatus(r.status),
          loadingPct: num(r.loadingPct, 0)
        };
      })
    : [];

  const ibts: EngSldIbt[] = Array.isArray(g.ibts)
    ? g.ibts.map((b) => {
        const r = (b ?? {}) as Record<string, unknown>;
        return {
          id: str(r.id, 'ibt'),
          code: str(r.code, ''),
          name: str(r.name, str(r.code, '')),
          from: str(r.from, ''),
          to: str(r.to, ''),
          x: num(r.x, 0),
          status: sldStatus(r.status)
        };
      })
    : [];

  const bays: EngSldBay[] = Array.isArray(g.bays)
    ? g.bays.map((b) => {
        const r = (b ?? {}) as Record<string, unknown>;
        return {
          id: str(r.id, 'bay'),
          code: str(r.code, ''),
          name: str(r.name, str(r.code, '')),
          busCode: str(r.busCode, ''),
          x: num(r.x, 0),
          circuitCount: Math.max(1, Math.floor(num(r.circuitCount, 1))),
          status: sldStatus(r.status)
        };
      })
    : [];

  const pins: EngSldPin[] = Array.isArray(g.pins)
    ? g.pins.map((p) => {
        const r = (p ?? {}) as Record<string, unknown>;
        return {
          seq: Math.floor(num(r.seq, 0)),
          kind: pinKind(r.kind),
          code: str(r.code, '')
        };
      })
    : [];

  return {
    id: str(g.id, 'server'),
    title: str(g.title, 'SLD Server Mode'),
    viewName: str(g.viewName, 'Engine (Spring Boot)'),
    tierCount: Math.max(1, Math.floor(num(g.tierCount, 1))),
    nodes,
    circuits,
    ibts,
    bays,
    pins
  };
}

export interface ServerParseResponse {
  graph: EngSldGraph;
  meta: { filename: string; engine: string; elapsedMs: number };
  issues: Array<{ level: 'error' | 'warning' | 'info'; message: string }>;
}