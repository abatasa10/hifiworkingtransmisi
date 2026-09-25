import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { parseWorkbookToPayload, hasEngineSheets, readSheetPreview } from '../../src/lib/sld/parser';
import { autoDetectMapping } from '../../src/lib/sld/mapping';
import { computeTiers } from '../../src/lib/sld/tier';
import { toViewModel } from '../../src/lib/sld/adapter';
import { computeEngineLayout } from '../../src/lib/sld/layout';

const sample = '/Users/ridwanalaziz/Kerja/ICON+/PROJECT/POWER INSPECT/DESIGN/peta-kerawanan/peta-kerawanan/public/template_kerawanan_subsistem_suralaya_cilegon.xlsx';
const wb = XLSX.read(readFileSync(sample));
console.log('SHEETS:', JSON.stringify(wb.SheetNames));
console.log('hasEngineSheets:', hasEngineSheets(wb));
const prev = readSheetPreview(wb.Sheets[wb.SheetNames[0]]);
console.log('headers:', JSON.stringify(prev.headers));
console.log('autoDetect:', JSON.stringify({ gi: autoDetectMapping(prev.headers).gi, from: autoDetectMapping(prev.headers).from, to: autoDetectMapping(prev.headers).to, assetType: autoDetectMapping(prev.headers).assetType, tier: autoDetectMapping(prev.headers).tier }));
const { payload, issues } = parseWorkbookToPayload(wb, 'template_fleksibel.xlsx');
const tierMap = computeTiers(payload);
const vm = toViewModel(payload, tierMap, 'Suralaya - Cilegon');
const pos = computeEngineLayout(vm.giList, [...vm.ibrLinks, ...vm.lineList], tierMap);
const tierVals = [...tierMap.values()];
console.log(JSON.stringify({
  objects: vm.giList.length,
  lines: vm.lineList.length,
  ibrLinks: vm.ibrLinks.length,
  tierRange: tierVals.length ? [Math.min(...tierVals), Math.max(...tierVals)] : null,
  issues: issues.map((i) => i.message).slice(0, 6),
  posKeys: Object.keys(pos).length,
  sampleIds: vm.giList.slice(0, 5).map((n) => `${n.id}:${n.assetType}:t${n.tier}`),
  risks: [...new Set(vm.giList.map((n) => n.riskStatus))]
}, null, 2));