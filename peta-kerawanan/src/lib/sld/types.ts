export type EngineObjectType =
  | 'GITET'
  | 'GISTET'
  | 'GI'
  | 'GIS'
  | 'GENERATING_UNIT'
  | 'IBT'
  | 'TRAFO'
  | 'KAPASITOR'
  | 'BEBAN'
  | 'BAY';

export type EngineStatusHint =
  | 'ENERGIZED'
  | 'NEW_NOT_ENERGIZED'
  | 'PLANNED'
  | 'DE_ENERGIZED'
  | 'OWNED_BY_CUSTOMER';

export type EngineRelationType = 'CONNECTED_TO' | 'IBT_LINK';

export type RiskCategory =
  | 'N-1'
  | 'N-2'
  | 'N-1-1'
  | 'N-1-2'
  | 'N-0'
  | 'Normal'
  | 'Sedang'
  | 'Sangat Rawan'
  | 'Rawan';

export interface EngineObject {
  external_key: string;
  object_type: EngineObjectType;
  raw_label: string;
  site_name: string;
  voltage_hv_kv: number | null;
  voltage_lv_kv: number | null;
  unit_no: string | null;
  tier_hint: number | null;
  status_hint: EngineStatusHint;
  confidence: number;
  is_bay: boolean;
  bay_feeder_key: string | null;
  bay_kind: string | null;
  has_transformer: boolean;
  has_capacitor: boolean;
  transformer_count: number | null;
  capacitor_count: number | null;
  symbol_note: string | null;
  view_keys: string[];
  outlet_key: string | null;
  role_hint: string | null;
  bay_circuit_count: number | null;
  risk_seq: number[];
  risk_level: RiskCategory;
  /** Explicit related-asset keys from the `Terhubung ke` column (cleanKey'd). */
  connected_keys: string[];
  /** Explicit impacted-GI keys from the `GI Terdampak` column (cleanKey'd). */
  impacted_keys: string[];
  /** Functional Location ID (`ID FunctLoc` column) — join key to the asset DB. */
  funct_loc: string | null;
  /** Free-text detail columns (`Kondisi / Permasalahan`, `Dampak`, ...). */
  condition: string | null;
  impact: string | null;
  mitigation: string | null;
  follow_up: string | null;
}

export interface EngineConnection {
  from_external_key: string;
  to_external_key: string;
  relation_type: EngineRelationType;
  circuit_type_hint: 'SUTT' | 'SKTT' | 'IBT_LINK';
  status_hint: EngineStatusHint;
  circuit_count: number;
  /** Optional per-row sirkit number; legacy workbooks can omit it. */
  circuit_number?: number | null;
  unit_no: string | null;
  single_phi: boolean;
  confidence: number;
  note: string | null;
  view_keys: string[];
  line_name: string | null;
  voltage_kv: number | null;
  length_km: number | null;
  loading_c1: number | null;
  loading_c2: number | null;
  corridor: string | null;
  uit: string | null;
  tier_from_hint: number | null;
  tier_to_hint: number | null;
  risk_seq: number[];
  risk_level: RiskCategory;
  /** Free-text detail columns (`Kondisi / Permasalahan`, `Dampak`, ...). */
  condition: string | null;
  impact: string | null;
  mitigation: string | null;
  follow_up: string | null;
}

export interface EngineRisk {
  seq_no: number | null;
  uit: string;
  category: RiskCategory;
  title: string;
  condition: string;
  impact: string;
  mitigation: string;
  follow_up: string;
  pin_kind: 'SUBSTATION' | 'CIRCUIT' | 'TRANSFORMER' | null;
  pin_key: string | null;
}

export interface EngineMeta {
  filename: string;
  document_type: 'SLD_TEMPLATE_XLSX' | 'SLD_SHEET_XLSX' | 'SLD_WORKBOOK_XLSX' | 'SLD_HANDOFF_JSON';
  analytical_hint: string;
  source_ref: string | null;
  effective_date: string | null;
}

export interface EngineSubsystem {
  code: string;
  name: string;
  apb: string | null;
  views: Array<{ view_key: string; name: string; source_keys: string[] }>;
}

export interface EnginePayload {
  meta: EngineMeta;
  subsystem: EngineSubsystem;
  objects: EngineObject[];
  connections: EngineConnection[];
  risks: EngineRisk[];
}

export interface EngineParseIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
}

export interface EngineParseResult {
  payload: EnginePayload;
  issues: EngineParseIssue[];
}
