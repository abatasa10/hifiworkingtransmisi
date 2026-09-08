import { Node } from '@xyflow/react';
import { SLDNodeData } from '../types/graph';

export const initialNodes500kV: Node<SLDNodeData>[] = [
  // ================= TIER 1: PEMBANGKIT =================
  {
    id: 'GEN_JAWA7',
    type: 'generator',
    position: { x: 50, y: 45 },
    data: { id: 'GEN_JAWA7', name: 'PLTU Jawa 7', code: 'JAWA7', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 2000, status: 'Beroperasi' }
  },
  {
    id: 'GEN_LBE',
    type: 'generator',
    position: { x: 130, y: 45 },
    data: { id: 'GEN_LBE', name: 'PLTU Lestari Banten Energi', code: 'LBE', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 660, status: 'Beroperasi' }
  },
  {
    id: 'GEN_NSRLA',
    type: 'generator',
    position: { x: 210, y: 45 },
    data: { id: 'GEN_NSRLA', name: 'PLTU New Suralaya', code: 'NSRLA', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 600, status: 'Beroperasi' }
  },
  {
    id: 'GEN_SRLYA',
    type: 'generator',
    position: { x: 290, y: 45 },
    data: { id: 'GEN_SRLYA', name: 'PLTU Suralaya 1-7', code: 'SRLYA', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 3400, status: 'Beroperasi' }
  },
  {
    id: 'GEN_JAWA910',
    type: 'generator',
    position: { x: 380, y: 45 },
    data: { id: 'GEN_JAWA910', name: 'PLTU Jawa 9 & 10', code: 'JAWA 9&10', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 2000, status: 'Beroperasi' }
  },
  {
    id: 'GEN_PRIOK',
    type: 'generator',
    position: { x: 470, y: 45 },
    data: { id: 'GEN_PRIOK', name: 'PLTGU Tanjung Priok', code: 'PRIOK', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 1180, status: 'Beroperasi' }
  },
  {
    id: 'GEN_MTWAR',
    type: 'generator',
    position: { x: 550, y: 45 },
    data: { id: 'GEN_MTWAR', name: 'PLTGU Muara Tawar', code: 'MTWAR', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 2160, status: 'Beroperasi' }
  },
  {
    id: 'GEN_CLMYA',
    type: 'generator',
    position: { x: 630, y: 45 },
    data: { id: 'GEN_CLMYA', name: 'PLTGU Cilamaya', code: 'CLMYA', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 1760, status: 'Beroperasi' }
  },
  {
    id: 'GEN_CRATA',
    type: 'generator',
    position: { x: 710, y: 45 },
    data: { id: 'GEN_CRATA', name: 'PLTA Cirata', code: 'CRATA', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 1008, status: 'Beroperasi' }
  },
  {
    id: 'GEN_SGLNG',
    type: 'generator',
    position: { x: 790, y: 45 },
    data: { id: 'GEN_SGLNG', name: 'PLTA Saguling', code: 'SGLNG', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 700, status: 'Beroperasi' }
  },
  {
    id: 'GEN_ADPLA',
    type: 'generator',
    position: { x: 870, y: 45 },
    data: { id: 'GEN_ADPLA', name: 'PLTU Adipala', code: 'ADPLA', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 660, status: 'Beroperasi' }
  },
  {
    id: 'GEN_CLCAP',
    type: 'generator',
    position: { x: 950, y: 45 },
    data: { id: 'GEN_CLCAP', name: 'PLTU Cilacap', code: 'CLCAP', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 2000, status: 'Beroperasi' }
  },
  {
    id: 'GEN_BTANG',
    type: 'generator',
    position: { x: 1030, y: 45 },
    data: { id: 'GEN_BTANG', name: 'PLTU Batang', code: 'BTANG', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 2000, status: 'Beroperasi' }
  },
  {
    id: 'GEN_NTJTI',
    type: 'generator',
    position: { x: 1110, y: 45 },
    data: { id: 'GEN_NTJTI', name: 'PLTU New Tanjung Jati', code: 'NTJTI', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 1000, status: 'Beroperasi' }
  },
  {
    id: 'GEN_TJATI',
    type: 'generator',
    position: { x: 1190, y: 45 },
    data: { id: 'GEN_TJATI', name: 'PLTU Tanjung Jati B', code: 'TJATI', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 2640, status: 'Beroperasi' }
  },
  {
    id: 'GEN_GRSIK',
    type: 'generator',
    position: { x: 1270, y: 45 },
    data: { id: 'GEN_GRSIK', name: 'PLTGU Gresik', code: 'GRSIK', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 2200, status: 'Beroperasi' }
  },
  {
    id: 'GEN_GRATI',
    type: 'generator',
    position: { x: 1350, y: 45 },
    data: { id: 'GEN_GRATI', name: 'PLTGU Grati', code: 'GRATI', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 800, status: 'Beroperasi' }
  },
  {
    id: 'GEN_PITON',
    type: 'generator',
    position: { x: 1430, y: 45 },
    data: { id: 'GEN_PITON', name: 'PLTU Paiton Complex', code: 'PITON', type: 'generator', voltage: '500 kV', tier: 1, capacityMW: 4700, status: 'Beroperasi' }
  },

  // ================= TIER 2: GITET BUSBAR UTAMA =================
  {
    id: 'GI_BLRJA',
    type: 'busbar',
    position: { x: 50, y: 220 },
    data: { id: 'GI_BLRJA', name: 'GITET Balaraja', code: 'BLRJA', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-durkos-mkrng' }
  },
  {
    id: 'GI_CLGON',
    type: 'busbar',
    position: { x: 140, y: 220 },
    data: { id: 'GI_CLGON', name: 'GITET Cilegon', code: 'CLGON', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-durkos-mkrng' }
  },
  {
    id: 'GI_TMBUN',
    type: 'busbar',
    position: { x: 230, y: 220 },
    data: { id: 'GI_TMBUN', name: 'GITET Tambun', code: 'TMBUN', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-cawang-priok' }
  },
  {
    id: 'GI_CWANG',
    type: 'busbar',
    position: { x: 320, y: 220 },
    data: { id: 'GI_CWANG', name: 'GITET Cawang', code: 'CWANG', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-cawang-priok' }
  },
  {
    id: 'GI_SKTNI',
    type: 'busbar',
    position: { x: 420, y: 220 },
    data: { id: 'GI_SKTNI', name: 'GITET Sukatani', code: 'SKTNI', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-cileungsi' }
  },
  {
    id: 'GI_DLTMS',
    type: 'busbar',
    position: { x: 510, y: 220 },
    data: { id: 'GI_DLTMS', name: 'GITET Delta Mas', code: 'DLTMS', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-cileungsi' }
  },
  {
    id: 'GI_CIBNG',
    type: 'busbar',
    position: { x: 600, y: 220 },
    data: { id: 'GI_CIBNG', name: 'GITET Cibinong', code: 'CIBNG', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-bogor' }
  },
  {
    id: 'GI_BDSLN',
    type: 'busbar',
    position: { x: 690, y: 220 },
    data: { id: 'GI_BDSLN', name: 'GITET Bandung Selatan', code: 'BDSLN', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-bandung' }
  },
  {
    id: 'GI_KSGHN',
    type: 'busbar',
    position: { x: 790, y: 220 },
    data: { id: 'GI_KSGHN', name: 'GITET Kesugihan', code: 'KSGHN', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-ungaran' }
  },
  {
    id: 'GI_PMLNG',
    type: 'busbar',
    position: { x: 890, y: 220 },
    data: { id: 'GI_PMLNG', name: 'GITET Pemalang', code: 'PMLNG', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-ungaran' }
  },
  {
    id: 'GI_UNGRN',
    type: 'busbar',
    position: { x: 990, y: 220 },
    data: { id: 'GI_UNGRN', name: 'GITET Ungaran', code: 'UNGRN', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-ungaran' }
  },
  {
    id: 'GI_KRIAN',
    type: 'busbar',
    position: { x: 1220, y: 220 },
    data: { id: 'GI_KRIAN', name: 'GITET Krian', code: 'KRIAN', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-krian-gresik' }
  },
  {
    id: 'GI_KDIR',
    type: 'busbar',
    position: { x: 1390, y: 220 },
    data: { id: 'GI_KDIR', name: 'GITET Kediri', code: 'KDIR', type: 'gitet', voltage: '500 kV', tier: 2, status: 'Beroperasi', subsystemId: 'sub-kediri-12' }
  },

  // ================= TIER 3: GITET KONEKTOR PUSAT =================
  {
    id: 'GI_LNGKG',
    type: 'busbar',
    position: { x: 50, y: 390 },
    data: { id: 'GI_LNGKG', name: 'GITET Lengkong', code: 'LNGKG', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-gandul' }
  },
  {
    id: 'GI_KMBNG',
    type: 'busbar',
    position: { x: 140, y: 390 },
    data: { id: 'GI_KMBNG', name: 'GITET Kembangan', code: 'KMBNG', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-durkos-mkrng' }
  },
  {
    id: 'GI_BKASI',
    type: 'busbar',
    position: { x: 330, y: 390 },
    data: { id: 'GI_BKASI', name: 'GITET Bekasi', code: 'BKASI', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-cileungsi' }
  },
  {
    id: 'GI_CBATU',
    type: 'busbar',
    position: { x: 420, y: 390 },
    data: { id: 'GI_CBATU', name: 'GITET Cibatu', code: 'CBATU', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-cileungsi' }
  },
  {
    id: 'GI_UBRNG',
    type: 'busbar',
    position: { x: 520, y: 390 },
    data: { id: 'GI_UBRNG', name: 'GITET Ujungberung', code: 'UBRNG', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-bandung' }
  },
  {
    id: 'GI_IDMYU',
    type: 'busbar',
    position: { x: 610, y: 390 },
    data: { id: 'GI_IDMYU', name: 'GITET Indramayu', code: 'IDMYU', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-bandung' }
  },
  {
    id: 'GI_MDCAN',
    type: 'busbar',
    position: { x: 700, y: 390 },
    data: { id: 'GI_MDCAN', name: 'GITET Mandirancan', code: 'MDCAN', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-bandung' }
  },
  {
    id: 'GI_TSMYA',
    type: 'busbar',
    position: { x: 800, y: 390 },
    data: { id: 'GI_TSMYA', name: 'GITET Tasikmalaya', code: 'TSMYA', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-bandung' }
  },
  {
    id: 'GI_BYOLI',
    type: 'busbar',
    position: { x: 970, y: 390 },
    data: { id: 'GI_BYOLI', name: 'GITET Boyolali', code: 'BYOLI', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-pedan' }
  },
  {
    id: 'GI_PEDAN',
    type: 'busbar',
    position: { x: 1080, y: 390 },
    data: { id: 'GI_PEDAN', name: 'GITET Pedan', code: 'PEDAN', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-pedan' }
  },
  {
    id: 'GI_NBANG',
    type: 'busbar',
    position: { x: 1220, y: 390 },
    data: { id: 'GI_NBANG', name: 'GITET Ngimbang', code: 'NBANG', type: 'gitet', voltage: '500 kV', tier: 3, status: 'Beroperasi', subsystemId: 'sub-ngimbang' }
  },

  // ================= TIER 4: GITET SELATAN / DKI =================
  {
    id: 'GI_GNDUL',
    type: 'busbar',
    position: { x: 60, y: 550 },
    data: { id: 'GI_GNDUL', name: 'GITET Gandul', code: 'GNDUL', type: 'gitet', voltage: '500 kV', tier: 4, status: 'Beroperasi', subsystemId: 'sub-gandul' }
  },
  {
    id: 'GI_DEPOK',
    type: 'busbar',
    position: { x: 210, y: 550 },
    data: { id: 'GI_DEPOK', name: 'GITET Depok', code: 'DEPOK', type: 'gitet', voltage: '500 kV', tier: 4, status: 'Beroperasi', subsystemId: 'sub-depok' }
  },

  // ================= TIER 5: DURI KOSAMBI =================
  {
    id: 'GI_DKSBI',
    type: 'busbar',
    position: { x: 60, y: 680 },
    data: { id: 'GI_DKSBI', name: 'GITET Duri Kosambi', code: 'DKSBI', type: 'gitet', voltage: '500 kV', tier: 5, status: 'Beroperasi', subsystemId: 'sub-durkos-mkrng' }
  },
  {
    id: 'IBT_DKSBI',
    type: 'ibt',
    position: { x: 150, y: 680 },
    data: { id: 'IBT_DKSBI', name: 'IBT Durkosambi 1 & 2', code: 'IBT DKSBI', type: 'ibt', voltage: '500/150 kV', tier: 5, status: 'Beroperasi', capacityMVA: 1000, loading: 55, circuits: 2, subsystemId: 'sub-durkos-mkrng' }
  },

  // ================= TIER 6: MUARA KARANG =================
  {
    id: 'GI_MKRNG',
    type: 'busbar',
    position: { x: 120, y: 800 },
    data: { id: 'GI_MKRNG', name: 'GITET Muara Karang', code: 'MKRNG', type: 'gitet', voltage: '500 kV', tier: 6, status: 'Beroperasi', subsystemId: 'sub-durkos-mkrng' }
  },
  {
    id: 'IBT_MKRNG',
    type: 'ibt',
    position: { x: 220, y: 800 },
    data: { id: 'IBT_MKRNG', name: 'IBT Muarakarang 1 & 2', code: 'IBT MKRNG', type: 'ibt', voltage: '500/150 kV', tier: 6, status: 'Beroperasi', capacityMVA: 1000, loading: 64, circuits: 2, subsystemId: 'sub-durkos-mkrng' }
  }
];
