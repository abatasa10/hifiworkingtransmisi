import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { parseWorkbookToPayload } from '../../src/lib/sld/parser';
import { computeTiers } from '../../src/lib/sld/tier';
import { toViewModel } from '../../src/lib/sld/adapter';
import { computeEngineLayout } from '../../src/lib/sld/layout';
import { toEngSldGraph, EngSldGraph, engNodeGeoms, engCircuitGeoms, engIbtGeoms, engBayGeoms, engPinGeoms, engTierGuides, engGraphBounds } from '../../src/lib/sld/engineSld';
import { coerceServerGraph } from '../../src/lib/sld/fromServer';

const sample = process.argv[2];
if (!sample) {
  throw new Error('Pass an SLD engine workbook path: npx tsx scripts/pipeline-test/parity-graph.ts <workbook.xlsx>');
}

const bytes = readFileSync(sample);
const wb = XLSX.read(bytes);
const { payload, issues } = parseWorkbookToPayload(wb, 'ss_cwd_ingest.xlsx');
const tierMap = computeTiers(payload);
const subsystemName = payload.subsystem.name || 'SLD';
const vm = toViewModel(payload, tierMap, subsystemName);
const allLines = [...vm.ibrLinks, ...vm.lineList];
const pos = computeEngineLayout(vm.giList, allLines, tierMap);
const fe = toEngSldGraph(vm.giList, allLines, pos, payload.risks, {
  id: 'upload',
  title: subsystemName,
  viewName: subsystemName
});

const name = sample.split(/[\\/]/).pop()!;
const fd = new FormData();
fd.append('file', new Blob([bytes]), name);
const be = (await (await fetch('http://localhost:8080/api/sld/parse', { method: 'POST', body: fd })).json()).graph as EngSldGraph;

// compare the raw graph contract 1:1; normalize number serialization
// (Jackson prints 150.0, JSON.stringify prints 150) and stackedAbove
// (Java emits false for every node).
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v)).valueOf();
const norm = (g: EngSldGraph) => JSON.stringify({
  id: g.id,
  title: g.title,
  viewName: g.viewName,
  tierCount: g.tierCount,
  nodes: g.nodes.map((n) => [n.code, n.label, n.name, n.type, num(n.voltageKv), n.role, n.tier, n.status, num(n.x), num(n.halfWidth), n.labelTop === true, n.stackedAbove === true]),
  circuits: g.circuits.map((c) => [c.id, c.code, c.name, c.type, num(c.voltageKv), c.from, c.to, num(c.fromPort), num(c.toPort), c.circuitCount, c.status, num(c.loadingPct)]),
  ibts: g.ibts.map((b) => [b.id, b.code, b.name, b.from, b.to, num(b.x), b.status]),
  bays: g.bays.map((b) => [b.id, b.code, b.name, b.busCode, num(b.x), b.circuitCount, b.status]),
  pins: g.pins.map((p) => [p.seq, p.kind, p.code])
}, null, 1);

const feS = norm(fe);
const beS = norm(be);

console.log('sample:', name);
console.log('FE: nodes', fe.nodes.length, 'circuits', fe.circuits.length, 'ibts', fe.ibts.length, 'bays', fe.bays.length, 'pins', fe.pins.length, 'tierCount', fe.tierCount);
console.log('BE: nodes', be.nodes.length, 'circuits', be.circuits.length, 'ibts', be.ibts.length, 'bays', be.bays.length, 'pins', be.pins.length, 'tierCount', be.tierCount);

if (feS !== beS) {
  console.log('PARITY: MISMATCH — first diff line:');
  const fl = feS.split('\n');
  const bl = beS.split('\n');
  for (let i = 0; i < Math.max(fl.length, bl.length); i++) {
    if (fl[i] !== bl[i]) {
      console.log('FE line ' + (i + 1) + ':', fl[i]);
      console.log('BE line ' + (i + 1) + ':', bl[i]);
      break;
    }
  }
  // per-array diff
  const showDiff = (label: string, a: unknown[], b: unknown[]) => {
    console.log(`-- ${label}: FE=${a.length} BE=${b.length}`);
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
        console.log(`  idx ${i}\n    FE ${JSON.stringify(a[i])}\n    BE ${JSON.stringify(b[i])}`);
      }
    }
  };
  showDiff('nodes', fe.nodes, be.nodes);
  showDiff('circuits', fe.circuits, be.circuits);
  showDiff('ibts', fe.ibts, be.ibts);
  showDiff('bays', fe.bays, be.bays);
  showDiff('pins', fe.pins, be.pins);
  process.exit(1);
}
console.log('PARITY: EXACT MATCH (raw EngSldGraph)');

// Render path: the page feeds coerceServerGraph(BE json) into SldSvgCanvas,
// which computes geometry via the eng* helpers — prove that path is identical
// to the native FE graph too.
const geomNorm = (g: EngSldGraph) => {
  const nodeGeoms = engNodeGeoms(g);
  const circuitGeoms = engCircuitGeoms(g);
  const ibtGeoms = engIbtGeoms(g);
  const bayGeoms = engBayGeoms(g);
  const pinGeoms = engPinGeoms(g, nodeGeoms, circuitGeoms, ibtGeoms, bayGeoms);
  return JSON.stringify({
    bounds: engGraphBounds(g),
    guides: engTierGuides(g),
    nodeGeoms: nodeGeoms.map((n) => [n.node.code, n.y, n.x1, n.x2, n.color, n.labelX, n.labelY, n.labelAnchor]),
    circuitGeoms: circuitGeoms.map((c) => [c.circuit.id, c.color, c.dash ?? '', c.wires.map((w) => [w.d, w.mid, w.pmts])]),
    ibtGeoms: ibtGeoms.map((i) => [i.ibt.id, i.y1, i.y2]),
    bayGeoms: bayGeoms.map((b) => [b.bay.id, b.y, b.color, b.xs]),
    pinGeoms: pinGeoms.map((p) => [p.pin.seq, p.pin.code, p.x, p.y])
  }, null, 1);
};
const feR = coerceServerGraph(fe);
const beR = coerceServerGraph(be);
const feG = geomNorm(feR);
const beG = geomNorm(beR);
const sameRender = feG === beG;
console.log('RENDER: nodes', feR.nodes.length, 'circuits', feR.circuits.length, 'ibts', feR.ibts.length, 'bays', feR.bays.length, 'pins', feR.pins.length);
if (sameRender) {
  console.log('RENDER PATH: EXACT MATCH (coerce → eng* geometry)');
  console.log('bounds:', JSON.stringify(engGraphBounds(feR)));
  process.exit(0);
}
console.log('RENDER PATH: MISMATCH (coerce → geometry) — first diff line:');
const rl = feG.split('\n');
const rlb = beG.split('\n');
for (let i = 0; i < Math.max(rl.length, rlb.length); i++) {
  if (rl[i] !== rlb[i]) {
    console.log('FE line ' + (i + 1) + ':', rl[i]);
    console.log('BE line ' + (i + 1) + ':', rlb[i]);
    break;
  }
}
process.exit(1);