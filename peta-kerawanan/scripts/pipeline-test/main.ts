import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { parseWorkbookToPayload } from '../../src/lib/sld/parser';
import { computeTiers } from '../../src/lib/sld/tier';
import { toViewModel } from '../../src/lib/sld/adapter';
import { computeEngineLayout } from '../../src/lib/sld/layout';

const sample = process.argv[2];
if (!sample) {
  throw new Error('Pass an SLD engine workbook path: node scripts/pipeline-test/main.ts <workbook.xlsx>');
}
const wb = XLSX.read(readFileSync(sample));
const { payload, issues } = parseWorkbookToPayload(wb, 'ss_cwd_ingest.xlsx');
const tierMap = computeTiers(payload);
const vm = toViewModel(payload, tierMap, 'Cawang');
const pos = computeEngineLayout(vm.giList, [...vm.ibrLinks, ...vm.lineList], tierMap);

const tierVals = [...tierMap.values()];
console.log(JSON.stringify({
  objects: vm.giList.length,
  lines: vm.lineList.length,
  ibrLinks: vm.ibrLinks.length,
  tierRange: [Math.min(...tierVals), Math.max(...tierVals)],
  issues: issues.map((i) => i.message).slice(0, 5),
  posKeys: Object.keys(pos).length,
  sampleIds: vm.giList.slice(0, 6).map((n) => `${n.id}:${n.assetType}:t${n.tier}`),
  ibrSample: vm.ibrLinks.slice(0, 3).map((l) => `${l.id}`),
  risks: [...new Set(vm.giList.map((n) => n.riskStatus))]
}, null, 2));
