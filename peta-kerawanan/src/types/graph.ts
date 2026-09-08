import { RiskLevel } from './system';

export type NodeType = 'gitet' | 'gi' | 'generator' | 'ibt' | 'busbar' | 'bay';

export interface SLDNodeData {
  id: string;
  name: string;
  code: string;
  type: NodeType;
  voltage: string;
  tier: number; // 1 to 6
  subsystemId?: string;
  capacityMW?: number;
  capacityMVA?: number;
  status: 'Beroperasi' | 'Pemeliharaan' | 'Rencana';
  riskId?: number;
  riskLevel?: RiskLevel;
  connectedEdgeIds?: string[];
  connectedNodeIds?: string[];
  // For IBT:
  primaryVoltage?: string;
  secondaryVoltage?: string;
  loading?: number;
  circuits?: number;
  details?: {
    province?: string;
    city?: string;
    lat?: number;
    lng?: number;
    operator?: string;
  };
  [key: string]: unknown;
}

export interface SLDEdgeData {
  id: string;
  source: string;
  target: string;
  name: string;
  type: 'transmission' | 'transformer_link' | 'koppel';
  voltage: '500 kV' | '150 kV' | '70 kV';
  circuitCount: number;
  lengthKm?: number;
  conductorType?: string;
  operatingStatus: 'Beroperasi' | 'Dalam Perbaikan' | 'Rencana';
  status: 'normal' | 'warning' | 'critical' | 'planned';
  loading: {
    circuit1: number;
    circuit2?: number;
    circuit3?: number;
    circuit4?: number;
  };
  riskId?: number;
  riskLevel?: RiskLevel;
  highlighted?: boolean;
  dimmed?: boolean;
  [key: string]: unknown;
}

export interface SLDFilterOptions {
  status: 'Semua' | 'Normal' | 'Kerawanan' | 'Planned';
  riskLevel: 'Semua' | 'Sangat Rawan' | 'Rawan' | 'Sedang' | 'Aman';
  voltage: 'Semua' | '500 kV' | '150 kV' | '70 kV';
  assetType: 'Semua' | 'GI' | 'GITET' | 'IBT' | 'SUTET' | 'Pembangkit';
  searchQuery: string;
}
