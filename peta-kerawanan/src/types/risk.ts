import { RiskLevel } from './system';

export interface RiskSolution {
  shortTerm: string[];
  mediumTerm?: string[];
  longTerm?: string[];
}

export interface RiskItem {
  id: number;
  number: number;
  name: string;
  lineGiSegment?: string; // Dari Line GI apa ke Line GI apa
  uit?: string; // Unit Induk Transmisi (JBB, JBT, JATIM)
  assetType: 'SUTET' | 'SUTT' | 'IBT' | 'GI' | 'GITET' | 'Pembangkit' | 'Peralatan';
  voltage: string;
  riskLevel: RiskLevel;
  sourceGiId?: string;
  targetGiId?: string;
  edgeId?: string;
  nodeId?: string;
  lengthKm?: number;
  circuits?: number;
  loadingCircuit1?: number;
  loadingCircuit2?: number;
  operatingStatus: string;
  condition: string;
  impact: string;
  mitigation: string;
  solution: RiskSolution;
  location: string;
  updatedAt: string;
  coordinates?: {
    lat: number;
    lng: number;
    label?: string;
  }[];
  relatedAssetIds?: string[];
}
