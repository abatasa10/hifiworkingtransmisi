import { ParsedGINode, ParsedTransmissionLine } from '../../data/customSLDStore';
import { EngineConnection, EngineObject, EnginePayload } from './types';

export type ParsedRiskStatus = ParsedGINode['riskStatus'];

const riskStatusOf = (level: string): ParsedRiskStatus => {
  const l = level.toUpperCase();
  if (l.includes('N-1-2') || l.includes('N-1-1') || l.includes('N12')) return 'N-1-2';
  if (l.includes('N-2') || l.includes('N2')) return 'N-2';
  if (l.includes('SANGAT RAWAN') || l.includes('KRITIS')) return 'Sangat Rawan';
  if (l.includes('SEDANG')) return 'Sedang';
  if (l.includes('RAWAN') || l.includes('N-1') || l.includes('N1')) return 'N-1';
  return 'Normal';
};

const voltageLabel = (hv: number | null, lv: number | null, fallback: string): string => {
  if (hv && lv) return `${Math.round(hv)}/${Math.round(lv)} kV`;
  if (hv) return `${Math.round(hv)} kV`;
  if (lv) return `${Math.round(lv)} kV`;
  return fallback;
};

const assetTypeOf = (o: EngineObject): ParsedGINode['assetType'] => {
  switch (o.object_type) {
    case 'GITET':
    case 'GISTET':
      return 'gitet';
    case 'GENERATING_UNIT':
      return 'pembangkit';
    case 'IBT':
      return 'ibt';
    case 'TRAFO':
      return 'trafo';
    case 'BEBAN':
      return 'beban';
    case 'GI':
    case 'GIS':
    case 'BAY':
      return o.is_bay ? 'gi' : 'gi';
    default:
      return 'busbar';
  }
};

export interface EngineViewBounding {
  giList: ParsedGINode[];
  lineList: ParsedTransmissionLine[];
  ibrLinks: ParsedTransmissionLine[];
}

/**
 * Convert the normalised engine payload into the flat node/line view model
 * the React Flow renderers consume. IBT_LINK connections are produced as
 * dedicated `transformer_link` lines so the 3-winding symbol renders on the
 * edge, exactly like the engine draws the IBT between a GITET and its 150 kV
 * bus.
 */
export function toViewModel(
  payload: EnginePayload,
  tierMap: Map<string, number>,
  subsystemName: string
): EngineViewBounding {
  const giList: ParsedGINode[] = [];
  const lineList: ParsedTransmissionLine[] = [];
  const ibrLinks: ParsedTransmissionLine[] = [];

  // Drop IBT objects that are not an endpoint of any connection: in the
  // current templates an IBT is drawn as an IBT_LINK edge (500kV bus -> 150kV
  // bus), not as a standalone node, so orphan IBT stubs would render as dead
  // nodes. Keep any IBT object that still participates in a connection.
  const endpointKeys = new Set<string>();
  for (const c of payload.connections) {
    endpointKeys.add(c.from_external_key);
    endpointKeys.add(c.to_external_key);
  }
  const droppedIbt = new Set<string>(
    payload.objects
      .filter((o) => o.object_type === 'IBT' && !endpointKeys.has(o.external_key))
      .map((o) => o.external_key)
  );

  const nodeByKey = new Map<string, ParsedGINode>();
  for (const o of payload.objects) {
    if (droppedIbt.has(o.external_key)) continue;
    const tier = tierMap.get(o.external_key);
    const riskStatus = riskStatusOf(o.risk_level);
    const volt = voltageLabel(o.voltage_hv_kv, o.voltage_lv_kv, o.object_type === 'IBT' ? '500/150 kV' : '150 kV');
    const region = payload.subsystem.apb || payload.subsystem.name || 'UP2B';
    if (o.object_type === 'GITET' || o.object_type === 'GISTET') {
      o.voltage_hv_kv = o.voltage_hv_kv ?? 500;
    }
    const node: ParsedGINode = {
      id: o.external_key,
      name: o.raw_label || o.external_key,
      code: o.external_key,
      assetType: assetTypeOf(o),
      voltage: volt,
      tier,
      ibtNumber: o.unit_no ?? (o.object_type === 'IBT' ? '1' : undefined),
      primaryVoltage: o.voltage_hv_kv ? `${Math.round(o.voltage_hv_kv)} kV` : undefined,
      secondaryVoltage: o.voltage_lv_kv ? `${Math.round(o.voltage_lv_kv)} kV` : undefined,
      capacityMVA: o.transformer_count ?? undefined,
      region,
      riskStatus,
      riskNumber: o.risk_seq[0],
      subsystem: subsystemName,
      uit: undefined,
      condition: undefined,
      isBay: o.is_bay,
      feederKey: o.bay_feeder_key ?? undefined,
      objectType: o.object_type,
      unitNo: o.unit_no ?? undefined,
      busLvKey: o.outlet_key ?? undefined
    };
    nodeByKey.set(o.external_key, node);
    giList.push(node);
  }

  const lineFrom = (c: EngineConnection): ParsedTransmissionLine => {
    const riskStatus = riskStatusOf(c.risk_level);
    const volt = c.voltage_kv ? `${Math.round(c.voltage_kv)} kV` : '150 kV';
    return {
      id: c.relation_type === 'IBT_LINK'
        ? `INTERNAL_IBT_${c.unit_no ?? 1}_${c.from_external_key}-${c.to_external_key}`
        : `LINE_${c.from_external_key}-${c.to_external_key}${c.unit_no ? '_' + c.unit_no : ''}`,
      sourceId: c.from_external_key,
      targetId: c.to_external_key,
      lineName: c.line_name || c.note || `${c.from_external_key} - ${c.to_external_key}`,
      circuit: `${c.circuit_count} Sirkit`,
      circuitCount: c.circuit_number ? 1 : c.circuit_count,
      circuitNumber: c.circuit_number ?? undefined,
      lengthKm: c.length_km ?? 0,
      loadingPct: c.loading_c1 ?? 0,
      loadingCircuit1: c.loading_c1 ?? 0,
      loadingCircuit2: c.loading_c2 ?? 0,
      voltage: volt,
      operatingStatus: c.status_hint === 'ENERGIZED' ? 'Beroperasi' : c.status_hint === 'PLANNED' ? 'Rencana' : 'Dalam Perbaikan',
      riskStatus,
      riskNumber: c.risk_seq[0],
      region: c.corridor || payload.subsystem.name,
      corridor: c.corridor ?? undefined,
      uit: c.uit ?? undefined
    };
  };

  for (const c of payload.connections) {
    if (droppedIbt.has(c.from_external_key) || droppedIbt.has(c.to_external_key)) continue;
    const line = lineFrom(c);
    if (c.relation_type === 'IBT_LINK') ibrLinks.push(line);
    else lineList.push(line);
  }

  return { giList, lineList, ibrLinks };
}
