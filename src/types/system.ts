export type RiskLevel = 'Sangat Rawan' | 'Rawan' | 'Sedang' | 'Aman';

export interface PowerSystem {
  id: string;
  name: string;
  region: string;
  riskLevel: RiskLevel;
  upbCount: number;
  subsystemCount: number;
  assetCount: number;
  giCount: number;
  ibtCount: number;
  lat: number;
  lng: number;
  description: string;
}

export interface UPB {
  id: string;
  systemId: string;
  name: string;
  shortName: string;
  region: string;
  giCount: number;
  subsystemCount: number;
  riskCount: number;
  riskLevel: RiskLevel;
  lat: number;
  lng: number;
  keySubstations: string[];
}

export interface Subsystem {
  id: string;
  upbId: string;
  name: string;
  giCount: number;
  riskLevel: RiskLevel;
  riskCount: number;
  transformerCount: number;
  peakLoadMW: number;
  description: string;
}
