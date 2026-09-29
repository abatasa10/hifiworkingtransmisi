import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { parseWorkbookToPayload } from '../../src/lib/sld/parser';

// Stage-3 parity helper: run ONLY the parse stage (parser.ts) and print a
// summary comparable with the Java backend endpoint POST /api/sld/payload.
// Usage: npx tsx scripts/pipeline-test/parse-only.ts <workbook.xlsx>

const sample = process.argv[2];
if (!sample) {
  throw new Error('Pass an SLD engine workbook path: node scripts/pipeline-test/parse-only.ts <workbook.xlsx>');
}
const wb = XLSX.read(readFileSync(sample));
const { payload, issues } = parseWorkbookToPayload(wb, 'ss_cwd_ingest.xlsx');

console.log(JSON.stringify({
  document_type: payload.meta.document_type,
  subsystem: { code: payload.subsystem.code, name: payload.subsystem.name, apb: payload.subsystem.apb },
  objects: payload.objects.length,
  objectSample: payload.objects.slice(0, 6).map((o) => `${o.external_key}:${o.object_type}:t${o.tier_hint}:kv${o.voltage_hv_kv}`),
  objectSigs: payload.objects.map((o) => `${o.external_key}|${o.object_type}|t${o.tier_hint}|kv${o.voltage_hv_kv}|${o.risk_level}`).sort(),
  connections: payload.connections.length,
  connSample: payload.connections.slice(0, 5).map((c) => `${c.from_external_key}>${c.to_external_key}:${c.relation_type}`),
  connSigs: payload.connections.map((c) => `${c.from_external_key}>${c.to_external_key}|${c.relation_type}|${c.circuit_type_hint}`).sort(),
  risks: payload.risks.length,
  riskSample: payload.risks.slice(0, 3).map((r) => `#${r.seq_no}:${r.pin_kind}:${r.pin_key}`),
  riskSigs: payload.risks.map((r) => `#${r.seq_no}|${r.pin_kind}|${r.pin_key}|${r.category}`).sort(),
  issueCount: issues.length,
  issues: issues.map((i) => i.message).slice(0, 5),
}, null, 2));