import * as XLSX from 'xlsx';
import {
  ColumnMapping,
  cleanKey,
  autoDetectMapping,
  emptyColumnMapping
} from './mapping';
import {
  EngineObject,
  EngineObjectType,
  EngineConnection,
  EnginePayload,
  EngineParseResult,
  EngineRisk,
  EngineStatusHint,
  RiskCategory
} from './types';

// ===========================================================================
// small helpers
// ===========================================================================

const norm = (s: unknown): string => String(s ?? '').trim().toLowerCase();

const str = (v: unknown): string => String(v ?? '').trim();

const numOr = (v: unknown): number | null => {
  if (v === null || v === undefined || str(v) === '') return null;
  const n = Number(String(v).replace(/,/g, '.'));
  return Number.isFinite(n) ? n : null;
};

const pcOr = (v: unknown): number | null => {
  const n = numOr(v);
  if (n === null) return null;
  return n > 1 && n <= 1.5 ? n * 100 : n; // guard against decimal fractions like 0.82
};

const kvNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const s = norm(v).replace(/kv/g, '').split('/')[0].trim().replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const intOr = (v: unknown): number | null => {
  const n = numOr(v);
  return n === null ? null : Math.trunc(n);
};

const boolOr = (v: unknown): boolean => {
  return ['1', 'true', 'yes', 'ya', 'ada', 'single', 'satu fasa'].includes(norm(v));
};

const firstLine = (v: unknown): string => {
  const s = str(v);
  for (const sep of ['\n', '. ', ';']) {
    const i = s.indexOf(sep);
    if (i > 0) return s.slice(0, i).replace(/^[\d.\s]+/, '').slice(0, 180);
  }
  return s.slice(0, 180);
};

const tokens = (v: unknown): string[] => {
  return str(v)
    .replace(/,/g, ';')
    .replace(/&/g, ';')
    .split(';')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
};

export const riskNumbers = (v: unknown): number[] => {
  const out: number[] = [];
  for (const t of tokens(v)) {
    const n = Number(t);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
};

/** Split a `Terhubung ke` / `GI Terdampak` cell into deduped clean keys. */
export const keyList = (v: unknown): string[] => {
  const out: string[] = [];
  for (const t of tokens(v)) {
    const k = cleanKey(t);
    if (k && !out.includes(k)) out.push(k);
  }
  return out;
};

const isRawan = (score: RiskCategory): boolean => score !== 'Normal';

export const normalizeRiskLevel = (v: unknown): RiskCategory => {
  const s = str(v);
  if (!s) return 'Normal';
  const u = s.toUpperCase();
  if (u.includes('N-1-2') || u.includes('N12') || u.includes('N-1-1')) return 'N-1-2';
  if (u.includes('N-2') || u.includes('N2')) return 'N-2';
  if (u.includes('N-1') || u.includes('N1')) return 'N-1';
  if (u.includes('SANGAT RAWAN') || u.includes('SANGAT RAWAN') || u.includes('KRITIS')) return 'Sangat Rawan';
  if (u.includes('SEDANG')) return 'Sedang';
  if (u.includes('WASPADA') || u.includes('RAWAN')) return 'Rawan';
  return 'Normal';
};

const statusMap = (v: unknown): EngineStatusHint => {
  const s = norm(v);
  if (!s) return 'ENERGIZED';
  if (s.includes('belum')) return 'NEW_NOT_ENERGIZED';
  if (s.includes('rencana') || s.includes('planned')) return 'PLANNED';
  if (s.includes('padam') || s.includes('de-energ')) return 'DE_ENERGIZED';
  if (s.includes('pelanggan') || s.includes('ktt')) return 'OWNED_BY_CUSTOMER';
  return 'ENERGIZED';
};

const lineTypeHint = (name: unknown): 'SUTT' | 'SKTT' => {
  const s = norm(name);
  if (s.includes('sktt') || s.includes('kabel') || s.includes('sku')) return 'SKTT';
  return 'SUTT';
};

export function resolveObjectType(
  sym: unknown,
  name: unknown,
  volt: unknown,
  bus150: unknown
): { object_type: EngineObjectType; is_bay: boolean; bay_kind: string | null } {
  const sL = norm(sym);
  const nL = norm(name);
  const vL = norm(volt);
  const bL = norm(bus150);

  if (!sL && !nL) return { object_type: 'GI', is_bay: false, bay_kind: null };

  // Bay priority: explicit Bay/sheet row
  if (sL.includes('bay') || sL.includes('spur') || (bL && (nL.includes('bay') || nL.includes('feeder')))) {
    return { object_type: 'BAY', is_bay: true, bay_kind: sL.includes('sktt') || sL.includes('kabel') ? 'SKTT' : 'SUTT' };
  }
  if (sL.includes('pembangkit') || sL.includes('generator') || sL.includes('genset') || sL.includes('plt')) {
    return { object_type: 'GENERATING_UNIT', is_bay: false, bay_kind: null };
  }
  if (sL.includes('trafo') && !sL.includes('ibt')) {
    return { object_type: 'TRAFO', is_bay: false, bay_kind: null };
  }
  if (sL.includes('kapasitor') || sL.includes('compensator') || sL.includes('reaktor') || sL.includes('shunt')) {
    return { object_type: 'KAPASITOR', is_bay: false, bay_kind: null };
  }
  if (sL.includes('ibt') || nL.startsWith('ibt ')) {
    return { object_type: 'IBT', is_bay: false, bay_kind: null };
  }
  if (sL.includes('gitet') || sL.includes('gistet')) {
    return { object_type: 'GITET', is_bay: false, bay_kind: null };
  }
  if (sL.includes('gis')) {
    return { object_type: 'GIS', is_bay: false, bay_kind: null };
  }
  if (sL.includes('beban') || sL.includes('ktt') || nL.includes('ktt') || nL.includes('konsumen')) {
    return { object_type: 'BEBAN', is_bay: false, bay_kind: null };
  }
  if (sL.includes('busbar') || sL.includes('rel')) {
    return { object_type: 'GI', is_bay: false, bay_kind: null };
  }
  if (nL.includes('busbar') || nL.includes('rel')) {
    return { object_type: 'GI', is_bay: false, bay_kind: null };
  }
  if (sL.includes('gi') || sL === 'gi') {
    return { object_type: 'GI', is_bay: false, bay_kind: null };
  }
  // fallback by voltage
  if (vL.includes('500') || vL.includes('275')) {
    return { object_type: 'GITET', is_bay: false, bay_kind: null };
  }
  return { object_type: 'GI', is_bay: false, bay_kind: null };
}

// distinguish a GITET-class busbar for the Tier source heuristic
export function isSourceObject(o: EngineObject): boolean {
  if (o.object_type === 'GENERATING_UNIT') return true;
  if (o.object_type === 'GITET') return true;
  const hv = o.voltage_hv_kv ?? o.voltage_lv_kv ?? 0;
  return hv >= 275 || norm(o.role_hint) === 'SOURCE';
}

// ===========================================================================
// Sheet reading utils (XLSX worksheet -> rows of objects keyed by header)
// ===========================================================================

export function sheetHeaders(sheet: XLSX.WorkSheet | undefined): string[] {
  if (!sheet) return [];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  for (const row of grid) {
    if (Array.isArray(row) && row.length) {
      return row.map((c) => str(c)).filter(Boolean);
    }
  }
  return [];
}

export interface SheetPreview {
  headers: string[];
  previewRows: unknown[][];
}

/**
 * Expose the same header-row detection and a few preview rows so the Upload
 * UI can render the mapping table from the engine parser's perspective.
 */
export function readSheetPreview(sheet: XLSX.WorkSheet | undefined): SheetPreview {
  const { headers, rows } = sheet ? readHeaderRows(sheet) : { headers: [], rows: [] };
  const previewRows = rows.slice(0, 5).map((r) => headers.map((h) => r[h]));
  return { headers, previewRows };
}

export function hasEngineSheets(wb: XLSX.WorkBook): boolean {
  const names = wb.SheetNames.map(norm);
  return (
    names.includes('gardu_induk_dan_aset') &&
    names.includes('jalur_transmisi')
  );
}

function pickSheet(wb: XLSX.WorkBook, names: string[]): XLSX.WorkSheet | undefined {
  const wanted = names.map(norm);
  for (const sn of wb.SheetNames) {
    if (wanted.includes(norm(sn))) return wb.Sheets[sn];
  }
  return undefined;
}

interface HeaderRows {
  headers: string[];
  rows: Record<string, unknown>[];
}

function readHeaderRows(sheet: XLSX.WorkSheet): HeaderRows {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  let headerIdx = -1;
  let headers: string[] = [];
  for (let r = 0; r < Math.min(25, grid.length); r++) {
    const row = grid[r];
    if (!Array.isArray(row) || !row.length) continue;
    const h = row.map((c) => str(c)).filter(Boolean);
    // a header row never contains long sentence cells (legend rows often do)
    if (h.some((c) => c.length > 60)) continue;
    const key = cleanKey(h.join(' '));
    if (
      key.includes('gi') ||
      key.includes('gardu') ||
      key.includes('asset') ||
      key.includes('nama') ||
      key.includes('darigi') ||
      key.includes('penghantar') ||
      key.includes('tier') ||
      key.includes('kode') ||
      key.includes('ibt') ||
      key.includes('bus') ||
      key.includes('trafo') ||
      key.includes('kerawanan')
    ) {
      headerIdx = r;
      headers = h;
      break;
    }
  }
  if (headerIdx < 0) return { headers: [], rows: [] };
  const data = grid
    .slice(headerIdx + 1)
    .filter((r) => Array.isArray(r) && r.some((c) => c !== null && c !== undefined && str(c) !== ''));
  const rows = data.map((raw) => {
    const o: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      o[h] = (raw as unknown[])[i];
    });
    return o;
  });
  return { headers, rows };
}

function get(row: Record<string, unknown>, ...keys: string[]): unknown {
  const wanted = keys.map(norm);
  for (const [hk, v] of Object.entries(row)) {
    if (wanted.includes(norm(hk))) return v;
  }
  return undefined;
}

function guessSubsystemName(filename: string): string {
  let base = (filename || 'subsistem').replace(/\.[^.]+$/, '');
  base = base
    .replace(/template_sld_subsistem_pln_/, '')
    .replace(/template_/, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ');
  return base.trim() || 'Subsistem';
}

/**
 * Derive the risk registry entries from the objects/connections that already
 * carry `risk_seq` Pins (substation vs circuit), so multi-sheet merges can
 * rebuild a consistent risk list from unioned state.
 */
export function buildRisksFromState(
  objList: EngineObject[],
  connections: EngineConnection[]
): EngineRisk[] {
  const pinBySeq = new Map<number, { pin_kind: EngineRisk['pin_kind']; pin_key: string | null }>();
  for (const o of objList) {
    for (const rn of o.risk_seq) pinBySeq.set(rn, { pin_kind: 'SUBSTATION', pin_key: o.external_key });
  }
  for (const c of connections) {
    for (const rn of c.risk_seq) {
      pinBySeq.set(rn, { pin_kind: 'CIRCUIT', pin_key: `${c.from_external_key}-${c.to_external_key}` });
    }
  }

  const risks: EngineRisk[] = [];
  for (const [seq, pin] of pinBySeq) {
    const conn = connections.find((c) => c.risk_seq.includes(seq));
    const obj = objList.find((o) => o.risk_seq.includes(seq));
    risks.push({
      seq_no: seq,
      uit: conn?.uit || (objList.length ? '' : '') || '',
      category: conn?.risk_level || obj?.risk_level || 'Normal',
      title: conn?.line_name || obj?.raw_label || `Kerawanan #${seq}`,
      condition: conn?.note || obj?.raw_label || '',
      impact: conn?.corridor || '',
      mitigation: '',
      follow_up: '',
      pin_kind: pin.pin_kind,
      pin_key: pin.pin_key
    });
  }
  return risks;
}

// ===========================================================================
// Flexible single-sheet parser (current Upload SLD template) -> EnginePayload
// ===========================================================================

export interface FlexSheetContext {
  filename: string;
  region?: string;
  subsystem?: string;
  defaultVoltage?: string;
}

export function parseFlexibleSheet(
  sheet: XLSX.WorkSheet | undefined,
  mapping: ColumnMapping,
  ctx: FlexSheetContext
): EngineParseResult {
  const issues: EngineParseResult['issues'] = [];
  const { headers, rows } = sheet ? readHeaderRows(sheet) : { headers: [], rows: [] };
  if (!headers.length || !rows.length) {
    issues.push({ level: 'error', message: 'Tidak ada baris data yang terbaca di sheet ini.' });
    return { payload: emptyPayload(ctx.filename), issues };
  }

  const colIdx = (h: string) => (h ? headers.indexOf(h) : -1);
  const col = {
    gi: colIdx(mapping.gi),
    code: colIdx(mapping.code),
    tier: colIdx(mapping.tier),
    tierFrom: colIdx(mapping.tierFrom),
    tierTo: colIdx(mapping.tierTo),
    assetType: colIdx(mapping.assetType),
    symbolFrom: colIdx(mapping.symbolFrom),
    symbolTo: colIdx(mapping.symbolTo),
    busbarShape: colIdx(mapping.busbarShape),
    capacity: colIdx(mapping.capacity),
    ibtNumber: colIdx(mapping.ibtNumber),
    from: colIdx(mapping.from),
    to: colIdx(mapping.to),
    lineName: colIdx(mapping.lineName),
    voltage: colIdx(mapping.voltage),
    risk: colIdx(mapping.risk),
    riskNumber: colIdx(mapping.riskNumber),
    load: colIdx(mapping.load),
    loadC2: colIdx(mapping.loadC2),
    circuits: colIdx(mapping.circuits),
    circuitNumber: colIdx(mapping.circuitNumber),
    lengthKm: colIdx(mapping.lengthKm),
    corridor: colIdx(mapping.corridor),
    uit: colIdx(mapping.uit),
    condition: colIdx(mapping.condition),
    impact: colIdx(mapping.impact),
    mitigation: colIdx(mapping.mitigation),
    solution: colIdx(mapping.solution),
    bus150: colIdx(mapping.bus150),
    feeder: colIdx(mapping.feeder),
    bayKind: colIdx(mapping.bayKind),
    viewKey: colIdx(mapping.viewKey),
    status: colIdx(mapping.status),
    noKerawanan: colIdx(mapping.noKerawanan),
    connectedTo: colIdx(mapping.connectedTo),
    impactedGis: colIdx(mapping.impactedGis),
    functLoc: colIdx(mapping.functLoc)
  };

  const defaultVoltage = ctx.defaultVoltage || '150 kV';
  const isLineRow = (r: Record<string, unknown>) =>
    (col.from >= 0 && str(r[headers[col.from]]) !== '') && (col.to >= 0 && str(r[headers[col.to]]) !== '');

  const objects = new Map<string, EngineObject>();
  const connections: EngineConnection[] = [];
  const viewKeys = new Set<string>();
  const riskByView: Record<string, Set<number>> = {};
  let regionHint = ctx.region || '';

  const ensureObject = (
    name: string,
    codeValue: unknown,
    symbol: unknown,
    voltageRaw: unknown,
    tierHint: number | null,
    bus150Raw: unknown,
    extra: Partial<EngineObject> = {}
  ): EngineObject => {
    const key = cleanKey(codeValue) || cleanKey(name) || `GI_${cleanKey(name)}`;
    const existing = objects.get(key);
    if (existing) {
      if (tierHint !== null && existing.tier_hint === null) existing.tier_hint = tierHint;
      if (existing.risk_level === 'Normal' && isRawan(extra.risk_level || 'Normal')) {
        existing.risk_level = extra.risk_level || 'Normal';
      }
      for (const rn of extra.risk_seq || []) {
        if (!existing.risk_seq.includes(rn)) existing.risk_seq.push(rn);
      }
      for (const k of extra.connected_keys || []) {
        if (!existing.connected_keys.includes(k)) existing.connected_keys.push(k);
      }
      for (const k of extra.impacted_keys || []) {
        if (!existing.impacted_keys.includes(k)) existing.impacted_keys.push(k);
      }
      if (!existing.funct_loc && extra.funct_loc) existing.funct_loc = extra.funct_loc;
      if (!existing.condition && extra.condition) existing.condition = extra.condition;
      if (!existing.impact && extra.impact) existing.impact = extra.impact;
      if (!existing.mitigation && extra.mitigation) existing.mitigation = extra.mitigation;
      if (!existing.follow_up && extra.follow_up) existing.follow_up = extra.follow_up;
      return existing;
    }
    const { object_type, is_bay, bay_kind } = resolveObjectType(symbol, name, voltageRaw, bus150Raw);
    const hv = kvNum(voltageRaw);
    const obj: EngineObject = {
      external_key: key,
      object_type,
      raw_label: name,
      site_name: name,
      voltage_hv_kv: hv,
      voltage_lv_kv: hv !== null && str(voltageRaw).includes('/') ? kvNum(str(voltageRaw).split('/')[1]) : null,
      unit_no: (extra.unit_no as string) ?? null,
      tier_hint: tierHint,
      status_hint: 'ENERGIZED',
      confidence: object_type === 'GITET' || object_type === 'GENERATING_UNIT' ? 0.9 : 0.8,
      is_bay,
      bay_feeder_key: null,
      bay_kind: is_bay ? bay_kind : null,
      has_transformer: false,
      has_capacitor: false,
      transformer_count: null,
      capacitor_count: null,
      symbol_note: null,
      view_keys: [],
      outlet_key: bus150Raw ? str(bus150Raw) : null,
      role_hint: object_type === 'GENERATING_UNIT' ? 'SOURCE' : null,
      bay_circuit_count: null,
      risk_seq: [],
      risk_level: 'Normal',
      connected_keys: [],
      impacted_keys: [],
      funct_loc: null,
      condition: null,
      impact: null,
      mitigation: null,
      follow_up: null,
      ...extra
    };
    objects.set(key, obj);
    return obj;
  };

  // ---- pass 1: object rows (rows without a Dari/Ke pair) ----
  for (const r of rows) {
    if (isLineRow(r)) continue;
    const giVal = col.gi >= 0 ? str(r[headers[col.gi]]) : '';
    const codeVal = col.code >= 0 ? r[headers[col.code]] : undefined;
    const assetTypeVal = col.assetType >= 0 ? str(r[headers[col.assetType]]) : '';
    const nameVal = giVal || str(codeVal);
    const voltRaw = col.voltage >= 0 ? r[headers[col.voltage]] : defaultVoltage;
    const bus150Raw = col.bus150 >= 0 ? r[headers[col.bus150]] : undefined;
    const tierVal = col.tier >= 0 ? intOr(r[headers[col.tier]]) : null;
    const riskVal = col.risk >= 0 ? normalizeRiskLevel(r[headers[col.risk]]) : 'Normal';
    const riskNo = col.riskNumber >= 0 ? riskNumbers(r[headers[col.riskNumber]]) : [];
    const ibtNo = col.ibtNumber >= 0 ? str(r[headers[col.ibtNumber]]) : null;
    const shapeVal = col.busbarShape >= 0 ? str(r[headers[col.busbarShape]]) : '';
    const capVal = col.capacity >= 0 ? numOr(r[headers[col.capacity]]) : null;
    if (!nameVal) continue;

    const obj = ensureObject(nameVal, codeVal, assetTypeVal, voltRaw, tierVal, bus150Raw, {
      unit_no: ibtNo,
      outlet_key: bus150Raw ? str(bus150Raw) : null,
      role_hint: isRawan(riskVal) ? 'RISK' : undefined,
      risk_seq: riskNo,
      risk_level: riskVal,
      connected_keys: keyList(col.connectedTo >= 0 ? r[headers[col.connectedTo]] : undefined),
      impacted_keys: keyList(col.impactedGis >= 0 ? r[headers[col.impactedGis]] : undefined),
      funct_loc: col.functLoc >= 0 ? str(r[headers[col.functLoc]]) || null : null,
      condition: col.condition >= 0 ? str(r[headers[col.condition]]) || null : null,
      impact: col.impact >= 0 ? str(r[headers[col.impact]]) || null : null,
      mitigation: col.mitigation >= 0 ? str(r[headers[col.mitigation]]) || null : null,
      follow_up: col.solution >= 0 ? str(r[headers[col.solution]]) || null : null
    });
    if (norm(shapeVal).includes('panjang') || norm(shapeVal).includes('wide')) {
      obj.has_transformer = true; // marker: treat as wide busbar hint via capacity below
    }
    if (riskNo.length) {
      for (const n of riskNo) {
        (riskByView['flex'] ??= new Set()).add(n);
      }
    }
    if (col.viewKey >= 0) {
      const vk = str(r[headers[col.viewKey]]).trim().toUpperCase();
      if (vk) {
        viewKeys.add(vk);
        if (!obj.view_keys.includes(vk)) obj.view_keys.push(vk);
      }
    }
  }

  // ---- pass 2: line rows ----
  for (const r of rows) {
    if (!isLineRow(r)) continue;
    const dariVal = col.from >= 0 ? str(r[headers[col.from]]) : '';
    const keVal = col.to >= 0 ? str(r[headers[col.to]]) : '';
    if (!dariVal || !keVal) continue;
    const lineNameVal =
      col.lineName >= 0 && str(r[headers[col.lineName]]) !== ''
        ? str(r[headers[col.lineName]])
        : `${dariVal} - ${keVal}`;
    const voltRaw = col.voltage >= 0 ? r[headers[col.voltage]] : defaultVoltage;
    const voltStr = str(voltRaw) || defaultVoltage;
    const sldTypeVal = col.assetType >= 0 ? str(r[headers[col.assetType]]) : '';
    const isIbt = norm(sldTypeVal).includes('ibt') || norm(lineNameVal).includes('ibt');
    // an IBT bay spans two voltage levels; split "500/150 kV" per endpoint
    let srcVolt = voltStr;
    let dstVolt = voltStr;
    if (isIbt && voltStr.includes('/')) {
      const parts = voltStr.split('/');
      srcVolt = `${parts[0].trim()} kV`;
      const lv = parts[1].trim();
      dstVolt = /\d/.test(lv) ? (norm(lv).includes('kv') ? lv : `${lv} kV`) : voltStr;
    }
    const riskLevelVal = col.risk >= 0 ? normalizeRiskLevel(r[headers[col.risk]]) : 'Normal';
    const riskNo = col.riskNumber >= 0 ? riskNumbers(r[headers[col.riskNumber]]) : [];
    const tierFromVal = col.tierFrom >= 0 ? intOr(r[headers[col.tierFrom]]) : null;
    const tierToVal = col.tierTo >= 0 ? intOr(r[headers[col.tierTo]]) : null;
    const symbolFromVal = col.symbolFrom >= 0 ? str(r[headers[col.symbolFrom]]) : '';
    const symbolToVal = col.symbolTo >= 0 ? str(r[headers[col.symbolTo]]) : '';
    const bus150Raw = col.bus150 >= 0 ? r[headers[col.bus150]] : undefined;

    // risk lives on the IBT wheel itself (the connection), not its busbars
    const endpointRisk = isIbt
      ? { risk_seq: [], risk_level: 'Normal' as RiskCategory }
      : { risk_seq: riskNo, risk_level: riskLevelVal };
    const src = ensureObject(dariVal, undefined, symbolFromVal, srcVolt, tierFromVal, bus150Raw, endpointRisk);
    const dst = ensureObject(keVal, undefined, symbolToVal, dstVolt, tierToVal, undefined, endpointRisk);

    const lenVal = col.lengthKm >= 0 ? numOr(r[headers[col.lengthKm]]) : null;
    const loadVal = col.load >= 0 ? pcOr(r[headers[col.load]]) : null;
    const loadC2Val = col.loadC2 >= 0 ? pcOr(r[headers[col.loadC2]]) : null;
    const circuitsVal = col.circuits >= 0 ? intOr(r[headers[col.circuits]]) ?? 2 : 2;
    const condVal = col.condition >= 0 ? str(r[headers[col.condition]]) || null : null;
    const impactVal = col.impact >= 0 ? str(r[headers[col.impact]]) || null : null;
    const mitigVal = col.mitigation >= 0 ? str(r[headers[col.mitigation]]) || null : null;
    const solVal = col.solution >= 0 ? str(r[headers[col.solution]]) || null : null;
    const corridorVal = col.corridor >= 0 ? str(r[headers[col.corridor]]) : null;
    const uitVal = col.uit >= 0 ? str(r[headers[col.uit]]) : null;
    if (corridorVal && !regionHint) regionHint = corridorVal;
    const statusVal = col.status >= 0 ? statusMap(r[headers[col.status]]) : 'ENERGIZED';

    if (riskLevelVal !== 'Normal') {
      for (const n of riskNo) {
        (riskByView['flex'] ??= new Set()).add(n);
      }
    }

    if (isIbt) {
      const unitNo = lineNameVal.match(/ibt\s*(\d+)/i)?.[1] ?? null;
      connections.push({
        from_external_key: src.external_key,
        to_external_key: dst.external_key,
        relation_type: 'IBT_LINK',
        circuit_type_hint: 'IBT_LINK',
        status_hint: statusVal,
        circuit_count: 1,
        circuit_number: col.circuitNumber >= 0 ? intOr(r[headers[col.circuitNumber]]) : null,
        unit_no: unitNo,
        single_phi: false,
        confidence: 1.0,
        note: lineNameVal,
        view_keys: [],
        line_name: lineNameVal,
        voltage_kv: kvNum(dstVolt) ?? kvNum(voltStr),
        length_km: lenVal,
        loading_c1: loadVal,
        loading_c2: loadC2Val,
        corridor: corridorVal || null,
        uit: uitVal,
        tier_from_hint: tierFromVal,
        tier_to_hint: tierToVal,
        risk_seq: riskNo,
        risk_level: riskLevelVal,
        condition: condVal,
        impact: impactVal,
        mitigation: mitigVal,
        follow_up: solVal
      });
      continue;
    }

    connections.push({
      from_external_key: src.external_key,
      to_external_key: dst.external_key,
      relation_type: 'CONNECTED_TO',
      circuit_type_hint: lineTypeHint(lineNameVal),
      status_hint: statusVal,
      circuit_count: circuitsVal,
      circuit_number: col.circuitNumber >= 0 ? intOr(r[headers[col.circuitNumber]]) : null,
      unit_no: null,
      single_phi: false,
      confidence: riskLevelVal === 'Normal' ? 0.85 : 0.8,
      note: lineNameVal,
      view_keys: [],
      line_name: lineNameVal,
      voltage_kv: kvNum(voltStr),
      length_km: lenVal,
      loading_c1: loadVal,
      loading_c2: loadC2Val,
      corridor: corridorVal || null,
      uit: uitVal,
      tier_from_hint: tierFromVal,
      tier_to_hint: tierToVal,
      risk_seq: riskNo,
      risk_level: riskLevelVal,
      condition: condVal,
      impact: impactVal,
      mitigation: mitigVal,
      follow_up: solVal
    });
  }

  // ---- pass 3: IBT -> Bus 150 kV links ------------------------------------
  // For every IBT object that carries an outlet/bus150 hint, emit an IBT_LINK
  // connection toward the LV busbar key so the 150 kV side is explicit
  // (mirrors the engine's `Bus 150 kV` handling).
  const objList = [...objects.values()];
  for (const o of objList) {
    if (o.object_type !== 'IBT') continue;
    const lv = o.outlet_key ? cleanKey(o.outlet_key) : null;
    if (!lv) continue;
    const target = objects.get(lv);
    if (!target) {
      issues.push({ level: 'warning', message: `Bus 150 kV "${o.outlet_key}" untuk IBT ${o.external_key} tidak ditemukan.` });
      continue;
    }
    const existing = connections.some(
      (c) =>
        c.from_external_key === o.external_key &&
        c.to_external_key === target.external_key &&
        c.relation_type === 'IBT_LINK'
    );
    if (!existing) {
      connections.push({
        from_external_key: o.external_key,
        to_external_key: target.external_key,
        relation_type: 'IBT_LINK',
        circuit_type_hint: 'IBT_LINK',
        status_hint: o.status_hint,
        circuit_count: 1,
        unit_no: o.unit_no,
        single_phi: false,
        confidence: 1.0,
        note: `IBT${o.unit_no ? ' ' + o.unit_no : ''} ${o.external_key}`,
        view_keys: [...o.view_keys],
        line_name: `IBT${o.unit_no ? ' ' + o.unit_no : ''} ${o.external_key}`,
        voltage_kv: o.voltage_lv_kv ?? kvNum(`${o.voltage_hv_kv}/${o.voltage_lv_kv}`),
        length_km: null,
        loading_c1: null,
        loading_c2: null,
        corridor: regionHint || null,
        uit: null,
        tier_from_hint: o.tier_hint,
        tier_to_hint: null,
        risk_seq: [...o.risk_seq],
        risk_level: o.risk_level,
        condition: null,
        impact: null,
        mitigation: null,
        follow_up: null
      });
      o.risk_seq = [];
      o.risk_level = 'Normal';
    }
  }

  // ---- risks: pin by seq using riskByView + line/object pins --------------
  const risks = buildRisksFromState(objList, connections);

  const subsystemName = ctx.subsystem || regionHint || guessSubsystemName(ctx.filename);
  return {
    payload: {
      meta: {
        filename: ctx.filename,
        document_type: 'SLD_SHEET_XLSX',
        analytical_hint: 'SUBSYSTEM_500_150',
        source_ref: `Template fleksibel (${ctx.filename})`,
        effective_date: null
      },
      subsystem: {
        code: `SS_${cleanKey(subsystemName).slice(0, 8).toUpperCase() || 'NEW'}`,
        name: subsystemName,
        apb: regionHint || 'UP2B',
        views:
          viewKeys.size > 0
            ? [...viewKeys].map((vk) => ({ view_key: vk, name: vk, source_keys: ['flex'] }))
            : [{ view_key: 'FLEX', name: 'Sudut Pandang Utama', source_keys: ['flex'] }]
      },
      objects: objList,
      connections,
      risks
    },
    issues
  };
}

export interface FlexWorkbookOverride {
  /** Sheet whose manual column mapping should be applied (usually the active sheet). */
  sheetName?: string;
  mapping?: ColumnMapping;
}

/**
 * Multi-sheet flexible workbook parser: classifies every worksheet on the fly
 * (object sheet = GI rows, line sheet = Dari/Ke rows, risk sheet = No
 * Kerawanan + Kondisi/Dampak/Mitigasi rows), parses object sheets first so
 * their richer node data wins, merges the line-sheet connections on top, and
 * finally rebuilds the risk registry from the unioned state (or from a
 * dedicated risk sheet pinned by seq).
 */
export function parseFlexibleWorkbook(
  wb: XLSX.WorkBook,
  ctx: FlexSheetContext,
  override?: FlexWorkbookOverride
): EngineParseResult {
  const issues: EngineParseResult['issues'] = [];

  interface ClassifiedSheet {
    name: string;
    sheet: XLSX.WorkSheet;
    mapping: ColumnMapping;
  }

  const objectSheets: ClassifiedSheet[] = [];
  const lineSheets: ClassifiedSheet[] = [];
  const riskSheets: Array<{ name: string; sheet: XLSX.WorkSheet }> = [];

  const classify = (headers: string[]) => {
    const m = autoDetectMapping(headers);
    const isLine = Boolean(m.from && m.to);
    const shortColumn = (h: string | undefined) => (h ? h.length > 0 && h.length <= 40 : false);
    // an object sheet needs a real, short GI column plus at least one object
    // marker column; this keeps symbol/description sheets and legends out.
    const isObject =
      shortColumn(m.gi) &&
      Boolean(m.assetType || m.code || m.tier || m.capacity || m.ibtNumber || m.busbarShape);
    const isRisk = Boolean(m.noKerawanan && (m.condition || m.impact || m.mitigation || m.solution));
    return { isLine, isObject, isRisk, m };
  };

  for (const sn of wb.SheetNames) {
    const { headers } = readHeaderRows(wb.Sheets[sn]);
    if (!headers.length) continue;
    const { isLine, isObject, isRisk, m } = classify(headers);
    const mapping =
      override && override.sheetName === sn && override.mapping
        ? { ...emptyColumnMapping(), ...override.mapping }
        : m;
    if (isLine) {
      lineSheets.push({ name: sn, sheet: wb.Sheets[sn], mapping });
    } else if (isObject) {
      objectSheets.push({ name: sn, sheet: wb.Sheets[sn], mapping });
    } else if (isRisk) {
      riskSheets.push({ name: sn, sheet: wb.Sheets[sn] });
    }
  }

  if (!objectSheets.length && !lineSheets.length) {
    issues.push({
      level: 'error',
      message: 'Tidak ada sheet Objek (GI) atau sheet Jalur Transmisi (kolom Dari-Ke GI) yang dikenali di workbook ini.'
    });
    return { payload: emptyPayload(ctx.filename), issues };
  }

  const objects = new Map<string, EngineObject>();
  const connections: EngineConnection[] = [];
  const viewKeys = new Set<string>();
  let regionHint = ctx.region || '';

  const mergePayload = (p: EnginePayload) => {
    for (const o of p.objects) {
      const ex = objects.get(o.external_key);
      if (!ex) {
        objects.set(o.external_key, o);
      } else {
        // object-sheet data parsed first wins; union risk pins and upgrade level
        if (ex.tier_hint === null && o.tier_hint !== null) ex.tier_hint = o.tier_hint;
        if (!ex.raw_label) ex.raw_label = o.raw_label;
        for (const rn of o.risk_seq) {
          if (!ex.risk_seq.includes(rn)) ex.risk_seq.push(rn);
        }
        if (ex.risk_level === 'Normal' && isRawan(o.risk_level)) ex.risk_level = o.risk_level;
      }
      for (const vk of o.view_keys) viewKeys.add(vk);
    }
    for (const c of p.connections) {
      const dup = connections.some(
        (x) =>
          x.from_external_key === c.from_external_key &&
          x.to_external_key === c.to_external_key &&
          x.relation_type === c.relation_type &&
          (x.circuit_number ?? null) === (c.circuit_number ?? null) &&
          (x.unit_no ?? null) === (c.unit_no ?? null)
      );
      if (!dup) connections.push(c);
      if (c.corridor && !regionHint) regionHint = c.corridor;
      for (const vk of c.view_keys) viewKeys.add(vk);
    }
  };

  // object sheets first (authoritative node data), then line sheets
  for (const s of [...objectSheets, ...lineSheets]) {
    const { payload, issues: sheetIssues } = parseFlexibleSheet(s.sheet, s.mapping, ctx);
    issues.push(...sheetIssues);
    mergePayload(payload);
  }

  const objList = [...objects.values()];
  const subsystemName = ctx.subsystem || regionHint || guessSubsystemName(ctx.filename);

  let risks: EngineRisk[] = [];
  if (riskSheets.length) {
    const pinBySeq = new Map<number, { pin_kind: EngineRisk['pin_kind']; pin_key: string | null }>();
    for (const o of objList) {
      for (const rn of o.risk_seq) pinBySeq.set(rn, { pin_kind: 'SUBSTATION', pin_key: o.external_key });
    }
    for (const c of connections) {
      for (const rn of c.risk_seq) {
        pinBySeq.set(rn, { pin_kind: 'CIRCUIT', pin_key: `${c.from_external_key}-${c.to_external_key}` });
      }
    }
    const bySeq = new Map<number, EngineRisk>();
    for (const rs of riskSheets) {
      const { headers, rows } = readHeaderRows(rs.sheet);
      const m = autoDetectMapping(headers);
      const i = (h: string) => (h ? headers.indexOf(h) : -1);
      const colSeq = i(m.noKerawanan);
      const colUit = i(m.uit);
      const colCond = i(m.condition);
      const colImpact = i(m.impact);
      const colMitig = i(m.mitigation);
      const colSol = i(m.solution);
      for (const r of rows) {
        const seqs = colSeq >= 0 ? riskNumbers(r[headers[colSeq]]) : [];
        if (!seqs.length) continue;
        const cond = colCond >= 0 ? str(r[headers[colCond]]) : '';
        for (const seq of seqs) {
          if (bySeq.has(seq)) continue;
          const pin = pinBySeq.get(seq);
          const conn = connections.find((c) => c.risk_seq.includes(seq));
          bySeq.set(seq, {
            seq_no: seq,
            uit: colUit >= 0 ? str(r[headers[colUit]]) : '',
            category: conn?.risk_level || 'Normal',
            title: firstLine(cond) || conn?.line_name || `Kerawanan #${seq}`,
            condition: cond,
            impact: colImpact >= 0 ? str(r[headers[colImpact]]) : '',
            mitigation: colMitig >= 0 ? str(r[headers[colMitig]]) : '',
            follow_up: colSol >= 0 ? str(r[headers[colSol]]) : '',
            pin_kind: pin?.pin_kind ?? null,
            pin_key: pin?.pin_key ?? null
          });
        }
      }
    }
    risks = [...bySeq.values()];
  } else {
    risks = buildRisksFromState(objList, connections);
  }

  return {
    payload: {
      meta: {
        filename: ctx.filename,
        document_type: 'SLD_WORKBOOK_XLSX',
        analytical_hint: 'SUBSYSTEM_500_150',
        source_ref: `Template fleksibel multi-sheet (${ctx.filename})`,
        effective_date: null
      },
      subsystem: {
        code: `SS_${cleanKey(subsystemName).slice(0, 8).toUpperCase() || 'NEW'}`,
        name: subsystemName,
        apb: regionHint || 'UP2B',
        views:
          viewKeys.size > 0
            ? [...viewKeys].map((vk) => ({ view_key: vk, name: vk, source_keys: ['flex'] }))
            : [{ view_key: 'FLEX', name: 'Sudut Pandang Utama', source_keys: ['flex'] }]
      },
      objects: objList,
      connections,
      risks
    },
    issues
  };
}

export function emptyPayload(filename: string): EnginePayload {
  return {
    meta: {
      filename,
      document_type: 'SLD_SHEET_XLSX',
      analytical_hint: 'SUBSYSTEM_500_150',
      source_ref: null,
      effective_date: null
    },
    subsystem: { code: 'SS_NEW', name: guessSubsystemName(filename), apb: '', views: [] },
    objects: [],
    connections: [],
    risks: []
  };
}

// ===========================================================================
// Multi-sheet engine template parser (port of app/services/ingest_parser.py)
// ===========================================================================

export function parseEngineWorkbook(wb: XLSX.WorkBook, filename: string): EngineParseResult {
  const issues: EngineParseResult['issues'] = [];
  const wsAsset = pickSheet(wb, ['Gardu_Induk_dan_Aset', 'Gardu Induk dan Aset', 'Aset', 'Asset']);
  const wsLine = pickSheet(wb, ['Jalur_Transmisi', 'Jalur Transmisi', 'Penghantar']);
  const wsRisk = pickSheet(wb, ['Data_Kerawanan_Detail', 'Data Kerawanan Detail', 'Kerawanan']);
  const wsInfo = pickSheet(wb, ['Info', 'Informasi', 'Subsistem', 'Header']);
  const wsBay = pickSheet(wb, ['Bay', 'Bays']);
  const wsViews = pickSheet(wb, ['Views', 'Sudut Pandang', 'SLD Views']);

// Deterministic sheet detection: only run the full multi-sheet engine parse
  // when BOTH strict engine sheets are present; any other workbook falls back
  // to the smart flexible workbook parser (object + line + risk sheets).
  if (!hasEngineSheets(wb)) {
    return parseFlexibleWorkbook(wb, { filename, defaultVoltage: '150 kV' });
  }

  const info: Record<string, unknown> = {};
  if (wsInfo) {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wsInfo, { header: 1 });
    for (const row of grid) {
      if (Array.isArray(row) && row[0] !== null && row[0] !== undefined) {
        info[norm(row[0])] = row[1];
      }
    }
  }
  const ssCode = str(info['kode subsistem'] || info['kode'] || '').trim().toUpperCase() || `SS_${cleanKey(filename).slice(0, 6)}`;
  const ssName = str(info['nama subsistem'] || info['nama'] || guessSubsystemName(filename)).trim();

  const objRaw: { code: string; row: Record<string, unknown> }[] = [];
  if (wsAsset) {
    for (const row of readHeaderRows(wsAsset).rows) {
      const code = get(row, 'Kode Singkatan', 'Kode', 'Code');
      const atype = norm(get(row, 'Tipe Asset', 'Tipe', 'Type'));
      if (!code || atype.includes('ibt') || atype.includes('winding')) continue;
      objRaw.push({ code: str(code).trim(), row });
    }
  }

  const objects = new Map<string, EngineObject>();
  for (const { code, row } of objRaw) {
    const name = str(get(row, 'Nama Asset / GI', 'Nama Asset', 'Nama GI', 'Name'));
    const { object_type, is_bay, bay_kind } = resolveObjectType(
      get(row, 'Tipe Asset', 'Tipe', 'Type'),
      name,
      get(row, 'Tegangan', 'Voltage'),
      ''
    );
    const tierTmp = get(row, 'Tier (Mulai 0)', 'Tier', 'Tier (Mulai 1)');
    const useZeroBased = Object.keys(row).some((k) => norm(k) === 'tier (mulai 0)');
    const tierRaw = intOr(tierTmp);
    const tier = tierRaw === null ? null : useZeroBased ? tierRaw + 1 : tierRaw;
    const status = statusMap(get(row, 'Status Operasi', 'Status'));
    const riskLevel = normalizeRiskLevel(get(row, 'Status Kerawanan', 'Tingkat Kerawanan', 'Kerawanan'));
    const riskNo = riskNumbers(get(row, 'No Kerawanan', 'No. Kerawanan'));

    objects.set(code, {
      external_key: code,
      object_type,
      raw_label: name || code,
      site_name: name || code,
      voltage_hv_kv: kvNum(get(row, 'Tegangan', 'Voltage')),
      voltage_lv_kv: null,
      unit_no: null,
      tier_hint: tier,
      status_hint: status,
      confidence: object_type === 'GITET' || object_type === 'GISTET' ? 0.9 : 0.8,
      is_bay,
      bay_feeder_key: str(get(row, 'Feeder (GI Induk)', 'Feeder', 'GI Induk', 'Induk') || null) || null,
      bay_kind: is_bay ? bay_kind : null,
      has_transformer: boolOr(get(row, 'Ada Trafo', 'Has Transformer')),
      has_capacitor: boolOr(get(row, 'Ada Kapasitor', 'Has Capacitor')),
      transformer_count: intOr(get(row, 'Jumlah Trafo', 'Transformer Count')),
      capacitor_count: intOr(get(row, 'Jumlah Kapasitor', 'Capacitor Count')),
      symbol_note: str(get(row, 'Catatan Simbol', 'Symbol Note')).trim() || null,
      view_keys: tokens(get(row, 'Sudut Pandang', 'View', 'View Key')),
      outlet_key: str(get(row, 'Bus Terhubung', 'Outlet Bus', 'Terhubung ke Bus') || null) || null,
      role_hint: str(get(row, 'Role', 'Peran', 'Peran SLD')).trim().toUpperCase() || null,
      bay_circuit_count: intOr(get(row, 'Jumlah Sirkit Bay', 'Jumlah Sirkit', 'Sirkit', 'Circuit Count')),
      risk_seq: riskNo,
      risk_level: riskLevel,
      connected_keys: [],
      impacted_keys: [],
      funct_loc: null,
      condition: null,
      impact: null,
      mitigation: null,
      follow_up: null
    });
  }

  // IBT n-Winding rows -> IBT_LINK connections (GITET bus -> Bus 150 kV)
  const pendingIbt: EngineConnection[] = [];
  if (wsAsset) {
    for (const row of readHeaderRows(wsAsset).rows) {
      const atype = norm(get(row, 'Tipe Asset', 'Tipe', 'Type'));
      if (!atype.includes('ibt') && !atype.includes('winding')) continue;
      const unit = str(get(row, 'No IBT', 'Unit', 'No Unit') || '1').trim();
      const rawCode = str(get(row, 'Kode Singkatan', 'Kode', 'Code'));
      const hvRaw = get(row, 'Bus HV', 'Bus Primer', 'GITET Induk');
      const hv = hvRaw ? str(hvRaw).trim().toUpperCase() : rawCode.split(/\s+/).pop()?.toUpperCase() ?? '';
      const lvRaw = get(row, 'Bus 150 kV', 'Bus 150kV', 'Bus LV', 'Ke Bus', 'Bus');
      const lv = lvRaw ? str(lvRaw).trim().toUpperCase() : null;
      if (!hv || !lv) continue;
      if (!objects.has(hv) || !objects.has(lv)) {
        issues.push({ level: 'warning', message: `IBT ${unit} ${rawCode}: endpooint tidak dikenal ${hv} -> ${lv}` });
        continue;
      }
      const gk = objects.get(hv)!;
      const ok = objects.get(lv)!;
      const gitetKey = objects.has(hv) ? hv : hv;
      const riskNo = riskNumbers(get(row, 'No Kerawanan', 'No. Kerawanan'));
      gk.tier_hint = gk.tier_hint ?? 0;
      ok.tier_hint = ok.tier_hint ?? 1;
      pendingIbt.push({
        from_external_key: gitetKey,
        to_external_key: ok.external_key,
        relation_type: 'IBT_LINK',
        circuit_type_hint: 'IBT_LINK',
        status_hint: statusMap(get(row, 'Status Operasi', 'Status')),
        circuit_count: 1,
        unit_no: unit,
        single_phi: false,
        confidence: 1.0,
        note: rawCode,
        view_keys: tokens(get(row, 'Sudut Pandang', 'View', 'View Key')),
        line_name: `IBT ${unit} ${hv}`,
        voltage_kv: 500,
        length_km: null,
        loading_c1: null,
        loading_c2: null,
        corridor: null,
        uit: null,
        tier_from_hint: 0,
        tier_to_hint: 1,
        risk_seq: riskNo,
        risk_level: normalizeRiskLevel(get(row, 'Status Kerawanan', 'Tingkat Kerawanan')),
        condition: null,
        impact: null,
        mitigation: null,
        follow_up: null
      });
    }
  }

  // Bay sheet
  const bayLinks: EngineConnection[] = [];
  if (wsBay) {
    const { rows } = readHeaderRows(wsBay);
    for (const row of rows) {
      const code = str(get(row, 'Kode GI', 'Kode', 'Code')).trim();
      const feeder = str(get(row, 'Feeder (GI Induk)', 'Feeder', 'GI Induk', 'Induk')).trim();
      if (!code || !feeder) continue;
      const existing = objects.get(code);
      const bayKindRaw = str(get(row, 'Jenis', 'Jenis Bay', 'Tipe') || 'SUTT').trim().toUpperCase() || 'SUTT';
      if (existing) {
        existing.is_bay = true;
        existing.bay_feeder_key = feeder;
        existing.bay_circuit_count = intOr(get(row, 'Jumlah Sirkit', 'Sirkit', 'Circuit Count'));
        existing.view_keys = tokens(get(row, 'Sudut Pandang', 'View', 'View Key'));
        existing.risk_seq = [...riskNumbers(get(row, 'No Kerawanan', 'No. Kerawanan'))];
      } else {
        objects.set(code, {
          external_key: code,
          object_type: 'BAY',
          raw_label: str(get(row, 'Nama GI', 'Nama') || code),
          site_name: str(get(row, 'Nama GI', 'Nama') || code),
          voltage_hv_kv: kvNum(get(row, 'Tegangan')),
          voltage_lv_kv: null,
          unit_no: null,
          tier_hint: null,
          status_hint: statusMap(get(row, 'Status Operasi', 'Status')),
          confidence: 0.7,
          is_bay: true,
          bay_feeder_key: feeder,
          bay_kind: bayKindRaw,
          has_transformer: false,
          has_capacitor: false,
          transformer_count: null,
          capacitor_count: null,
          symbol_note: null,
          view_keys: tokens(get(row, 'Sudut Pandang', 'View', 'View Key')),
          outlet_key: null,
          role_hint: null,
          bay_circuit_count: intOr(get(row, 'Jumlah Sirkit', 'Sirkit', 'Circuit Count')),
          risk_seq: riskNumbers(get(row, 'No Kerawanan', 'No. Kerawanan')),
          risk_level: 'Normal',
          connected_keys: [],
          impacted_keys: [],
          funct_loc: null,
          condition: null,
          impact: null,
          mitigation: null,
          follow_up: null
        });
      }
      if (objects.has(feeder)) {
        bayLinks.push({
          from_external_key: code,
          to_external_key: feeder,
          relation_type: 'CONNECTED_TO',
          circuit_type_hint: 'SUTT',
          status_hint: 'ENERGIZED',
          circuit_count: 1,
          circuit_number: null,
          unit_no: null,
          single_phi: false,
          confidence: 0.7,
          note: null,
          view_keys: [],
          line_name: null,
          voltage_kv: null,
          length_km: null,
          loading_c1: null,
          loading_c2: null,
          corridor: null,
          uit: null,
          tier_from_hint: null,
          tier_to_hint: null,
          risk_seq: [],
          risk_level: 'Normal',
          condition: null,
          impact: null,
          mitigation: null,
          follow_up: null
        });
      }
    }
  }

  // Connections from Jalur_Transmisi
  const connections = [...pendingIbt, ...bayLinks];
  if (wsLine) {
    for (const row of readHeaderRows(wsLine).rows) {
      const fr = str(get(row, 'Dari GI', 'Dari', 'From')).trim();
      const to = str(get(row, 'Ke GI', 'Ke', 'To')).trim();
      if (!fr || !to) continue;
      const fk = objects.has(fr) ? fr : fr;
      const tk = objects.has(to) ? to : to;
      if (!objects.has(fk)) {
        issues.push({ level: 'warning', message: `Endpoint at Jalur_Transmisi tidak dikenal: ${fr}` });
        continue;
      }
      if (!objects.has(tk)) {
        issues.push({ level: 'warning', message: `Endpoint at Jalur_Transmisi tidak dikenal: ${to}` });
        continue;
      }
      const lineNameVal = str(get(row, 'Nama Penghantar', 'Nama', 'Name'));
      const riskLevel = normalizeRiskLevel(get(row, 'Tingkat Kerawanan', 'Kerawanan'));
      const riskNo = riskNumbers(get(row, 'No Kerawanan', 'No. Kerawanan'));
      connections.push({
        from_external_key: fk,
        to_external_key: tk,
        relation_type: 'CONNECTED_TO',
        circuit_type_hint: lineTypeHint(get(row, 'Nama Penghantar', 'Nama', 'Name')),
        status_hint: statusMap(get(row, 'Status Operasi', 'Status')),
        circuit_count: intOr(get(row, 'Jumlah Sirkit', 'Sirkit')) ?? 2,
        circuit_number: intOr(get(row, 'No Sirkit', 'Nomor Sirkit', 'Circuit Number', 'Circuit No')),
        unit_no: null,
        single_phi: boolOr(get(row, 'Single Phi', 'Single-phi', 'Single Phase')),
        confidence: 0.85,
        note: lineNameVal || null,
        view_keys: tokens(get(row, 'Sudut Pandang', 'View', 'View Key')),
        line_name: lineNameVal || null,
        voltage_kv: kvNum(get(row, 'Tegangan')),
        length_km: numOr(get(row, 'Panjang Saluran (km)', 'Panjang')),
        loading_c1: pcOr(get(row, 'Pembebanan Sirkit 1 (%)', 'Pembebanan 1', 'Pembebanan Sirkit 1')),
        loading_c2: pcOr(get(row, 'Pembebanan Sirkit 2 (%)', 'Pembebanan 2', 'Pembebanan Sirkit 2')),
        corridor: str(get(row, 'Koridor / Wilayah', 'Koridor', 'Wilayah')).trim() || null,
        uit: str(get(row, 'UIT')).trim() || null,
        tier_from_hint: intOr(get(row, 'Tier Dari', 'Tier Dari GI')),
        tier_to_hint: intOr(get(row, 'Tier Ke', 'Tier Ke GI')),
        risk_seq: riskNo,
        risk_level: riskLevel,
        condition: str(get(row, 'Kondisi / Permasalahan', 'Kondisi')).trim() || null,
        impact: str(get(row, 'Dampak')).trim() || null,
        mitigation: str(get(row, 'Mitigasi')).trim() || null,
        follow_up: str(get(row, 'Usulan / Solusi', 'Usulan', 'Solusi')).trim() || null
      });
    }
  }

  // De-duplicate repeated (from, to, relation) tuples (e.g. a Bay also listed
  // as a Jalur_Transmisi endpoint).
  const seenConn = new Set<string>();
  for (let i = 0; i < connections.length; i++) {
    const c = connections[i];
    // IBT_LINK runs that share both endpoints are distinct units (IBT 2 & IBT 3);
    // parallel Sirkit 1 / Sirkit 2 rows are distinct circuits.
    const k = `${c.from_external_key}\u0000${c.to_external_key}\u0000${c.relation_type}\u0000${
      c.relation_type === 'IBT_LINK' ? c.unit_no ?? '1' : c.circuit_number ?? ''
    }`;
    if (seenConn.has(k)) {
      connections.splice(i, 1);
      i--;
    } else {
      seenConn.add(k);
    }
  }

  // Risks from Data_Kerawanan_Detail
  const risks: EngineRisk[] = [];
  const pinBySeq = new Map<number, { pin_kind: EngineRisk['pin_kind']; pin_key: string | null }>();
  for (const o of objects.values()) {
    for (const rn of o.risk_seq) pinBySeq.set(rn, { pin_kind: 'SUBSTATION', pin_key: o.external_key });
  }
  for (const c of connections) {
    for (const rn of c.risk_seq) {
      pinBySeq.set(rn, { pin_kind: 'CIRCUIT', pin_key: `${c.from_external_key}-${c.to_external_key}` });
    }
  }
  if (wsRisk) {
    for (const row of readHeaderRows(wsRisk).rows) {
      const seq = intOr(get(row, 'No', 'Seq'));
      const pin = seq !== null ? pinBySeq.get(seq) : null;
      risks.push({
        seq_no: seq,
        uit: str(get(row, 'UIT') || 'JBB').trim(),
        category: normalizeRiskLevel(get(row, 'Kategori Kontingensi', 'Kategori', 'Category')),
        title: firstLine(get(row, 'Kondisi / Permasalahan', 'Kondisi')),
        condition: str(get(row, 'Kondisi / Permasalahan', 'Kondisi')),
        impact: str(get(row, 'Dampak')),
        mitigation: str(get(row, 'Mitigasi')),
        follow_up: str(get(row, 'Usulan / Solusi', 'Usulan', 'Solusi')),
        pin_kind: pin?.pin_kind ?? null,
        pin_key: pin?.pin_key ?? null
      });
    }
  }

  // Views manifest
  const viewRows: Array<{ view_key: string; name: string; source_keys: string[] }> = [];
  if (wsViews) {
    for (const row of readHeaderRows(wsViews).rows) {
      const vk = str(get(row, 'View Key', 'Kunci View', 'Kode View', 'Sudut Pandang')).trim().toUpperCase();
      if (vk) {
        viewRows.push({
          view_key: vk,
          name: str(get(row, 'Nama View', 'Nama SLD', 'Name') || vk),
          source_keys: tokens(get(row, 'Sumber Tier-1 (kode GI, pisah ;)', 'Sumber Tier-1', 'Source Keys'))
        });
      }
    }
  }

  return {
    payload: {
      meta: {
        filename,
        document_type: 'SLD_TEMPLATE_XLSX',
        analytical_hint: 'SUBSYSTEM_500_150',
        source_ref: `Template subsistem PLN (${filename})`,
        effective_date: null
      },
      subsystem: { code: ssCode, name: ssName, apb: str(info['apb'] || info['up2b'] || null) || 'UP2B', views: viewRows },
      objects: [...objects.values()],
      connections,
      risks
    },
    issues
  };
}

export function parseWorkbookToPayload(wb: XLSX.WorkBook, filename: string): EngineParseResult {
  return parseEngineWorkbook(wb, filename);
}
