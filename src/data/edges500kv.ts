import { Edge } from '@xyflow/react';
import { SLDEdgeData } from '../types/graph';

export const initialEdges500kV: Edge<SLDEdgeData>[] = [
  // ================= GENERATOR FEEDS (TIER 1 -> TIER 2) =================
  {
    id: 'GEN_JAWA7_BLRJA',
    source: 'GEN_JAWA7',
    target: 'GI_BLRJA',
    type: 'transmission',
    data: {
      id: 'GEN_JAWA7_BLRJA',
      source: 'GEN_JAWA7',
      target: 'GI_BLRJA',
      name: 'Saluran Evakuasi PLTU Jawa 7 - Balaraja',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 42.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 62, circuit2: 60 }
    }
  },
  {
    id: 'GEN_SRLYA_CLGON',
    source: 'GEN_SRLYA',
    target: 'GI_CLGON',
    type: 'transmission',
    data: {
      id: 'GEN_SRLYA_CLGON',
      source: 'GEN_SRLYA',
      target: 'GI_CLGON',
      name: 'Saluran Evakuasi PLTU Suralaya - Cilegon',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 4,
      lengthKm: 18.5,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 72, circuit2: 70 }
    }
  },
  {
    id: 'GEN_PRIOK_CWANG',
    source: 'GEN_PRIOK',
    target: 'GI_CWANG',
    type: 'transmission',
    data: {
      id: 'GEN_PRIOK_CWANG',
      source: 'GEN_PRIOK',
      target: 'GI_CWANG',
      name: 'Saluran Evakuasi PLTGU Priok - Cawang',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 24.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 54, circuit2: 50 }
    }
  },
  {
    id: 'GEN_MTWAR_TMBUN',
    source: 'GEN_MTWAR',
    target: 'GI_TMBUN',
    type: 'transmission',
    data: {
      id: 'GEN_MTWAR_TMBUN',
      source: 'GEN_MTWAR',
      target: 'GI_TMBUN',
      name: 'Saluran Evakuasi PLTGU Muara Tawar - Tambun',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 15.2,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 65, circuit2: 62 }
    }
  },
  {
    id: 'GEN_CRATA_CIBNG',
    source: 'GEN_CRATA',
    target: 'GI_CIBNG',
    type: 'transmission',
    data: {
      id: 'GEN_CRATA_CIBNG',
      source: 'GEN_CRATA',
      target: 'GI_CIBNG',
      name: 'Saluran Evakuasi PLTA Cirata - Cibinong',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 48.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 45, circuit2: 42 }
    }
  },
  {
    id: 'GEN_SGLNG_BDSLN',
    source: 'GEN_SGLNG',
    target: 'GI_BDSLN',
    type: 'transmission',
    data: {
      id: 'GEN_SGLNG_BDSLN',
      source: 'GEN_SGLNG',
      target: 'GI_BDSLN',
      name: 'Saluran Evakuasi PLTA Saguling - Bandung Selatan',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 38.5,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 40, circuit2: 38 }
    }
  },
  {
    id: 'GEN_CLCAP_KSGHN',
    source: 'GEN_CLCAP',
    target: 'GI_KSGHN',
    type: 'transmission',
    data: {
      id: 'GEN_CLCAP_KSGHN',
      source: 'GEN_CLCAP',
      target: 'GI_KSGHN',
      name: 'Saluran Evakuasi PLTU Cilacap - Kesugihan',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 22.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 68, circuit2: 65 }
    }
  },
  {
    id: 'GEN_TJATI_UNGRN',
    source: 'GEN_TJATI',
    target: 'GI_UNGRN',
    type: 'transmission',
    data: {
      id: 'GEN_TJATI_UNGRN',
      source: 'GEN_TJATI',
      target: 'GI_UNGRN',
      name: 'Saluran Evakuasi PLTU Tanjung Jati - Ungaran',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 76.5,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 78, circuit2: 74 }
    }
  },

  // ================= MAIN 500 kV GRID TRANSMISSION LINES =================

  // --- RISK #7: SUTET GANDUL - DURKOS - KEMBANGAN ---
  {
    id: 'LINE_GNDUL_DKSBI',
    source: 'GI_GNDUL',
    target: 'GI_DKSBI',
    type: 'transmission',
    data: {
      id: 'LINE_GNDUL_DKSBI',
      source: 'GI_GNDUL',
      target: 'GI_DKSBI',
      name: 'SUTET Gandul - Durkos (Kerawanan #7)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 36.2,
      operatingStatus: 'Beroperasi',
      status: 'warning',
      loading: { circuit1: 55, circuit2: 43 },
      riskId: 7,
      riskLevel: 'Sedang'
    }
  },
  {
    id: 'LINE_DKSBI_KMBNG',
    source: 'GI_DKSBI',
    target: 'GI_KMBNG',
    type: 'transmission',
    data: {
      id: 'LINE_DKSBI_KMBNG',
      source: 'GI_DKSBI',
      target: 'GI_KMBNG',
      name: 'SUTET Durkos - Kembangan (Kerawanan #7)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 36.3,
      operatingStatus: 'Beroperasi',
      status: 'warning',
      loading: { circuit1: 43, circuit2: 40 },
      riskId: 7,
      riskLevel: 'Sedang'
    }
  },
  {
    id: 'LINE_DKSBI_MKRNG',
    source: 'GI_DKSBI',
    target: 'GI_MKRNG',
    type: 'transmission',
    data: {
      id: 'LINE_DKSBI_MKRNG',
      source: 'GI_DKSBI',
      target: 'GI_MKRNG',
      name: 'SUTET Duri Kosambi - Muara Karang',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 21.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 48, circuit2: 45 }
    }
  },
  {
    id: 'LINK_DKSBI_IBT',
    source: 'GI_DKSBI',
    target: 'IBT_DKSBI',
    type: 'transformer_link',
    data: {
      id: 'LINK_DKSBI_IBT',
      source: 'GI_DKSBI',
      target: 'IBT_DKSBI',
      name: 'Koppel Bay IBT Durkosambi 1 & 2',
      type: 'transformer_link',
      voltage: '500 kV',
      circuitCount: 2,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 55, circuit2: 55 }
    }
  },
  {
    id: 'LINK_MKRNG_IBT',
    source: 'GI_MKRNG',
    target: 'IBT_MKRNG',
    type: 'transformer_link',
    data: {
      id: 'LINK_MKRNG_IBT',
      source: 'GI_MKRNG',
      target: 'IBT_MKRNG',
      name: 'Koppel Bay IBT Muarakarang 1 & 2',
      type: 'transformer_link',
      voltage: '500 kV',
      circuitCount: 2,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 64, circuit2: 64 }
    }
  },

  // --- RISK #1: CILEGON - CIBINONG ---
  {
    id: 'LINE_CLGON_CIBNG',
    source: 'GI_CLGON',
    target: 'GI_CIBNG',
    type: 'transmission',
    data: {
      id: 'LINE_CLGON_CIBNG',
      source: 'GI_CLGON',
      target: 'GI_CIBNG',
      name: 'SUTET Cilegon - Cibinong Sirkit 1 & 2 (Kerawanan #1)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 104.2,
      operatingStatus: 'Beroperasi',
      status: 'critical',
      loading: { circuit1: 88, circuit2: 84 },
      riskId: 1,
      riskLevel: 'Sangat Rawan'
    }
  },

  // --- RISK #14: BALARAJA - LENGKONG ---
  {
    id: 'LINE_BLRJA_LNGKG',
    source: 'GI_BLRJA',
    target: 'GI_LNGKG',
    type: 'transmission',
    data: {
      id: 'LINE_BLRJA_LNGKG',
      source: 'GI_BLRJA',
      target: 'GI_LNGKG',
      name: 'SUTET Balaraja - Lengkong (Kerawanan #14)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 34.0,
      operatingStatus: 'Beroperasi',
      status: 'warning',
      loading: { circuit1: 61, circuit2: 57 },
      riskId: 14,
      riskLevel: 'Sedang'
    }
  },

  // --- RISK #9: GANDUL - DEPOK ---
  {
    id: 'LINE_GNDUL_DEPOK',
    source: 'GI_GNDUL',
    target: 'GI_DEPOK',
    type: 'transmission',
    data: {
      id: 'LINE_GNDUL_DEPOK',
      source: 'GI_GNDUL',
      target: 'GI_DEPOK',
      name: 'SUTET Gandul - Depok (Kerawanan #9)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 18.3,
      operatingStatus: 'Beroperasi',
      status: 'warning',
      loading: { circuit1: 68, circuit2: 65 },
      riskId: 9,
      riskLevel: 'Rawan'
    }
  },

  // --- RISK #5: CAWANG - BEKASI ---
  {
    id: 'LINE_CWANG_BKASI',
    source: 'GI_CWANG',
    target: 'GI_BKASI',
    type: 'transmission',
    data: {
      id: 'LINE_CWANG_BKASI',
      source: 'GI_CWANG',
      target: 'GI_BKASI',
      name: 'SUTET Cawang - Bekasi (Kerawanan #5)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 28.6,
      operatingStatus: 'Beroperasi',
      status: 'warning',
      loading: { circuit1: 76, circuit2: 72 },
      riskId: 5,
      riskLevel: 'Rawan'
    }
  },

  // --- RISK #11: TAMBUN - CAWANG ---
  {
    id: 'LINE_TMBUN_CWANG',
    source: 'GI_TMBUN',
    target: 'GI_CWANG',
    type: 'transmission',
    data: {
      id: 'LINE_TMBUN_CWANG',
      source: 'GI_TMBUN',
      target: 'GI_CWANG',
      name: 'SUTET Tambun - Cawang (Kerawanan #11)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 21.4,
      operatingStatus: 'Beroperasi',
      status: 'warning',
      loading: { circuit1: 58, circuit2: 52 },
      riskId: 11,
      riskLevel: 'Sedang'
    }
  },

  // --- RISK #19: MANDIRANCAN - TASIKMALAYA ---
  {
    id: 'LINE_MDCAN_TSMYA',
    source: 'GI_MDCAN',
    target: 'GI_TSMYA',
    type: 'transmission',
    data: {
      id: 'LINE_MDCAN_TSMYA',
      source: 'GI_MDCAN',
      target: 'GI_TSMYA',
      name: 'SUTET Mandirancan - Tasikmalaya (Kerawanan #19)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 89.7,
      operatingStatus: 'Beroperasi',
      status: 'critical',
      loading: { circuit1: 82, circuit2: 80 },
      riskId: 19,
      riskLevel: 'Sangat Rawan'
    }
  },

  // --- RISK #20: UNGARAN - PEDAN ---
  {
    id: 'LINE_UNGRN_PEDAN',
    source: 'GI_UNGRN',
    target: 'GI_PEDAN',
    type: 'transmission',
    data: {
      id: 'LINE_UNGRN_PEDAN',
      source: 'GI_UNGRN',
      target: 'GI_PEDAN',
      name: 'SUTET Ungaran - Pedan (Kerawanan #20)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 68.4,
      operatingStatus: 'Beroperasi',
      status: 'critical',
      loading: { circuit1: 85, circuit2: 79 },
      riskId: 20,
      riskLevel: 'Sangat Rawan'
    }
  },

  // --- RISK #29: GRATI - PAITON ---
  {
    id: 'LINE_GRATI_PITON',
    source: 'GEN_GRATI',
    target: 'GEN_PITON',
    type: 'transmission',
    data: {
      id: 'LINE_GRATI_PITON',
      source: 'GEN_GRATI',
      target: 'GEN_PITON',
      name: 'SUTET Grati - Paiton (Kerawanan #29)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 98.1,
      operatingStatus: 'Beroperasi',
      status: 'warning',
      loading: { circuit1: 74, circuit2: 71 },
      riskId: 29,
      riskLevel: 'Rawan'
    }
  },

  // --- OTHER NORMAL LINES ---
  {
    id: 'LINE_BLRJA_CLGON',
    source: 'GI_BLRJA',
    target: 'GI_CLGON',
    type: 'transmission',
    data: {
      id: 'LINE_BLRJA_CLGON',
      source: 'GI_BLRJA',
      target: 'GI_CLGON',
      name: 'SUTET Balaraja - Cilegon',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 46.5,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 48, circuit2: 44 }
    }
  },
  {
    id: 'LINE_LNGKG_KMBNG',
    source: 'GI_LNGKG',
    target: 'GI_KMBNG',
    type: 'transmission',
    data: {
      id: 'LINE_LNGKG_KMBNG',
      source: 'GI_LNGKG',
      target: 'GI_KMBNG',
      name: 'SUTET Lengkong - Kembangan',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 24.2,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 42, circuit2: 39 }
    }
  },
  {
    id: 'LINE_KMBNG_GNDUL',
    source: 'GI_KMBNG',
    target: 'GI_GNDUL',
    type: 'transmission',
    data: {
      id: 'LINE_KMBNG_GNDUL',
      source: 'GI_KMBNG',
      target: 'GI_GNDUL',
      name: 'SUTET Kembangan - Gandul Bypass',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 31.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 38, circuit2: 35 }
    }
  },
  {
    id: 'LINE_DEPOK_CIBNG',
    source: 'GI_DEPOK',
    target: 'GI_CIBNG',
    type: 'transmission',
    data: {
      id: 'LINE_DEPOK_CIBNG',
      source: 'GI_DEPOK',
      target: 'GI_CIBNG',
      name: 'SUTET Depok - Cibinong',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 26.5,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 52, circuit2: 49 }
    }
  },
  {
    id: 'LINE_CIBNG_BDSLN',
    source: 'GI_CIBNG',
    target: 'GI_BDSLN',
    type: 'transmission',
    data: {
      id: 'LINE_CIBNG_BDSLN',
      source: 'GI_CIBNG',
      target: 'GI_BDSLN',
      name: 'SUTET Cibinong - Bandung Selatan',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 98.4,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 60, circuit2: 58 }
    }
  },
  {
    id: 'LINE_BKASI_CBATU',
    source: 'GI_BKASI',
    target: 'GI_CBATU',
    type: 'transmission',
    data: {
      id: 'LINE_BKASI_CBATU',
      source: 'GI_BKASI',
      target: 'GI_CBATU',
      name: 'SUTET Bekasi - Cibatu',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 32.1,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 44, circuit2: 41 }
    }
  },
  {
    id: 'LINE_CBATU_DLTMS',
    source: 'GI_CBATU',
    target: 'GI_DLTMS',
    type: 'transmission',
    data: {
      id: 'LINE_CBATU_DLTMS',
      source: 'GI_CBATU',
      target: 'GI_DLTMS',
      name: 'SUTET Cibatu - Delta Mas',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 18.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 39, circuit2: 36 }
    }
  },
  {
    id: 'LINE_DLTMS_SKTNI',
    source: 'GI_DLTMS',
    target: 'GI_SKTNI',
    type: 'transmission',
    data: {
      id: 'LINE_DLTMS_SKTNI',
      source: 'GI_DLTMS',
      target: 'GI_SKTNI',
      name: 'SUTET Delta Mas - Sukatani',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 14.5,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 35, circuit2: 32 }
    }
  },
  {
    id: 'LINE_CIBNG_UBRNG',
    source: 'GI_CIBNG',
    target: 'GI_UBRNG',
    type: 'transmission',
    data: {
      id: 'LINE_CIBNG_UBRNG',
      source: 'GI_CIBNG',
      target: 'GI_UBRNG',
      name: 'SUTET Cibinong - Ujungberung',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 112.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 56, circuit2: 52 }
    }
  },
  {
    id: 'LINE_UBRNG_MDCAN',
    source: 'GI_UBRNG',
    target: 'GI_MDCAN',
    type: 'transmission',
    data: {
      id: 'LINE_UBRNG_MDCAN',
      source: 'GI_UBRNG',
      target: 'GI_MDCAN',
      name: 'SUTET Ujungberung - Mandirancan',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 94.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 58, circuit2: 54 }
    }
  },
  {
    id: 'LINE_TSMYA_KSGHN',
    source: 'GI_TSMYA',
    target: 'GI_KSGHN',
    type: 'transmission',
    data: {
      id: 'LINE_TSMYA_KSGHN',
      source: 'GI_TSMYA',
      target: 'GI_KSGHN',
      name: 'SUTET Tasikmalaya - Kesugihan',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 102.5,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 51, circuit2: 48 }
    }
  },
  {
    id: 'LINE_KSGHN_PMLNG',
    source: 'GI_KSGHN',
    target: 'GI_PMLNG',
    type: 'transmission',
    data: {
      id: 'LINE_KSGHN_PMLNG',
      source: 'GI_KSGHN',
      target: 'GI_PMLNG',
      name: 'SUTET Kesugihan - Pemalang',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 88.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 49, circuit2: 47 }
    }
  },
  {
    id: 'LINE_PMLNG_UNGRN',
    source: 'GI_PMLNG',
    target: 'GI_UNGRN',
    type: 'transmission',
    data: {
      id: 'LINE_PMLNG_UNGRN',
      source: 'GI_PMLNG',
      target: 'GI_UNGRN',
      name: 'SUTET Pemalang - Ungaran',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 115.0,
      operatingStatus: 'Beroperasi',
      status: 'warning',
      loading: { circuit1: 67, circuit2: 63 }
    }
  },
  {
    id: 'LINE_PEDAN_BYOLI',
    source: 'GI_PEDAN',
    target: 'GI_BYOLI',
    type: 'transmission',
    data: {
      id: 'LINE_PEDAN_BYOLI',
      source: 'GI_PEDAN',
      target: 'GI_BYOLI',
      name: 'SUTET Pedan - Boyolali',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 42.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 46, circuit2: 44 }
    }
  },
  {
    id: 'LINE_UNGRN_NBANG',
    source: 'GI_UNGRN',
    target: 'GI_NBANG',
    type: 'transmission',
    data: {
      id: 'LINE_UNGRN_NBANG',
      source: 'GI_UNGRN',
      target: 'GI_NBANG',
      name: 'SUTET Ungaran - Ngimbang Sirkit 1 & 2',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 174.0,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 59, circuit2: 56 }
    }
  },
  {
    id: 'LINE_NBANG_KRIAN',
    source: 'GI_NBANG',
    target: 'GI_KRIAN',
    type: 'transmission',
    data: {
      id: 'LINE_NBANG_KRIAN',
      source: 'GI_NBANG',
      target: 'GI_KRIAN',
      name: 'SUTET Ngimbang - Krian',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 58.2,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 54, circuit2: 50 }
    }
  },
  {
    id: 'LINE_KRIAN_KDIR',
    source: 'GI_KRIAN',
    target: 'GI_KDIR',
    type: 'transmission',
    data: {
      id: 'LINE_KRIAN_KDIR',
      source: 'GI_KRIAN',
      target: 'GI_KDIR',
      name: 'SUTET Krian - Kediri Sirkit 1 & 2',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 92.5,
      operatingStatus: 'Beroperasi',
      status: 'normal',
      loading: { circuit1: 52, circuit2: 48 }
    }
  },

  // --- PLANNED TRANSMISSION (DASHED) ---
  {
    id: 'PLAN_MTWAR_PRIOK',
    source: 'GEN_MTWAR',
    target: 'GEN_PRIOK',
    type: 'transmission',
    data: {
      id: 'PLAN_MTWAR_PRIOK',
      source: 'GEN_MTWAR',
      target: 'GEN_PRIOK',
      name: 'SUTET Muara Tawar - Priok (RUPTL 2025-2034)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 26.0,
      operatingStatus: 'Rencana',
      status: 'planned',
      loading: { circuit1: 0, circuit2: 0 }
    }
  },
  {
    id: 'PLAN_PRIOK_MKRNG',
    source: 'GEN_PRIOK',
    target: 'GI_MKRNG',
    type: 'transmission',
    data: {
      id: 'PLAN_PRIOK_MKRNG',
      source: 'GEN_PRIOK',
      target: 'GI_MKRNG',
      name: 'SUTET Priok - Muara Karang (RUPTL COD 2027)',
      type: 'transmission',
      voltage: '500 kV',
      circuitCount: 2,
      lengthKm: 22.0,
      operatingStatus: 'Rencana',
      status: 'planned',
      loading: { circuit1: 0, circuit2: 0 }
    }
  }
];
