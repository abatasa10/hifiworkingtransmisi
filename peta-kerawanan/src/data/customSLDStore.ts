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
  isWideBusbar?: boolean;
  busbarWidth?: number;
  region: string;
  riskStatus: 'Normal' | 'N-1' | 'N-2' | 'N-1-2' | 'Sedang' | 'Sangat Rawan';
  riskNumber?: string | number;
  subsystem?: string;
  uit?: string;
  condition?: string;
  impact?: string;
  mitigation?: string;
  solution?: string;
  x?: number;
  y?: number;
  // Engine metadata (port from SLD engine / ingest_parser.py)
  objectType?: 'GITET' | 'GISTET' | 'GI' | 'GIS' | 'GENERATING_UNIT' | 'IBT' | 'TRAFO' | 'KAPASITOR' | 'BEBAN' | 'BAY';
  unitNo?: string;
  busLvKey?: string;
  isBay?: boolean;
  feederKey?: string;
  // Related-asset info (explicit template columns + topology derivation)
  connectedKeys?: string[];
  connectedNames?: string[];
  impactedKeys?: string[];
  impactedNames?: string[];
  /** Functional Location ID — join key to the asset/bay DB. */
  functLoc?: string;
}

export interface ParsedTransmissionLine {
  id: string;
  sourceId: string;
  targetId: string;
  lineName: string;
  circuit: string;
  circuitCount?: number;
  circuitNumber?: number; // 1 or 2 for parallel multi-circuit / 2-line rendering
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
  uit?: string;
  condition?: string;
  impact?: string;
  mitigation?: string;
  solution?: string;
  // Related-asset info (endpoints resolved + downstream impact)
  sourceName?: string;
  targetName?: string;
  impactedNames?: string[];
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

import type { EngineRisk } from '../lib/sld/types';

/** Bumped whenever the saved shape changes; older snapshots are discarded. */
export const CUSTOM_SLD_VERSION = 2;

export interface CustomSLDConfig {
  targetId: string; // e.g. 'sub-bogor', 'sub-depok', 'sld-500kv'
  targetName: string;
  type: 'excel' | 'image';
  updatedAt: string;
  version?: number;
  excelData?: {
    giList: ParsedGINode[];
    lineList: ParsedTransmissionLine[];
    risks?: EngineRisk[];
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

import { defaultSuralayaCilegonGIs, defaultSuralayaCilegonLines } from './defaultSuralayaCilegonData';

export const getCustomSLD = (targetId: string): CustomSLDConfig | null => {
  try {
    const key = `${STORAGE_PREFIX}${targetId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data) as CustomSLDConfig;
        // Stale snapshots (saved before the engine pipeline + risk pins)
        // can never match a fresh preview; discard them so the user
        // re-uploads once instead of staring at mismatched data.
        // NOTE: the old phantom/corruption heuristics lived here and have
        // been removed — they misfired on correct new data (legit KTT
        // beban nodes) and deleted every fresh save on read. Versioning
        // above is now the single staleness gate.
        if (parsed.version !== CUSTOM_SLD_VERSION) {
          localStorage.removeItem(key);
        } else {
          return parsed;
        }
      } catch {
        localStorage.removeItem(key);
      }
    }

    // Default authentic configuration for Subsistem Suralaya - Cilegon
    if (targetId === 'sub-suralaya-cilegon' || targetId === 'sub-bogor') {
      return {
        targetId,
        targetName: 'Subsistem Suralaya Unit #3 - Suralaya 1,2 – Cilegon 4',
        type: 'excel',
        updatedAt: new Date().toISOString(),
        excelData: {
          giList: defaultSuralayaCilegonGIs,
          lineList: defaultSuralayaCilegonLines
        }
      };
    }

    return null;
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
  { id: 'sub-suralaya-cilegon', name: 'Subsistem Suralaya - Cilegon', parent: 'P2B Jakban (Jakarta & Banten)' },
  { id: 'sub-bogor', name: 'Subsistem Bogor', parent: 'UP2B Jawa Barat' },
  { id: 'sld-500kv', name: 'Sistem Backbone 500 kV (JAMALI)', parent: 'UIP2B Jamali' },
  { id: 'sub-depok', name: 'Subsistem Depok', parent: 'UP2B Jawa Barat' },
  { id: 'sub-cileungsi', name: 'Subsistem Cileungsi', parent: 'UP2B Jawa Barat' },
  { id: 'sub-krian-gresik', name: 'Subsistem Krian - Gresik', parent: 'UP2B Jawa Timur' }
];
