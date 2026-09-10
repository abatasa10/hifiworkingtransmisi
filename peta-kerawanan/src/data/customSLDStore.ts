export interface ParsedGINode {
  id: string;
  name: string;
  code?: string;
  assetType?: 'pembangkit' | 'busbar' | 'gitet' | 'gi' | 'ibt' | 'trafo' | 'beban';
  voltage: string; // '500 kV' | '275 kV' | '150 kV' | '70 kV' | '20 kV' | '500/150 kV' | '275/150 kV'
  tier?: number; // Tier starts from 0: Tier 0 = Source utama, Tier 1 = Downstream 1, Tier 2 = Downstream 2, dst.
  ibtNumber?: string | number; // e.g. 1, 2, 4, '1&2'
  primaryVoltage?: string; // e.g. '500 kV' or '275 kV'
  secondaryVoltage?: string; // e.g. '150 kV'
  capacityMVA?: number;
  region: string;
  riskStatus: 'Normal' | 'N-1' | 'N-2' | 'N-1-2' | 'Sedang' | 'Sangat Rawan';
  riskNumber?: string | number;
  subsystem?: string;
  x?: number;
  y?: number;
}

export interface ParsedTransmissionLine {
  id: string;
  sourceId: string;
  targetId: string;
  lineName: string;
  circuit: string;
  circuitCount?: number;
  lengthKm: number;
  loadingPct: number;
  loadingCircuit1?: number;
  loadingCircuit2?: number;
  voltage?: string;
  operatingStatus?: string;
  riskStatus: 'Normal' | 'N-1' | 'N-2' | 'N-1-2' | 'Sedang' | 'Sangat Rawan';
  riskNumber?: string | number;
  region?: string;
  corridor?: string;
}

export interface ImageHotspot {
  id: string;
  name: string;
  voltage: string;
  riskStatus: 'Normal' | 'N-1' | 'N-2' | 'N-1-2';
  xPercent: number; // 0 - 100%
  yPercent: number; // 0 - 100%
  description?: string;
}

export interface CustomSLDConfig {
  targetId: string; // e.g. 'sub-bogor', 'sub-depok', 'sld-500kv'
  targetName: string;
  type: 'excel' | 'image';
  updatedAt: string;
  excelData?: {
    giList: ParsedGINode[];
    lineList: ParsedTransmissionLine[];
  };
  imageData?: {
    imageUrl: string;
    imageFileName: string;
    hotspots: ImageHotspot[];
  };
}

const STORAGE_PREFIX = 'pln_custom_sld_';

export const saveCustomSLD = (config: CustomSLDConfig): void => {
  try {
    const key = `${STORAGE_PREFIX}${config.targetId}`;
    localStorage.setItem(key, JSON.stringify(config));
    // Trigger window event so other components can react in real time
    window.dispatchEvent(new CustomEvent('custom-sld-updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save custom SLD to localStorage', err);
  }
};

export const getCustomSLD = (targetId: string): CustomSLDConfig | null => {
  try {
    const key = `${STORAGE_PREFIX}${targetId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as CustomSLDConfig;
  } catch (err) {
    console.error('Failed to read custom SLD from localStorage', err);
    return null;
  }
};

export const removeCustomSLD = (targetId: string): void => {
  try {
    const key = `${STORAGE_PREFIX}${targetId}`;
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('custom-sld-updated', { detail: { targetId } }));
  } catch (err) {
    console.error('Failed to remove custom SLD', err);
  }
};

export const defaultTargetOptions = [
  { id: 'sld-500kv', name: 'Sistem Backbone 500 kV (JAMALI)', parent: 'UIP2B Jamali' },
  { id: 'sub-bogor', name: 'Subsistem Bogor', parent: 'UP2B Jawa Barat' },
  { id: 'sub-depok', name: 'Subsistem Depok', parent: 'UP2B Jawa Barat' },
  { id: 'sub-cileungsi', name: 'Subsistem Cileungsi', parent: 'UP2B Jawa Barat' },
  { id: 'sub-krian-gresik', name: 'Subsistem Krian - Gresik', parent: 'UP2B Jawa Timur' }
];
