/**
 * Profil Aset Transmisi - MANTAPS Enterprise Dashboard
 * Seamless Progressive Drill-Down Controller
 */

// Global State
const appState = {
  currentLevel: 1, // 1: Indonesia, 2: Wilayah/Jawa, 3: Jenis Aset, 4: Merk, 5: Daftar Aset, 6: Detail Aset
  region: 'Jawa',
  subRegion: 'Jawa Barat',
  assetType: 'Power Transformer',
  brand: 'ABB',
  selectedAssetId: 'TRF-ABB-001',
  filters: {
    unitInduk: 'Semua',
    upt: 'Semua',
    ultg: 'Semua',
    jenisAset: 'Semua',
    merk: 'Semua',
    tegangan: 'Semua',
    healthIndex: 'Semua',
    searchQuery: ''
  }
};

// Map instances
let mainMap = null;
let miniMap = null;
let miniMapExpanded = null;
let mainMarkers = [];

// Chart instances
let chartDonutHI = null;
let chartBrandAge = null;
let chartTrenHI = null;
let chartTrenHIDedicated = null;
let chartUmurAsetL3 = null;
let chartUmurAsetL2 = null;
let chartL2Provinsi = null;
let chartL2BrandRisk = null;
let chartL2HI = null;
let chartL2Tren = null;
let chartDetailTrenHI = null;
let chartCompareRadar = null;

// Mock Data Definitions
// Catatan: `nationalStats` (daftar 38 provinsi + rekap 6 wilayah) didefinisikan
// di bawah `jawaStats` supaya angka provinsi Jawa bisa diturunkan dari satu sumber data.

// aggregated per province; `pt` = Power Transformer, `brandCount`, `avgAge`, `hi45Count`/`hi45Pct`
// (HI 4-5 dari SELURUH aset provinsi), `gis` = Gardu Induk, `upt` = rekap UPT
const jawaStats = {
  totalAssets: '10.214',
  totalBrands: 24,
  avgHI: 2.71,
  hi45Count: '2.237',
  provinces: [
    {
      name: 'Banten', lat: -6.40, lng: 106.15, count: '1.564', avgHI: 2.55, color: '#ef4444',
      pt: 356, brandCount: 10, avgAge: 16.8, hi45Count: 298, hi45Pct: 19.0,
      topTypes: [
        { name: 'Power Transformer', count: 356 },
        { name: 'CB (Circuit Breaker)', count: 268 },
        { name: 'CT (Current Transformer)', count: 214 }
      ],
      gis: [
        { name: 'GI Serang', lat: -6.115, lng: 106.150 },
        { name: 'GI Cilegon', lat: -6.017, lng: 106.053 },
        { name: 'GI Merak', lat: -5.930, lng: 105.980 },
        { name: 'GI Bayur', lat: -6.480, lng: 106.320 },
        { name: 'GI Pandeglang', lat: -6.350, lng: 106.130 },
        { name: 'GI Tangerang', lat: -6.180, lng: 106.630 }
      ],
      upt: [
        { name: 'UPT Serang', count: 96, mva: '3.450', hi45: 17, ratio: 17.7 },
        { name: 'UPT Cilegon', count: 88, mva: '3.170', hi45: 14, ratio: 15.9 },
        { name: 'UPT Pandeglang', count: 62, mva: '2.230', hi45: 12, ratio: 19.4 },
        { name: 'UPT Tangerang', count: 60, mva: '2.160', hi45: 13, ratio: 21.7 },
        { name: 'UPT Karawang', count: 50, mva: '1.800', hi45: 11, ratio: 22.0 }
      ]
    },
    {
      name: 'DKI Jakarta', lat: -6.20, lng: 106.84, count: '1.231', avgHI: 2.64, color: '#ef4444',
      pt: 214, brandCount: 9, avgAge: 14.2, hi45Count: 246, hi45Pct: 20.0,
      topTypes: [
        { name: 'Power Transformer', count: 214 },
        { name: 'CB (Circuit Breaker)', count: 186 },
        { name: 'CT (Current Transformer)', count: 152 }
      ],
      gis: [
        { name: 'GI Cawang', lat: -6.242, lng: 106.882 },
        { name: 'GI Gambir', lat: -6.176, lng: 106.820 },
        { name: 'GI Ciracas', lat: -6.320, lng: 106.900 },
        { name: 'GI Tegall', lat: -6.200, lng: 106.830 },
        { name: 'GI Tambora', lat: -6.190, lng: 106.800 },
        { name: 'GI Duren Sawit', lat: -6.290, lng: 106.920 }
      ],
      upt: [
        { name: 'UPT Jakarta Pusat', count: 78, mva: '2.810', hi45: 18, ratio: 23.1 },
        { name: 'UPT Jakarta Timur', count: 62, mva: '2.230', hi45: 14, ratio: 22.6 },
        { name: 'UPT Jakarta Selatan', count: 46, mva: '1.660', hi45: 10, ratio: 21.7 },
        { name: 'UPT Jakarta Barat', count: 28, mva: '1.010', hi45: 5, ratio: 17.9 }
      ]
    },
    {
      name: 'Jawa Barat', lat: -6.90, lng: 107.60, count: '2.843', avgHI: 2.71, color: '#ef4444',
      pt: 842, brandCount: 12, avgAge: 18.4, hi45Count: 624, hi45Pct: 21.9,
      topTypes: [
        { name: 'Power Transformer', count: 842 },
        { name: 'CB (Circuit Breaker)', count: 526 },
        { name: 'CT (Current Transformer)', count: 418 }
      ],
      gis: [
        { name: 'GI Cibatu', lat: -7.108, lng: 107.986 },
        { name: 'GI Gandul', lat: -6.329, lng: 106.787 },
        { name: 'GI Bekasi', lat: -6.238, lng: 106.992 },
        { name: 'GI Bandung Selatan', lat: -6.980, lng: 107.620 },
        { name: 'GI Mandirancan', lat: -6.832, lng: 108.471 },
        { name: 'GI Tasikmalaya', lat: -7.327, lng: 108.220 }
      ],
      upt: [
        { name: 'UPT Bandung', count: 214, mva: '7.850', hi45: 48, ratio: 22.4 },
        { name: 'UPT Cirebon', count: 178, mva: '6.200', hi45: 39, ratio: 21.9 },
        { name: 'UPT Bekasi', count: 186, mva: '8.100', hi45: 44, ratio: 23.6 },
        { name: 'UPT Bogor', count: 142, mva: '5.400', hi45: 30, ratio: 21.1 },
        { name: 'UPT Karawang', count: 122, mva: '4.900', hi45: 25, ratio: 20.5 }
      ]
    },
    {
      name: 'Jawa Tengah', lat: -7.15, lng: 110.15, count: '2.102', avgHI: 2.68, color: '#ef4444',
      pt: 604, brandCount: 12, avgAge: 19.1, hi45Count: 430, hi45Pct: 20.4,
      topTypes: [
        { name: 'Power Transformer', count: 604 },
        { name: 'CB (Circuit Breaker)', count: 392 },
        { name: 'CT (Current Transformer)', count: 318 }
      ],
      gis: [
        { name: 'GI Kalibaru', lat: -6.980, lng: 110.320 },
        { name: 'GI Wonosobo', lat: -7.360, lng: 109.920 },
        { name: 'GI Iji', lat: -7.270, lng: 110.430 },
        { name: 'GI Palimanan', lat: -6.860, lng: 109.140 },
        { name: 'GI Purwokerto', lat: -7.070, lng: 109.260 },
        { name: 'GI Pekalongan', lat: -6.890, lng: 109.660 }
      ],
      upt: [
        { name: 'UPT Semarang', count: 152, mva: '5.470', hi45: 30, ratio: 19.7 },
        { name: 'UPT Surakarta', count: 118, mva: '4.250', hi45: 23, ratio: 19.5 },
        { name: 'UPT Semarang Utara', count: 96, mva: '3.460', hi45: 20, ratio: 20.8 },
        { name: 'UPT Cilacap', count: 84, mva: '3.020', hi45: 18, ratio: 21.4 },
        { name: 'UPT Purwokerto', count: 78, mva: '2.810', hi45: 15, ratio: 19.2 },
        { name: 'UPT Pekalongan', count: 76, mva: '2.740', hi45: 16, ratio: 21.1 }
      ]
    },
    {
      name: 'Jawa Timur', lat: -7.53, lng: 112.23, count: '1.674', avgHI: 2.75, color: '#ef4444',
      pt: 498, brandCount: 11, avgAge: 17.6, hi45Count: 382, hi45Pct: 22.8,
      topTypes: [
        { name: 'Power Transformer', count: 498 },
        { name: 'CB (Circuit Breaker)', count: 316 },
        { name: 'CT (Current Transformer)', count: 254 }
      ],
      gis: [
        { name: 'GI Pandean', lat: -7.020, lng: 112.430 },
        { name: 'GI Ventura', lat: -7.230, lng: 112.720 },
        { name: 'GI Driyorejo', lat: -7.330, lng: 112.680 },
        { name: 'GI Pegirian', lat: -7.250, lng: 112.730 },
        { name: 'GI Mojokerto', lat: -7.520, lng: 112.550 },
        { name: 'GI Kediri', lat: -7.800, lng: 112.010 }
      ],
      upt: [
        { name: 'UPT Surabaya', count: 138, mva: '4.970', hi45: 33, ratio: 23.9 },
        { name: 'UPT Malang', count: 112, mva: '4.030', hi45: 27, ratio: 24.1 },
        { name: 'UPT Gresik', count: 96, mva: '3.460', hi45: 22, ratio: 22.9 },
        { name: 'UPT Kediri', count: 84, mva: '3.020', hi45: 20, ratio: 23.8 },
        { name: 'UPT Madiun', count: 68, mva: '2.450', hi45: 15, ratio: 22.1 }
      ]
    }
  ]
};

// -------------------------------------------------------------
// DAFTAR 38 PROVINSI — dasar peta Level 1 dan indeks pencarian
// -------------------------------------------------------------
// `count` = seluruh aset, `hi45` = unit HI 4–5, `avgHI` = rata-rata Health Index.
// `alias` = nama panggilan/nama lama agar pencarian tidak gagal (mis. "Jogja", "Jabar").
const REGION_META = [
  { name: 'Sumatera', color: '#f97316' },
  { name: 'Jawa', color: '#ef4444' },
  { name: 'Kalimantan', color: '#f59e0b' },
  { name: 'Sulawesi', color: '#10b981' },
  { name: 'Nusa Tenggara', color: '#f59e0b' },
  { name: 'Papua & Maluku', color: '#f97316' }
];

// 5 provinsi Jawa diambil dari `jawaStats` supaya peta depan dan drill-down tidak pernah beda angka.
const PROVINCE_SEED = [
  // --- Sumatera (10) ---
  { name: 'Aceh', region: 'Sumatera', lat: 4.2, lng: 97.0, count: 1250, avgHI: 2.68, hi45: 232, alias: 'aceh' },
  { name: 'Sumatera Utara', region: 'Sumatera', lat: 2.6, lng: 99.0, count: 1450, avgHI: 2.66, hi45: 268, alias: 'sumut sumatera utara' },
  { name: 'Sumatera Barat', region: 'Sumatera', lat: -0.95, lng: 100.35, count: 1100, avgHI: 2.69, hi45: 196, alias: 'sumbar sumatera barat' },
  { name: 'Riau', region: 'Sumatera', lat: 0.6, lng: 101.5, count: 800, avgHI: 2.64, hi45: 152, alias: 'riau kepulauan riau' },
  { name: 'Jambi', region: 'Sumatera', lat: -1.6, lng: 103.6, count: 700, avgHI: 2.61, hi45: 140, alias: 'jambi' },
  { name: 'Sumatera Selatan', region: 'Sumatera', lat: -3.1, lng: 104.2, count: 1700, avgHI: 2.70, hi45: 340, alias: 'sumsel sumatera selatan' },
  { name: 'Bengkulu', region: 'Sumatera', lat: -3.8, lng: 102.4, count: 520, avgHI: 2.58, hi45: 98, alias: 'bengkulu bengkalis' },
  { name: 'Lampung', region: 'Sumatera', lat: -4.4, lng: 105.3, count: 1100, avgHI: 2.67, hi45: 205, alias: 'lampung' },
  { name: 'Bangka Belitung', region: 'Sumatera', lat: -2.2, lng: 106.1, count: 280, avgHI: 2.55, hi45: 62, alias: 'bangka belitung kep Bangka Belitung' },
  { name: 'Kepulauan Riau', region: 'Sumatera', lat: 0.9, lng: 104.6, count: 180, avgHI: 2.60, hi45: 40, alias: 'riau kepulauan kepulauan riau batam' },
  // --- Kalimantan (5) ---
  { name: 'Kalimantan Barat', region: 'Kalimantan', lat: 0.2, lng: 112.0, count: 880, avgHI: 2.57, hi45: 176, alias: 'kalbar kalimantan barat' },
  { name: 'Kalimantan Tengah', region: 'Kalimantan', lat: -1.6, lng: 113.9, count: 560, avgHI: 2.55, hi45: 118, alias: 'kalteng kalimantan tengah' },
  { name: 'Kalimantan Selatan', region: 'Kalimantan', lat: -3.0, lng: 114.6, count: 1080, avgHI: 2.59, hi45: 216, alias: 'kalsel kalimantan selatan' },
  { name: 'Kalimantan Timur', region: 'Kalimantan', lat: 1.4, lng: 116.3, count: 1200, avgHI: 2.54, hi45: 265, alias: 'kaltim kalimantan timur' },
  { name: 'Kalimantan Utara', region: 'Kalimantan', lat: 2.6, lng: 117.5, count: 290, avgHI: 2.49, hi45: 68, alias: 'kalut kalimantan utara' },
  // --- Sulawesi (6) ---
  { name: 'Sulawesi Utara', region: 'Sulawesi', lat: 1.5, lng: 124.8, count: 780, avgHI: 2.61, hi45: 148, alias: 'sulut sulawesi utara' },
  { name: 'Gorontalo', region: 'Sulawesi', lat: 0.8, lng: 121.6, count: 240, avgHI: 2.60, hi45: 50, alias: 'gorontalo' },
  { name: 'Sulawesi Tengah', region: 'Sulawesi', lat: -1.4, lng: 120.4, count: 520, avgHI: 2.58, hi45: 105, alias: 'sulteng sulawesi tengah' },
  { name: 'Sulawesi Barat', region: 'Sulawesi', lat: -2.6, lng: 119.4, count: 440, avgHI: 2.55, hi45: 92, alias: 'sulbar sulawesi barat' },
  { name: 'Sulawesi Selatan', region: 'Sulawesi', lat: -4.6, lng: 120.5, count: 1200, avgHI: 2.63, hi45: 230, alias: 'sulsel sulawesi selatan' },
  { name: 'Sulawesi Tenggara', region: 'Sulawesi', lat: -3.9, lng: 122.5, count: 600, avgHI: 2.56, hi45: 125, alias: 'sultra sulawesi tenggara' },
  // --- Nusa Tenggara (3) ---
  { name: 'Bali', region: 'Nusa Tenggara', lat: -8.4, lng: 115.2, count: 940, avgHI: 2.66, hi45: 190, alias: 'bali' },
  { name: 'Nusa Tenggara Barat', region: 'Nusa Tenggara', lat: -8.7, lng: 117.4, count: 590, avgHI: 2.60, hi45: 118, alias: 'ntb lombok nusa tenggara barat' },
  { name: 'Nusa Tenggara Timur', region: 'Nusa Tenggara', lat: -9.3, lng: 123.9, count: 500, avgHI: 2.48, hi45: 105, alias: 'ntt timor nusa tenggara timur' },
  // --- Papua & Maluku (8) ---
  { name: 'Maluku', region: 'Papua & Maluku', lat: -3.7, lng: 128.5, count: 390, avgHI: 2.70, hi45: 92, alias: 'maluku ambon' },
  { name: 'Maluku Utara', region: 'Papua & Maluku', lat: 1.4, lng: 127.1, count: 240, avgHI: 2.66, hi45: 58, alias: 'malut maluku utara ternate' },
  { name: 'Papua Barat', region: 'Papua & Maluku', lat: -2.5, lng: 132.0, count: 220, avgHI: 2.69, hi45: 55, alias: 'pabar papua barat' },
  { name: 'Papua Barat Daya', region: 'Papua & Maluku', lat: -3.6, lng: 136.0, count: 120, avgHI: 2.66, hi45: 30, alias: 'pabaya papua barat daya sorong' },
  { name: 'Papua', region: 'Papua & Maluku', lat: -3.2, lng: 137.6, count: 350, avgHI: 2.72, hi45: 88, alias: 'papua jayapura' },
  { name: 'Papua Selatan', region: 'Papua & Maluku', lat: -3.6, lng: 141.0, count: 165, avgHI: 2.68, hi45: 40, alias: 'p_selatan papuatim papua selatan merauke' },
  { name: 'Papua Tengah', region: 'Papua & Maluku', lat: -2.6, lng: 140.6, count: 105, avgHI: 2.65, hi45: 26, alias: 'ptengah papua tengah' },
  { name: 'Papua Pegunungan', region: 'Papua & Maluku', lat: -4.1, lng: 141.6, count: 80, avgHI: 2.60, hi45: 22, alias: 'pgun papua pegunungan wamena' }
];

// Susun daftar final: 32 provinsi non-Jawa + DI Yogyakarta + 5 provinsi Jawa dari `jawaStats`
// supaya tidak ada angka ganda antara peta depan dan drill-down.
const PROVINCE_LIST = (() => {
  const jawaProvinces = jawaStats.provinces.map(p => ({
    name: p.name,
    region: 'Jawa',
    lat: p.lat,
    lng: p.lng,
    count: numValue(p.count),
    avgHI: p.avgHI,
    hi45: p.hi45Count,
    alias: p.name === 'DKI Jakarta' ? 'dki jakarta jakarta jakarta pusat'
      : p.name === 'Jawa Barat' ? 'jabar jawa barat barat'
      : p.name === 'Jawa Tengah' ? 'jatem jawa tengah tengah'
      : p.name === 'Jawa Timur' ? 'jatim jawa timur timur'
      : p.name.toLowerCase()
  }));

  // DI Yogyakarta: satu-satunya provinsi Jawa yang belum punya drill-down, angkanya
  // disetel supaya total Jawa = `jawaStats.totalAssets` (10.214).
  const diyCount = numValue(jawaStats.totalAssets) - jawaProvinces.reduce((s, p) => s + p.count, 0);
  return [
    ...PROVINCE_SEED.filter(p => p.region !== 'Jawa'),
    { name: 'DI Yogyakarta', region: 'Jawa', lat: -7.80, lng: 110.36, count: diyCount, avgHI: 2.58, hi45: 150, alias: 'diy yogyakarta jogja jogjakarta' },
    ...jawaProvinces
  ].sort((a, b) => a.name.localeCompare(b.name));
})();

// Rekap nasional & 6 wilayah dihitung dari daftar provinsi di atas (single source of truth).
const nationalStats = (() => {
  const totalAssets = PROVINCE_LIST.reduce((s, p) => s + p.count, 0);
  const hi45Count = PROVINCE_LIST.reduce((s, p) => s + p.hi45, 0);
  const avgHI = PROVINCE_LIST.reduce((s, p) => s + p.avgHI * p.count, 0) / totalAssets;

  const regions = REGION_META.map(r => {
    const list = PROVINCE_LIST.filter(p => p.region === r.name);
    const count = list.reduce((s, p) => s + p.count, 0);
    const hi45 = list.reduce((s, p) => s + p.hi45, 0);
    return {
      name: r.name,
      color: r.color,
      count,
      countLabel: fmtInt(count),
      avgHI: list.reduce((s, p) => s + p.avgHI * p.count, 0) / count,
      hi45,
      hi45Pct: (hi45 / count) * 100,
      lat: list.reduce((s, p) => s + p.lat * p.count, 0) / count,
      lng: list.reduce((s, p) => s + p.lng * p.count, 0) / count,
      provinces: list
    };
  });

  return {
    provinces: PROVINCE_LIST,
    provinceCount: PROVINCE_LIST.length,
    regions,
    regionColors: REGION_META.reduce((acc, r) => ({ ...acc, [r.name]: r.color }), {}),
    totalAssets,
    totalAssetsLabel: fmtInt(totalAssets),
    totalBrands: 24,
    avgHI,
    hi45Count,
    hi45Label: fmtInt(hi45Count),
    hi45Pct: (hi45Count / totalAssets) * 100
  };
})();

// Hanya 5 provinsi Jawa yang punya drill-down data; sisanya masuk ke scope Jawa agregat.
function findJawaProvince(name) {
  return jawaStats.provinces.find(p => p.name === name) || null;
}

// -------------------------------------------------------------
// HIERARKI ORGANISASI: Unit Induk > Unit Pelaksana (UPT) > ULTG > Gardu Induk
// -------------------------------------------------------------
// Dipakai untuk filter berjenjang di halaman depan dan untuk pencarian.
// Bentuk: [Unit Induk, nama panjang, [ [UPT, provinsi, [ [ULTG, [GI, ...]] ]] ]
// Koordinat Gardu Induk diambil dari data Jawa bila tersedia, selebihnya memakai
// titik tengah provinsi (prototype belum punya koordinat per GI di luar Jawa).
const ORG_RAW = [
  // 1. UIT JBB: Jawa Bagian Barat (DKI Jakarta & Banten)
  ['UIT JBB', 'PLN Unit Induk Transmisi Jawa Bagian Barat', [
    ['UPT Cawang', 'DKI Jakarta', [
      ['ULTG Cawang', ['GI Cawang', 'GI Gambir', 'GI Senayan']]
    ], [-6.2550, 106.8750]],
    ['UPT Pulogadung', 'DKI Jakarta', [
      ['ULTG Pulogadung', ['GI Pulogadung', 'GI Ciracas', 'GI Duren Sawit']]
    ], [-6.1350, 106.9650]],
    ['UPT Gandul', 'DKI Jakarta', [
      ['ULTG Gandul', ['GI Gandul', 'GI Tebet', 'GI Depok']]
    ], [-6.3900, 106.7900]],
    ['UPT Durikosambi', 'DKI Jakarta', [
      ['ULTG Durikosambi', ['GI Tambora', 'GI Kebon Jeruk', 'GI Tegall']]
    ], [-6.1150, 106.6850]],
    ['UPT Cilegon', 'Banten', [
      ['ULTG Cilegon', ['GI Cilegon', 'GI Merak', 'GI Baleraja']]
    ], [-5.9850, 106.0250]],
    ['UPT Banten Baru', 'Banten', [
      ['ULTG Serang', ['GI Serang', 'GI Tangerang', 'GI Pandeglang']]
    ], [-6.1250, 106.1850]]
  ]],

  // 2. UIT JBT: Jawa Bagian Tengah (Jawa Barat, Jawa Tengah & DIY)
  ['UIT JBT', 'PLN Unit Induk Transmisi Jawa Bagian Tengah', [
    ['UPT Bandung', 'Jawa Barat', [
      ['ULTG Bandung Raya', ['GI Cibatu', 'GI Bandung Selatan']],
      ['ULTG Bandung Timur', ['GI Mandirancan', 'GI Tasikmalaya']],
      ['ULTG Garut', ['GI Garut', 'GI Wanaraja']]
    ], [-6.9175, 107.6191]],
    ['UPT Cirebon', 'Jawa Barat', [
      ['ULTG Cirebon Raya', ['GI Cirebon', 'GI Patimban', 'GI Gebang']]
    ], [-6.7320, 108.5523]],
    ['UPT Bekasi', 'Jawa Barat', [
      ['ULTG Bekasi', ['GI Bekasi', 'GI Cikarang']]
    ], [-6.2383, 106.9756]],
    ['UPT Bogor', 'Jawa Barat', [
      ['ULTG Bogor', ['GI Bogor', 'GI Ciawi']]
    ], [-6.5971, 106.8060]],
    ['UPT Karawang', 'Jawa Barat', [
      ['ULTG Karawang', ['GI Karawang']]
    ], [-6.3042, 107.3055]],
    ['UPT Semarang', 'Jawa Tengah', [
      ['ULTG Semarang', ['GI Kalibaru', 'GI Ungaran']],
      ['ULTG Kendal', ['GI Kendal', 'GI Diponegoro']]
    ], [-6.9667, 110.4167]],
    ['UPT Salatiga', 'Jawa Tengah', [
      ['ULTG Salatiga', ['GI Salatiga', 'GI Bawen']]
    ], [-7.3305, 110.5084]],
    ['UPT Purwokerto', 'Jawa Tengah', [
      ['ULTG Purwokerto', ['GI Purwokerto', 'GI Cilacap', 'GI Wonosobo']]
    ], [-7.4244, 109.2301]],
    ['UPT Surakarta', 'Jawa Tengah', [
      ['ULTG Surakarta', ['GI Palur', 'GI Surakarta', 'GI Klaten']]
    ], [-7.5755, 110.8243]],
    ['UPT Yogyakarta', 'DI Yogyakarta', [
      ['ULTG Yogyakarta', ['GI Wirobrajan', 'GI Wonosari']]
    ], [-7.7956, 110.3695]]
  ]],

  // 3. UIT JBM: Jawa Bagian Timur & Bali (Jawa Timur & Bali)
  ['UIT JBM', 'PLN Unit Induk Transmisi Jawa Bagian Timur & Bali', [
    ['UPT Surabaya', 'Jawa Timur', [
      ['ULTG Surabaya Barat', ['GI Pandean', 'GI Ventura']],
      ['ULTG Gresik', ['GI Gresik', 'GI Manyar']]
    ], [-7.2575, 112.7521]],
    ['UPT Malang', 'Jawa Timur', [
      ['ULTG Malang', ['GI Malang', 'GI Pujon']],
      ['ULTG Mojokerto', ['GI Mojokerto', 'GI Driyorejo']]
    ], [-7.9666, 112.6326]],
    ['UPT Madiun', 'Jawa Timur', [
      ['ULTG Madiun', ['GI Madiun', 'GI Ngantang', 'GI Kediri']]
    ], [-7.6298, 111.5239]],
    ['UPT Probolinggo', 'Jawa Timur', [
      ['ULTG Probolinggo', ['GI Probolinggo', 'GI Paiton', 'GI Banyuwangi']]
    ], [-7.7543, 113.2159]],
    ['UPT Bali', 'Bali', [
      ['ULTG Bali Timur', ['GI Kapal', 'GI Pesanggaran', 'GI Sanur']]
    ], [-8.6705, 115.2126]]
  ]],

  // 4. UIP3B SUM: Sumatera
  ['UIP3B SUM', 'PLN UIP3B Sumatera', [
    ['UPT Banda Aceh', 'Aceh', [['ULTG Aceh', ['GI Banda Aceh', 'GI Lhokseumawe']]], [5.5483, 95.3238]],
    ['UPT Medan', 'Sumatera Utara', [['ULTG Medan', ['GI Belawan', 'GI Medan']]], [3.5952, 98.6722]],
    ['UPT Pematang Siantar', 'Sumatera Utara', [['ULTG Siantar', ['GI Pematang Siantar', 'GI Kisaran']]], [2.9590, 99.0687]],
    ['UPT Pekanbaru', 'Riau', [['ULTG Pekanbaru', ['GI Pekanbaru', 'GI Bangkinang', 'GI Dumai']]], [0.5071, 101.4478]],
    ['UPT Padang', 'Sumatera Barat', [['ULTG Padang', ['GI Bungus', 'GI Padang', 'GI Bukittinggi']]], [-0.9471, 100.4172]],
    ['UPT Jambi', 'Jambi', [['ULTG Jambi', ['GI Jambi', 'GI Muara Bungo']]], [-1.6101, 103.6131]],
    ['UPT Palembang', 'Sumatera Selatan', [['ULTG Palembang', ['GI Bukit Siguntang', 'GI Sriwijaya']]], [-2.9761, 104.7754]],
    ['UPT Bengkulu', 'Bengkulu', [['ULTG Bengkulu', ['GI Bengkulu', 'GI Curup']]], [-3.8004, 102.2655]],
    ['UPT Tanjung Karang', 'Lampung', [['ULTG Lampung', ['GI Terbanggi', 'GI Tarahan']]], [-5.4292, 105.2611]]
  ]],

  // 5. UIP3B KAL: Kalimantan
  ['UIP3B KAL', 'PLN UIP3B Kalimantan', [
    ['UPT Pontianak', 'Kalimantan Barat', [['ULTG Kalbar', ['GI Pontianak', 'GI Ketapang']]], [-0.0263, 109.3425]],
    ['UPT Palangka Raya', 'Kalimantan Tengah', [['ULTG Kalteng', ['GI Palangka Raya', 'GI Sampit']]], [-2.2161, 113.9140]],
    ['UPT Banjarmasin', 'Kalimantan Selatan', [['ULTG Kalsel', ['GI Banjarmasin', 'GI Asam Asam']]], [-3.3194, 114.5908]],
    ['UPT Balikpapan', 'Kalimantan Timur', [['ULTG Kaltim Selatan', ['GI Balikpapan', 'GI Kariangau']]], [-1.2379, 116.8529]],
    ['UPT Samarinda', 'Kalimantan Timur', [['ULTG Kaltim Utara', ['GI Samarinda', 'GI Bontang']]], [-0.5022, 117.1537]]
  ]],

  // 6. UIP3B SUL: Sulawesi
  ['UIP3B SUL', 'PLN UIP3B Sulawesi', [
    ['UPT Manado', 'Sulawesi Utara', [['ULTG Sulut', ['GI Manado', 'GI Bitung']]], [1.4748, 124.8421]],
    ['UPT Palu', 'Sulawesi Tengah', [['ULTG Sulteng', ['GI Palu', 'GI Poso']]], [-0.9003, 119.8779]],
    ['UPT Makassar', 'Sulawesi Selatan', [['ULTG Sulsel', ['GI Makassar', 'GI Parepare', 'GI Bakaru']]], [-5.1477, 119.4327]],
    ['UPT Kendari', 'Sulawesi Tenggara', [['ULTG Sultra', ['GI Kendari', 'GI Kolaka']]], [-3.9985, 122.5126]],
    ['UPT Mamuju', 'Sulawesi Barat', [['ULTG Sulbar', ['GI Mamuju', 'GI Majene']]], [-2.6788, 118.8926]]
  ]]
];

function getDefaultBaysForGi(giName) {
  if (giName === 'GI Cibatu') {
    return [
      { name: 'Bay Trafo 1', code: 'TRF-1' },
      { name: 'Bay Trafo 2', code: 'TRF-2' },
      { name: 'Bay Penghantar Garut 1', code: 'LINE-GRT1' },
      { name: 'Bay Penghantar Garut 2', code: 'LINE-GRT2' },
      { name: 'Bay Kopel 150 kV', code: 'KOPEL-150' }
    ];
  }
  if (giName.includes('500kV') || giName.includes('500')) {
    return [
      { name: 'Bay IBT 1 500 kV', code: 'IBT-1' },
      { name: 'Bay IBT 2 500 kV', code: 'IBT-2' },
      { name: 'Bay Penghantar 1 500 kV', code: 'LINE-1' },
      { name: 'Bay Kopel 500 kV', code: 'KOPEL-500' }
    ];
  }
  return [
    { name: 'Bay Trafo 1', code: 'TRF-1' },
    { name: 'Bay Trafo 2', code: 'TRF-2' },
    { name: 'Bay Penghantar 1', code: 'LINE-1' },
    { name: 'Bay Penghantar 2', code: 'LINE-2' },
    { name: 'Bay Kopel 150 kV', code: 'KOPEL-150' }
  ];
}

const ORG_HIERARCHY = (() => {
  const giCoords = new Map();
  jawaStats.provinces.forEach(p => p.gis.forEach(g => giCoords.set(g.name, { lat: g.lat, lng: g.lng })));

  return ORG_RAW.map(([code, name, upts]) => ({
    code,
    name,
    alias: [
      name,
      code,
      code.replace(/\s+/g, ''),
      code.replace(/^UIP3B\s+/, ''),
      code.replace(/^UIT\s+/, ''),
      name.replace(/\s+/g, ''),
      name.replace(/^PLN\s+/, '')
    ].join(' '),
    upts: upts.map(([uptName, province, ultgs, customCoord]) => {
      const uptLat = customCoord ? customCoord[0] : -2.0;
      const uptLng = customCoord ? customCoord[1] : 118.0;

      return {
        name: uptName,
        province,
        lat: uptLat,
        lng: uptLng,
        ultgs: ultgs.map(([ultgName, gis], ultgIdx) => {
          const ultgOffsetLat = ultgs.length > 1 ? (ultgIdx === 0 ? 0.07 : ultgIdx === 1 ? -0.07 : 0.05 * (ultgIdx - 1)) : 0;
          const ultgOffsetLng = ultgs.length > 1 ? (ultgIdx === 0 ? -0.07 : ultgIdx === 1 ? 0.07 : 0.05 * (ultgIdx - 1)) : 0;
          const approxUltgLat = uptLat + ultgOffsetLat;
          const approxUltgLng = uptLng + ultgOffsetLng;

          const giList = gis.map((giItem, giIdx) => {
            const giName = typeof giItem === 'string' ? giItem : giItem.name;
            const bays = (typeof giItem === 'object' && giItem.bays) ? giItem.bays : getDefaultBaysForGi(giName);
            const known = giCoords.get(giName);
            const lat = known ? known.lat : (approxUltgLat + (giIdx === 0 ? 0.04 : giIdx === 1 ? -0.04 : 0.03 * (giIdx - 1)));
            const lng = known ? known.lng : (approxUltgLng + (giIdx === 0 ? -0.04 : giIdx === 1 ? 0.04 : 0.03 * (giIdx - 1)));
            return {
              name: giName,
              province,
              lat,
              lng,
              bays: bays.map(b => (typeof b === 'string' ? { name: b } : b))
            };
          });

          return {
            name: ultgName,
            lat: giList.length ? avgLat(giList) : approxUltgLat,
            lng: giList.length ? avgLng(giList) : approxUltgLng,
            gis: giList
          };
        })
      };
    })
  }));
})();

function findUnitInduk(code) {
  return ORG_HIERARCHY.find(u => u.code === code) || null;
}

function findUptByName(name, unitIndukCode) {
  const ui = unitIndukCode ? findUnitInduk(unitIndukCode) : null;
  const scope = ui ? ui.upts : ORG_HIERARCHY.flatMap(u => u.upts);
  return scope.find(u => u.name === name) || null;
}

function findUltgByName(name, uptName, unitIndukCode) {
  const upt = uptName && uptName !== 'Semua' ? findUptByName(uptName, unitIndukCode) : null;
  if (!upt) {
    const allUltgs = ORG_HIERARCHY.flatMap(ui => ui.upts.flatMap(u => u.ultgs));
    return allUltgs.find(u => u.name === name) || null;
  }
  return upt.ultgs.find(u => u.name === name) || null;
}

function findGiByName(name, ultgName, uptName, unitIndukCode) {
  const ultg = ultgName && ultgName !== 'Semua' ? findUltgByName(ultgName, uptName, unitIndukCode) : null;
  if (!ultg) {
    const allGis = ORG_HIERARCHY.flatMap(ui => ui.upts.flatMap(u => u.ultgs.flatMap(g => g.gis)));
    return allGis.find(g => g.name === name) || null;
  }
  return ultg.gis.find(g => g.name === name) || null;
}

// =============================================================
// KONFIGURASI KATALOG JENIS ASET TRANSMISI (MANTAPS / POWER INSPECT)
// =============================================================
const ASSET_TYPE_CONFIGS = {
  'Power Transformer': {
    name: 'Power Transformer',
    label: 'Power Transformer (Trafo Tenaga)',
    shortCode: 'TRF',
    icon: 'zap',
    unitName: 'Unit Trafo',
    total: 842,
    totalJawa: 2514,
    totalNasional: 10214,
    avgAge: 18.4,
    avgHI: 2.74,
    voltageDesc: 'Transformator Daya 150/500 kV',
    unitCapacityLabel: 'Kapasitas terpasang',
    unitCapacityUnit: 'MVA',
    capacityMultiplier: 60,
    groupName: 'Lainnya',
    brands: [
      { name: 'ABB', count: 182, hi: [28, 32, 22, 12, 6], avgHI: 2.78, avgAge: 18.4, age: [12, 18, 32, 26, 12] },
      { name: 'Siemens', count: 138, hi: [32, 34, 20, 10, 4], avgHI: 2.54, avgAge: 16.2, age: [14, 20, 30, 24, 12] },
      { name: 'Toshiba', count: 112, hi: [24, 29, 28, 14, 5], avgHI: 2.69, avgAge: 19.1, age: [10, 16, 32, 28, 14] },
      { name: 'GE', count: 98, hi: [20, 31, 27, 16, 6], avgHI: 2.74, avgAge: 20.3, age: [8, 14, 30, 30, 18] },
      { name: 'Hitachi', count: 72, hi: [22, 30, 24, 18, 6], avgHI: 2.70, avgAge: 17.8, age: [16, 22, 32, 20, 10] }
    ],
    minorBrands: [
      { name: 'Hyundai', weight: 13, avgHI: 2.86, avgAge: 20.4 },
      { name: 'Hyosung', weight: 12, avgHI: 2.83, avgAge: 19.8 },
      { name: 'S&C Electric', weight: 11, avgHI: 2.81, avgAge: 21.2 },
      { name: 'Plus Celcom', weight: 11, avgHI: 2.88, avgAge: 22.0 },
      { name: 'Ecowatt', weight: 10, avgHI: 2.79, avgAge: 18.6 },
      { name: 'Victor', weight: 10, avgHI: 2.90, avgAge: 23.4 },
      { name: 'Merlin Gerin', weight: 9, avgHI: 2.76, avgAge: 24.1 },
      { name: 'Aichi', weight: 9, avgHI: 2.82, avgAge: 20.9 },
      { name: 'Elin', weight: 8, avgHI: 2.85, avgAge: 19.4 },
      { name: 'Fuji Electric', weight: 8, avgHI: 2.74, avgAge: 17.9 },
      { name: 'Schneider Electric', weight: 8, avgHI: 2.71, avgAge: 16.8 },
      { name: 'Sunlight', weight: 7, avgHI: 2.87, avgAge: 21.7 },
      { name: 'Star', weight: 7, avgHI: 2.80, avgAge: 19.1 },
      { name: 'Megapower', weight: 7, avgHI: 2.89, avgAge: 22.6 },
      { name: 'Tosis', weight: 6, avgHI: 2.84, avgAge: 20.2 },
      { name: 'Japan Electric', weight: 6, avgHI: 2.78, avgAge: 18.8 },
      { name: 'Kobe Steel', weight: 5, avgHI: 2.81, avgAge: 19.9 },
      { name: 'Nitto Kogyo', weight: 4, avgHI: 2.86, avgAge: 20.6 },
      { name: 'Daewoo', weight: 4, avgHI: 2.92, avgAge: 24.8 }
    ]
  },
  'PMT': {
    name: 'PMT',
    label: 'PMT (Pemutus Tenaga / Circuit Breaker)',
    shortCode: 'PMT',
    icon: 'toggle-right',
    unitName: 'Bay PMT',
    total: 2980,
    totalJawa: 8850,
    totalNasional: 28400,
    avgAge: 16.5,
    avgHI: 2.62,
    voltageDesc: '70/150/500 kV • Media Gas SF6 & Vakum',
    unitCapacityLabel: 'Kapasitas Pemutusan',
    unitCapacityUnit: 'kA',
    capacityMultiplier: 40,
    groupName: 'Lainnya',
    brands: [
      { name: 'ABB', count: 780, hi: [34, 35, 18, 9, 4], avgHI: 2.48, avgAge: 15.2, age: [18, 24, 32, 18, 8] },
      { name: 'Siemens', count: 690, hi: [36, 34, 18, 8, 4], avgHI: 2.42, avgAge: 14.8, age: [20, 26, 30, 16, 8] },
      { name: 'Alstom / GE', count: 480, hi: [25, 33, 24, 13, 5], avgHI: 2.68, avgAge: 18.6, age: [12, 18, 34, 24, 12] },
      { name: 'Mitsubishi', count: 390, hi: [30, 32, 23, 11, 4], avgHI: 2.58, avgAge: 16.9, age: [15, 22, 33, 20, 10] },
      { name: 'Hyundai', count: 280, hi: [26, 32, 25, 12, 5], avgHI: 2.65, avgAge: 17.4, age: [14, 20, 32, 22, 12] }
    ],
    minorBrands: [
      { name: 'Crompton Greaves', weight: 14, avgHI: 2.78, avgAge: 19.2 },
      { name: 'XD Electric', weight: 13, avgHI: 2.82, avgAge: 20.1 },
      { name: 'Hitachi', weight: 12, avgHI: 2.60, avgAge: 16.5 },
      { name: 'Hyosung', weight: 11, avgHI: 2.71, avgAge: 18.0 },
      { name: 'Fuji Electric', weight: 10, avgHI: 2.66, avgAge: 17.5 },
      { name: 'Meidensha', weight: 9, avgHI: 2.74, avgAge: 19.8 },
      { name: 'Schneider Electric', weight: 8, avgHI: 2.55, avgAge: 15.0 },
      { name: 'Toshiba', weight: 8, avgHI: 2.62, avgAge: 16.8 },
      { name: 'Areva', weight: 6, avgHI: 2.85, avgAge: 22.4 },
      { name: 'Daelim', weight: 5, avgHI: 2.88, avgAge: 21.0 },
      { name: 'Pinggao', weight: 4, avgHI: 2.80, avgAge: 18.2 }
    ]
  },
  'PMS': {
    name: 'PMS',
    label: 'PMS (Pemisah / Disconnector Switch)',
    shortCode: 'PMS',
    icon: 'git-commit',
    unitName: 'Set PMS',
    total: 5800,
    totalJawa: 17200,
    totalNasional: 48500,
    avgAge: 19.2,
    avgHI: 2.81,
    voltageDesc: '70/150/500 kV • Rel, Line & Tanah',
    unitCapacityLabel: 'Arus Pengenal',
    unitCapacityUnit: 'A',
    capacityMultiplier: 2000,
    groupName: 'Lainnya',
    brands: [
      { name: 'ABB', count: 1450, hi: [26, 32, 24, 13, 5], avgHI: 2.65, avgAge: 17.8, age: [14, 18, 34, 22, 12] },
      { name: 'Siemens', count: 1280, hi: [28, 34, 22, 11, 5], avgHI: 2.58, avgAge: 17.2, age: [15, 20, 33, 20, 12] },
      { name: 'HAPAM', count: 980, hi: [22, 30, 27, 15, 6], avgHI: 2.78, avgAge: 19.6, age: [10, 16, 32, 26, 16] },
      { name: 'Coelme / EGIC', count: 780, hi: [20, 29, 28, 16, 7], avgHI: 2.84, avgAge: 20.4, age: [8, 15, 30, 28, 19] },
      { name: 'GE / Alstom', count: 620, hi: [21, 31, 26, 15, 7], avgHI: 2.80, avgAge: 20.1, age: [9, 15, 31, 27, 18] }
    ],
    minorBrands: [
      { name: 'Daelim', weight: 15, avgHI: 2.86, avgAge: 20.8 },
      { name: 'Taikai', weight: 14, avgHI: 2.88, avgAge: 21.2 },
      { name: 'Iljin Electric', weight: 12, avgHI: 2.82, avgAge: 19.5 },
      { name: 'Hitachi', weight: 11, avgHI: 2.70, avgAge: 18.2 },
      { name: 'Schneider Electric', weight: 10, avgHI: 2.68, avgAge: 17.4 },
      { name: 'Chint Electric', weight: 9, avgHI: 2.92, avgAge: 22.0 },
      { name: 'Fuji Electric', weight: 9, avgHI: 2.75, avgAge: 18.9 },
      { name: 'S&C Electric', weight: 8, avgHI: 2.79, avgAge: 19.8 },
      { name: 'XD Group', weight: 7, avgHI: 2.89, avgAge: 21.6 },
      { name: 'Elin', weight: 5, avgHI: 2.91, avgAge: 23.0 }
    ]
  },
  'CT': {
    name: 'CT',
    label: 'CT (Current Transformer / Trafo Arus)',
    shortCode: 'CT',
    icon: 'activity',
    unitName: 'Fasa CT',
    total: 8200,
    totalJawa: 24500,
    totalNasional: 68200,
    avgAge: 17.5,
    avgHI: 2.60,
    voltageDesc: '70/150/500 kV • Kelas Proteksi & Metering',
    unitCapacityLabel: 'Rasio Arus Nominal',
    unitCapacityUnit: 'A',
    capacityMultiplier: 1200,
    groupName: 'Lainnya',
    brands: [
      { name: 'Trench', count: 2100, hi: [32, 36, 19, 9, 4], avgHI: 2.45, avgAge: 15.6, age: [18, 22, 34, 18, 8] },
      { name: 'ABB', count: 1850, hi: [34, 34, 20, 8, 4], avgHI: 2.46, avgAge: 15.8, age: [18, 22, 33, 19, 8] },
      { name: 'Koncar', count: 1420, hi: [28, 33, 23, 11, 5], avgHI: 2.62, avgAge: 17.4, age: [14, 19, 33, 22, 12] },
      { name: 'Arteche', count: 1100, hi: [30, 34, 22, 10, 4], avgHI: 2.54, avgAge: 16.5, age: [16, 21, 33, 20, 10] },
      { name: 'Alstom / GE', count: 920, hi: [24, 32, 26, 13, 5], avgHI: 2.70, avgAge: 18.8, age: [12, 17, 33, 24, 14] }
    ],
    minorBrands: [
      { name: 'Emek', weight: 16, avgHI: 2.74, avgAge: 19.2 },
      { name: 'Balteau', weight: 14, avgHI: 2.79, avgAge: 20.4 },
      { name: 'Siemens', weight: 14, avgHI: 2.50, avgAge: 15.4 },
      { name: 'Pfiffner', weight: 12, avgHI: 2.58, avgAge: 16.8 },
      { name: 'Nissin Electric', weight: 11, avgHI: 2.68, avgAge: 18.0 },
      { name: 'XD Electric', weight: 10, avgHI: 2.82, avgAge: 21.0 },
      { name: 'BHEL', weight: 8, avgHI: 2.88, avgAge: 22.6 },
      { name: 'Chint', weight: 8, avgHI: 2.84, avgAge: 20.8 },
      { name: 'Ritrans', weight: 7, avgHI: 2.72, avgAge: 18.5 }
    ]
  },
  'PT': {
    name: 'PT',
    label: 'PT / CVT (Potential Transformer)',
    shortCode: 'PT',
    icon: 'zap-off',
    unitName: 'Fasa PT/CVT',
    total: 4750,
    totalJawa: 14200,
    totalNasional: 41200,
    avgAge: 17.2,
    avgHI: 2.58,
    voltageDesc: '70/150/500 kV • Induktif & Kapasitif (CVT)',
    unitCapacityLabel: 'Tegangan Sekunder',
    unitCapacityUnit: 'V',
    capacityMultiplier: 100,
    groupName: 'Lainnya',
    brands: [
      { name: 'Trench', count: 1250, hi: [33, 35, 19, 9, 4], avgHI: 2.47, avgAge: 15.8, age: [18, 22, 33, 19, 8] },
      { name: 'ABB', count: 1080, hi: [35, 33, 20, 8, 4], avgHI: 2.45, avgAge: 15.5, age: [19, 23, 32, 18, 8] },
      { name: 'Koncar', count: 820, hi: [27, 33, 24, 11, 5], avgHI: 2.64, avgAge: 17.8, age: [13, 18, 34, 23, 12] },
      { name: 'Haefely Trench', count: 620, hi: [31, 34, 21, 10, 4], avgHI: 2.52, avgAge: 16.4, age: [16, 21, 33, 20, 10] },
      { name: 'Arteche', count: 540, hi: [29, 34, 22, 11, 4], avgHI: 2.58, avgAge: 16.9, age: [15, 20, 33, 21, 11] }
    ],
    minorBrands: [
      { name: 'Alstom', weight: 18, avgHI: 2.72, avgAge: 19.0 },
      { name: 'Emek', weight: 15, avgHI: 2.76, avgAge: 19.8 },
      { name: 'Siemens', weight: 14, avgHI: 2.51, avgAge: 15.6 },
      { name: 'Nissin', weight: 13, avgHI: 2.69, avgAge: 18.2 },
      { name: 'Balteau', weight: 12, avgHI: 2.80, avgAge: 20.6 },
      { name: 'Pfiffner', weight: 11, avgHI: 2.61, avgAge: 17.0 },
      { name: 'XD Electric', weight: 9, avgHI: 2.85, avgAge: 21.5 },
      { name: 'Chint', weight: 8, avgHI: 2.86, avgAge: 21.0 }
    ]
  },
  'Lightning Arrester': {
    name: 'Lightning Arrester',
    label: 'Lightning Arrester (Surge Arrester / LA)',
    shortCode: 'LA',
    icon: 'shield',
    unitName: 'Fasa LA',
    total: 5280,
    totalJawa: 15800,
    totalNasional: 43600,
    avgAge: 15.8,
    avgHI: 2.52,
    voltageDesc: '70/150/500 kV • Metal Oxide (ZnO) Gapless',
    unitCapacityLabel: 'Arus Pelepasan Nominal',
    unitCapacityUnit: 'kA',
    capacityMultiplier: 10,
    groupName: 'Lainnya',
    brands: [
      { name: 'ABB', count: 1420, hi: [36, 35, 17, 8, 4], avgHI: 2.41, avgAge: 14.6, age: [20, 24, 32, 16, 8] },
      { name: 'Siemens', count: 1210, hi: [37, 34, 18, 8, 3], avgHI: 2.39, avgAge: 14.2, age: [22, 25, 31, 15, 7] },
      { name: 'Meidensha', count: 810, hi: [30, 34, 22, 10, 4], avgHI: 2.56, avgAge: 16.5, age: [16, 21, 33, 20, 10] },
      { name: 'Bowthorpe / TE', count: 660, hi: [28, 33, 24, 11, 4], avgHI: 2.61, avgAge: 17.2, age: [14, 19, 34, 22, 11] },
      { name: 'Toshiba', count: 540, hi: [26, 32, 25, 12, 5], avgHI: 2.66, avgAge: 18.0, age: [13, 18, 33, 24, 12] }
    ],
    minorBrands: [
      { name: 'Lamco', weight: 16, avgHI: 2.76, avgAge: 19.4 },
      { name: 'Cooper Power', weight: 15, avgHI: 2.70, avgAge: 18.2 },
      { name: 'Hubbell', weight: 14, avgHI: 2.65, avgAge: 17.5 },
      { name: 'Hitachi', weight: 13, avgHI: 2.58, avgAge: 16.2 },
      { name: 'Tridelta', weight: 12, avgHI: 2.64, avgAge: 17.0 },
      { name: 'Chint', weight: 11, avgHI: 2.82, avgAge: 20.8 },
      { name: 'XD Electric', weight: 10, avgHI: 2.85, avgAge: 21.4 },
      { name: 'Daelim', weight: 9, avgHI: 2.88, avgAge: 22.0 }
    ]
  },
  'GIS': {
    name: 'GIS',
    label: 'GIS (Gas Insulated Switchgear)',
    shortCode: 'GIS',
    icon: 'server',
    unitName: 'Bay GIS',
    total: 180,
    totalJawa: 540,
    totalNasional: 1420,
    avgAge: 14.1,
    avgHI: 2.38,
    voltageDesc: '150/500 kV Indoor Substation • SF6 Enclosed',
    unitCapacityLabel: 'Tekanan Gas SF6',
    unitCapacityUnit: 'bar',
    capacityMultiplier: 6,
    groupName: 'Lainnya',
    brands: [
      { name: 'ABB', count: 62, hi: [42, 36, 14, 6, 2], avgHI: 2.22, avgAge: 12.8, age: [26, 28, 28, 14, 4] },
      { name: 'Siemens', count: 48, hi: [44, 35, 14, 5, 2], avgHI: 2.18, avgAge: 12.4, age: [28, 30, 27, 12, 3] },
      { name: 'Toshiba', count: 26, hi: [34, 35, 20, 8, 3], avgHI: 2.45, avgAge: 15.2, age: [18, 24, 32, 18, 8] },
      { name: 'Mitsubishi', count: 20, hi: [36, 34, 19, 8, 3], avgHI: 2.40, avgAge: 14.6, age: [20, 25, 31, 17, 7] },
      { name: 'Hyosung', count: 14, hi: [30, 34, 23, 10, 3], avgHI: 2.52, avgAge: 16.0, age: [16, 22, 34, 20, 8] }
    ],
    minorBrands: [
      { name: 'Hyundai', weight: 22, avgHI: 2.58, avgAge: 16.8 },
      { name: 'XD Electric', weight: 20, avgHI: 2.66, avgAge: 18.2 },
      { name: 'Hitachi', weight: 18, avgHI: 2.44, avgAge: 14.8 },
      { name: 'Pinggao', weight: 15, avgHI: 2.70, avgAge: 19.0 },
      { name: 'TBEA', weight: 14, avgHI: 2.72, avgAge: 19.5 },
      { name: 'NHVS', weight: 11, avgHI: 2.75, avgAge: 20.0 }
    ]
  },
  'Rele Proteksi': {
    name: 'Rele Proteksi',
    label: 'Rele Proteksi & IED (Protection Relay)',
    shortCode: 'REL',
    icon: 'cpu',
    unitName: 'Unit IED',
    total: 3280,
    totalJawa: 9800,
    totalNasional: 29500,
    avgAge: 12.8,
    avgHI: 2.35,
    voltageDesc: 'Transmisi 70/150/500 kV • Line Diff, Distansi, Trafo & Busbar Diff',
    unitCapacityLabel: 'Fungsi ANSI & IED',
    unitCapacityUnit: 'Point',
    capacityMultiplier: 64,
    groupName: 'Lainnya',
    brands: [
      { name: 'SEL (Schweitzer)', count: 980, hi: [45, 35, 13, 5, 2], avgHI: 2.16, avgAge: 11.2, age: [30, 32, 26, 10, 2] },
      { name: 'ABB (Relion)', count: 860, hi: [40, 36, 15, 6, 3], avgHI: 2.26, avgAge: 12.5, age: [25, 30, 29, 13, 3] },
      { name: 'Siemens (SIPROTEC)', count: 790, hi: [42, 35, 14, 6, 3], avgHI: 2.24, avgAge: 12.2, age: [26, 31, 28, 12, 3] },
      { name: 'Schneider / MiCOM', count: 580, hi: [35, 35, 19, 8, 3], avgHI: 2.42, avgAge: 14.4, age: [20, 26, 32, 17, 5] },
      { name: 'GE Multilin / UR', count: 420, hi: [32, 34, 21, 9, 4], avgHI: 2.50, avgAge: 15.6, age: [18, 23, 33, 20, 6] }
    ],
    minorBrands: [
      { name: 'Toshiba', weight: 20, avgHI: 2.54, avgAge: 16.2 },
      { name: 'NR Electric', weight: 18, avgHI: 2.48, avgAge: 14.8 },
      { name: 'Reyrolle', weight: 16, avgHI: 2.76, avgAge: 19.8 },
      { name: 'Woodward', weight: 14, avgHI: 2.62, avgAge: 17.5 },
      { name: 'Arcteq', weight: 12, avgHI: 2.40, avgAge: 13.0 },
      { name: 'VAMP', weight: 11, avgHI: 2.58, avgAge: 16.8 },
      { name: 'ZIV', weight: 9, avgHI: 2.65, avgAge: 18.2 }
    ]
  },
  'Baterai': {
    name: 'Baterai',
    label: 'Baterai & Rectifier (Sistem DC 110V/220V)',
    shortCode: 'BAT',
    icon: 'battery-charging',
    unitName: 'Bank Baterai',
    total: 490,
    totalJawa: 1480,
    totalNasional: 4200,
    avgAge: 9.6,
    avgHI: 2.42,
    voltageDesc: 'DC 110V / 220V Gardu Induk • Ni-Cd & VRLA Lead Acid',
    unitCapacityLabel: 'Kapasitas Baterai',
    unitCapacityUnit: 'Ah',
    capacityMultiplier: 200,
    groupName: 'Lainnya',
    brands: [
      { name: 'Saft', count: 140, hi: [40, 36, 15, 6, 3], avgHI: 2.26, avgAge: 8.8, age: [32, 34, 24, 8, 2] },
      { name: 'Yuasa', count: 120, hi: [36, 35, 18, 8, 3], avgHI: 2.38, avgAge: 9.4, age: [28, 32, 27, 11, 2] },
      { name: 'Hoppecke', count: 95, hi: [38, 35, 17, 7, 3], avgHI: 2.32, avgAge: 9.1, age: [30, 33, 26, 9, 2] },
      { name: 'Enersys', count: 75, hi: [34, 34, 20, 8, 4], avgHI: 2.45, avgAge: 10.2, age: [25, 30, 29, 13, 3] },
      { name: 'Panasonic', count: 60, hi: [32, 35, 21, 9, 3], avgHI: 2.48, avgAge: 10.5, age: [24, 29, 31, 13, 3] }
    ],
    minorBrands: [
      { name: 'Chloride', weight: 18, avgHI: 2.60, avgAge: 11.8 },
      { name: 'Benning', weight: 17, avgHI: 2.50, avgAge: 10.6 },
      { name: 'GNB Industrial', weight: 16, avgHI: 2.58, avgAge: 11.4 },
      { name: 'Exide', weight: 14, avgHI: 2.65, avgAge: 12.2 },
      { name: 'BBI', weight: 13, avgHI: 2.54, avgAge: 11.0 },
      { name: 'Fiamm', weight: 12, avgHI: 2.62, avgAge: 12.0 },
      { name: 'Coslight', weight: 10, avgHI: 2.70, avgAge: 13.0 }
    ]
  },
  'Kabel SKTT': {
    name: 'Kabel SKTT',
    label: 'Saluran Kabel SKTT & Kabel Laut',
    shortCode: 'SKTT',
    icon: 'activity',
    unitName: 'Kms Sirkit',
    total: 620,
    totalJawa: 1860,
    totalNasional: 4200,
    avgAge: 15.2,
    avgHI: 2.49,
    voltageDesc: '150 kV XLPE Bawah Tanah & Kabel Laut Selat Madura/Bali',
    unitCapacityLabel: 'Panjang Sirkit',
    unitCapacityUnit: 'kms',
    capacityMultiplier: 12,
    groupName: 'Lainnya',
    brands: [
      { name: 'Prysmian', count: 180, hi: [35, 36, 18, 8, 3], avgHI: 2.40, avgAge: 14.2, age: [22, 28, 32, 14, 4] },
      { name: 'LS Cable', count: 150, hi: [33, 35, 20, 9, 3], avgHI: 2.46, avgAge: 14.8, age: [20, 26, 34, 16, 4] },
      { name: 'Sumitomo', count: 120, hi: [36, 35, 18, 8, 3], avgHI: 2.38, avgAge: 13.9, age: [24, 28, 31, 14, 3] },
      { name: 'Nexans', count: 95, hi: [32, 34, 21, 9, 4], avgHI: 2.51, avgAge: 15.6, age: [18, 25, 33, 18, 6] },
      { name: 'Supreme Cable (PT SC)', count: 75, hi: [30, 34, 23, 10, 3], avgHI: 2.54, avgAge: 16.0, age: [17, 24, 34, 19, 6] }
    ],
    minorBrands: [
      { name: 'Kabel Metal Indonesia (KMI)', weight: 20, avgHI: 2.58, avgAge: 16.5 },
      { name: 'Taihan', weight: 18, avgHI: 2.55, avgAge: 16.0 },
      { name: 'J-Power Systems', weight: 16, avgHI: 2.42, avgAge: 14.5 },
      { name: 'Furukawa', weight: 15, avgHI: 2.48, avgAge: 15.2 },
      { name: 'Voksel Electric', weight: 14, avgHI: 2.62, avgAge: 17.2 },
      { name: 'Jembo Cable', weight: 10, avgHI: 2.66, avgAge: 17.8 },
      { name: 'Iljin Cable', weight: 7, avgHI: 2.59, avgAge: 16.4 }
    ]
  },
  'Kompensator': {
    name: 'Kompensator',
    label: 'Shunt Reactor & Kapasitor Bank',
    shortCode: 'REA',
    icon: 'cpu',
    unitName: 'Bank',
    total: 280,
    totalJawa: 860,
    totalNasional: 2150,
    avgAge: 16.4,
    avgHI: 2.64,
    voltageDesc: '150/500 kV • Kompensasi Daya Reaktif MVAr',
    unitCapacityLabel: 'Daya Reaktif',
    unitCapacityUnit: 'MVAr',
    capacityMultiplier: 50,
    groupName: 'Lainnya',
    brands: [
      { name: 'ABB', count: 80, hi: [30, 34, 22, 10, 4], avgHI: 2.52, avgAge: 15.5, age: [18, 22, 33, 19, 8] },
      { name: 'Siemens', count: 68, hi: [32, 34, 20, 10, 4], avgHI: 2.48, avgAge: 15.0, age: [20, 24, 32, 17, 7] },
      { name: 'Trench', count: 52, hi: [28, 33, 24, 11, 4], avgHI: 2.58, avgAge: 16.2, age: [16, 21, 34, 21, 8] },
      { name: 'Nissin Electric', count: 40, hi: [26, 32, 25, 12, 5], avgHI: 2.65, avgAge: 17.1, age: [14, 19, 33, 23, 11] },
      { name: 'Cooper Power', count: 30, hi: [24, 31, 26, 13, 6], avgHI: 2.72, avgAge: 18.0, age: [12, 17, 34, 24, 13] }
    ],
    minorBrands: [
      { name: 'ZEZ Silko', weight: 22, avgHI: 2.75, avgAge: 18.5 },
      { name: 'Hilkar', weight: 20, avgHI: 2.68, avgAge: 17.2 },
      { name: 'Hitachi', weight: 18, avgHI: 2.56, avgAge: 16.0 },
      { name: 'GE', weight: 16, avgHI: 2.70, avgAge: 17.8 },
      { name: 'Meidensha', weight: 14, avgHI: 2.64, avgAge: 16.8 },
      { name: 'Daelim', weight: 10, avgHI: 2.78, avgAge: 19.2 }
    ]
  },
  'NGR': {
    name: 'NGR',
    label: 'NGR (Neutral Grounding Resistance)',
    shortCode: 'NGR',
    icon: 'shield-alert',
    unitName: 'Unit NGR',
    total: 370,
    totalJawa: 1120,
    totalNasional: 3100,
    avgAge: 18.1,
    avgHI: 2.68,
    voltageDesc: '70/150 kV Sisi Netral Trafo Daya • 40 Ω / 500 A',
    unitCapacityLabel: 'Nilai Resistansi & Arus',
    unitCapacityUnit: 'Ohm',
    capacityMultiplier: 40,
    groupName: 'Lainnya',
    brands: [
      { name: 'Cressall', count: 110, hi: [30, 35, 22, 9, 4], avgHI: 2.50, avgAge: 16.2, age: [16, 22, 34, 20, 8] },
      { name: 'Post Glover', count: 92, hi: [28, 34, 23, 11, 4], avgHI: 2.58, avgAge: 16.8, age: [15, 20, 33, 22, 10] },
      { name: 'Hilkar', count: 74, hi: [27, 33, 24, 11, 5], avgHI: 2.62, avgAge: 17.4, age: [14, 19, 34, 22, 11] },
      { name: 'ABB', count: 65, hi: [32, 34, 21, 9, 4], avgHI: 2.48, avgAge: 15.8, age: [18, 23, 33, 18, 8] },
      { name: 'Siemens', count: 55, hi: [34, 33, 20, 9, 4], avgHI: 2.46, avgAge: 15.5, age: [19, 24, 32, 18, 7] }
    ],
    minorBrands: [
      { name: 'Aktif Elektroteknik', weight: 20, avgHI: 2.70, avgAge: 18.2 },
      { name: 'Microelettrica Scientifica', weight: 18, avgHI: 2.66, avgAge: 17.8 },
      { name: 'Avtron', weight: 16, avgHI: 2.68, avgAge: 18.0 },
      { name: 'Spiroll', weight: 14, avgHI: 2.74, avgAge: 19.0 },
      { name: 'Toshiba', weight: 12, avgHI: 2.60, avgAge: 17.0 },
      { name: 'Hitachi', weight: 10, avgHI: 2.58, avgAge: 16.6 },
      { name: 'Lainnya Lokal', weight: 10, avgHI: 2.82, avgAge: 20.4 }
    ]
  },
  'SUTT SUTET': {
    name: 'SUTT SUTET',
    label: 'Menara SUTT / SUTET & Konduktor',
    shortCode: 'TWR',
    icon: 'navigation',
    unitName: 'Tower',
    total: 10700,
    totalJawa: 32000,
    totalNasional: 96000,
    avgAge: 22.4,
    avgHI: 2.85,
    voltageDesc: '70/150/500 kV Saluran Udara • Lattice Tower & Monopole',
    unitCapacityLabel: 'Tinggi Rata-rata Tower',
    unitCapacityUnit: 'm',
    capacityMultiplier: 38,
    groupName: 'Lainnya',
    brands: [
      { name: 'Bukaka Teknik Utama', count: 2800, hi: [24, 32, 26, 12, 6], avgHI: 2.74, avgAge: 20.5, age: [10, 16, 32, 26, 16] },
      { name: 'Karya Logam', count: 2200, hi: [22, 30, 27, 14, 7], avgHI: 2.82, avgAge: 22.0, age: [8, 14, 31, 28, 19] },
      { name: 'Danusari Mitra Sejahtera', count: 1800, hi: [25, 31, 26, 12, 6], avgHI: 2.72, avgAge: 20.1, age: [11, 17, 32, 25, 15] },
      { name: 'Armindo Cipta', count: 1400, hi: [23, 30, 28, 13, 6], avgHI: 2.79, avgAge: 21.6, age: [9, 15, 32, 27, 17] },
      { name: 'Wijaya Karya (WIKA)', count: 1200, hi: [28, 33, 24, 10, 5], avgHI: 2.65, avgAge: 19.2, age: [14, 18, 34, 22, 12] }
    ],
    minorBrands: [
      { name: 'Amarta Karya', weight: 18, avgHI: 2.80, avgAge: 22.5 },
      { name: 'Citramas', weight: 17, avgHI: 2.78, avgAge: 21.8 },
      { name: 'Boma Bisma Indra', weight: 16, avgHI: 2.86, avgAge: 23.4 },
      { name: 'Cilegon Fabricators', weight: 15, avgHI: 2.72, avgAge: 20.8 },
      { name: 'Sediver (Insulator)', weight: 14, avgHI: 2.68, avgAge: 19.5 },
      { name: 'NGK (Insulator)', weight: 12, avgHI: 2.62, avgAge: 18.8 },
      { name: 'MacLean Power', weight: 8, avgHI: 2.66, avgAge: 19.0 }
    ]
  },
  'RTU SCADA': {
    name: 'RTU SCADA',
    label: 'RTU & Gateway SCADATEL',
    shortCode: 'RTU',
    icon: 'monitor',
    unitName: 'Unit RTU',
    total: 420,
    totalJawa: 1250,
    totalNasional: 3600,
    avgAge: 10.4,
    avgHI: 2.32,
    voltageDesc: 'Teleinformasi GI & Gardu Hubung • Protokol IEC 60870-5-104 / DNP3',
    unitCapacityLabel: 'Kapasitas I/O Point',
    unitCapacityUnit: 'I/O',
    capacityMultiplier: 256,
    groupName: 'Lainnya',
    brands: [
      { name: 'ABB (RTU500)', count: 120, hi: [44, 35, 13, 6, 2], avgHI: 2.18, avgAge: 9.6, age: [32, 33, 24, 9, 2] },
      { name: 'Schneider (Foxboro/Easergy)', count: 100, hi: [40, 36, 15, 6, 3], avgHI: 2.28, avgAge: 10.2, age: [28, 32, 27, 11, 2] },
      { name: 'Siemens (SICAM)', count: 85, hi: [42, 35, 14, 6, 3], avgHI: 2.25, avgAge: 9.9, age: [30, 32, 26, 10, 2] },
      { name: 'GE (D20 / Reason)', count: 68, hi: [34, 34, 20, 8, 4], avgHI: 2.45, avgAge: 11.5, age: [22, 28, 32, 15, 3] },
      { name: 'SEL (Real Time Automation)', count: 58, hi: [46, 35, 12, 5, 2], avgHI: 2.12, avgAge: 8.9, age: [35, 34, 22, 7, 2] }
    ],
    minorBrands: [
      { name: 'Telvent', weight: 20, avgHI: 2.65, avgAge: 13.5 },
      { name: 'Moxa', weight: 18, avgHI: 2.36, avgAge: 10.0 },
      { name: 'Advantech', weight: 16, avgHI: 2.40, avgAge: 10.8 },
      { name: 'Yokogawa', weight: 15, avgHI: 2.35, avgAge: 10.2 },
      { name: 'Ingeteam', weight: 14, avgHI: 2.42, avgAge: 11.0 },
      { name: 'Brodersen', weight: 10, avgHI: 2.50, avgAge: 12.0 },
      { name: 'Lainnya', weight: 7, avgHI: 2.60, avgAge: 13.0 }
    ]
  },
  'Wave Trap': {
    name: 'Wave Trap',
    label: 'Wave Trap & PLC (Line Trap Komunikasi)',
    shortCode: 'WVT',
    icon: 'radio',
    unitName: 'Unit Trap',
    total: 1070,
    totalJawa: 3200,
    totalNasional: 8900,
    avgAge: 18.6,
    avgHI: 2.70,
    voltageDesc: '70/150/500 kV • Carrier Komunikasi Proteksi & Teleprotection SUTT',
    unitCapacityLabel: 'Induktansi Wave Trap',
    unitCapacityUnit: 'mH',
    capacityMultiplier: 1,
    groupName: 'Lainnya',
    brands: [
      { name: 'Trench', count: 320, hi: [30, 34, 22, 10, 4], avgHI: 2.55, avgAge: 16.8, age: [16, 21, 33, 21, 9] },
      { name: 'ABB', count: 280, hi: [32, 34, 21, 9, 4], avgHI: 2.50, avgAge: 16.4, age: [18, 22, 33, 19, 8] },
      { name: 'Siemens', count: 230, hi: [33, 33, 21, 9, 4], avgHI: 2.49, avgAge: 16.2, age: [18, 23, 32, 19, 8] },
      { name: 'Haefely', count: 160, hi: [28, 33, 24, 11, 4], avgHI: 2.62, avgAge: 17.5, age: [14, 19, 34, 22, 11] },
      { name: 'Alstom', count: 130, hi: [26, 32, 25, 12, 5], avgHI: 2.68, avgAge: 18.2, age: [13, 18, 33, 24, 12] }
    ],
    minorBrands: [
      { name: 'Koncar', weight: 22, avgHI: 2.68, avgAge: 18.4 },
      { name: 'Nissin', weight: 20, avgHI: 2.70, avgAge: 18.8 },
      { name: 'XD Electric', weight: 18, avgHI: 2.80, avgAge: 20.6 },
      { name: 'Chint', weight: 15, avgHI: 2.82, avgAge: 21.0 },
      { name: 'Daelim', weight: 14, avgHI: 2.85, avgAge: 21.5 },
      { name: 'Lainnya', weight: 11, avgHI: 2.88, avgAge: 22.0 }
    ]
  }
};

// Helper untuk mendapatkan konfigurasi jenis aset aktif
function getActiveAssetConfig() {
  const jenis = (typeof document !== 'undefined' && document.getElementById('filterJenisAset')?.value) ||
                (typeof appState !== 'undefined' && appState.assetType) ||
                'Power Transformer';
  return ASSET_TYPE_CONFIGS[jenis] || ASSET_TYPE_CONFIGS['Power Transformer'];
}

// Turunkan profil HI 1..5 dari rata-rata HI (bobot digeser sesuai kondisi merk).
function hiProfile(avgHI) {
  const d = (avgHI || 2.7) - 2.7;
  return distribute(100, [22 + d * 10, 30 - d * 2, 28, 14 - d * 6, 6 + d * 2].map(w => Math.max(w, 1.5)));
}

// Turunkan sebaran umur 0–5 / 6–10 / 11–20 / 21–30 / >30 dari rata-rata umur.
function ageProfile(avgAge) {
  const d = (avgAge || 18) - 18;
  return distribute(100, [30 - d * 1.6, 22 - d * 0.6, 26, 14 + d * 0.8, 8 + d * 0.8].map(w => Math.max(w, 2)));
}

// Rakit katalog merk utuh (5 merk utama + merk minor) untuk konfigurasi jenis aset
function getBrandCatalogForConfig(cfg) {
  if (!cfg) cfg = ASSET_TYPE_CONFIGS['Power Transformer'];
  const minorTotal = Math.round(cfg.brands.reduce((s, b) => s + b.count, 0) * 0.38);
  const minorBrands = cfg.minorBrands || [];
  const weights = minorBrands.map(b => b.weight || 10);
  const weightSum = weights.reduce((s, w) => s + w, 0) || 1;
  const counts = distribute(minorTotal, weights.map(w => (w / weightSum) * 100));

  const minors = minorBrands.map((b, i) => ({
    name: b.name,
    count: counts[i],
    avgHI: b.avgHI || 2.75,
    avgAge: b.avgAge || 18,
    hi: hiProfile(b.avgHI || 2.75),
    age: ageProfile(b.avgAge || 18),
    minor: true
  }));

  return [...cfg.brands, ...minors];
}

// Dynamic Proxy agar variabel global assetTypeStats & BRAND_CATALOG selalu merefleksikan jenis aset aktif
const assetTypeStats = new Proxy({}, {
  get(target, prop) {
    const cfg = getActiveAssetConfig();
    return cfg[prop];
  }
});

const BRAND_CATALOG = new Proxy([], {
  get(target, prop) {
    const cat = getBrandCatalogForConfig(getActiveAssetConfig());
    if (prop === 'length') return cat.length;
    if (prop === Symbol.iterator) return cat[Symbol.iterator].bind(cat);
    if (!isNaN(prop)) return cat[prop];
    if (typeof cat[prop] === 'function') return cat[prop].bind(cat);
    return cat[prop];
  }
});

// Update isi dropdown filterMerk secara dinamis mengikuti jenis aset terpilih
function populateBrandDropdown(assetType) {
  const brandSelect = document.getElementById('filterMerk');
  if (!brandSelect) return;

  const currentBrand = brandSelect.value;
  const cfg = ASSET_TYPE_CONFIGS[assetType] || ASSET_TYPE_CONFIGS['Power Transformer'];
  const majorBrands = cfg.brands.map(b => b.name);
  const minorBrands = (cfg.minorBrands || []).map(b => b.name);
  const allBrandNames = [...majorBrands, ...minorBrands];

  let html = `<option value="Semua">Semua Merk (${allBrandNames.length} Pabrikan)</option>`;
  html += `<optgroup label="5 Merk Terbesar (Populasi Utama)">`;
  majorBrands.forEach(b => {
    html += `<option value="${b}">${b}</option>`;
  });
  html += `</optgroup>`;

  if (minorBrands.length > 0) {
    html += `<optgroup label="Pabrikan Lainnya (${minorBrands.length} Merk)">`;
    minorBrands.forEach(b => {
      html += `<option value="${b}">${b}</option>`;
    });
    html += `</optgroup>`;
  }

  brandSelect.innerHTML = html;

  if (allBrandNames.includes(currentBrand)) {
    brandSelect.value = currentBrand;
  } else {
    brandSelect.value = 'Semua';
    if (typeof appState !== 'undefined' && appState.filters) {
      appState.filters.merk = 'Semua';
    }
  }
}
window.populateBrandDropdown = populateBrandDropdown;

function onJenisAsetChanged() {
  const jenis = document.getElementById('filterJenisAset')?.value || 'Power Transformer';
  if (typeof appState !== 'undefined') {
    appState.assetType = jenis;
    if (appState.filters) appState.filters.jenisAset = jenis;
  }
  populateBrandDropdown(jenis);
  onAssetFiltersChanged();
}
window.onJenisAsetChanged = onJenisAsetChanged;

// Katalog unit/assets dasar untuk scope Jawa Barat + merk ABB.
// `lat`/`lng` dipakai sebagai koordinat marker pada mini map level 4.
const assetList = [
  { id: 'TRF-ABB-001', name: 'Trafo 1', gi: 'GI Cibatu', bay: 'Bay Trafo 1', lat: -7.108, lng: 107.986, voltage: '150 kV', year: 1998, age: 28, hi: 4, status: 'Perlu Perhatian', unit: 'UPT Cirebon' },
  { id: 'TRF-ABB-002', name: 'Trafo 2', gi: 'GI Cilegon', bay: 'Bay Trafo 2', lat: -6.017, lng: 106.053, voltage: '150 kV', year: 2004, age: 22, hi: 3, status: 'Cukup', unit: 'UPT Cilegon' },
  { id: 'TRF-ABB-003', name: 'Trafo 1', gi: 'GI Gandul', bay: 'Bay Trafo 1', lat: -6.329, lng: 106.787, voltage: '150 kV', year: 2012, age: 14, hi: 2, status: 'Baik', unit: 'UPT Gandul' },
  { id: 'TRF-ABB-004', name: 'Trafo 4', gi: 'GI Bekasi', bay: 'Bay Trafo 4', lat: -6.238, lng: 106.992, voltage: '150 kV', year: 1996, age: 30, hi: 5, status: 'Prioritas', unit: 'UPT Bekasi' },
  { id: 'TRF-ABB-005', name: 'Trafo 3', gi: 'GI Bandung Selatan', bay: 'Bay Trafo 3', lat: -6.980, lng: 107.620, voltage: '150 kV', year: 2008, age: 18, hi: 2, status: 'Baik', unit: 'UPT Bandung' },
  { id: 'TRF-ABB-006', name: 'Trafo 2', gi: 'GI Mandirancan', bay: 'Bay Trafo 2', lat: -6.832, lng: 108.471, voltage: '150 kV', year: 1999, age: 27, hi: 4, status: 'Perlu Perhatian', unit: 'UPT Cirebon' },
  { id: 'TRF-ABB-007', name: 'Trafo 1', gi: 'GI Tasikmalaya', bay: 'Bay Trafo 1', lat: -7.327, lng: 108.220, voltage: '150 kV', year: 2015, age: 11, hi: 1, status: 'Sangat Baik', unit: 'UPT Bandung' },
  { id: 'TRF-ABB-008', name: 'Trafo 2', gi: 'GI Kembangan', bay: 'Bay Trafo 2', lat: -6.820, lng: 106.830, voltage: '150 kV', year: 2001, age: 25, hi: 3, status: 'Cukup', unit: 'UPT Durikosambi' },
  { id: 'TRF-ABB-009', name: 'Trafo 1', gi: 'GI Cawang', bay: 'Bay Trafo 1', lat: -6.242, lng: 106.882, voltage: '150 kV', year: 2018, age: 8, hi: 1, status: 'Sangat Baik', unit: 'UPT Cawang' },
  { id: 'TRF-ABB-010', name: 'Trafo 3', gi: 'GI Cirata 500kV', bay: 'Bay IBT 3 500 kV', lat: -6.702, lng: 107.358, voltage: '500 kV', year: 1994, age: 32, hi: 4, status: 'Perlu Perhatian', unit: 'UPT Bandung' },
  { id: 'TRF-ABB-011', name: 'Trafo 2', gi: 'GI Depok', bay: 'Bay Trafo 2', lat: -6.402, lng: 106.822, voltage: '150 kV', year: 2006, age: 20, hi: 2, status: 'Baik', unit: 'UPT Gandul' },
  { id: 'TRF-ABB-012', name: 'Trafo 1', gi: 'GI Salak', bay: 'Bay Trafo 1', lat: -6.740, lng: 106.650, voltage: '150 kV', year: 2019, age: 7, hi: 1, status: 'Sangat Baik', unit: 'UPT Bogor' }
];

// -------------------------------------------------------------
// SCOPE RESOLVER
// Mengubah data dasar (Jawa Barat) menjadi data yang sesuai scope aktif:
// agregat seluruh wilayah Jawa, atau satu provinsi tertentu.
// -------------------------------------------------------------
const SCOPE_BASE_KEY = 'jawa-barat';
const AGE_BUCKETS = ['0–5 tahun', '6–10 tahun', '11–20 tahun', '21–30 tahun', '>30 tahun'];
const TREN_YEARS = ['2021', '2022', '2023', '2024', '2025', '2026'];
// Bentuk tren relatif terhadap HI akhir (dari data ABB: 2,35 → 2,78)
const TREN_SHAPE = [0.845, 0.881, 0.928, 0.953, 0.978, 1];
const HI_META = [
  { label: 'HI 1 — Sangat Baik', short: 'HI 1 (Sangat Baik)', color: '#2563eb', status: 'Sangat Baik' },
  { label: 'HI 2 — Baik', short: 'HI 2 (Baik)', color: '#10b981', status: 'Baik' },
  { label: 'HI 3 — Cukup', short: 'HI 3 (Cukup)', color: '#f59e0b', status: 'Cukup' },
  { label: 'HI 4 — Perlu Perhatian', short: 'HI 4 (Perhatian)', color: '#f97316', status: 'Perlu Perhatian' },
  { label: 'HI 5 — Buruk', short: 'HI 5 (Buruk)', color: '#ef4444', status: 'Prioritas' }
];

function fmtInt(n) {
  return Math.round(n).toLocaleString('id-ID');
}

function fmtNum(n, digits = 2) {
  return Number(n).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function fmtPct(n, digits = 1) {
  return `${fmtNum(n, digits)}%`;
}

function scaleTo(count, baseCount, total) {
  if (!count) return 0;
  return Math.round((count / baseCount) * total);
}

// Bagikan total unit ke bucket persentase tanpa sisa (metode largest remainder),
// supaya jumlah unit per HI/umur selalu sama dengan totalPopulasi.
function distribute(total, pcts) {
  const raw = pcts.map(p => (p / 100) * total);
  const out = raw.map(r => Math.floor(r));
  let rest = total - out.reduce((s, v) => s + v, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; rest > 0; k++, rest--) {
    out[order[k % order.length].i] += 1;
  }
  return out;
}

// Hash deterministik agar data turunan stabil antar-render (tidak random)
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// MVA disimpan sebagai string berformat ("7.850"); parse agar tidak terpotong
function mvaValue(raw) {
  return parseInt(String(raw).replace(/\D/g, ''), 10) || 0;
}

// Angka pada data Jawa disimpan sebagai string berformat ("1.564"); parse ke number
function numValue(raw) {
  return Number(String(raw).replace(/[.,\s]/g, '')) || 0;
}

function hi45Text(source) {
  return `${fmtInt(source.hi45Count)} (${fmtNum(source.hi45Pct, 1)}%)`;
}

// Label scope aktif: provinsi terpilih, atau nama wilayah bila masih agregat
function getScopeLabel() {
  // Scope organisasi aktif (Unit Induk/UPT/ULTG/GI) menang di atas region navigasi,
  // karena scope semacam ini direpresentasikan oleh peta Level 1 yang berisi marker.
  if (isOrgScopeActive()) {
    try { return getScopeStats().label; } catch (e) { /* fallback ke region */ }
  }
  const region = appState.region;
  if (!region) return null;
  const sub = appState.subRegion;
  if (!sub || sub === region) return region;
  return sub;
}

function isOrgScopeActive() {
  return ['filterUnitInduk', 'filterUPT', 'filterULTG', 'filterGI', 'filterBay'].some(id => {
    const el = document.getElementById(id);
    return el && el.value && el.value !== 'Semua';
  });
}
window.isOrgScopeActive = isOrgScopeActive;

function isAggregateScope() {
  return !appState.subRegion || appState.subRegion === appState.region;
}

function aggregateUpt(provs) {
  const merged = new Map();
  provs.forEach(p => p.upt.forEach(u => {
    const prev = merged.get(u.name) || { name: u.name, count: 0, mva: 0, hi45: 0 };
    prev.count += u.count;
    prev.mva += mvaValue(u.mva);
    prev.hi45 += u.hi45;
    merged.set(u.name, prev);
  }));

  return Array.from(merged.values())
    .map(u => ({ ...u, ratio: u.count ? (u.hi45 / u.count) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function getScopeStats() {
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const cfg = getActiveAssetConfig();
  const scale = (cfg.totalJawa || 2514) / 2514;
  const brandCountTotal = cfg.brands.length + (cfg.minorBrands ? cfg.minorBrands.length : 0);

  // 1. NASIONAL (Semua Unit Induk)
  if (uiCode === 'Semua') {
    const totalPT = Math.round(3124 * scale);
    const allGis = typeof ORG_HIERARCHY !== 'undefined'
      ? ORG_HIERARCHY.flatMap(ui => ui.upts.flatMap(u => u.ultgs.flatMap(x => x.gis)))
      : [];
    const allUpts = typeof ORG_HIERARCHY !== 'undefined'
      ? ORG_HIERARCHY.flatMap(ui => ui.upts).map(u => {
          const uCnt = Math.round((50 + hashSeed(u.name) * 60) * scale);
          return {
            name: u.name,
            count: uCnt,
            mva: Math.round(uCnt * (cfg.capacityMultiplier || 35)),
            hi45: Math.round(uCnt * 0.21),
            ratio: 21.0
          };
        })
      : [];

    return {
      key: 'nasional',
      label: 'Nasional (Seluruh Unit Induk)',
      isAggregate: true,
      pt: totalPT,
      brandCount: brandCountTotal,
      avgHI: cfg.avgHI || 2.64,
      avgAge: cfg.avgAge || 17.6,
      center: { lat: -1.2, lng: 118.0, zoom: 5 },
      gis: allGis,
      upt: allUpts
    };
  }

  // 2. UNIT INDUK SCOPE (Unit Induk terpilih, UPT Semua)
  if (uiCode !== 'Semua' && uptName === 'Semua') {
    const ui = findUnitInduk(uiCode);
    const uiMetric = (typeof UNIT_INDUK_METRICS !== 'undefined' ? UNIT_INDUK_METRICS.find(m => m.code === uiCode) : null) || {
      code: uiCode,
      name: ui ? ui.name : uiCode,
      totalAsset: 4000,
      hiAvg: 2.62,
      center: [-2, 118]
    };
    const basePt = uiCode === 'UIT JBT' ? 842 : uiCode === 'UIT JBB' ? 520 : uiCode === 'UIP3B SUM' ? 680 : uiCode === 'UIT JBM' ? 480 : uiCode === 'UIP3B KAL' ? 310 : 292;
    const pt = Math.round(basePt * scale);
    const brandCount = Math.min(brandCountTotal, uiCode === 'UIT JBT' ? 20 : uiCode === 'UIT JBB' ? 16 : 15);
    const avgAge = uiCode === 'UIT JBT' ? cfg.avgAge : Number((cfg.avgAge - 1.2).toFixed(1));

    const uptList = ui ? ui.upts.map(u => {
      const uPt = Math.round(pt / ui.upts.length);
      const hi45 = Math.round(uPt * 0.20);
      return {
        name: u.name,
        count: uPt,
        mva: Math.round(uPt * (cfg.capacityMultiplier || 35)),
        hi45,
        ratio: 20.0
      };
    }) : [];

    return {
      key: slugify(uiCode),
      label: `${uiCode} (${uiMetric.name})`,
      isAggregate: false,
      pt,
      brandCount,
      avgHI: uiMetric.hiAvg,
      avgAge,
      center: { lat: uiMetric.center[0], lng: uiMetric.center[1], zoom: 7 },
      gis: ui ? ui.upts.flatMap(u => u.ultgs.flatMap(x => x.gis)) : [],
      upt: uptList
    };
  }

  // 3. UPT SCOPE (UPT terpilih)
  if (uptName !== 'Semua') {
    const upt = findUptByName(uptName, uiCode);
    const baseUpt = Math.round(65 + (hashSeed(uptName) * 85));
    const uPt = Math.round(baseUpt * scale);
    const ultgList = upt ? upt.ultgs.map(ultg => {
      const cnt = Math.round(uPt / upt.ultgs.length);
      const hi45 = Math.round(cnt * 0.20);
      return {
        name: ultg.name,
        count: cnt,
        mva: Math.round(cnt * (cfg.capacityMultiplier || 35)),
        hi45,
        ratio: 20.0
      };
    }) : [];

    return {
      key: slugify(uptName),
      label: `${uptName} (${uiCode})`,
      isAggregate: false,
      pt: uPt,
      brandCount: Math.min(brandCountTotal, Math.round(7 + hashSeed(uptName + 'b') * 5)),
      avgHI: Number((cfg.avgHI - 0.1 + hashSeed(uptName + 'h') * 0.2).toFixed(2)),
      avgAge: Number((cfg.avgAge - 2 + hashSeed(uptName + 'a') * 4).toFixed(1)),
      center: { lat: upt ? upt.lat : -6.2, lng: upt ? upt.lng : 106.8, zoom: 9 },
      gis: upt ? upt.ultgs.flatMap(x => x.gis) : [],
      upt: ultgList
    };
  }

  // 4. Default / Fallback
  const region = appState.region || 'Jawa';
  const provs = jawaStats.provinces;
  const prov = provs.find(p => p.name === appState.subRegion) || provs[2];
  return {
    key: slugify(prov.name),
    label: prov.name,
    isAggregate: false,
    pt: Math.round(prov.pt * scale),
    brandCount: Math.min(brandCountTotal, prov.brandCount),
    avgHI: cfg.avgHI || prov.avgHI,
    avgAge: cfg.avgAge || prov.avgAge,
    center: { lat: prov.lat, lng: prov.lng, zoom: 9 },
    gis: prov.gis,
    upt: prov.upt.map(u => ({ ...u, count: Math.round(u.count * scale), mva: mvaValue(u.mva) }))
  };
}

// Statistik Jenis Aset aktif untuk scope terpilih (KPI level 3 + tabel per merk)
function getAssetTypeStats() {
  const scope = getScopeStats();
  const cfg = getActiveAssetConfig();
  const catalog = getBrandCatalogForConfig(cfg);
  const baseTotal = cfg.total || catalog.reduce((s, b) => s + b.count, 0);
  const basePcts = catalog.map(b => (b.count / (baseTotal || 1)) * 100);
  const brandCounts = distribute(scope.pt, basePcts);

  const brands = catalog.map((b, i) => {
    const count = brandCounts[i];
    return {
      name: b.name,
      count,
      pct: (count / (scope.pt || 1)) * 100,
      minor: Boolean(b.minor),
      hi: b.hi.slice(),
      hiCounts: distribute(count, b.hi),
      avgHI: b.avgHI,
      avgAge: b.avgAge,
      age: b.age.slice(),
      over20: Math.round((b.age[3] + b.age[4]) / 100 * count)
    };
  });

  const majors = brands.filter(b => !b.minor);
  const minors = brands.filter(b => b.minor);
  const minorCount = minors.reduce((s, b) => s + b.count, 0);

  const groupPct = key => {
    if (!minorCount) return [20, 20, 20, 20, 20];
    const weights = [0, 1, 2, 3, 4].map(i => minors.reduce((s, b) => s + b[key][i] * b.count, 0) / minorCount);
    return distribute(100, weights);
  };

  const groupHiPct = groupPct('hi');
  const groupAgePct = groupPct('age');

  const group = {
    name: cfg.groupName || 'Lainnya',
    count: minorCount,
    pct: (minorCount / (scope.pt || 1)) * 100,
    minor: true,
    isGroup: true,
    members: minors,
    memberCount: minors.length,
    hi: groupHiPct,
    hiCounts: distribute(minorCount, groupHiPct),
    avgHI: minorCount ? minors.reduce((s, b) => s + b.avgHI * b.count, 0) / minorCount : 0,
    avgAge: minorCount ? minors.reduce((s, b) => s + b.avgAge * b.count, 0) / minorCount : 0,
    age: groupAgePct,
    over20: Math.round((groupAgePct[3] + groupAgePct[4]) / 100 * minorCount)
  };
  const brandsGrouped = [...majors, group];

  const weighted = brands.reduce(
    (acc, b) => ({ hi: acc.hi + b.avgHI * b.count }),
    { hi: 0 }
  );
  const hi45Count = brands.reduce((sum, b) => sum + b.hiCounts[3] + b.hiCounts[4], 0);

  return {
    name: cfg.name,
    cfg,
    scope,
    total: scope.pt,
    brandCount: brands.length,
    brands,
    brandsGrouped,
    groupName: cfg.groupName || 'Lainnya',
    avgHI: weighted.hi / (scope.pt || 1),
    avgAge: scope.avgAge,
    hi45Count,
    hi45Pct: (hi45Count / (scope.pt || 1)) * 100
  };
}

function buildAgeBuckets(brand) {
  const counts = distribute(brand.count, brand.age);
  return brand.age.map((pct, i) => ({
    range: AGE_BUCKETS[i],
    pct,
    count: counts[i]
  }));
}

// Distribusi Health Index level scope (agregat dari semua merk)
function getScopeHIDistribution() {
  const stats = getAssetTypeStats();
  const rows = HI_META.map((meta, i) => {
    const count = stats.brands.reduce((sum, b) => sum + b.hiCounts[i], 0);
    return {
      label: meta.short,
      status: meta.status,
      color: meta.color,
      count,
      pct: (count / stats.total) * 100
    };
  });

  const hi12 = rows[0].count + rows[1].count;
  const hi3 = rows[2].count;
  const hi45 = rows[3].count + rows[4].count;

  return { rows, total: stats.total, hi12, hi3, hi45 };
}

// Distribusi kelompok umur level scope + kapasitas per kelompok
function getScopeAgeBuckets() {
  const stats = getAssetTypeStats();
  const cfg = getActiveAssetConfig();
  const catalog = getBrandCatalogForConfig(cfg);
  const baseTotal = catalog.reduce((sum, b) => sum + b.count, 0);
  const pcts = catalog.reduce(
    (acc, b) => acc.map((v, i) => v + b.age[i] * b.count),
    [0, 0, 0, 0, 0]
  ).map(v => v / (baseTotal || 1));

  const counts = distribute(stats.total, pcts);
  const capPerUnit = cfg.capacityMultiplier || 35;
  const rows = counts.map((count, i) => ({
    range: AGE_BUCKETS[i],
    count,
    pct: pcts[i],
    mva: count * capPerUnit,
    status: i <= 1 ? 'Baik' : i === 2 ? 'Cukup' : 'Perlu Perhatian',
    hiLevel: i <= 1 ? 2 : i === 2 ? 3 : 4
  }));

  return { rows, total: stats.total, mvaTotal: stats.total * capPerUnit, capUnit: cfg.unitCapacityUnit || 'MVA' };
}

// Rata-rata kapasitas per unit pada scope aktif
function getScopeMvaPerUnit() {
  const scope = getScopeStats();
  const cfg = getActiveAssetConfig();
  return cfg.capacityMultiplier || 35;
}

// Ringkasan tiap unit / provinsi untuk tabel & grafik perbandingan
function getProvinceSummaries() {
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const cfg = getActiveAssetConfig();
  const scale = (cfg.totalJawa || 2514) / 2514;
  const brandCountBase = cfg.brands.length + (cfg.minorBrands ? cfg.minorBrands.length : 0);

  if (uiCode === 'Semua') {
    if (typeof UNIT_INDUK_METRICS !== 'undefined') {
      return UNIT_INDUK_METRICS.map(ui => {
        const basePt = ui.code === 'UIT JBT' ? 842 : ui.code === 'UIT JBB' ? 520 : ui.code === 'UIP3B SUM' ? 680 : ui.code === 'UIT JBM' ? 480 : ui.code === 'UIP3B KAL' ? 310 : 292;
        const pt = Math.round(basePt * scale);
        const brandCount = Math.min(brandCountBase, ui.code === 'UIT JBT' ? 20 : ui.code === 'UIT JBB' ? 16 : 15);
        const hi45 = Math.round(pt * 0.21);
        const hi45Pct = 21.0;
        const avgAge = ui.code === 'UIT JBT' ? cfg.avgAge : Number((cfg.avgAge - 1.2).toFixed(1));

        return {
          name: ui.code,
          fullName: ui.name,
          totalAset: fmtInt(ui.totalAsset),
          pt,
          brandCount,
          avgHI: ui.hiAvg,
          hi45,
          hi45Pct,
          avgAge,
          gi: ui.giCount,
          upt: ui.uptCount,
          color: ui.color,
          isActive: false,
          levelType: 'unit-induk'
        };
      });
    }
  }

  const ui = typeof findUnitInduk === 'function' ? findUnitInduk(uiCode) : null;
  if (ui && uptName === 'Semua') {
    return ui.upts.map(u => {
      const gis = u.ultgs.flatMap(x => x.gis);
      const seed = hashSeed(u.name);
      const basePt = Math.round(65 + seed * 85);
      const pt = Math.round(basePt * scale);
      const brandCount = Math.min(brandCountBase, Math.round(6 + hashSeed(u.name + 'b') * 6));
      const avgHI = Number((cfg.avgHI - 0.15 + hashSeed(u.name + 'h') * 0.3).toFixed(2));
      const hi45 = Math.round(pt * 0.20);
      const avgAge = Number((cfg.avgAge - 2 + hashSeed(u.name + 'a') * 4).toFixed(1));

      return {
        name: u.name,
        fullName: u.name,
        totalAset: fmtInt(pt * 3 + 110),
        pt,
        brandCount,
        avgHI,
        hi45,
        hi45Pct: 20.0,
        avgAge,
        gi: gis.length || 6,
        upt: u.ultgs.length,
        color: '#0284c7',
        isActive: false,
        levelType: 'upt'
      };
    });
  }

  const upt = typeof findUptByName === 'function' ? findUptByName(uptName, uiCode) : null;
  if (upt) {
    return upt.ultgs.map(ultg => {
      const basePt = Math.round(ultg.gis.length * 18);
      const pt = Math.round(basePt * scale);
      return {
        name: ultg.name,
        fullName: ultg.name,
        totalAset: fmtInt(pt * 3 + 45),
        pt,
        brandCount: Math.min(ultg.gis.length * 3, brandCountBase),
        avgHI: Number((cfg.avgHI - 0.1).toFixed(2)),
        hi45: Math.round(pt * 0.19),
        hi45Pct: 19.0,
        avgAge: Number((cfg.avgAge - 1).toFixed(1)),
        gi: ultg.gis.length,
        upt: 1,
        color: '#0d9488',
        isActive: false,
        levelType: 'ultg'
      };
    });
  }

  return jawaStats.provinces.map(p => ({
    name: p.name,
    fullName: p.name,
    totalAset: p.count,
    pt: Math.round(p.pt * scale),
    brandCount: Math.min(brandCountBase, p.brandCount),
    avgHI: cfg.avgHI || p.avgHI,
    hi45: Math.round(p.hi45Count * scale * 0.22),
    hi45Pct: p.hi45Pct,
    avgAge: cfg.avgAge || p.avgAge,
    gi: p.gis.length,
    upt: p.upt.length,
    color: p.color,
    lat: p.lat,
    lng: p.lng,
    isActive: appState.subRegion === p.name,
    levelType: 'provinsi'
  }));
}

function buildTren(avgHI) {
  return TREN_YEARS.map((year, i) => ({ year, hi: Number((avgHI * TREN_SHAPE[i]).toFixed(2)) }));
}

// Statistik satu merk untuk scope aktif (KPI level 4)
function getBrandStats(brandName) {
  const typeStats = getAssetTypeStats();
  const brand = typeStats.brands.find(b => b.name === brandName) || typeStats.brands[0];

  const hiBreakdown = brand.hi.map((pct, i) => ({
    label: HI_META[i].label,
    pct,
    count: brand.hiCounts[i],
    color: HI_META[i].color
  }));

  return {
    brand: brand.name,
    assetType: typeStats.name,
    scope: typeStats.scope,
    count: brand.count,
    pctOfType: brand.pct,
    avgHI: brand.avgHI,
    avgAge: brand.avgAge,
    over20: brand.over20,
    over20Pct: (brand.over20 / brand.count) * 100,
    hi12Pct: brand.hi[0] + brand.hi[1],
    hi12Count: hiBreakdown[0].count + hiBreakdown[1].count,
    hi3Pct: brand.hi[2],
    hi3Count: hiBreakdown[2].count,
    hi45Pct: brand.hi[3] + brand.hi[4],
    hi45Count: hiBreakdown[3].count + hiBreakdown[4].count,
    hiBreakdown,
    ageBuckets: buildAgeBuckets(brand),
    historyTren: buildTren(brand.avgHI)
  };
}

// Daftar unit aset untuk scope + merk aktif (level 5 & 6)
function getScopeAssets() {
  const scope = getScopeStats();
  const brand = appState.brand || 'ABB';
  const cfg = getActiveAssetConfig();
  const prefix = cfg.shortCode || 'AST';

  if (scope.key === SCOPE_BASE_KEY && brand === 'ABB' && cfg.name === 'Power Transformer') return assetList;

  const perGi = scope.isAggregate ? 1 : 2;
  const rows = [];
  let seq = 0;

  scope.gis.forEach((g, gi) => {
    for (let i = 0; i < perGi; i++) {
      const seed = hashSeed(`${scope.key}|${cfg.name}|${brand}|${g.name}|${i}`);
      const hi = 1 + Math.floor(seed * 5);
      const year = 1993 + Math.floor(hashSeed(`${seed}|year`) * 26);
      const upt = scope.upt.length ? scope.upt[gi % scope.upt.length].name : 'UPT Regional';
      const code = brand.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
      const bayName = cfg.name === 'PMT' ? `Bay Line ${i + 1} 150kV` : cfg.name === 'PMS' ? `Bay PMS Rel ${i + 1}` : cfg.name === 'Baterai' ? `Ruang DC Baterai ${i + 1}` : cfg.name === 'Rele Proteksi' ? `Panel Proteksi ${i + 1}` : `Bay ${cfg.name} ${i + 1}`;

      rows.push({
        id: `${prefix}-${code}-${String(++seq).padStart(3, '0')}`,
        name: `${cfg.name} ${i + 1}`,
        gi: g.name,
        bay: bayName,
        lat: g.lat,
        lng: g.lng,
        voltage: hashSeed(`${seed}|kv`) > 0.85 ? '500 kV' : '150 kV',
        year,
        age: 2026 - year,
        hi,
        status: HI_META[hi - 1].status,
        unit: upt
      });
    }
  });

  return rows;
}

// Marker peta merk: diturunkan dari daftar unit agar sinkron dengan tabel
function getScopeGisLocations() {
  return getScopeAssets().map(a => ({
    name: a.gi,
    lat: a.lat,
    lng: a.lng,
    id: a.id,
    hi: a.hi,
    label: `${HI_META[a.hi - 1].label} - ${HI_META[a.hi - 1].status}`
  }));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function hiColor(hi) {
  return HI_META[Math.min(Math.max(hi, 1), 5) - 1].color;
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initLucide();
  initMainMap();
  setupFilterListeners();
  setupModalDismiss();
  renderLevel1();

  // Support direct deep-linking to analytical tabs: ?tab=profil-merk or #umur-aset
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab') || window.location.hash.replace('#', '');
  if (tabParam && ['sebaran-aset', 'profil-merk', 'profil-jenis', 'umur-aset'].includes(tabParam)) {
    setTimeout(() => switchLevel2Tab(tabParam), 150);
  }

  // Support direct deep-linking to filters: ?ui=UIT JBB &upt=UPT Cawang &merk=ABB &hi=HI 4
  const uiParam = urlParams.get('ui');
  const uptParam = urlParams.get('upt');
  const jenisParam = urlParams.get('jenis') || urlParams.get('assetType');
  const merkParam = urlParams.get('merk');
  const hiParam = urlParams.get('hi');

  if (jenisParam) {
    setTimeout(() => {
      const jSel = document.getElementById('filterJenisAset');
      if (jSel) {
        jSel.value = jenisParam;
        if (typeof onJenisAsetChanged === 'function') {
          onJenisAsetChanged();
        }
      }
    }, 150);
  }

  if (uiParam) {
    setTimeout(() => {
      const uiSel = document.getElementById('filterUnitInduk');
      if (uiSel) {
        uiSel.value = uiParam;
        cascadeUnitInduk();
        if (uptParam) {
          const uptSel = document.getElementById('filterUPT');
          if (uptSel) {
            uptSel.value = uptParam;
            cascadeUpt();
          }
        }
      }
    }, 200);
  }

  if (merkParam) {
    setTimeout(() => {
      const mSel = document.getElementById('filterMerk');
      if (mSel) {
        mSel.value = merkParam;
        onAssetFiltersChanged();
      }
    }, 250);
  }

  if (hiParam) {
    setTimeout(() => {
      const hSel = document.getElementById('filterHI');
      if (hSel) {
        hSel.value = hiParam;
        onAssetFiltersChanged();
      }
    }, 250);
  }
});

function initLucide() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// -------------------------------------------------------------
// SEAMLESS DRILL-DOWN ROUTER
// -------------------------------------------------------------
function navigateTo(level, params = {}) {
  appState.currentLevel = level;
  if (params.region) appState.region = params.region;
  if (params.subRegion) appState.subRegion = params.subRegion;
  if (params.assetType) appState.assetType = params.assetType;
  if (params.brand) appState.brand = params.brand;
  if (params.assetId) appState.selectedAssetId = params.assetId;

  // Saat kembali ke peta, scope provinsi dilepas agar scope ikut wilayah, bukan sisa drill-down
  if (level <= 2) appState.subRegion = null;

  // Pencarian hanya berlaku di halaman depan;Highlight lama dibuang saat pindah level
  if (level !== 1) {
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput && searchInput.value) searchInput.value = '';
    appState.filters.searchQuery = '';
    highlightMapMatches('');
    hideSearchResults();
  }

  // Hide all view panels
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // Pill navigasi "Navigasi Profil Aset" hanya aktif di tampilan peta depan;
  // sembunyikan saat masuk ke detail (Level 3+) karena tidak berfungsi di sana.
  const analyticsNav = document.getElementById('dashboardAnalyticsNav');
  if (analyticsNav) {
    analyticsNav.style.display = (level === 1 || level === 2) ? 'flex' : 'none';
  }

  // Level 1 or Level 2 both utilize #viewMapSection
  if (level === 1 || level === 2) {
    document.getElementById('viewMapSection').classList.add('active');
    if (level === 1) {
      renderLevel1();
    } else {
      renderLevel2();
    }
  } else if (level === 3) {
    document.getElementById('viewLevel3').classList.add('active');
    renderLevel3();
  } else if (level === 4) {
    document.getElementById('viewLevel4').classList.add('active');
    renderLevel4();
  } else if (level === 5) {
    document.getElementById('viewLevel5').classList.add('active');
    renderLevel5();
  } else if (level === 6) {
    document.getElementById('viewLevel6').classList.add('active');
    renderLevel6();
  }

  // Breadcrumb dibangun setelah render supaya state scope sudah final
  updateBreadcrumbs();

  setTimeout(initLucide, 50);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Profil Merk adalah analisis brand tingkat nasional: klik brand dari tab
// Profil Merk selalu membuka profil seluruh Indonesia, apapun filter Unit
// Induk/UPT yang sedang aktif agar hasil tidak tersangkut ke satu wilayah.
function openBrandProfileScoped(brand) {
  // Scope (nasional atau Unit Induk/UPT filter aktif) diwakili filter, bukan
  // appState.region. Men-set region ke scope.label akan membuat breadcrumb
  // menganggap scope sebagai region navigasi L2 (klik -> "design awal" region).
  appState.region = null;
  appState.subRegion = null;
  navigateTo(4, { brand });
}
window.openBrandProfileScoped = openBrandProfileScoped;
window.openBrandProfileNational = openBrandProfileScoped;

// Back dari L3 (Aset Type). Mode region navigasi (Jawa) -> L2 Region.
// Mode scope org aktif (Unit Induk/UPT) -> kembali ke peta scoped L1 yang berisi marker.
function backFromLevel3() {
  if (isOrgScopeActive()) {
    navigateTo(1);
  } else {
    navigateTo(2);
  }
}
window.backFromLevel3 = backFromLevel3;

// -------------------------------------------------------------
// BREADCRUMB BUILDER (DYNAMIC, CLICKABLE & FILTER-AWARE)
// -------------------------------------------------------------
function updateBreadcrumbs() {
  const container = document.getElementById('globalBreadcrumbs');
  if (!container) return;

  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const ultgName = document.getElementById('filterULTG')?.value || 'Semua';
  const giName = document.getElementById('filterGI')?.value || 'Semua';
  const bayName = document.getElementById('filterBay')?.value || 'Semua';

  const brand = document.getElementById('filterMerk')?.value || 'Semua';
  const hi = document.getElementById('filterHI')?.value || 'Semua';
  const jenisAset = document.getElementById('filterJenisAset')?.value || 'Power Transformer';

  let html = '';

  // Level 1: Main View
  if (appState.currentLevel === 1) {
    if (uiCode === 'Semua') {
      html += `<span class="breadcrumb-item breadcrumb-current"><i data-lucide="map" class="breadcrumb-icon"></i> Nasional (Seluruh Unit)</span>`;
    } else {
      html += `<a class="breadcrumb-item breadcrumb-link" onclick="resetOrgFilter()" title="Kembali ke Peta Nasional"><i data-lucide="map" class="breadcrumb-icon"></i> Nasional</a>`;
      html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;

      if (uptName === 'Semua') {
        html += `<span class="breadcrumb-item breadcrumb-current"><i data-lucide="building-2" class="breadcrumb-icon"></i> ${uiCode}</span>`;
      } else {
        html += `<a class="breadcrumb-item breadcrumb-link" onclick="selectUnitIndukFromBreadcrumb('${uiCode}')" title="Kembali ke ${uiCode}"><i data-lucide="building-2" class="breadcrumb-icon"></i> ${uiCode}</a>`;
        html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;

        if (ultgName === 'Semua') {
          html += `<span class="breadcrumb-item breadcrumb-current"><i data-lucide="building" class="breadcrumb-icon"></i> ${uptName}</span>`;
        } else {
          html += `<a class="breadcrumb-item breadcrumb-link" onclick="selectUptFromBreadcrumb('${uptName}', '${uiCode}')" title="Kembali ke ${uptName}"><i data-lucide="building" class="breadcrumb-icon"></i> ${uptName}</a>`;
          html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;

          if (giName === 'Semua') {
            html += `<span class="breadcrumb-item breadcrumb-current"><i data-lucide="zap" class="breadcrumb-icon"></i> ${ultgName}</span>`;
          } else {
            html += `<a class="breadcrumb-item breadcrumb-link" onclick="selectUltgFromBreadcrumb('${ultgName}', '${uptName}', '${uiCode}')" title="Kembali ke ${ultgName}"><i data-lucide="zap" class="breadcrumb-icon"></i> ${ultgName}</a>`;
            html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;

            if (bayName === 'Semua') {
              html += `<span class="breadcrumb-item breadcrumb-current"><i data-lucide="radio" class="breadcrumb-icon"></i> ${giName}</span>`;
            } else {
              html += `<a class="breadcrumb-item breadcrumb-link" onclick="selectGiFromBreadcrumb('${giName}', '${ultgName}', '${uptName}', '${uiCode}')" title="Kembali ke ${giName}"><i data-lucide="radio" class="breadcrumb-icon"></i> ${giName}</a>`;
              html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;
              html += `<span class="breadcrumb-item breadcrumb-current font-mono">${bayName}</span>`;
            }
          }
        }
      }
    }
  } else {
    // Level 2 - 6 Drill-down navigation
    html += `<a class="breadcrumb-item breadcrumb-link" onclick="navigateTo(1)"><i data-lucide="map" class="breadcrumb-icon"></i> Nasional</a>`;
    // Scope org aktif direpresentasikan di peta Level 1, sehingga segmen region
    // navigasi (appState.region, mis. "Jawa") tidak relevan dan tidak ditampilkan.
    if (appState.currentLevel >= 2 && appState.region && !isOrgScopeActive()) {
      html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;
      if (appState.currentLevel === 2) {
        html += `<span class="breadcrumb-item breadcrumb-current">${appState.region}</span>`;
      } else {
        html += `<a class="breadcrumb-item breadcrumb-link" onclick="navigateTo(2)">${appState.region}</a>`;
      }
    }
    if (appState.currentLevel >= 3) {
      const scope = getScopeLabel();
      if (scope && scope !== appState.region) {
        html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;
        if (isOrgScopeActive()) {
          // Scope org aktif diwakili peta Level 1 yang berisi marker (UPT/UPTL/GI).
          // Klik scope = kembali ke peta scoped, bukan ke "design awal" region L2.
          html += `<a class="breadcrumb-item breadcrumb-link" onclick="navigateTo(1)" title="Kembali ke ${scope}">${scope}</a>`;
        } else {
          html += `<span class="text-slate-600">${scope}</span>`;
        }
      }
      html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;
      if (appState.currentLevel === 3) {
        html += `<span class="breadcrumb-item breadcrumb-current">${appState.assetType}</span>`;
      } else {
        html += `<a class="breadcrumb-item breadcrumb-link" onclick="navigateTo(3)">${appState.assetType}</a>`;
      }
    }
    if (appState.currentLevel >= 4) {
      html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;
      if (appState.currentLevel === 4) {
        html += `<span class="breadcrumb-item breadcrumb-current">${appState.brand}</span>`;
      } else {
        html += `<a class="breadcrumb-item breadcrumb-link" onclick="navigateTo(4)">${appState.brand}</a>`;
      }
    }
    if (appState.currentLevel >= 5) {
      html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;
      if (appState.currentLevel === 5) {
        html += `<span class="breadcrumb-item breadcrumb-current">Daftar Aset</span>`;
      } else {
        html += `<a class="breadcrumb-item breadcrumb-link" onclick="navigateTo(5)">Daftar Aset</a>`;
      }
    }
    if (appState.currentLevel === 6) {
      html += `<span class="breadcrumb-separator"><i data-lucide="chevron-right"></i></span>`;
      html += `<span class="breadcrumb-item breadcrumb-current font-mono">${appState.selectedAssetId}</span>`;
    }
  }

  // Active Filter Badges in Breadcrumb bar
  let filterChips = '';
  if (brand !== 'Semua') {
    filterChips += `<span class="breadcrumb-chip" onclick="clearMerkFilter()" title="Klik untuk menghapus filter Merk: ${brand}"><i data-lucide="tag" class="chip-icon"></i> Merk: <strong>${brand}</strong> <i data-lucide="x" class="chip-remove"></i></span>`;
  }
  if (hi !== 'Semua') {
    filterChips += `<span class="breadcrumb-chip chip-hi" onclick="clearHIFilter()" title="Klik untuk menghapus filter AHI: ${hi}"><i data-lucide="shield-alert" class="chip-icon"></i> AHI: <strong>${hi}</strong> <i data-lucide="x" class="chip-remove"></i></span>`;
  }
  if (jenisAset !== 'Power Transformer') {
    filterChips += `<span class="breadcrumb-chip" onclick="clearJenisFilter()" title="Reset ke Power Transformer"><i data-lucide="cpu" class="chip-icon"></i> <strong>${jenisAset}</strong> <i data-lucide="x" class="chip-remove"></i></span>`;
  }

  if (filterChips) {
    html += `<div class="breadcrumb-active-chips">${filterChips}</div>`;
  }

  container.innerHTML = html;
  initLucide();
}

function selectUnitIndukFromBreadcrumb(code) {
  const selUI = document.getElementById('filterUnitInduk');
  if (selUI) {
    selUI.value = code;
    cascadeUnitInduk();
  }
}
window.selectUnitIndukFromBreadcrumb = selectUnitIndukFromBreadcrumb;

function selectUptFromBreadcrumb(uptName, uiCode) {
  if (uiCode) {
    const selUI = document.getElementById('filterUnitInduk');
    if (selUI && selUI.value !== uiCode) {
      selUI.value = uiCode;
      cascadeUnitInduk();
    }
  }
  const selUpt = document.getElementById('filterUPT');
  if (selUpt) {
    selUpt.value = uptName;
    cascadeUpt();
  }
}
window.selectUptFromBreadcrumb = selectUptFromBreadcrumb;

function selectUltgFromBreadcrumb(ultgName, uptName, uiCode) {
  selectUptFromBreadcrumb(uptName, uiCode);
  const selUltg = document.getElementById('filterULTG');
  if (selUltg) {
    selUltg.value = ultgName;
    cascadeUltg();
  }
}
window.selectUltgFromBreadcrumb = selectUltgFromBreadcrumb;

function selectGiFromBreadcrumb(giName, ultgName, uptName, uiCode) {
  selectUltgFromBreadcrumb(ultgName, uptName, uiCode);
  const selGi = document.getElementById('filterGI');
  if (selGi) {
    selGi.value = giName;
    cascadeGi();
  }
}
window.selectGiFromBreadcrumb = selectGiFromBreadcrumb;

function clearMerkFilter() {
  const sel = document.getElementById('filterMerk');
  if (sel) {
    sel.value = 'Semua';
    onAssetFiltersChanged();
  }
}
window.clearMerkFilter = clearMerkFilter;

function clearHIFilter() {
  const sel = document.getElementById('filterHI');
  if (sel) {
    sel.value = 'Semua';
    onAssetFiltersChanged();
  }
}
window.clearHIFilter = clearHIFilter;

function clearJenisFilter() {
  const sel = document.getElementById('filterJenisAset');
  if (sel) {
    sel.value = 'Power Transformer';
    if (typeof onJenisAsetChanged === 'function') {
      onJenisAsetChanged();
    } else {
      onAssetFiltersChanged();
    }
  }
}
window.clearJenisFilter = clearJenisFilter;

// -------------------------------------------------------------
// LEVEL 1: PETA NASIONAL (INDONESIA)
// -------------------------------------------------------------
// -------------------------------------------------------------
// UNIT INDUK STATISTIK NASIONAL (MANTAPS TRANSMISI)
// -------------------------------------------------------------
const UNIT_INDUK_METRICS = [
  {
    code: 'UIP3B SUM',
    name: 'PLN UIP3B Sumatera',
    region: 'Sumatera',
    center: [0.6500, 101.4000],
    color: '#f97316',
    totalAsset: 9080,
    uptCount: 9,
    giCount: 20,
    hi45: 1840,
    hiAvg: 2.62,
    alias: 'sumatera sumatra uip3bsum uip3b sumatera p3bs medan aceh riau padang jambi palembang bengkulu lampung'
  },
  {
    code: 'UIT JBB',
    name: 'PLN UIT Jawa Bagian Barat',
    region: 'DKI Jakarta & Banten',
    center: [-6.1500, 106.6500],
    color: '#ef4444',
    totalAsset: 4820,
    uptCount: 6,
    giCount: 18,
    hi45: 980,
    hiAvg: 2.58,
    alias: 'jbb jakarta banten uitjbb uit jbb cawang pulogadung gandul durikosambi cilegon'
  },
  {
    code: 'UIT JBT',
    name: 'PLN UIT Jawa Bagian Tengah',
    region: 'Jawa Barat & Jateng',
    center: [-7.1500, 110.0500],
    color: '#f59e0b',
    totalAsset: 5214,
    uptCount: 10,
    giCount: 28,
    hi45: 1060,
    hiAvg: 2.65,
    alias: 'jbt jawa tengah barat uitjbt uit jbt semarang bandung cirebon solo yogyakarta'
  },
  {
    code: 'UIT JBM',
    name: 'PLN UIT Jawa Bagian Timur & Bali',
    region: 'Jawa Timur & Bali',
    center: [-7.9500, 113.8000],
    color: '#00a3e0',
    totalAsset: 3880,
    uptCount: 5,
    giCount: 17,
    hi45: 790,
    hiAvg: 2.61,
    alias: 'jbm jawa timur bali uitjbm uit jbm surabaya malang madiun probolinggo bali'
  },
  {
    code: 'UIP3B KAL',
    name: 'PLN UIP3B Kalimantan',
    region: 'Kalimantan',
    center: [-1.4000, 113.8000],
    color: '#10b981',
    totalAsset: 4010,
    uptCount: 5,
    giCount: 10,
    hi45: 820,
    hiAvg: 2.70,
    alias: 'kalimantan uip3bkal uip3b kalimantan banjarmasin balikpapan pontianak samarinda'
  },
  {
    code: 'UIP3B SUL',
    name: 'PLN UIP3B Sulawesi',
    region: 'Sulawesi',
    center: [-2.5000, 121.2000],
    color: '#0284c7',
    totalAsset: 3780,
    uptCount: 5,
    giCount: 11,
    hi45: 770,
    hiAvg: 2.68,
    alias: 'sulawesi uip3bsul uip3b sulawesi makassar manado palu kendari mamuju'
  }
];

function renderNationalUnitIndukMarkers() {
  clearMainMarkers();
  if (!mainMap) return;

  UNIT_INDUK_METRICS.forEach(ui => {
    const icon = L.divIcon({
      className: 'uit-pin-marker-wrap',
      html: `
        <div class="uit-pin-marker" style="--ui-theme-color: ${ui.color};" onclick="selectUnitIndukFromMap('${ui.code}')" title="Klik untuk fokus ${ui.code}">
          <div class="uit-pin-head">
            <div class="uit-pin-icon"><i data-lucide="building-2"></i></div>
            <div class="uit-pin-content">
              <span class="uit-pin-title">${ui.code}</span>
              <span class="uit-pin-subtitle">${fmtInt(ui.totalAsset)} Aset &middot; AHI ${ui.hiAvg}</span>
            </div>
            <div class="uit-pin-arrow"><i data-lucide="chevron-right"></i></div>
          </div>
          <div class="uit-pin-point"></div>
        </div>
      `,
      iconSize: [148, 42],
      iconAnchor: [74, 42]
    });

    const marker = L.marker(ui.center, { icon: icon, zIndexOffset: 300 }).addTo(mainMap);
    marker.on('click', (e) => {
      if (e && e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
      selectUnitIndukFromMap(ui.code);
    });

    mainMarkers.push(marker);
  });

  // Legenda Unit Induk di pojok kiri bawah peta
  const legend = document.getElementById('nationalRegionLegend');
  if (legend) {
    legend.innerHTML = `
      <div class="map-legend-title">Hierarki Unit Induk Transmisi</div>
      <div class="map-legend-row" style="cursor: pointer; background: #eff6ff; border-radius: 4px; padding: 4px 6px; margin-bottom: 6px;" onclick="resetOrgFilter()" title="Kembali ke tampilan seluruh Indonesia">
        <span class="map-legend-swatch" style="background:#0056b3"></span>
        <span class="map-legend-name" style="font-weight: 700; color: #0056b3;">Semua Unit Induk</span>
        <span class="map-legend-value" style="color: #0056b3;">Nasional</span>
      </div>
      ${UNIT_INDUK_METRICS.map(ui => `
        <div class="map-legend-row" style="cursor: pointer;" onclick="selectUnitIndukFromMap('${ui.code}')" title="Klik untuk fokus ${ui.code}">
          <span class="map-legend-swatch" style="background:${ui.color}"></span>
          <span class="map-legend-name" style="font-weight: 600;">${ui.code}</span>
          <span class="map-legend-value">${fmtInt(ui.totalAsset)}</span>
        </div>
      `).join('')}
    `;
    legend.style.display = 'block';
  }

  setTimeout(initLucide, 40);
}

function selectUnitIndukFromMap(code) {
  const uiSelect = document.getElementById('filterUnitInduk');
  if (uiSelect) {
    uiSelect.value = code;
    cascadeUnitInduk();
  }
}
window.selectUnitIndukFromMap = selectUnitIndukFromMap;

function selectUptFromMap(uptName) {
  const uptSelect = document.getElementById('filterUPT');
  if (uptSelect) {
    uptSelect.value = uptName;
    cascadeUpt();
  }
}
window.selectUptFromMap = selectUptFromMap;

function selectUltgFromMap(ultgName) {
  const ultgSelect = document.getElementById('filterULTG');
  if (ultgSelect) {
    ultgSelect.value = ultgName;
    cascadeUltg();
  }
}
window.selectUltgFromMap = selectUltgFromMap;

function selectGiFromMap(giName) {
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const upt = uptName !== 'Semua' ? findUptByName(uptName, uiCode === 'Semua' ? null : uiCode) : null;

  if (upt) {
    const parentUltg = upt.ultgs.find(u => u.gis.some(g => g.name === giName));
    if (parentUltg) {
      const ultgSelect = document.getElementById('filterULTG');
      if (ultgSelect) {
        ultgSelect.value = parentUltg.name;
        cascadeUltg();
      }
    }
  }

  const giSelect = document.getElementById('filterGI');
  if (giSelect) {
    giSelect.value = giName;
    cascadeGi();
  }
}
window.selectGiFromMap = selectGiFromMap;

function selectBayFromMap(bayName) {
  const baySelect = document.getElementById('filterBay');
  if (baySelect) {
    baySelect.value = bayName;
    cascadeBay();
  }
}
window.selectBayFromMap = selectBayFromMap;

// ======================================================================
// NAVIGASI ARAH DASHBOARD (Peta Transmisi + 4 Pilar Analitik)
// ======================================================================
function scrollToDashboardSection(elemId) {
  const el = document.getElementById(elemId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  document.querySelectorAll('.analytics-pill-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-nav-target') === 'peta-transmisi') btn.classList.add('active');
  });
}
window.scrollToDashboardSection = scrollToDashboardSection;

function activateAndScrollToTab(tabId) {
  switchLevel2Tab(tabId);
  const bottomSec = document.getElementById('level2BottomSection');
  if (bottomSec) {
    bottomSec.style.display = 'block';
    setTimeout(() => {
      bottomSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }
}
window.activateAndScrollToTab = activateAndScrollToTab;

function renderLevel1() {
  document.getElementById('subHeaderTitle').textContent = 'Profil Aset Transmisi';
  document.getElementById('subHeaderDesc').textContent = 'Analisis kondisi aset berdasarkan lokasi, jenis aset, merk, umur, dan Health Index.';
  
  // Controls visibility
  document.getElementById('filterStripLevel1').style.display = 'flex';
  document.getElementById('level2HeaderBlock').style.display = 'none';
  document.getElementById('level2BottomSection').style.display = 'block'; // 4 Tabs Analitik Selalu Aktif
  document.getElementById('nationalStatPill').style.display = 'block';
  const hiLegendL1 = document.getElementById('mapHIlegend');
  if (hiLegendL1) hiLegendL1.style.display = 'none';
  populateBrandFilter();
  initOrgFilter();

  const pillUI = document.getElementById('pillUnitInduk') || document.getElementById('pillProvinsi');
  if (pillUI) pillUI.textContent = '6';
  const pillTotal = document.getElementById('pillTotalAset');
  if (pillTotal) pillTotal.textContent = nationalStats.totalAssetsLabel;
  document.getElementById('mapSizeToggle').style.display = 'none';

  // Map viewport height: pas 480px agar tab analitik langsung terlihat jelas di bawahnya
  document.getElementById('mainMapViewport').style.height = '480px';

  if (!mainMap) return;

  // Reset map view ke Indonesia hanya ketika scope nasional.
  // Saat scope organisasi aktif (Unit Induk/UPT/ULTG dipilih), biarkan
  // applyOrgFilterToMap() yang menyesuaikan zoom via fitBounds, sehingga
  // marker tidak menumpuk di satu sisi ketika kembali dari level detail.
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  setTimeout(() => {
    mainMap.invalidateSize();
    if (uiCode === 'Semua') {
      mainMap.flyTo([-1.2, 118.0], 5, { duration: 1.0 });
    }
  }, 100);

  // Clear existing markers
  clearMainMarkers();
  hideFrontPageNotice();

  // Nampilin unit induk secara besar dulu
  renderNationalUnitIndukMarkers();

  // Kartu konteks dan tab analitik mengikuti filter organisasi yang sedang aktif
  applyOrgFilterToMap();
  updateAnalyticsViews();
}

// Membuka provinsi dari peta depan / hasil pencarian.
function openProvinceFromFrontPage(provName) {
  const prov = nationalStats.provinces.find(p => p.name === provName);
  if (!prov) return;

  if (prov.region !== 'Jawa') {
    showFrontPageNotice(prov);
    return;
  }

  navigateTo(2, { region: 'Jawa' });
  const drillable = findJawaProvince(provName);
  if (drillable) {
    selectProvince(provName, false);
    updateSebaranAsetTabByName(provName);
  }
}

function showFrontPageNotice(prov) {
  const box = document.getElementById('frontPageNotice');
  if (!box) return;
  box.innerHTML = `
    <div class="front-page-notice-icon"><i data-lucide="info"></i></div>
    <div class="front-page-notice-body">
      <div class="front-page-notice-title">${prov.name} &middot; ${fmtInt(prov.count)} aset</div>
      <div class="front-page-notice-text">
        Health Index ${fmtNum(prov.avgHI, 2)} &middot; HI 4–5 ${fmtInt(prov.hi45)} unit (${fmtPct((prov.hi45 / prov.count) * 100)}).
        Data drill-down merk &amp; unit pada prototipe ini baru tersedia untuk wilayah Jawa.
      </div>
      <button class="btn btn-primary btn-sm" onclick="navigateTo(2, { region: 'Jawa' }); document.getElementById('frontPageNotice').hidden = true;">
        Buka Drill-down Jawa <i data-lucide="arrow-right"></i>
      </button>
    </div>
    <button class="front-page-notice-close" onclick="document.getElementById('frontPageNotice').hidden = true;" aria-label="Tutup">
      <i data-lucide="x"></i>
    </button>
  `;
  box.hidden = false;
  initLucide();
}

function hideFrontPageNotice() {
  const box = document.getElementById('frontPageNotice');
  if (box) box.hidden = true;
}

function selectNationalRegion(regionName) {
  navigateTo(2, { region: regionName });
}

function setNationalContextCard(data) {
  const card = document.getElementById('mapContextCard');
  if (!card) return;

  const metrics = [
    { label: 'Total Aset', value: data.total, mono: true },
    data.brands != null ? { label: 'Jumlah Merk', value: data.brands, mono: true } : null,
    data.avgHI != null ? { label: 'Rata-rata HI', value: data.avgHI, mono: true } : null,
    data.hi45 != null ? { label: 'Aset HI 4–5', value: data.hi45 } : null
  ].filter(Boolean);

  const isOrg = data.isOrg;

  card.innerHTML = `
    <div class="context-card-header">
      <div class="context-card-icon">
        <i data-lucide="building-2"></i>
      </div>
      <div style="min-width:0;">
        <div class="context-card-title">${data.title}</div>
        <div style="font-size: 11px; color: var(--text-muted);">
          ${data.subtitleExtra || (isOrg ? 'Struktur Organisasi' : 'Ringkasan Kondisi Wilayah')}
        </div>
      </div>
    </div>
    <div class="context-metrics-list">
      ${metrics.map(m => `
        <div class="context-metric-row">
          <span class="context-metric-label">${m.label}</span>
          <span class="context-metric-val ${m.label.includes('HI 4–5') ? 'warning' : ''}">${m.value}</span>
        </div>
      `).join('')}
    </div>
    <button class="btn-action-primary" id="btnLihatDetailContext">
      <span>${data.buttonLabel || 'Lihat Detail'}</span>
      <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
    </button>
    ${data.backLabel ? `
      <button type="button" class="btn-action-secondary" id="btnContextBack" style="width:100%;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;font-weight:600;color:#1e293b;cursor:pointer;transition:all 0.15s ease;">
        <i data-lucide="arrow-left" style="width:14px;height:14px;"></i>
        <span>${data.backLabel}</span>
      </button>
    ` : ''}
  `;
  document.getElementById('btnLihatDetailContext').onclick = data.onClickBtn;
  if (data.backLabel && data.onBack) {
    const backBtn = document.getElementById('btnContextBack');
    if (backBtn) backBtn.onclick = data.onBack;
  }
  initLucide();
}

// -------------------------------------------------------------
// UKURAN PETA LEVEL 2 (ringkas ↔ diperbesar)
// -------------------------------------------------------------
const MAP_SIZE_COMPACT = '360px';
const MAP_SIZE_EXPANDED = '640px';
let mapSizeExpanded = false;

function applyMapSize() {
  const viewport = document.getElementById('mainMapViewport');
  if (!viewport) return;
  viewport.style.height = mapSizeExpanded ? MAP_SIZE_EXPANDED : MAP_SIZE_COMPACT;
  const label = document.getElementById('mapSizeToggleLabel');
  const icon = document.getElementById('mapSizeToggleIcon');
  if (label) label.textContent = mapSizeExpanded ? 'Perkecil Peta' : 'Perbesar Peta';
  if (icon) icon.setAttribute('data-lucide', mapSizeExpanded ? 'minimize-2' : 'maximize-2');
  initLucide();
  if (mainMap) setTimeout(() => mainMap.invalidateSize(), 220);
}

function toggleMapSize() {
  mapSizeExpanded = !mapSizeExpanded;
  applyMapSize();
}

// -------------------------------------------------------------
// LEVEL 2: SETELAH KLIK WILAYAH / SISTEM (JAWA)
// -------------------------------------------------------------
function renderLevel2() {
  document.getElementById('subHeaderTitle').textContent = `Profil Aset — ${appState.region}`;
  document.getElementById('subHeaderDesc').textContent = 'Peta melakukan zoom ke wilayah terpilih dan menampilkan ringkasan aset di wilayah tersebut.';
  document.getElementById('regionalTitle').textContent = `Profil Aset — ${appState.region}`;

  // Reset subRegion — belum pilih provinsi
  appState.subRegion = null;

  // Controls visibility
  document.getElementById('filterStripLevel1').style.display = 'none';
  document.getElementById('level2HeaderBlock').style.display = 'block';
  document.getElementById('level2BottomSection').style.display = 'block';
  document.getElementById('nationalStatPill').style.display = 'none';
  const navL2 = document.getElementById('mapFloatingNav');
  if (navL2) navL2.style.display = 'none';
  const hiLegendL2 = document.getElementById('mapHIlegend');
  if (hiLegendL2) hiLegendL2.style.display = 'block';
  const regionLegendL2 = document.getElementById('nationalRegionLegend');
  if (regionLegendL2) regionLegendL2.style.display = 'none';
  hideFrontPageNotice();
  document.getElementById('mapSizeToggle').style.display = 'inline-flex';

  // Peta dibuat lebih pendek supaya tab analitik di bawahnya mendapat ruang
  applyMapSize();

  if (!mainMap) return;

  // Zoom map smoothly to Java Island
  setTimeout(() => {
    mainMap.invalidateSize();
    mainMap.flyTo([-7.1, 109.8], 7, { duration: 1.0 });
  }, 100);

  // Clear existing markers
  clearMainMarkers();

  // Render Java Province markers
  jawaStats.provinces.forEach(prov => {
    const icon = L.divIcon({
      className: 'custom-cluster-wrapper',
      html: `
        <div class="custom-cluster-marker" style="background-color: ${prov.color}; width: 64px; height: 64px; cursor: pointer;">
          <div class="cluster-val" style="font-size: 13.5px;">${prov.count}</div>
          <div class="cluster-label" style="font-size: 9.5px;">${prov.name}</div>
        </div>
      `,
      iconSize: [64, 64],
      iconAnchor: [32, 32]
    });

    const marker = L.marker([prov.lat, prov.lng], { icon: icon }).addTo(mainMap);

    marker.bindTooltip(`<strong>${prov.name}</strong><br/><span style="font-size:11px;color:#0056b3;font-weight:700;">Klik untuk lihat detail provinsi &rarr;</span>`, {
      direction: 'top',
      offset: [0, -25]
    });

    // Klik marker: update context card & tab, TIDAK langsung drill-down
    marker.on('click', (e) => {
      if (e && e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
      selectProvince(prov.name, true);
      updateSebaranAsetTab(prov);
    });

    mainMarkers.push(marker);
  });

  // Tampilkan context card ringkasan Jawa (bukan langsung Jawa Barat)
  setJawaRegionContextCard();

  // Switch to default tab dan reset konten tab ke Jawa
  switchLevel2Tab('sebaran-aset');
  resetSebaranAsetTab();
  renderL2AssetTypeSummary();
}

// Semua ringkasan level 2 mengikuti scope aktif (agregat Jawa atau provinsi)
function renderL2AssetTypeSummary() {
  const stats = getAssetTypeStats();
  const cfg = getActiveAssetConfig();
  const scope = stats.scope;
  const scopeText = scope.isAggregate ? `${scope.label} (agregat)` : scope.label;
  const age = getScopeAgeBuckets();

  const capUnit = age.capUnit || 'MVA';
  setText('l2KpiLabelPt', cfg.name);
  setText('l2ActiveAssetText', `Jenis Aset: ${cfg.name}`);
  setText('thColJenisAset', cfg.name);
  setText('thColMerkJenis', `Merk ${cfg.shortCode || 'Aset'}`);
  setText('l2BrandTabTitle', `Komposisi Merk ${cfg.name}`);
  setText('l2PtCardTitle', cfg.name);
  setText('tab3BtnLabel', `Eksplorasi ${cfg.name}`);
  setText('thKapasitasUpt', `Kapasitas (${capUnit})`);
  setText('thKapasitasAge', `Kapasitas (${capUnit})`);
  setText('overlayKapasitasLabel', `Kapasitas (${capUnit})`);
  setText('thKapasitasLevel3', `Kapasitas (${capUnit})`);

  setText('l2PtCount', fmtInt(stats.total));
  setText('l2PtMeta', `Rata-rata HI: ${fmtNum(stats.avgHI, 2)} • ${fmtInt(stats.brandCount)} Merk`);
  setText('l2PtSubtitle', `${cfg.voltageDesc || 'Transformator Daya 150/500 kV'} • ${scope.label}`);
  setText('l2HiSubtitle', scopeText);
  setText('l2MerkSubtitle', scopeText);
  setText('l2PtHiSubtitle', scopeText);
  setText('l2UptSubtitle', `${scope.upt.length} UPT • ${fmtInt(age.mvaTotal)} ${age.capUnit || 'MVA'}`);
  setText('l2TrenSubtitle', `Rata-rata HI ${scopeText}, 2021 – 2026`);

  // KPI header
  setText('l2KpiPt', fmtInt(stats.total));
  setText('l2KpiBrands', fmtInt(stats.brandCount));
  setText('l2KpiAvgHI', fmtNum(stats.avgHI, 2));
  setText('l2KpiHi45', fmtInt(stats.hi45Count));
  setText('l2KpiHi45Pct', fmtPct(stats.hi45Pct));
  setText('l2KpiAvgAge', fmtNum(stats.avgAge, 1));
  setText('l2KpiGi', fmtInt(scope.gis.length));

  // Ringkasan teknis jenis aset terpilih
  const specList = document.getElementById('l2PtSpecList');
  if (specList) {
    const specs = [
      { icon: 'activity', label: 'Rata-rata HI', value: `${fmtNum(stats.avgHI, 2)} — ${highestHiLabel(stats.avgHI)}` },
      { icon: 'alert-triangle', label: 'Unit HI 4–5', value: `${fmtInt(stats.hi45Count)} (${fmtPct(stats.hi45Pct)})` },
      { icon: 'clock', label: 'Rata-rata umur', value: `${fmtNum(stats.avgAge, 1)} tahun` },
      { icon: 'zap', label: cfg.unitCapacityLabel || 'Kapasitas terpasang', value: `${fmtInt(age.mvaTotal)} ${age.capUnit || 'MVA'}` },
      { icon: 'map-pin', label: 'Gardu Induk', value: `${fmtInt(scope.gis.length)} lokasi` },
      { icon: 'award', label: 'Merk aktif', value: `${fmtInt(stats.brandCount)} pabrikan` }
    ];
    specList.innerHTML = specs.map(s => `
      <div class="metric-list-row">
        <span class="metric-list-label"><i data-lucide="${s.icon}" style="width:14px;height:14px;"></i>${s.label}</span>
        <span class="metric-list-val">${s.value}</span>
      </div>
    `).join('');
  }

  renderL2HICards();
  renderL2ProvTable();
  renderL2BrandTable();
  renderL2UptTable();
  renderL2AgeTable();

  // Chart digambar ulang hanya untuk tab yang sedang aktif
  const activePanel = document.querySelector('.level2-tab-panel.active');
  if (activePanel) renderL2ChartForTab(activePanel.id.replace('l2tab-', ''));
}

function highestHiLabel(avgHI) {
  if (avgHI <= 1.8) return 'Sangat Baik';
  if (avgHI <= 2.4) return 'Baik';
  if (avgHI <= 3.2) return 'Cukup';
  return 'Perlu Perhatian';
}

// Chart hanya digambar untuk tab yang sedang aktif, karena canvas di panel
// tersembunyi akan ter-render dengan ukuran 0 oleh Chart.js.
function renderL2ChartForTab(tabId) {
  const stats = getAssetTypeStats();
  const scope = stats.scope;
  const font = { family: 'Plus Jakarta Sans', size: 11 };

  if (tabId === 'sebaran-aset') {
    const provCanvas = document.getElementById('canvasL2Provinsi');
    if (!provCanvas) return;
    if (chartL2Provinsi) chartL2Provinsi.destroy();
    const rows = getProvinceSummaries();
    const hasActive = rows.some(p => p.isActive);
    const colorPrimary = '#0056b3';
    const colorWarning = '#f97316';
    const colorPrimaryMuted = '#cbd5e1';
    const colorWarningMuted = '#fed7aa';

    chartL2Provinsi = new Chart(provCanvas, {
      type: 'bar',
      data: {
        labels: rows.map(p => p.name),
        datasets: [
          {
            label: stats.name || 'Unit Aset',
            data: rows.map(p => p.pt),
            backgroundColor: hasActive
              ? rows.map(p => (p.isActive ? colorPrimary : colorPrimaryMuted))
              : colorPrimary,
            borderRadius: 4
          },
          {
            label: 'Unit HI 4–5',
            data: rows.map(p => p.hi45),
            backgroundColor: hasActive
              ? rows.map(p => (p.isActive ? colorWarning : colorWarningMuted))
              : colorWarning,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (evt, els) => {
          if (!els.length) return;
          const p = rows[els[0].index];
          onTableRowClick(p);
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font,
              generateLabels: (chart) => [
                {
                  text: stats.name || 'Unit Aset',
                  fillStyle: colorPrimary,
                  strokeStyle: colorPrimary,
                  lineWidth: 0,
                  hidden: !chart.isDatasetVisible(0),
                  datasetIndex: 0
                },
                {
                  text: 'Unit HI 4–5',
                  fillStyle: colorWarning,
                  strokeStyle: colorWarning,
                  lineWidth: 0,
                  hidden: !chart.isDatasetVisible(1),
                  datasetIndex: 1
                }
              ]
            }
          },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const p = rows[items[0].dataIndex];
                return [`Rata-rata HI: ${fmtNum(p.avgHI, 2)}`, `Rata-rata umur: ${fmtNum(p.avgAge, 1)} thn`, `Gardu Induk: ${fmtInt(p.gi)}`];
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font } },
          y: { grid: { color: '#f1f5f9' }, beginAtZero: true, ticks: { font }, title: { display: true, text: 'Jumlah Unit' } }
        }
      }
    });
    return;
  }

  if (tabId === 'profil-merk') {
    const riskCanvas = document.getElementById('canvasL2BrandRisk');
    if (!riskCanvas) return;
    if (chartL2BrandRisk) chartL2BrandRisk.destroy();
    const rows = stats.brandsGrouped.map(b => ({
      name: b.name,
      hi45: b.hiCounts[3] + b.hiCounts[4],
      pct: b.hi[3] + b.hi[4],
      isGroup: b.isGroup
    })).sort((a, b) => b.hi45 - a.hi45);

    chartL2BrandRisk = new Chart(riskCanvas, {
      type: 'bar',
      data: {
        labels: rows.map(r => r.name),
        datasets: [{
          label: `Unit HI 4–5 — ${scope.label}`,
          data: rows.map(r => r.hi45),
          backgroundColor: '#f97316',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (item) => `${fmtInt(item.parsed.x)} unit (${fmtPct(rows[item.dataIndex].pct)})` }
          }
        },
        scales: {
          x: { grid: { color: '#f1f5f9' }, beginAtZero: true, ticks: { font } },
          y: { grid: { display: false }, ticks: { font } }
        }
      }
    });
    return;
  }

  if (tabId === 'profil-jenis') {
    const hiCanvas = document.getElementById('canvasL2HI');
    if (!hiCanvas) return;
    if (chartL2HI) chartL2HI.destroy();
    const dist = getScopeHIDistribution();

    chartL2HI = new Chart(hiCanvas, {
      type: 'doughnut',
      data: {
        labels: dist.rows.map(r => r.label),
        datasets: [{
          data: dist.rows.map(r => r.count),
          backgroundColor: dist.rows.map(r => r.color),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 11, font: { family: 'Plus Jakarta Sans', size: 11 }, padding: 10 } },
          tooltip: {
            callbacks: { label: (item) => `${item.label}: ${fmtInt(item.parsed)} unit (${fmtPct(dist.rows[item.dataIndex].pct)})` }
          }
        }
      }
    });
    return;
  }

  if (tabId === 'umur-aset') {
    renderChartUmurAsetL2();

    const trenCanvas = document.getElementById('canvasL2Tren');
    if (!trenCanvas) return;
    if (chartL2Tren) chartL2Tren.destroy();
    const tren = buildTren(stats.avgHI);

    chartL2Tren = new Chart(trenCanvas, {
      type: 'line',
      data: {
        labels: tren.map(t => t.year),
        datasets: [{
          label: `Rata-rata HI — ${scope.label}`,
          data: tren.map(t => t.hi),
          borderColor: '#0056b3',
          backgroundColor: 'rgba(0, 86, 179, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#0056b3'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (item) => `HI ${fmtNum(item.parsed.y)}` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font } },
          y: { grid: { color: '#f1f5f9' }, ticks: { font }, title: { display: true, text: 'Health Index' } }
        }
      }
    });
  }
}

function destroyL2Charts() {
  if (chartL2Provinsi) { chartL2Provinsi.destroy(); chartL2Provinsi = null; }
  if (chartL2BrandRisk) { chartL2BrandRisk.destroy(); chartL2BrandRisk = null; }
  if (chartL2HI) { chartL2HI.destroy(); chartL2HI = null; }
  if (chartL2Tren) { chartL2Tren.destroy(); chartL2Tren = null; }
  if (chartUmurAsetL2) { chartUmurAsetL2.destroy(); chartUmurAsetL2 = null; }
}


function renderL2HICards() {
  const dist = getScopeHIDistribution();
  setText('l2Hi12Val', fmtInt(dist.hi12));
  setText('l2Hi12Sub', `${fmtPct((dist.hi12 / dist.total) * 100)} dari total`);
  setText('l2Hi3Val', fmtInt(dist.hi3));
  setText('l2Hi45Val', fmtInt(dist.hi45));

  const list = document.getElementById('l2HiList');
  if (!list) return;
  list.innerHTML = dist.rows.map((r, i) => `
    <div class="metric-list-row">
      <span class="metric-list-label"><span class="hi-dot hi-dot-${i + 1}"></span>${r.label}</span>
      <span class="metric-list-val">${fmtInt(r.count)} <span style="color:var(--text-muted);font-weight:500;">(${fmtPct(r.pct)})</span></span>
    </div>
  `).join('');
}

function onTableRowClick(p) {
  if (!p) return;
  if (p.levelType === 'unit-induk') {
    const selUI = document.getElementById('filterUnitInduk');
    if (selUI) {
      selUI.value = p.name;
      cascadeUnitInduk();
    }
  } else if (p.levelType === 'upt') {
    selectUptFromMap(p.name);
  } else if (p.levelType === 'ultg') {
    selectUltgFromMap(p.name);
  } else {
    selectProvince(p.name, true);
    updateSebaranAsetTabByName(p.name);
  }
}
window.onTableRowClick = onTableRowClick;

function onTableRowClickByIndex(idx) {
  const rows = getProvinceSummaries();
  const p = rows[idx];
  if (p) onTableRowClick(p);
}
window.onTableRowClickByIndex = onTableRowClickByIndex;

function renderL2ProvTable() {
  const tbody = document.getElementById('l2ProvTableBody');
  if (!tbody) return;
  const rows = getProvinceSummaries();

  tbody.innerHTML = rows.map((p, idx) => `
    <tr class="province-row${p.isActive ? ' is-active' : ''}" style="cursor: pointer;" onclick="onTableRowClickByIndex(${idx})">
      <td>
        <strong>${p.name}</strong>
        ${p.fullName && p.fullName !== p.name ? `<div style="font-size:11px;color:var(--text-muted);font-weight:normal;">${p.fullName}</div>` : ''}
      </td>
      <td style="text-align: right;" class="font-mono">${p.totalAset}</td>
      <td style="text-align: right;" class="font-mono">${fmtInt(p.pt)}</td>
      <td style="text-align: right;" class="font-mono">${fmtInt(p.brandCount)}</td>
      <td style="text-align: right;" class="font-mono">${fmtNum(p.avgHI, 2)}</td>
      <td style="text-align: right;" class="font-mono">${fmtInt(p.hi45)} <span style="color:var(--text-muted);">(${fmtPct(p.hi45Pct)})</span></td>
      <td style="text-align: right;" class="font-mono">${fmtNum(p.avgAge, 1)} thn</td>
      <td style="text-align: right;" class="font-mono">${fmtInt(p.gi)}</td>
      <td style="text-align: right;">
        <button type="button" class="table-btn-link" onclick="event.stopPropagation(); onTableRowClickByIndex(${idx});">
          Fokuskan <i data-lucide="crosshair" style="width:14px;height:14px;"></i>
        </button>
      </td>
    </tr>
  `).join('');

  initLucide();
}

function renderL2BrandTable() {
  const tbody = document.getElementById('l2BrandTableBody');
  if (!tbody) return;
  const stats = getAssetTypeStats();
  const activeBrand = document.getElementById('filterMerk')?.value || 'Semua';

  tbody.innerHTML = stats.brandsGrouped.map(b => {
    const dominant = b.hi.indexOf(Math.max(...b.hi)) + 1;
    const isSelected = activeBrand !== 'Semua' && b.name.toLowerCase() === activeBrand.toLowerCase();
    const action = b.isGroup
      ? `<button class="table-btn-link" onclick="openOtherBrandsModal()">
           Lihat ${b.memberCount} merk <i data-lucide="list" style="width:14px;height:14px;"></i>
         </button>`
      : `<button class="table-btn-link" onclick="openBrandProfileNational('${b.name}')">
           Lihat Profil <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
         </button>`;
    const nameCell = b.isGroup
      ? `<strong class="text-brand-600">${b.name}</strong> <span class="pill-count">${b.memberCount} merk</span>`
      : `<strong class="text-brand-600">${b.name}</strong>${isSelected ? ' <span class="badge-filter-active" style="background:#0056b3;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-left:5px;">TERPILIH</span>' : ''}`;

    return `
      <tr class="${b.isGroup ? 'row-group' : ''} ${isSelected ? 'is-selected-brand' : ''}" style="${isSelected ? 'background: #eff6ff; border-left: 3px solid #0056b3;' : ''}">
        <td>${nameCell}</td>
        <td style="text-align: right;" class="font-mono">${fmtInt(b.count)}</td>
        <td style="text-align: right;" class="font-mono">${fmtPct(b.pct)}</td>
        <td style="text-align: right;" class="font-mono">${fmtNum(b.avgHI, 2)}</td>
        <td style="text-align: right;" class="font-mono">${b.hi[0] + b.hi[1]}%</td>
        <td style="text-align: right;" class="font-mono">${b.hi[3] + b.hi[4]}%</td>
        <td style="text-align: right;" class="font-mono">${fmtNum(b.avgAge, 1)} thn</td>
        <td><span class="badge-hi hi-${dominant}"><span class="hi-dot hi-dot-${dominant}"></span> ${HI_META[dominant - 1].status} (${b.hi[dominant - 1]}%)</span></td>
        <td style="text-align: right;">${action}</td>
      </tr>
    `;
  }).join('');

  const bar = document.getElementById('l2BrandBarContainer');
  if (bar) {
    const maxCount = Math.max(...stats.brandsGrouped.map(b => b.count));
    bar.innerHTML = stats.brandsGrouped.map(b => {
      const isSelected = activeBrand !== 'Semua' && b.name.toLowerCase() === activeBrand.toLowerCase();
      return `
        <div class="brand-bar-item${b.isGroup ? ' is-group' : ''}${isSelected ? ' is-active-brand' : ''}"
onclick="${b.isGroup ? 'openOtherBrandsModal()' : `openBrandProfileNational('${b.name}')`}"
             style="${isSelected ? 'background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 4px 8px;' : ''}"
             title="${b.isGroup ? `Klik untuk lihat daftar ${b.memberCount} merk dalam kategori Lainnya` : `Klik untuk lihat detail merk ${b.name}`}">
          <div class="brand-bar-name">${b.name}${b.isGroup ? ` <span class="brand-bar-badge">${b.memberCount}</span>` : ''}${isSelected ? ' 🏷️' : ''}</div>
          <div class="brand-bar-track">
            <div class="brand-bar-fill" style="width: ${Math.round((b.count / maxCount) * 100)}%; ${isSelected ? 'background: #0056b3;' : ''}"></div>
          </div>
          <div class="brand-bar-metric">
            ${fmtInt(b.count)} <span style="font-size:11px;color:var(--text-muted);font-weight:normal;">(${fmtPct(b.pct)})</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Modal daftar merk di dalam kategori "Lainnya" (19 merk, scope-aware).
function openOtherBrandsModal() {
  const group = getAssetTypeStats().brandsGrouped.find(b => b.isGroup);
  if (!group) return;
  const scope = getScopeStats();
  const rows = group.members.slice().sort((a, b) => b.count - a.count);

  openBrandModal({
    eyebrow: `Kategori ${group.name} • ${group.memberCount} merk`,
    title: 'Rincian Merk Lainnya',
    subtitle: `Setiap merk bisa diklik untuk membuka profil Health Index, sebaran umur, dan daftar unit — ${scope.label}.`,
    head: ['Merk', 'Unit', 'Pangsa', 'HI', 'HI 4–5', 'Umur', ''],
    rows: rows.map(m => `
      <tr class="row-clickable" onclick="closeBrandModal(); openBrandProfileNational('${m.name}');" title="Klik untuk melihat profil merk ${m.name}">
        <td><strong class="text-brand-600">${m.name}</strong></td>
        <td style="text-align:right;" class="font-mono">${fmtInt(m.count)}</td>
        <td style="text-align:right;" class="font-mono">${fmtPct(m.pct)}</td>
        <td style="text-align:right;" class="font-mono">${fmtNum(m.avgHI, 2)}</td>
        <td style="text-align:right;" class="font-mono">${fmtInt(m.hiCounts[3] + m.hiCounts[4])} (${Math.round(m.hi[3] + m.hi[4])}%)</td>
        <td style="text-align:right;" class="font-mono">${fmtNum(m.avgAge, 1)} thn</td>
        <td style="text-align:right;">
          <button class="table-btn-link" onclick="event.stopPropagation(); closeBrandModal(); openBrandProfileNational('${m.name}');">
            Detail <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
          </button>
        </td>
      </tr>
    `).join(''),
    footer: `${group.memberCount} merk menyumbang ${fmtInt(group.count)} unit (${fmtPct(group.pct)} dari total ${fmtInt(scope.pt)} ${getAssetTypeStats().name} di ${scope.label}). Rata-rata grup: HI ${fmtNum(group.avgHI, 2)}, umur ${fmtNum(group.avgAge, 1)} tahun.`
  });
}

function renderL2UptTable() {
  const tbody = document.getElementById('l2UptTableBody');
  if (!tbody) return;
  const scope = getScopeStats();

  tbody.innerHTML = scope.upt.map(u => {
    const level = u.ratio >= 22 ? 4 : u.ratio >= 20 ? 3 : 2;
    return `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td style="text-align: right;" class="font-mono">${fmtInt(u.count)}</td>
        <td style="text-align: right;" class="font-mono">${fmtInt(u.mva)}</td>
        <td style="text-align: right;" class="font-mono">${fmtInt(u.hi45)}</td>
        <td style="text-align: right;" class="font-mono">${fmtPct(u.ratio)}</td>
        <td><span class="badge-hi hi-${level}"><span class="hi-dot hi-dot-${level}"></span> ${HI_META[level - 1].status}</span></td>
      </tr>
    `;
  }).join('');

  initLucide();
}

function renderL2AgeTable() {
  const tbody = document.getElementById('l2AgeTableBody');
  if (!tbody) return;
  const age = getScopeAgeBuckets();

  tbody.innerHTML = age.rows.map((r, i) => `
    <tr>
      <td><strong>${r.range}</strong></td>
      <td style="text-align: right;" class="font-mono">${fmtInt(r.count)}</td>
      <td style="text-align: right;" class="font-mono">${fmtPct((r.count / age.total) * 100)}</td>
      <td style="text-align: right;" class="font-mono">${fmtInt(r.mva)}</td>
      <td><span class="badge-hi hi-${r.hiLevel}"><span class="hi-dot hi-dot-${r.hiLevel}"></span> ${r.status}</span></td>
      <td style="text-align: right;">
        <button class="table-btn-link" onclick="switchLevel2Tab('profil-jenis')">
          Analisis HI <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
        </button>
      </td>
    </tr>
  `).join('');

  initLucide();
}

// Context card: tampilkan ringkasan WILAYAH JAWA (sebelum klik provinsi)
function setJawaRegionContextCard() {
  const card = document.getElementById('mapContextCard');
  if (!card) return;

  card.innerHTML = `
    <div class="context-card-header">
      <div class="context-card-icon">
        <i data-lucide="map"></i>
      </div>
      <div>
        <div class="context-card-title">${appState.region}</div>
        <div style="font-size: 11px; color: var(--text-muted);">Ringkasan Seluruh Wilayah</div>
      </div>
    </div>
    <div class="context-metrics-list">
      <div class="context-metric-row">
        <span class="context-metric-label">Total Aset</span>
        <span class="context-metric-val">${jawaStats.totalAssets}</span>
      </div>
      <div class="context-metric-row">
        <span class="context-metric-label">Jumlah Merk</span>
        <span class="context-metric-val">${jawaStats.totalBrands}</span>
      </div>
      <div class="context-metric-row">
        <span class="context-metric-label">Rata-rata HI</span>
        <span class="context-metric-val">${jawaStats.avgHI}</span>
      </div>
      <div class="context-metric-row">
        <span class="context-metric-label">Aset HI 4–5</span>
        <span class="context-metric-val warning">${jawaStats.hi45Count}</span>
      </div>
    </div>
    <div class="top-asset-types-box">
      <div class="top-asset-heading">Provinsi di Wilayah Jawa:</div>
      ${jawaStats.provinces.map(p => `
        <div class="top-asset-row" style="cursor:pointer;" onclick="selectProvince('${p.name}', true); updateSebaranAsetTabByName('${p.name}');">
          <span>${p.name}</span>
          <strong class="font-mono">${p.count}</strong>
        </div>
      `).join('')}
    </div>
    <div style="font-size: 11px; color: var(--text-muted); margin-top: 10px; font-style: italic;">
      <i data-lucide="mouse-pointer" style="width:11px;height:11px;display:inline-block;vertical-align:-1px;"></i>
      Klik marker provinsi di peta untuk detail
    </div>
  `;
  initLucide();
  // Kembali ke ringkasan wilayah: scope dilepas dan tab bawah ikut aggregate
  appState.subRegion = null;
  resetSebaranAsetTab();
  renderL2AssetTypeSummary();
}

// Context card: tampilkan detail PROVINSI (setelah klik marker)
function selectProvince(provName, fly = true) {
  appState.subRegion = provName;
  const prov = jawaStats.provinces.find(p => p.name === provName) || jawaStats.provinces[2];

  if (fly && mainMap) {
    mainMap.flyTo([prov.lat, prov.lng], 8, { duration: 0.8 });
  }

  const card = document.getElementById('mapContextCard');
  if (!card) return;

  const activeCfg = getActiveAssetConfig();
  const topTypes = prov.topTypes || [
    { name: activeCfg.name, count: prov.pt },
    { name: 'PMT (Circuit Breaker)', count: Math.round(prov.pt * 0.7) },
    { name: 'PMS (Disconnecting Switch)', count: Math.round(prov.pt * 1.4) }
  ];

  card.innerHTML = `
    <div class="context-card-header">
      <div class="context-card-icon">
        <i data-lucide="map-pin"></i>
      </div>
      <div>
        <div class="context-card-title">${prov.name}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${appState.region}</div>
      </div>
    </div>
    <div class="context-metrics-list">
      <div class="context-metric-row">
        <span class="context-metric-label">Total Aset</span>
        <span class="context-metric-val">${prov.count}</span>
      </div>
      <div class="context-metric-row">
        <span class="context-metric-label">Jumlah Merk</span>
        <span class="context-metric-val">22</span>
      </div>
      <div class="context-metric-row">
        <span class="context-metric-label">Rata-rata HI</span>
        <span class="context-metric-val">${prov.avgHI}</span>
      </div>
      <div class="context-metric-row">
        <span class="context-metric-label">Aset HI 4–5</span>
        <span class="context-metric-val warning">${hi45Text(prov)}</span>
      </div>
    </div>
    <div class="top-asset-types-box">
      <div class="top-asset-heading">Jenis Aset Terbanyak:</div>
      ${topTypes.map(t => `
        <div class="top-asset-row">
          <span>${t.name}</span>
          <strong class="font-mono">${t.count}</strong>
        </div>
      `).join('')}
    </div>
    <div style="display:flex; gap:8px; margin-top:12px; flex-direction:column;">
      <button class="btn-action-primary" onclick="navigateTo(3, { subRegion: '${prov.name}', assetType: '${activeCfg.name}' })">
        <span>Lihat Profil Jenis Aset</span>
        <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
      </button>
      <button class="btn-action-secondary" style="justify-content:center;" onclick="setJawaRegionContextCard()">
        <i data-lucide="arrow-left" style="width:14px;height:14px;"></i>
        <span>Kembali ke Ringkasan Jawa</span>
      </button>
    </div>
  `;
  initLucide();
  renderL2AssetTypeSummary();
}

// Update tab Sebaran Aset berdasarkan objek provinsi
function updateSebaranAsetTab(prov) {
  const stats = getAssetTypeStats();
  const titleEl = document.getElementById('sebaranAsetTitle');
  const descEl = document.getElementById('sebaranAsetDesc');
  const btnLabel = document.getElementById('sebaranAsetBtnLabel');
  const btn = document.getElementById('sebaranAsetBtn');

  if (titleEl) titleEl.textContent = `Sebaran Wilayah Terpilih: ${prov.name}`;
  if (descEl) descEl.textContent = `Total ${prov.count} aset tersebar di wilayah ${prov.name}. Rata-rata HI semua jenis aset: ${fmtNum(prov.avgHI, 2)}. Aset kritis (HI 4–5): ${hi45Text(prov)}. Klik tombol untuk eksplorasi jenis aset.`;
  if (btnLabel) btnLabel.textContent = `Eksplorasi ${stats.name} — ${prov.name} (${fmtInt(prov.pt)} Unit)`;
  // Update onclick button agar gunakan provinsi yang dipilih
  if (btn) btn.onclick = () => navigateTo(3, { subRegion: prov.name, assetType: stats.name });
}

// Reset tab Sebaran Aset ke Jawa (tidak ada provinsi dipilih)
function resetSebaranAsetTab() {
  const stats = getAssetTypeStats();
  const titleEl = document.getElementById('sebaranAsetTitle');
  const descEl = document.getElementById('sebaranAsetDesc');
  const btnLabel = document.getElementById('sebaranAsetBtnLabel');
  const btn = document.getElementById('sebaranAsetBtn');
  const totalPT = jawaStats.provinces.reduce((sum, p) => sum + p.pt, 0);

  if (titleEl) titleEl.textContent = `Sebaran Wilayah: ${appState.region}`;
  if (descEl) descEl.textContent = `Total ${jawaStats.totalAssets} aset tersebar di seluruh wilayah ${appState.region}. Pilih provinsi di peta untuk melihat detail, atau eksplorasi ${stats.name} seluruh wilayah.`;
  if (btnLabel) btnLabel.textContent = `Eksplorasi ${stats.name} — ${appState.region} (${fmtInt(totalPT)} Unit)`;
  // Scope agregat: subRegion diisi dengan nama wilayah agar breadcrumb tidak dobel
  if (btn) btn.onclick = () => navigateTo(3, { subRegion: appState.region, assetType: stats.name });
}

// Update tab Sebaran Aset berdasarkan nama provinsi
function updateSebaranAsetTabByName(provName) {
  const prov = jawaStats.provinces.find(p => p.name === provName) || jawaStats.provinces[2];
  updateSebaranAsetTab(prov);
}

function switchLevel2Tab(tabId) {
  // Update button active states in bottom tab bar
  document.querySelectorAll('[data-level2-tab]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-level2-tab') === tabId) {
      btn.classList.add('active');
    }
  });

  // Update button active states in top analytics navigation bar
  document.querySelectorAll('.analytics-pill-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-nav-target') === tabId) {
      btn.classList.add('active');
    }
  });

  // Switch panels
  document.querySelectorAll('.level2-tab-panel').forEach(panel => {
    panel.style.display = 'none';
    panel.classList.remove('active');
  });

  const targetPanel = document.getElementById(`l2tab-${tabId}`);
  if (targetPanel) {
    targetPanel.style.display = 'block';
    targetPanel.classList.add('active');
  }

  const bottomSec = document.getElementById('level2BottomSection');
  if (bottomSec) bottomSec.style.display = 'block';

  // Chart digambar setelah panel terlihat agar ukurannya tidak 0
  setTimeout(() => renderL2ChartForTab(tabId), 80);

  initLucide();
}

function renderChartUmurAsetL2() {
  const ctx = document.getElementById('canvasL2UmurAset');
  if (!ctx) return;

  const stats = getAssetTypeStats();
  const scope = stats.scope;
  const scopeText = scope.isAggregate ? `${scope.label} (agregat)` : scope.label;
  const age = getScopeAgeBuckets();
  const capUnit = age.capUnit || 'MVA';

  setText('l2UmurTitle', `Sebaran Umur Aset ${stats.name} — ${scope.label}`);
  setText('l2UmurSubtitle', `Distribusi kelompok umur ${stats.name} (${fmtInt(stats.total)} unit) di ${scopeText}`);

  if (chartUmurAsetL2) chartUmurAsetL2.destroy();

  chartUmurAsetL2 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: age.rows.map(r => r.range),
      datasets: [
        {
          label: `${stats.name} — ${scope.label}`,
          data: age.rows.map(r => r.count),
          backgroundColor: ['#10b981', '#10b981', '#f59e0b', '#f97316', '#ef4444'],
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } },
        tooltip: {
          callbacks: {
            label: (item) => {
              const row = age.rows[item.dataIndex];
              return `${fmtInt(row.count)} unit (${fmtPct((row.count / age.total) * 100)}) • ${fmtInt(row.mva)} ${capUnit}`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: '#f1f5f9' },
          beginAtZero: true,
          title: { display: true, text: 'Jumlah Unit' }
        }
      }
    }
  });
}

function clearMainMarkers() {
  mainMarkers.forEach(m => mainMap.removeLayer(m));
  mainMarkers = [];
}

// -------------------------------------------------------------
// LEVEL 3: SETELAH KLIK JENIS ASET (POWER TRANSFORMER)
// -------------------------------------------------------------
function renderLevel3() {
  const stats = getAssetTypeStats();
  const scope = stats.scope;
  const scopeText = scope.isAggregate ? `${scope.label} (agregat)` : scope.label;

  document.getElementById('subHeaderTitle').textContent = `Profil Aset — ${appState.assetType}`;
  document.getElementById('subHeaderDesc').textContent = `Analisis persebaran merk, distribusi Health Index, dan sebaran umur aset untuk ${appState.assetType} di ${scopeText}.`;
  document.getElementById('filterStripLevel1').style.display = 'none';

  document.getElementById('l3Title').textContent = appState.assetType;
  document.getElementById('l3Subtitle').textContent = `Profil Aset — ${appState.assetType} • ${scopeText}`;

  // KPI mengikuti scope aktif
  setText('l3KpiTotal', fmtInt(stats.total));
  setText('l3KpiBrands', fmtInt(stats.brandCount));
  setText('l3KpiAvgHI', fmtNum(stats.avgHI, 2));
  setText('l3KpiHI45Value', fmtInt(stats.hi45Count));
  setText('l3KpiHI45Pct', fmtPct(stats.hi45Pct, 1));
  setText('l3KpiAvgAge', fmtNum(stats.avgAge, 1));

  // Judul tabel & kartu ikut scope
  setText('l3HITableSubtitle', `Tabel analisis kondisi per merk di wilayah ${scopeText}`);
  setText('l3LokasiTitle', `Persebaran ${appState.assetType} per UPT di ${scopeText}`);
  setText('l3ScopeBadge', scope.label);

  // Render Horizontal Bar Chart: Jumlah Aset per Merk
  renderChartJumlahMerk();

  // Render 100% Stacked Bar: Distribusi HI per Merk
  renderStackedBarHI();

  // Tabel HI per merk + rekap UPT
  renderL3HITable();
  renderL3UptTable();

  // Reset tab to default
  switchLevel3Tab('sebaran-merk');
}

function switchLevel3Tab(tabId) {
  document.querySelectorAll('[data-level3-tab]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-level3-tab') === tabId) {
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.level3-tab-panel').forEach(panel => {
    panel.style.display = 'none';
  });

  const targetPanel = document.getElementById(`l3tab-${tabId}`);
  if (targetPanel) {
    targetPanel.style.display = 'block';
  }

  if (tabId === 'sebaran-umur') {
    setTimeout(renderChartUmurAsetMerk, 100);
  }

  initLucide();
}

// Tabel rincian evaluasi Health Index per merk
function renderL3HITable() {
  const tbody = document.getElementById('l3HITableBody');
  if (!tbody) return;

  tbody.innerHTML = getAssetTypeStats().brandsGrouped.map(b => `
    <tr${b.isGroup ? ' class="row-group"' : ''}>
      <td>
        ${b.isGroup
          ? `<strong class="text-brand-600">${b.name}</strong> <span class="pill-count">${b.memberCount} merk</span>`
          : `<strong class="text-brand-600">${b.name}</strong>`}
      </td>
      ${b.hi.map((pct, i) => `<td>${fmtInt(b.hiCounts[i])} unit (${Math.round(pct)}%)</td>`).join('')}
      <td><strong class="font-mono">${fmtNum(b.avgHI, 2)}</strong></td>
      <td>${b.isGroup
        ? `<button class="table-btn-link" onclick="openOtherBrandsModal()">Lihat ${b.memberCount} merk &rarr;</button>`
        : `<button class="table-btn-link" onclick="navigateTo(4, { brand: '${b.name}' })">Detail ${b.name} &rarr;</button>`}</td>
    </tr>
  `).join('');
}

// Rekap persebaran per Unit Pelaksana Transmisi
function renderL3UptTable() {
  const tbody = document.getElementById('l3UptTableBody');
  if (!tbody) return;

  const rows = getScopeStats().upt;
  tbody.innerHTML = rows.map(u => {
    const cls = u.ratio >= 22 ? 'priority' : (u.ratio >= 21 ? 'attention' : 'good');
    return `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${fmtInt(u.count)} unit</td>
        <td>${fmtInt(u.mva)} MVA</td>
        <td>${fmtInt(u.hi45)} unit</td>
        <td><span class="status-badge ${cls}">${fmtNum(u.ratio, 1)}%</span></td>
      </tr>
    `;
  }).join('');
}

function renderChartJumlahMerk() {
  const container = document.getElementById('brandBarContainer');
  if (!container) return;

  const brands = getAssetTypeStats().brandsGrouped;
  const maxCount = Math.max(...brands.map(b => b.count));

  let html = '';
  brands.forEach(b => {
    const widthPct = Math.round((b.count / maxCount) * 100);
    html += `
      <div class="brand-bar-item${b.isGroup ? ' is-group' : ''}"
           onclick="${b.isGroup ? 'openOtherBrandsModal()' : `navigateTo(4, { brand: '${b.name}' })`}"
           title="${b.isGroup ? `Klik untuk lihat daftar ${b.memberCount} merk dalam kategori Lainnya` : `Klik untuk lihat detail merk ${b.name}`}">
        <div class="brand-bar-name">${b.name}${b.isGroup ? ` <span class="brand-bar-badge">${b.memberCount}</span>` : ''}</div>
        <div class="brand-bar-track">
          <div class="brand-bar-fill" style="width: ${widthPct}%;"></div>
        </div>
        <div class="brand-bar-metric">
          ${fmtInt(b.count)} <span style="font-size:11px;color:var(--text-muted);font-weight:normal;">(${fmtNum(b.pct, 1)}%)</span>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function renderStackedBarHI() {
  const container = document.getElementById('stackedHIContainer');
  if (!container) return;

  const brands = getAssetTypeStats().brandsGrouped;
  let html = '';

  brands.forEach(b => {
    const r = b.hi.map(p => Math.round(p));
    html += `
      <div class="stacked-bar-row${b.isGroup ? ' is-group' : ''}" ${b.isGroup ? 'onclick="openOtherBrandsModal()" title="Klik untuk lihat 19 merk"' : ''}>
        <div class="stacked-bar-name">${b.name}${b.isGroup ? ` <span class="brand-bar-badge">${b.memberCount}</span>` : ''}</div>
        <div class="stacked-track">
          <div class="stacked-segment" style="width: ${r[0]}%; background: var(--hi-1);" data-tooltip="HI 1: ${r[0]}%">${r[0]}%</div>
          <div class="stacked-segment" style="width: ${r[1]}%; background: var(--hi-2);" data-tooltip="HI 2: ${r[1]}%">${r[1]}%</div>
          <div class="stacked-segment" style="width: ${r[2]}%; background: var(--hi-3);" data-tooltip="HI 3: ${r[2]}%">${r[2]}%</div>
          <div class="stacked-segment" style="width: ${r[3]}%; background: var(--hi-4);" data-tooltip="HI 4: ${r[3]}%">${r[3]}%</div>
          <div class="stacked-segment" style="width: ${r[4]}%; background: var(--hi-5);" data-tooltip="HI 5: ${r[4]}%">${r[4]}%</div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function renderChartUmurAsetMerk() {
  const ctx = document.getElementById('canvasUmurMerk');
  if (!ctx) return;

  if (chartUmurAsetL3) chartUmurAsetL3.destroy();

  const palette = ['#0056b3', '#00a3e0', '#f59e0b', '#10b981', '#f97316', '#64748b'];
  const datasets = getAssetTypeStats().brandsGrouped.map((b, i) => ({
    label: b.isGroup ? `${b.name} (${b.memberCount} merk)` : b.name,
    data: b.age.map(pct => Math.round((pct / 100) * b.count)),
    backgroundColor: palette[i % palette.length]
  }));

  chartUmurAsetL3 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['0–5 thn', '6–10 thn', '11–20 thn', '21–30 thn', '>30 thn'],
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } },
        tooltip: { padding: 10 }
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#f1f5f9' }, title: { display: true, text: 'Jumlah Unit' } }
      }
    }
  });
}

// -------------------------------------------------------------
// LEVEL 4: SETELAH KLIK MERK / PABRIKAN (ABB)
// -------------------------------------------------------------
function renderLevel4() {
  const stats = getBrandStats(appState.brand);
  const scope = stats.scope;
  const scopeText = scope.isAggregate ? `${scope.label} (agregat)` : scope.label;

  document.getElementById('subHeaderTitle').textContent = `Profil Merk — ${stats.brand}`;
  document.getElementById('subHeaderDesc').textContent = `${stats.assetType} — ${scopeText}`;
  document.getElementById('filterStripLevel1').style.display = 'none';

  document.getElementById('l4BrandBadge').textContent = stats.brand;
  document.getElementById('l4Title').textContent = `Profil Merk — ${stats.brand}`;
  setText('l4Subtitle', `${stats.assetType} — ${scopeText}`);

  // 7 KPI objektif mengikuti scope + merk aktif
  setText('l4KpiTotal', fmtInt(stats.count));
  setText('l4KpiTotalPct', fmtPct(stats.pctOfType, 1));
  setText('l4KpiAvgHI', fmtNum(stats.avgHI, 2));
  setText('l4KpiHI12Pct', `${stats.hi12Pct}%`);
  setText('l4KpiHI12Count', `${fmtInt(stats.hi12Count)} unit`);
  setText('l4KpiHI3Pct', `${stats.hi3Pct}%`);
  setText('l4KpiHI3Count', `${fmtInt(stats.hi3Count)} unit`);
  setText('l4KpiHI45Pct', `${stats.hi45Pct}%`);
  setText('l4KpiHI45Count', `${fmtInt(stats.hi45Count)} unit`);
  setText('l4KpiAvgAge', fmtNum(stats.avgAge, 1));
  setText('l4KpiOver20', fmtInt(stats.over20));
  setText('l4KpiOver20Pct', fmtPct(stats.over20Pct, 0));

  // Label scope & judul kartu
  setText('l4ScopeBadge', scope.label);
  setText('l4DonutSubtitle', `Komposisi kondisi kesehatan trafo ${stats.brand}`);
  setText('l4MiniMapSubtitle', `Peta GIS Gardu Induk Trafo ${stats.brand} (${scope.label})`);
  setText('l4ExpandedMapTitle', `Peta Lengkap Sebaran Gardu Induk Trafo ${stats.brand} (${scope.label})`);
  setText('l4AgeTitle', `Analisis Mendalam Umur Operasi Trafo ${stats.brand}`);
  setText('l4TrenSubtitle', `Perkembangan rata-rata kondisi degradasi aset ${stats.brand} periode 2021 s.d 2026`);
  setText('l4ListHeading', `Ingin melihat rincian setiap unit trafo ${stats.brand}?`);
  setText('l4ListDesc', `Jelajahi daftar ${fmtInt(stats.count)} aset trafo lengkap dengan lokasi GI, tegangan operasi, status, dan riwayat pemeliharaan.`);
  setText('l4ListBtn', `Buka Daftar Aset ${stats.brand}`);
  setText('compareModalTitle', `Perbandingan Merk — ${stats.assetType} di ${scopeText}`);

  // Switch to Ringkasan tab
  switchLevel4Tab('ringkasan');
}

function switchLevel4Tab(tabId) {
  document.querySelectorAll('[data-level4-tab]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-level4-tab') === tabId) {
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.level4-tab-panel').forEach(panel => {
    panel.style.display = 'none';
  });

  const targetPanel = document.getElementById(`l4tab-${tabId}`);
  if (targetPanel) {
    targetPanel.style.display = 'block';
  }

  if (tabId === 'ringkasan') {
    setTimeout(() => {
      renderDonutChartHI();
      renderBrandAgeChart();
      initBrandMiniMap();
      renderChartTrenHI();
    }, 50);
  } else if (tabId === 'sebaran-lokasi') {
    setTimeout(initBrandMiniMapExpanded, 100);
  } else if (tabId === 'tren-hi') {
    setTimeout(renderChartTrenHIDedicated, 100);
  }

  initLucide();
}

function renderDonutChartHI() {
  const ctx = document.getElementById('canvasDonutHI');
  if (!ctx) return;

  if (chartDonutHI) chartDonutHI.destroy();

  const stats = getBrandStats(appState.brand);
  const data = stats.hiBreakdown;

  chartDonutHI = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: data.map(d => d.color),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(item) {
              const count = item.raw;
              const pct = stats.count ? Math.round((count / stats.count) * 100) : 0;
              return ` ${item.label}: ${count} unit (${pct}%)`;
            }
          }
        }
      }
    }
  });

  setText('donutCenterVal', fmtInt(stats.count));

  const legendBox = document.getElementById('donutLegendList');
  if (legendBox) {
    legendBox.innerHTML = data.map(d => `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:3px 0;">
        <span style="display:flex; align-items:center; gap:6px;">
          <span style="width:8px; height:8px; border-radius:50%; background:${d.color}; display:inline-block;"></span>
          ${d.label.split('—')[0].trim()}
        </span>
        <span class="font-mono" style="font-weight:700;">${d.pct}% <span style="font-weight:normal;color:var(--text-muted);">(${d.count} unit)</span></span>
      </div>
    `).join('');
  }
}

function renderBrandAgeChart() {
  const ctx = document.getElementById('canvasBrandAge');
  if (!ctx) return;

  if (chartBrandAge) chartBrandAge.destroy();

  const data = getBrandStats(appState.brand).ageBuckets;

  chartBrandAge = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.range),
      datasets: [{
        label: 'Persentase Aset',
        data: data.map(d => d.pct),
        backgroundColor: '#0284c7',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => ` ${item.raw}% (${data[item.dataIndex].count} unit)`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { callback: v => v + '%' }
        }
      }
    }
  });
}

function initBrandMiniMap() {
  const mapDiv = document.getElementById('miniMapJabar');
  if (!mapDiv) return;

  if (miniMap) {
    miniMap.remove();
    miniMap = null;
  }

  const scope = getScopeStats();

  miniMap = L.map('miniMapJabar', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([scope.center.lat, scope.center.lng], scope.center.zoom);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(miniMap);

  getScopeGisLocations().forEach(loc => {
    const circle = L.circleMarker([loc.lat, loc.lng], {
      radius: 7,
      fillColor: hiColor(loc.hi),
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(miniMap);

    circle.bindPopup(`
      <div style="font-family: var(--font-main); font-size:12px; padding: 4px;">
        <strong style="color:var(--brand-primary);">${loc.name}</strong><br/>
        Asset ID: <span class="font-mono font-bold">${loc.id}</span><br/>
        Status: <span style="color:${hiColor(loc.hi)};font-weight:700;">${loc.label}</span><br/>
        <button onclick="navigateTo(6, { assetId: '${loc.id}' })" style="margin-top:6px; padding:3px 8px; background:var(--brand-primary); color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;">Lihat Detail</button>
      </div>
    `);
  });
}

function initBrandMiniMapExpanded() {
  const mapDiv = document.getElementById('miniMapJabarExpanded');
  if (!mapDiv) return;

  if (miniMapExpanded) {
    miniMapExpanded.remove();
    miniMapExpanded = null;
  }

  const scope = getScopeStats();

  miniMapExpanded = L.map('miniMapJabarExpanded', {
    zoomControl: true
  }).setView([scope.center.lat, scope.center.lng], scope.center.zoom);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(miniMapExpanded);

  getScopeGisLocations().forEach(loc => {
    const circle = L.circleMarker([loc.lat, loc.lng], {
      radius: 9,
      fillColor: hiColor(loc.hi),
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(miniMapExpanded);

    circle.bindPopup(`
      <div style="font-family: var(--font-main); font-size:13px; padding: 4px;">
        <strong style="color:var(--brand-primary); font-size:14px;">${loc.name}</strong><br/>
        Asset ID: <span class="font-mono font-bold">${loc.id}</span><br/>
        Status: <span style="color:${hiColor(loc.hi)};font-weight:700;">${loc.label}</span><br/>
        <button onclick="navigateTo(6, { assetId: '${loc.id}' })" style="margin-top:8px; padding:4px 10px; background:var(--brand-primary); color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px;">Lihat Detail Aset &rarr;</button>
      </div>
    `);
  });
}

function renderChartTrenHI() {
  const ctx = document.getElementById('canvasTrenHI');
  if (!ctx) return;

  if (chartTrenHI) chartTrenHI.destroy();

  const data = getBrandStats(appState.brand).historyTren;

  chartTrenHI = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.year),
      datasets: [{
        label: 'Rata-rata Health Index',
        data: data.map(d => d.hi),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#ea580c',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 1,
          max: 5,
          grid: { color: '#f1f5f9' },
          title: { display: true, text: 'Health Index (1-5)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderChartTrenHIDedicated() {
  const ctx = document.getElementById('canvasTrenHIDedicated');
  if (!ctx) return;

  if (chartTrenHIDedicated) chartTrenHIDedicated.destroy();

  const data = getBrandStats(appState.brand).historyTren;

  chartTrenHIDedicated = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.year),
      datasets: [{
        label: `Rata-rata Health Index ${appState.brand}`,
        data: data.map(d => d.hi),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.12)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#ea580c',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          min: 1,
          max: 5,
          grid: { color: '#f1f5f9' },
          title: { display: true, text: 'Health Index (1-5)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// -------------------------------------------------------------
// LEVEL 5: DAFTAR ASET
// -------------------------------------------------------------
function renderLevel5() {
  const scope = getScopeStats();
  const scopeText = scope.isAggregate ? `${scope.label} (agregat)` : scope.label;

  document.getElementById('subHeaderTitle').textContent = `Daftar Aset — ${appState.brand}`;
  document.getElementById('subHeaderDesc').textContent = `Daftar unit aset ${appState.assetType} ${appState.brand} di wilayah ${scopeText}.`;
  document.getElementById('filterStripLevel1').style.display = 'none';

  document.getElementById('l5Title').textContent = `Daftar Aset — ${appState.brand}`;
  setText('l5Subtitle', `${appState.assetType} ${appState.brand} — ${scopeText}`);

  filterAndRenderAssetTable();
}

function filterAndRenderAssetTable() {
  const tbody = document.getElementById('assetTableBody');
  if (!tbody) return;

  const assets = getScopeAssets();
  const query = (appState.filters.searchQuery || '').toLowerCase();
  const filtered = assets.filter(a => {
    return (
      a.id.toLowerCase().includes(query) ||
      a.name.toLowerCase().includes(query) ||
      a.gi.toLowerCase().includes(query) ||
      (a.bay && a.bay.toLowerCase().includes(query)) ||
      a.voltage.toLowerCase().includes(query) ||
      a.status.toLowerCase().includes(query)
    );
  });

  document.getElementById('assetTableCount').textContent = `Menampilkan ${filtered.length} dari ${assets.length} aset`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center" style="padding: 30px; color: var(--text-muted);">Tidak ditemukan aset sesuai kata kunci.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((a, idx) => {
    let hiBadgeClass = `hi-${a.hi}`;
    let statusClass = 'good';
    if (a.status === 'Perlu Perhatian') statusClass = 'attention';
    if (a.status === 'Prioritas') statusClass = 'priority';

    return `
      <tr onclick="navigateTo(6, { assetId: '${a.id}' })">
        <td style="color:var(--text-muted);">${idx + 1}</td>
        <td><strong class="font-mono text-brand-600">${a.id}</strong></td>
        <td><strong>${a.name}</strong></td>
        <td>${a.gi}</td>
        <td><span class="badge-bay">${a.bay || 'Bay Trafo 1'}</span></td>
        <td>${a.voltage}</td>
        <td>${a.year}</td>
        <td>${a.age} thn</td>
        <td>
          <span class="badge-hi ${hiBadgeClass}">
            <span class="hi-dot hi-dot-${a.hi}"></span>
            HI ${a.hi}
          </span>
        </td>
        <td><span class="status-badge ${statusClass}">${a.status}</span></td>
        <td>
          <span class="table-btn-link" onclick="event.stopPropagation(); navigateTo(6, { assetId: '${a.id}' })">
            Lihat Detail <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
          </span>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
}

function openAssetFilterInfo() {
  alert(`Filter diterapkan: Tegangan 150 kV, Wilayah ${getScopeLabel() || 'Nasional (Seluruh Unit Induk)'}`);
}

function exportAssetListCSV() {
  const assets = getScopeAssets();
  let csv = 'No,ID Asset,Nama Asset,GI,Bay,Tegangan,Merk,Tahun Operasi,Umur,Health Index,Status\n';
  assets.forEach((a, idx) => {
    csv += `${idx + 1},"${a.id}","${a.name}","${a.gi}","${a.bay || 'Bay Trafo 1'}","${a.voltage}","${appState.brand}",${a.year},${a.age},HI ${a.hi},"${a.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Daftar_Aset_${appState.brand}_${getScopeLabel() || 'Nasional'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// LEVEL 6: DETAIL ASSET (TRF-ABB-001)
// -------------------------------------------------------------
function renderLevel6() {
  document.getElementById('subHeaderTitle').textContent = `Detail Asset — ${appState.selectedAssetId}`;
  document.getElementById('subHeaderDesc').textContent = 'Informasi detail aset, histori Health Index, hasil inspeksi, dan rekomendasi tindakan.';
  document.getElementById('filterStripLevel1').style.display = 'none';

  const assets = getScopeAssets();
  const asset = assets.find(a => a.id === appState.selectedAssetId) || assets[0];

  // Populate Specs
  document.getElementById('detailAssetId').textContent = asset.id;
  document.getElementById('detailAssetName').textContent = asset.name;
  document.getElementById('detailAssetMerk').textContent = appState.brand;
  document.getElementById('detailAssetType').textContent = appState.assetType;
  document.getElementById('detailAssetVoltage').textContent = asset.voltage;
  document.getElementById('detailAssetGI').textContent = asset.gi;
  if (document.getElementById('detailAssetBay')) {
    document.getElementById('detailAssetBay').textContent = asset.bay || 'Bay Trafo 1';
  }
  document.getElementById('detailAssetUnit').textContent = asset.unit || 'UPT Regional';
  document.getElementById('detailAssetYear').textContent = asset.year;
  document.getElementById('detailAssetAge').textContent = `${asset.age} tahun`;
  document.getElementById('detailAssetStatus').textContent = asset.status;

  const hiBadge = document.getElementById('detailAssetHI');
  hiBadge.className = `badge-hi hi-${asset.hi}`;
  hiBadge.innerHTML = `<span class="hi-dot hi-dot-${asset.hi}"></span> HI ${asset.hi} (${asset.status})`;

  // Render Riwayat Health Index Line Chart
  renderChartDetailTrenHI(asset);
}

function renderChartDetailTrenHI(asset) {
  const ctx = document.getElementById('canvasDetailTrenHI');
  if (!ctx) return;

  if (chartDetailTrenHI) chartDetailTrenHI.destroy();

  const points = [
    { year: '2021', val: 2.1 },
    { year: '2022', val: 2.4 },
    { year: '2023', val: 2.8 },
    { year: '2024', val: 3.4 },
    { year: '2025', val: 3.9 },
    { year: '2026', val: 4.1 }
  ];

  chartDetailTrenHI = new Chart(ctx, {
    type: 'line',
    data: {
      labels: points.map(p => p.year),
      datasets: [{
        label: 'Riwayat Health Index',
        data: points.map(p => p.val),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderWidth: 3,
        tension: 0.25,
        fill: true,
        pointBackgroundColor: '#dc2626',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: item => ` HI: ${item.raw} (Tahun ${item.label})`
          }
        }
      },
      scales: {
        y: {
          min: 1,
          max: 5,
          grid: { color: '#f1f5f9' },
          title: { display: true, text: 'Health Index' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// -------------------------------------------------------------
// LEAFLET MAP INITIALIZATION (CARTODB LIGHT TILES)
// -------------------------------------------------------------
function initMainMap() {
  const mapContainer = document.getElementById('mainLeafletMap');
  if (!mapContainer) return;

  mainMap = L.map('mainLeafletMap', {
    zoomControl: false,
    minZoom: 4,
    maxZoom: 18
  }).setView([-1.2, 118.0], 5);

  // 100% Free OpenStreetMap as default
  const osmStandard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
  }).addTo(mainMap);

  // Alternative Free Tiles: ESRI World Street & Carto Voyager
  const esriStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
  });

  const cartoVoyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  });

  const baseLayers = {
    "OpenStreetMap (Gratis / Default)": osmStandard,
    "ESRI Street Map (Gratis)": esriStreet,
    "CARTO Voyager (Gratis)": cartoVoyager
  };

  L.control.layers(baseLayers, null, { position: 'topright' }).addTo(mainMap);
  L.control.zoom({ position: 'bottomright' }).addTo(mainMap);
}

// Global functions for inline HTML calls
window.navigateTo = navigateTo;
window.selectNationalRegion = selectNationalRegion;
window.selectProvince = selectProvince;
window.switchLevel2Tab = switchLevel2Tab;
window.toggleMapSize = toggleMapSize;
window.switchLevel3Tab = switchLevel3Tab;
window.switchLevel4Tab = switchLevel4Tab;
window.openBrandComparisonModal = openBrandComparisonModal;
window.closeBrandComparisonModal = closeBrandComparisonModal;
window.exportAssetListCSV = exportAssetListCSV;
window.renderComparisonChart = renderComparisonChart;
window.setJawaRegionContextCard = setJawaRegionContextCard;
window.updateSebaranAsetTab = updateSebaranAsetTab;
window.updateSebaranAsetTabByName = updateSebaranAsetTabByName;
window.getScopeLabel = getScopeLabel;
window.clearGlobalSearch = clearGlobalSearch;
window.selectSearchResult = selectSearchResult;

// -------------------------------------------------------------
// FILTER & SEARCH LISTENERS
// -------------------------------------------------------------
// -------------------------------------------------------------
// PENCARIAN HALAMAN DEPAN (LEVEL 1): wilayah, sistem, dan GI
// -------------------------------------------------------------
const SEARCH_INDEX = (() => {
  const regions = nationalStats.regions.map(r => ({
    kind: 'region',
    name: r.name,
    subtitle: 'Wilayah',
    alias: r.provinces.map(p => p.name).join(' '),
    count: r.countLabel,
    lat: r.lat,
    lng: r.lng
  }));

  const provinces = nationalStats.provinces.map(p => ({
    kind: 'province',
    name: p.name,
    subtitle: `Provinsi di ${p.region}`,
    alias: p.alias,
    count: fmtInt(p.count),
    region: p.region,
    drillable: Boolean(findJawaProvince(p.name)),
    lat: p.lat,
    lng: p.lng
  }));

  // Unit Induk, UPT, ULTG, dan Gardu Induk dari hierarchy organisasi
  const orgAliases = {
    'UIT JBB': 'DKI Jakarta Banten Jawa Bagian Barat JBB Cawang Pulogadung Gandul Cilegon',
    'UIT JBT': 'Jawa Bagian Tengah Jawa Barat Jawa Tengah DIY Yogyakarta JBT Bandung Semarang Surakarta Purwokerto',
    'UIT JBM': 'Jawa Bagian Timur Bali JBM Jawa Timur Surabaya Malang Madiun Probolinggo Bali',
    'UIP3B SUM': 'Sumatera Sumatra UIP3B Sumatera Aceh Medan Padang Pekanbaru Riau Jambi Palembang Bengkulu Lampung SUM',
    'UIP3B KAL': 'Kalimantan UIP3B Kalimantan Pontianak Palangka Raya Banjarmasin Balikpapan Samarinda KAL',
    'UIP3B SUL': 'Sulawesi UIP3B Sulawesi Manado Palu Makassar Kendari Mamuju SUL'
  };

  const orgEntries = ORG_HIERARCHY.flatMap(ui => {
    const extraAlias = orgAliases[ui.code] || '';
    const out = [{
      kind: 'ui',
      name: ui.code,
      subtitle: ui.name,
      alias: `${ui.alias} ${extraAlias}`,
      lat: ui.upts.length ? avgLat(ui.upts.flatMap(u => u.ultgs.flatMap(g => g.gis))) : -2,
      lng: ui.upts.length ? avgLng(ui.upts.flatMap(u => u.ultgs.flatMap(g => g.gis))) : 118
    }];

    ui.upts.forEach(upt => {
      out.push({
        kind: 'upt',
        name: upt.name,
        subtitle: `Unit Pelaksana • ${ui.code}`,
        alias: `${upt.name.replace(/^UPT\s*/, '')} ${ui.code} ${upt.province || ''}`,
        province: upt.province,
        unitInduk: ui.code,
        lat: upt.lat,
        lng: upt.lng,
        count: upt.ultgs.reduce((s, u) => s + u.gis.length, 0)
      });

      upt.ultgs.forEach(ultg => {
        const gis = ultg.gis;
        out.push({
          kind: 'ultg',
          name: ultg.name,
          subtitle: `ULTG • ${upt.name} • ${ui.code}`,
          alias: `${ultg.name.replace(/^ULTG\s*/, '')} ${upt.name.replace(/^UPT\s*/, '')}`,
          province: upt.province,
          unitInduk: ui.code,
          upt: upt.name,
          count: gis.length
        });

        gis.forEach(g => {
          out.push({
            kind: 'gi',
            name: g.name,
            subtitle: `GI di ${ultg.name} • ${upt.name}`,
            alias: `${g.name.replace(/^GI\s*/, '')} ${upt.name.replace(/^UPT\s*/, '')}`,
            province: g.province,
            unitInduk: ui.code,
            upt: upt.name,
            ultg: ultg.name,
            lat: g.lat,
            lng: g.lng,
            count: g.bays ? `${g.bays.length} Bay` : undefined
          });

          if (g.bays) {
            g.bays.forEach(bay => {
              out.push({
                kind: 'bay',
                name: bay.name,
                subtitle: `Bay di ${g.name} • ${ultg.name}`,
                alias: `${bay.name} ${g.name} ${bay.code || ''}`,
                province: g.province,
                unitInduk: ui.code,
                upt: upt.name,
                ultg: ultg.name,
                gi: g.name,
                lat: g.lat,
                lng: g.lng
              });
            });
          }
        });
      });
    });

    return out;
  });

  const brands = BRAND_CATALOG.map(b => ({
    kind: 'brand',
    name: b.name,
    subtitle: 'Merk Power Transformer',
    brand: b.name
  }));

  return [...orgEntries, ...provinces, ...regions, ...brands];
})();

let searchResults = [];
let searchActiveIndex = -1;

function normalizeSearch(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function runGlobalSearch(rawQuery) {
  const query = normalizeSearch(rawQuery);
  const resultsBox = document.getElementById('globalSearchResults');
  const clearBtn = document.getElementById('globalSearchClear');
  if (clearBtn) clearBtn.hidden = !rawQuery;

  highlightMapMatches(query);

  if (!query) {
    searchResults = [];
    searchActiveIndex = -1;
    if (resultsBox) {
      resultsBox.hidden = true;
      resultsBox.innerHTML = '';
    }
    return;
  }

  const terms = query.split(' ').filter(Boolean);
  searchResults = SEARCH_INDEX
    .filter(item => {
      const haystack = normalizeSearch(`${item.name} ${item.subtitle} ${item.alias || ''} ${item.province || ''}`);
      return terms.every(term => haystack.includes(term));
    })
    .sort((a, b) => {
      const aName = normalizeSearch(a.name);
      const bName = normalizeSearch(b.name);
      const aExact = aName === query ? 0 : 1;
      const bExact = bName === query ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;

      const aStarts = aName.startsWith(query) ? 0 : 1;
      const bStarts = bName.startsWith(query) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;

      const aInName = aName.includes(query) ? 0 : 1;
      const bInName = bName.includes(query) ? 0 : 1;
      if (aInName !== bInName) return aInName - bInName;

      const kindOrder = { ui: 1, upt: 2, ultg: 3, gi: 4, bay: 5, province: 6, region: 7, brand: 8 };
      const aKind = kindOrder[a.kind] || 99;
      const bKind = kindOrder[b.kind] || 99;
      if (aKind !== bKind) return aKind - bKind;

      return a.name.localeCompare(b.name);
    })
    .slice(0, 10);

  searchActiveIndex = searchResults.length ? 0 : -1;
  renderSearchResults();
}

function renderSearchResults() {
  const resultsBox = document.getElementById('globalSearchResults');
  if (!resultsBox) return;

  if (!searchResults.length) {
    resultsBox.innerHTML = `    <div class="search-empty">Tidak ada Unit Induk, UPT, ULTG, GI, provinsi, wilayah, atau merk yang cocok.</div>`;
    resultsBox.hidden = false;
    return;
  }

  const tally = kind => searchResults.filter(r => r.kind === kind).length;
  const provs = tally('province');
  const regions = tally('region');
  const brands = tally('brand');
  const gis = tally('gi');
  const bays = tally('bay');
  const upts = tally('upt');
  const orgs = tally('ui') + tally('ultg');
  const parts = [
    provs ? `${provs} provinsi` : '',
    regions ? `${regions} wilayah` : '',
    orgs ? `${orgs} unit` : '',
    brands ? `${brands} merk` : '',
    gis ? `${gis} GI` : '',
    bays ? `${bays} Bay` : '',
    upts ? `${upts} Unit Pelaksana` : ''
  ].filter(Boolean);

  const ICONS = {
    province: 'map-pin', region: 'map', brand: 'tag',
    ui: 'building', ultg: 'layers', gi: 'zap', upt: 'building-2',
    bay: 'git-commit'
  };

  resultsBox.innerHTML = `
    <div class="search-results-head">${searchResults.length} hasil${parts.length ? ` • ${parts.join(' • ')}` : ''}</div>
    ${searchResults.map((item, i) => `
      <button type="button" class="search-result-item${i === searchActiveIndex ? ' active' : ''}"
              data-index="${i}"
              onclick="selectSearchResult(${i})">
        <span class="search-result-icon"><i data-lucide="${ICONS[item.kind]}"></i></span>
        <span class="search-result-text">
          <span class="search-result-title">${item.name}</span>
          <span class="search-result-sub">${item.subtitle}</span>
        </span>
        ${item.count ? `<span class="search-result-count">${item.count}</span>` : ''}
        ${item.kind === 'province' && !item.drillable ? '<span class="search-result-flag">info</span>' : ''}
      </button>
    `).join('')}
  `;
  resultsBox.hidden = false;
  initLucide();
}

function selectSearchResult(target) {
  const item = typeof target === 'number' ? searchResults[target] : target;
  if (!item) return;

  const input = document.getElementById('globalSearchInput');
  if (input) input.value = item.name;
  const clearBtn = document.getElementById('globalSearchClear');
  if (clearBtn) clearBtn.hidden = false;
  hideSearchResults();

  // Unit Induk / Unit Pelaksana / ULTG / GI / Bay: isi filter berjenjang lalu fokuskan peta ke sana.
  if (['ui', 'upt', 'ultg', 'gi', 'bay'].includes(item.kind)) {
    applyOrgSelectionFromSearch(item);
    return;
  }

  if (item.kind === 'region') {
    navigateTo(2, { region: item.name });
  } else if (item.kind === 'province') {
    openProvinceFromFrontPage(item.name);
  } else if (item.kind === 'brand') {
    const bSelect = document.getElementById('filterMerk');
    if (bSelect) {
      bSelect.value = item.name;
      bSelect.dispatchEvent(new Event('change'));
    }
  }
}

// Menyalin pilihan dari hasil pencarian ke filter berjenjang.
function applyOrgSelectionFromSearch(item) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && [...el.options].some(o => o.value === value)) el.value = value;
  };

  if (item.kind === 'ui') {
    selectUnitIndukFromMap(item.name);
    return;
  }

  if (item.kind === 'upt') {
    set('filterUnitInduk', item.unitInduk || 'Semua');
    cascadeUnitInduk();
    set('filterUPT', item.name);
    cascadeUpt();
    return;
  }

  if (item.kind === 'ultg') {
    set('filterUnitInduk', item.unitInduk || 'Semua');
    cascadeUnitInduk();
    set('filterUPT', item.upt || 'Semua');
    cascadeUpt();
    set('filterULTG', item.name);
    cascadeUltg();
    return;
  }

  if (item.kind === 'gi') {
    set('filterUnitInduk', item.unitInduk || 'Semua');
    cascadeUnitInduk();
    set('filterUPT', item.upt || 'Semua');
    cascadeUpt();
    set('filterULTG', item.ultg || 'Semua');
    cascadeUltg();
    set('filterGI', item.name);
    cascadeGi();
    return;
  }

  if (item.kind === 'bay') {
    set('filterUnitInduk', item.unitInduk || 'Semua');
    cascadeUnitInduk();
    set('filterUPT', item.upt || 'Semua');
    cascadeUpt();
    set('filterULTG', item.ultg || 'Semua');
    cascadeUltg();
    set('filterGI', item.gi || 'Semua');
    cascadeGi();
    set('filterBay', item.name);
    cascadeBay();
    return;
  }
}

function clearGlobalSearch() {
  const input = document.getElementById('globalSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('globalSearchClear');
  if (clearBtn) clearBtn.hidden = true;
  appState.filters.searchQuery = '';
  runGlobalSearch('');
  hideSearchResults();
  highlightMapMatches('');
  resetOrgFilter();
}

function hideSearchResults() {
  const resultsBox = document.getElementById('globalSearchResults');
  if (resultsBox) resultsBox.hidden = true;
}

// Redupkan cluster/marker yang tidak cocok, tandai yang cocok agar mudah dilihat
function highlightMapMatches(query) {
  const terms = query ? query.split(' ').filter(Boolean) : [];
  document.querySelectorAll('.uit-large-marker-wrap, .upt-map-marker-wrap, .custom-cluster-marker').forEach(el => {
    const label = normalizeSearch(el.dataset.searchLabel || el.textContent || '');
    const isMatch = !terms.length || terms.every(term => label.includes(term));
    el.classList.toggle('is-dimmed', Boolean(terms.length) && !isMatch);
    el.classList.toggle('is-matched', Boolean(terms.length) && isMatch);
  });
}

function moveSearchHighlight(step) {
  if (!searchResults.length) return;
  searchActiveIndex = (searchActiveIndex + step + searchResults.length) % searchResults.length;
  renderSearchResults();
  const active = document.querySelector('.search-result-item.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

// -------------------------------------------------------------
// FILTER BERJENJANG: Unit Induk > UPT > ULTG > Gardu Induk
// -------------------------------------------------------------
// Aturan: anak hanya bisa dipilih setelah induknya dipilih. Mengubah selections
// di level atas otomatis mereset level di bawahnya.
function setSelectOptions(select, options, allLabel) {
  if (!select) return;
  select.innerHTML = [
    `<option value="Semua">${allLabel}</option>`,
    ...options.map(v => `<option value="${v}">${v}</option>`)
  ].join('');
}

function enableSelect(select, enabled, hintId, readyText, waitingText) {
  if (!select) return;
  select.disabled = !enabled;
  select.classList.toggle('is-disabled', !enabled);
  const hint = hintId ? document.getElementById(hintId) : null;
  if (hint) {
    if (enabled) {
      hint.textContent = '';
      hint.style.display = 'none';
    } else {
      hint.textContent = waitingText;
      hint.style.display = 'inline';
    }
  }
}

function cascadeUnitInduk() {
  const uiSelect = document.getElementById('filterUnitInduk');
  const code = uiSelect ? uiSelect.value : 'Semua';
  const ui = code === 'Semua' ? null : findUnitInduk(code);

  setSelectOptions(
    document.getElementById('filterUPT'),
    ui ? ui.upts.map(u => u.name) : [],
    ui ? 'Semua Unit Pelaksana' : 'Pilih Unit Induk dulu'
  );
  enableSelect(
    document.getElementById('filterUPT'), Boolean(ui),
    'hintUPT', 'Unit Pelaksana', '(pilih Unit Induk dulu)'
  );

  cascadeUpt();
}

function cascadeUpt() {
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptSelect = document.getElementById('filterUPT');
  const uptName = uptSelect?.value || 'Semua';
  const upt = uptName === 'Semua' ? null : findUptByName(uptName, uiCode === 'Semua' ? null : uiCode);

  // Bila nilai UPT tidak lagi ada di daftar induk yang dipilih, kembalikan ke "Semua"
  if (uptName !== 'Semua' && !upt && uptSelect) {
    uptSelect.value = 'Semua';
    cascadeUpt();
    return;
  }

  setSelectOptions(
    document.getElementById('filterULTG'),
    upt ? upt.ultgs.map(u => u.name) : [],
    upt ? 'Semua ULTG' : 'Pilih Unit Pelaksana dulu'
  );
  enableSelect(
    document.getElementById('filterULTG'), Boolean(upt),
    'hintULTG', 'ULTG', '(pilih Unit Pelaksana dulu)'
  );

  cascadeUltg();
}

function cascadeUltg() {
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const ultgName = document.getElementById('filterULTG')?.value || 'Semua';

  const upt = uptName === 'Semua' ? null : findUptByName(uptName, uiCode === 'Semua' ? null : uiCode);
  const ultg = upt && ultgName !== 'Semua' ? upt.ultgs.find(u => u.name === ultgName) : null;

  // Bila nilai ULTG tidak lagi ada di daftar UPT, kembalikan ke "Semua"
  if (ultgName !== 'Semua' && !ultg && document.getElementById('filterULTG')) {
    document.getElementById('filterULTG').value = 'Semua';
    cascadeUltg();
    return;
  }

  setSelectOptions(
    document.getElementById('filterGI'),
    ultg ? ultg.gis.map(g => g.name) : [],
    ultg ? 'Semua GI' : 'Pilih ULTG dulu'
  );
  enableSelect(
    document.getElementById('filterGI'), Boolean(ultg),
    'hintGI', 'GI', '(pilih ULTG dulu)'
  );

  cascadeGi();
}

function cascadeGi() {
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const ultgName = document.getElementById('filterULTG')?.value || 'Semua';
  const giName = document.getElementById('filterGI')?.value || 'Semua';

  const upt = uptName === 'Semua' ? null : findUptByName(uptName, uiCode === 'Semua' ? null : uiCode);
  const ultg = upt && ultgName !== 'Semua' ? upt.ultgs.find(u => u.name === ultgName) : null;
  const gi = ultg && giName !== 'Semua' ? ultg.gis.find(g => g.name === giName) : null;

  // Bila nilai GI tidak lagi ada di daftar ULTG, kembalikan ke "Semua"
  if (giName !== 'Semua' && !gi && document.getElementById('filterGI')) {
    document.getElementById('filterGI').value = 'Semua';
    cascadeGi();
    return;
  }

  setSelectOptions(
    document.getElementById('filterBay'),
    gi ? gi.bays.map(b => b.name) : [],
    gi ? 'Semua Bay' : 'Pilih GI dulu'
  );
  enableSelect(
    document.getElementById('filterBay'), Boolean(gi),
    'hintBay', 'Bay', '(pilih GI dulu)'
  );

  applyOrgFilterToMap();
}

function cascadeBay() {
  applyOrgFilterToMap();
}

// -------------------------------------------------------------
// NAVIGASI BALIK DAN BREADCRUMB PETA (LEVEL 1 DRILL-DOWN)
// -------------------------------------------------------------
function updateMapFloatingNav() {
  const nav = document.getElementById('mapFloatingNav');
  const backLabel = document.getElementById('mapBackLabel');
  const crumbs = document.getElementById('mapNavBreadcrumbs');
  if (!nav) return;

  if (appState.currentLevel !== 1) {
    nav.style.display = 'none';
    return;
  }

  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const ultgName = document.getElementById('filterULTG')?.value || 'Semua';
  const giName = document.getElementById('filterGI')?.value || 'Semua';
  const bayName = document.getElementById('filterBay')?.value || 'Semua';

  if (uiCode === 'Semua') {
    nav.style.display = 'none';
    return;
  }

  nav.style.display = 'flex';

  // Kasus 2: Level Unit Induk (UPT belum dipilih)
  if (uiCode !== 'Semua' && uptName === 'Semua') {
    if (backLabel) backLabel.textContent = 'Kembali ke Peta Nasional';
    if (crumbs) {
      crumbs.innerHTML = `
        <span class="map-nav-crumb" onclick="resetOrgFilter()">Nasional</span>
        <span class="map-nav-sep">&rsaquo;</span>
        <span class="map-nav-crumb active">${uiCode}</span>
      `;
    }
    return;
  }

  // Kasus 3: Level UPT (ULTG belum dipilih) -> Menampilkan ULTG-ULTG
  if (uptName !== 'Semua' && ultgName === 'Semua') {
    if (backLabel) backLabel.textContent = `Kembali ke ${uiCode}`;
    if (crumbs) {
      crumbs.innerHTML = `
        <span class="map-nav-crumb" onclick="resetOrgFilter()">Nasional</span>
        <span class="map-nav-sep">&rsaquo;</span>
        <span class="map-nav-crumb" onclick="selectUnitIndukFromMap('${uiCode}')">${uiCode}</span>
        <span class="map-nav-sep">&rsaquo;</span>
        <span class="map-nav-crumb active">${uptName}</span>
      `;
    }
    return;
  }

  // Kasus 4: Level ULTG (GI belum dipilih) -> Menampilkan Gardu Induk
  if (ultgName !== 'Semua' && giName === 'Semua') {
    if (backLabel) backLabel.textContent = `Kembali ke ${uptName}`;
    if (crumbs) {
      crumbs.innerHTML = `
        <span class="map-nav-crumb" onclick="resetOrgFilter()">Nasional</span>
        <span class="map-nav-sep">&rsaquo;</span>
        <span class="map-nav-crumb" onclick="selectUnitIndukFromMap('${uiCode}')">${uiCode}</span>
        <span class="map-nav-sep">&rsaquo;</span>
        <span class="map-nav-crumb" onclick="selectUptFromMap('${uptName}')">${uptName}</span>
        <span class="map-nav-sep">&rsaquo;</span>
        <span class="map-nav-crumb active">${ultgName}</span>
      `;
    }
    return;
  }

  // Kasus 5: Level Gardu Induk / Bay
  if (giName !== 'Semua') {
    if (backLabel) backLabel.textContent = `Kembali ke ${ultgName !== 'Semua' ? ultgName : uptName}`;
    if (crumbs) {
      crumbs.innerHTML = `
        <span class="map-nav-crumb" onclick="resetOrgFilter()">Nasional</span>
        <span class="map-nav-sep">&rsaquo;</span>
        <span class="map-nav-crumb" onclick="selectUnitIndukFromMap('${uiCode}')">${uiCode}</span>
        <span class="map-nav-sep">&rsaquo;</span>
        <span class="map-nav-crumb" onclick="selectUptFromMap('${uptName}')">${uptName}</span>
        ${ultgName !== 'Semua' ? `<span class="map-nav-sep">&rsaquo;</span><span class="map-nav-crumb" onclick="selectUltgFromMap('${ultgName}')">${ultgName}</span>` : ''}
        <span class="map-nav-sep">&rsaquo;</span>
        <span class="map-nav-crumb active">${giName}${bayName !== 'Semua' ? ' • ' + bayName : ''}</span>
      `;
    }
    return;
  }
}

function handleMapBackNavigation() {
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const ultgName = document.getElementById('filterULTG')?.value || 'Semua';
  const giName = document.getElementById('filterGI')?.value || 'Semua';
  const bayName = document.getElementById('filterBay')?.value || 'Semua';

  if (bayName !== 'Semua') {
    const el = document.getElementById('filterBay');
    if (el) el.value = 'Semua';
    cascadeBay();
    return;
  }

  if (giName !== 'Semua') {
    const el = document.getElementById('filterGI');
    if (el) el.value = 'Semua';
    cascadeGi();
    return;
  }

  if (ultgName !== 'Semua') {
    const el = document.getElementById('filterULTG');
    if (el) el.value = 'Semua';
    cascadeUltg();
    return;
  }

  if (uptName !== 'Semua') {
    const el = document.getElementById('filterUPT');
    if (el) el.value = 'Semua';
    cascadeUpt();
    return;
  }

  if (uiCode !== 'Semua') {
    resetOrgFilter();
    return;
  }
}
window.handleMapBackNavigation = handleMapBackNavigation;
window.updateMapFloatingNav = updateMapFloatingNav;

// Menyorot Unit Induk / UPT / Gardu Induk & Bay terpilih di peta dan menampilkan konteks organisasinya.
function applyOrgFilterToMap() {
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const ultgName = document.getElementById('filterULTG')?.value || 'Semua';
  const giName = document.getElementById('filterGI')?.value || 'Semua';
  const bayName = document.getElementById('filterBay')?.value || 'Semua';

  const ui = uiCode === 'Semua' ? null : findUnitInduk(uiCode);
  const upt = uptName === 'Semua' ? null : findUptByName(uptName, uiCode === 'Semua' ? null : uiCode);
  const ultg = upt && ultgName !== 'Semua' ? upt.ultgs.find(u => u.name === ultgName) : null;
  const gi = ultg && giName !== 'Semua' ? ultg.gis.find(g => g.name === giName) : null;

  document.querySelectorAll('.gi-filter-marker').forEach(el => el.remove());
  updateBreadcrumbs();

  // KASUS 1: Semua Unit Induk (Kembali ke Tampilan Nasional Level 1)
  if (uiCode === 'Semua') {
    if (appState.currentLevel === 1) {
      setNationalContextCard(buildIndonesiaContext());
      renderNationalUnitIndukMarkers();
      updateMapFloatingNav();
      if (mainMap) {
        mainMap.flyTo([-1.2, 118.0], 5, { duration: 0.8 });
      }
    }
    updateAnalyticsViews();
    return;
  }

  // KASUS 2: Unit Induk dipilih, tapi UPT masih "Semua" -> Menampilkan Unit Pelaksana (UPT)
  if (uiCode !== 'Semua' && uptName === 'Semua') {
    const uiMetric = UNIT_INDUK_METRICS.find(m => m.code === uiCode) || {
      code: uiCode,
      name: ui ? ui.name : uiCode,
      totalAsset: 3000,
      uptCount: ui ? ui.upts.length : 5,
      giCount: 40,
      hi45: 600,
      hiAvg: 2.62,
      center: [-2, 118]
    };

    clearMainMarkers();

    // Zoom cerdas: gunakan fitBounds agar marker UPT tidak saling tumpuk
    if (mainMap && ui && ui.upts.length) {
      const bounds = L.latLngBounds(ui.upts.map(u => [u.lat, u.lng]));
      mainMap.fitBounds(bounds, { padding: [55, 55], maxZoom: 9.5, duration: 0.8 });
    } else if (mainMap && uiMetric.center) {
      mainMap.flyTo(uiMetric.center, 7, { duration: 0.8 });
    }

    // Tampilkan marker Unit Pelaksana (UPT)
    if (ui && mainMap) {
      ui.upts.forEach(u => {
        const gis = u.ultgs.flatMap(x => x.gis);
        const lat = u.lat != null ? u.lat : avgLat(gis);
        const lng = u.lng != null ? u.lng : avgLng(gis);
        const giCount = gis.length;
        const icon = L.divIcon({
          className: 'upt-map-marker-wrap',
          html: `
            <div class="upt-map-marker" onclick="selectUptFromMap('${u.name}')" title="Klik untuk lihat ULTG di ${u.name}">
              <div class="upt-marker-icon"><i data-lucide="building-2"></i></div>
              <div class="upt-marker-info">
                <div class="upt-marker-name">${u.name}</div>
                <div class="upt-marker-sub">${u.ultgs.length} ULTG &middot; ${giCount} GI</div>
              </div>
              <div class="upt-marker-badge">${u.ultgs.length} ULTG</div>
            </div>
          `,
          iconSize: [160, 38],
          iconAnchor: [80, 19]
        });

        const marker = L.marker([lat, lng], { icon: icon, zIndexOffset: 300 }).addTo(mainMap);
        marker.on('click', (e) => {
          if (e && e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
          selectUptFromMap(u.name);
        });
        mainMarkers.push(marker);
      });
      setTimeout(initLucide, 40);
    }

    // Context Card Unit Induk
    if (appState.currentLevel === 1) {
      setNationalContextCard({
        title: uiCode,
        isOrg: true,
        subtitleExtra: uiMetric.name,
        total: `${fmtInt(uiMetric.totalAsset)} Aset`,
        brands: `${uiMetric.uptCount} UPT (${uiMetric.giCount} GI)`,
        avgHI: fmtNum(uiMetric.hiAvg, 2),
        hi45: `${fmtInt(uiMetric.hi45)} (${fmtPct((uiMetric.hi45 / uiMetric.totalAsset) * 100)})`,
        buttonLabel: 'Buka Daftar Aset Unit Induk',
        onClickBtn: () => {
          navigateTo(5);
        },
        backLabel: 'Kembali ke Seluruh Indonesia',
        onBack: () => resetOrgFilter()
      });
      updateMapFloatingNav();
    }
    updateAnalyticsViews();
    return;
  }

  // KASUS 3: UPT dipilih, tapi ULTG masih "Semua" -> MENAMPILKAN ULTG!
  if (uptName !== 'Semua' && ultgName === 'Semua') {
    clearMainMarkers();
    if (!upt) return;

    // Zoom peta ke wilayah UPT
    if (mainMap) {
      if (upt.ultgs.length > 1) {
        const bounds = L.latLngBounds(upt.ultgs.map(u => [u.lat, u.lng]));
        mainMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 11, duration: 0.8 });
      } else if (upt.lat != null && upt.lng != null) {
        mainMap.flyTo([upt.lat, upt.lng], 10.5, { duration: 0.8 });
      }
    }

    // Tampilkan marker ULTG (Unit Layanan Transmisi & Gardu Induk)
    if (mainMap) {
      upt.ultgs.forEach(ultgItem => {
        const giCount = ultgItem.gis.length;
        const icon = L.divIcon({
          className: 'ultg-map-marker-wrap',
          html: `
            <div class="ultg-map-marker" onclick="selectUltgFromMap('${ultgItem.name}')" title="Klik untuk lihat Gardu Induk di ${ultgItem.name}">
              <div class="ultg-marker-icon"><i data-lucide="layers"></i></div>
              <div class="ultg-marker-info">
                <div class="ultg-marker-name">${ultgItem.name}</div>
                <div class="ultg-marker-sub">${giCount} Gardu Induk &middot; ULTG</div>
              </div>
              <div class="ultg-marker-badge">${giCount} GI</div>
            </div>
          `,
          iconSize: [160, 38],
          iconAnchor: [80, 19]
        });

        const marker = L.marker([ultgItem.lat, ultgItem.lng], { icon: icon, zIndexOffset: 350 }).addTo(mainMap);
        marker.on('click', (e) => {
          if (e && e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
          selectUltgFromMap(ultgItem.name);
        });
        mainMarkers.push(marker);
      });
      setTimeout(initLucide, 40);
    }

    if (appState.currentLevel === 1) {
      const allGis = upt.ultgs.flatMap(u => u.gis);
      const totalBays = allGis.reduce((sum, g) => sum + (g.bays ? g.bays.length : 5), 0);
      setNationalContextCard({
        title: upt.name,
        isOrg: true,
        subtitleExtra: `Unit Pelaksana • ${uiCode} • Provinsi ${upt.province}`,
        total: `${upt.ultgs.length} ULTG Terdaftar`,
        brands: `${allGis.length} GI (${totalBays} Bay)`,
        avgHI: '2.58',
        hi45: `${Math.round(totalBays * 0.18)} unit HI 4–5`,
        buttonLabel: `Buka Profil Aset ${upt.name}`,
        onClickBtn: () => {
          navigateTo(5);
        },
        backLabel: `Kembali ke Unit Induk (${uiCode})`,
        onBack: () => {
          const uptSelect = document.getElementById('filterUPT');
          if (uptSelect) uptSelect.value = 'Semua';
          cascadeUpt();
        }
      });
      updateMapFloatingNav();
    }
    return;
  }

  // KASUS 4: ULTG dipilih, tapi GI masih "Semua" -> MENAMPILKAN GARDU INDUK (GI)!
  if (ultgName !== 'Semua' && giName === 'Semua') {
    clearMainMarkers();
    if (!ultg) return;

    // Zoom peta ke wilayah ULTG
    const targets = ultg.gis;
    if (mainMap && targets.length) {
      if (targets.length > 1) {
        const bounds = L.latLngBounds(targets.map(g => [g.lat, g.lng]));
        mainMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 12.5, duration: 0.8 });
      } else {
        mainMap.flyTo([targets[0].lat, targets[0].lng], 12, { duration: 0.8 });
      }
    }

    if (mainMap) {
      targets.forEach(g => {
        const bayCount = g.bays ? g.bays.length : 5;
        const icon = L.divIcon({
          className: 'gi-card-marker-wrap',
          html: `
            <div class="gi-card-marker" onclick="selectGiFromMap('${g.name}')" title="Klik untuk lihat Bay di ${g.name}">
              <div class="gi-marker-icon"><i data-lucide="zap"></i></div>
              <div class="gi-marker-info">
                <div class="gi-marker-name">${g.name}</div>
                <div class="gi-marker-sub">${bayCount} Bay &middot; 150 kV</div>
              </div>
              <div class="gi-marker-voltage">150 kV</div>
            </div>
          `,
          iconSize: [160, 38],
          iconAnchor: [80, 19]
        });

        const marker = L.marker([g.lat, g.lng], { icon: icon, zIndexOffset: 400 }).addTo(mainMap);
        marker.on('click', (e) => {
          if (e && e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
          selectGiFromMap(g.name);
        });
        mainMarkers.push(marker);
      });
      setTimeout(initLucide, 40);
    }

    if (appState.currentLevel === 1) {
      const totalBays = targets.reduce((sum, g) => sum + (g.bays ? g.bays.length : 5), 0);
      setNationalContextCard({
        title: ultg.name,
        isOrg: true,
        subtitleExtra: `ULTG di ${uptName} • ${uiCode}`,
        total: `${targets.length} Gardu Induk`,
        brands: `${totalBays} Bay Transmisi`,
        avgHI: '2.52',
        hi45: `${Math.round(totalBays * 0.16)} unit HI 4–5`,
        buttonLabel: `Buka Daftar Aset ${ultg.name}`,
        onClickBtn: () => {
          navigateTo(5);
        },
        backLabel: `Kembali ke ${uptName}`,
        onBack: () => {
          const ultgSelect = document.getElementById('filterULTG');
          if (ultgSelect) ultgSelect.value = 'Semua';
          cascadeUltg();
        }
      });
      updateMapFloatingNav();
    }
    updateAnalyticsViews();
    return;
  }

  // KASUS 5: GI dipilih (dan Bay dipilih atau Semua) -> MENAMPILKAN BAY TRANSMISI!
  if (giName !== 'Semua') {
    clearMainMarkers();
    const activeGi = gi || (ultg ? ultg.gis.find(g => g.name === giName) : null) || (upt ? upt.ultgs.flatMap(u => u.gis).find(g => g.name === giName) : null);
    if (!activeGi) return;

    // Zoom peta langsung ke GI terpilih
    if (mainMap && activeGi.lat != null && activeGi.lng != null) {
      mainMap.flyTo([activeGi.lat, activeGi.lng], 13.5, { duration: 0.8 });
    }

    // Marker Pusat Gardu Induk
    const centerIcon = L.divIcon({
      className: 'gi-card-marker-wrap',
      html: `
        <div class="gi-card-marker" style="border-color:#00458f; background:#eff6ff;">
          <div class="gi-marker-icon" style="background:#00458f;"><i data-lucide="zap"></i></div>
          <div class="gi-marker-info">
            <div class="gi-marker-name">${activeGi.name}</div>
            <div class="gi-marker-sub">${activeGi.bays ? activeGi.bays.length : 5} Bay &middot; Gardu Induk</div>
          </div>
          <div class="gi-marker-voltage" style="background:#00458f;">150 kV</div>
        </div>
      `,
      iconSize: [170, 42],
      iconAnchor: [85, 21]
    });
    const centerMarker = L.marker([activeGi.lat, activeGi.lng], { icon: centerIcon, zIndexOffset: 500 }).addTo(mainMap);
    mainMarkers.push(centerMarker);

    // Marker Bay-bay di sekitar Gardu Induk
    const bays = activeGi.bays || getDefaultBaysForGi(activeGi.name);
    bays.forEach((b, idx) => {
      const angle = (idx / bays.length) * 2 * Math.PI;
      const dist = 0.005; // ~500m
      const bLat = activeGi.lat + Math.sin(angle) * dist;
      const bLng = activeGi.lng + Math.cos(angle) * dist;
      const isCurrentBay = bayName !== 'Semua' && bayName === b.name;

      const bayIcon = L.divIcon({
        className: 'bay-map-marker-wrap',
        html: `
          <div class="bay-map-marker ${isCurrentBay ? 'is-active' : ''}" onclick="selectBayFromMap('${b.name}')" title="Pilih ${b.name}">
            <span class="bay-marker-code">${b.code}</span>
            <span class="bay-marker-name">${b.name}</span>
          </div>
        `,
        iconSize: [140, 30],
        iconAnchor: [70, 15]
      });
      const bMarker = L.marker([bLat, bLng], { icon: bayIcon, zIndexOffset: isCurrentBay ? 600 : 450 }).addTo(mainMap);
      bMarker.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
        selectBayFromMap(b.name);
      });
      mainMarkers.push(bMarker);

      // Garis penghubung GI ke Bay
      const line = L.polyline([[activeGi.lat, activeGi.lng], [bLat, bLng]], {
        color: isCurrentBay ? '#d97706' : '#94a3b8',
        weight: isCurrentBay ? 2.5 : 1.5,
        dashArray: '4, 4'
      }).addTo(mainMap);
      mainMarkers.push(line);
    });
    setTimeout(initLucide, 40);

    if (appState.currentLevel === 1) {
      const activeBayObj = bayName !== 'Semua' ? bays.find(b => b.name === bayName) : null;
      setNationalContextCard({
        title: bayName !== 'Semua' ? `${activeGi.name} — ${bayName}` : activeGi.name,
        isOrg: true,
        subtitleExtra: `${uiCode} • ${upt ? upt.name : ''}${ultg ? ' • ' + ultg.name : ''}`,
        total: bayName !== 'Semua' ? `Kode Bay: ${activeBayObj ? activeBayObj.code : 'BAY-01'}` : `${bays.length} Bay Terpasang`,
        brands: 'Tegangan: 150 kV',
        avgHI: '2.40',
        hi45: bayName !== 'Semua' ? 'Kondisi: Normal (HI 2)' : '0 Unit Kritis',
        buttonLabel: bayName !== 'Semua' ? 'Lihat Spesifikasi Bay' : 'Buka Daftar Aset GI',
        onClickBtn: () => {
          if (bayName !== 'Semua') navigateTo(6);
          else navigateTo(5);
        },
        backLabel: `Kembali ke ${ultgName !== 'Semua' ? ultgName : uptName}`,
        onBack: () => {
          if (bayName !== 'Semua') {
            const baySelect = document.getElementById('filterBay');
            if (baySelect) baySelect.value = 'Semua';
            cascadeBay();
          } else {
            const giSelect = document.getElementById('filterGI');
            if (giSelect) giSelect.value = 'Semua';
            cascadeGi();
          }
        }
      });
      updateMapFloatingNav();
    }
  }

  updateAnalyticsViews();
}

function updateAnalyticsViews() {
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  const uptName = document.getElementById('filterUPT')?.value || 'Semua';
  const ultgName = document.getElementById('filterULTG')?.value || 'Semua';

  const brand = document.getElementById('filterMerk')?.value || 'Semua';
  const hi = document.getElementById('filterHI')?.value || 'Semua';
  const jenis = document.getElementById('filterJenisAset')?.value || 'Power Transformer';

  let filterTitleSuffix = '';
  if (brand !== 'Semua') filterTitleSuffix += ` • Merk ${brand}`;
  if (hi !== 'Semua') filterTitleSuffix += ` • ${hi}`;

  const titleEl = document.getElementById('sebaranAsetTitle');
  const descEl = document.getElementById('sebaranAsetDesc');
  const btnLabel = document.getElementById('sebaranAsetBtnLabel');
  const btn = document.getElementById('sebaranAsetBtn');
  const chartTitle = document.getElementById('chartProvTitle');
  const chartSubtitle = document.getElementById('chartProvSubtitle');
  const tableTitle = document.getElementById('tableProvTitle');
  const tableSubtitle = document.getElementById('tableProvSubtitle');
  const thScopeName = document.getElementById('thScopeName');

  const stats = getAssetTypeStats();

  if (uiCode === 'Semua') {
    if (titleEl) titleEl.textContent = `Sebaran Wilayah: Nasional (Seluruh Unit Induk Transmisi)${filterTitleSuffix}`;
    if (descEl) descEl.textContent = `Total ${fmtInt(nationalStats.totalAssets)} aset (${fmtInt(stats.total)} ${jenis}) tersebar di 6 Unit Induk Transmisi di seluruh Indonesia. Klik baris atau batang grafik untuk memfokuskan wilayah.`;
    if (btnLabel) btnLabel.textContent = `Eksplorasi ${jenis} Nasional (${fmtInt(stats.total)} Unit)${filterTitleSuffix}`;
    if (btn) btn.onclick = () => navigateTo(3, { assetType: jenis });
    if (chartTitle) chartTitle.textContent = `${jenis} per Unit Induk Transmisi${filterTitleSuffix}`;
    if (chartSubtitle) chartSubtitle.textContent = 'Klik batang untuk memfokuskan Unit Induk pada peta';
    if (tableTitle) tableTitle.textContent = `Ringkasan Per Unit Induk Transmisi${filterTitleSuffix}`;
    if (tableSubtitle) tableSubtitle.textContent = 'Klik baris atau tombol Fokuskan untuk memfokuskan ke Unit Induk';
    if (thScopeName) thScopeName.textContent = 'Unit Induk';
  } else if (uptName === 'Semua') {
    const ui = typeof findUnitInduk === 'function' ? findUnitInduk(uiCode) : null;
    const uiName = ui ? ui.name : uiCode;
    if (titleEl) titleEl.textContent = `Sebaran Wilayah: ${uiCode} — ${uiName}${filterTitleSuffix}`;
    if (descEl) descEl.textContent = `Total aset dan ${fmtInt(stats.total)} unit ${jenis} di lingkungan ${uiCode}. Tersebar di ${ui ? ui.upts.length : 0} Unit Pelaksana (UPT).`;
    if (btnLabel) btnLabel.textContent = `Eksplorasi ${jenis} — ${uiCode} (${fmtInt(stats.total)} Unit)${filterTitleSuffix}`;
    if (btn) btn.onclick = () => navigateTo(3, { subRegion: uiCode, assetType: jenis });
    if (chartTitle) chartTitle.textContent = `${jenis} per UPT di ${uiCode}${filterTitleSuffix}`;
    if (chartSubtitle) chartSubtitle.textContent = 'Klik batang untuk memfokuskan UPT pada peta';
    if (tableTitle) tableTitle.textContent = `Ringkasan UPT di ${uiCode}${filterTitleSuffix}`;
    if (tableSubtitle) tableSubtitle.textContent = 'Klik baris atau tombol Fokuskan untuk memfokuskan ke UPT';
    if (thScopeName) thScopeName.textContent = 'Unit Pelaksana (UPT)';
  } else {
    const upt = typeof findUptByName === 'function' ? findUptByName(uptName, uiCode) : null;
    if (titleEl) titleEl.textContent = `Sebaran Wilayah: ${uptName} (${uiCode})${filterTitleSuffix}`;
    if (descEl) descEl.textContent = `Rincian ULTG dan Gardu Induk di lingkungan ${uptName}.`;
    if (btnLabel) btnLabel.textContent = `Eksplorasi ${jenis} — ${uptName}${filterTitleSuffix}`;
    if (btn) btn.onclick = () => navigateTo(3, { subRegion: uptName, assetType: jenis });
    if (chartTitle) chartTitle.textContent = `${jenis} per ULTG di ${uptName}${filterTitleSuffix}`;
    if (chartSubtitle) chartSubtitle.textContent = 'Klik batang untuk memfokuskan ULTG pada peta';
    if (tableTitle) tableTitle.textContent = `Ringkasan ULTG di ${uptName}${filterTitleSuffix}`;
    if (tableSubtitle) tableSubtitle.textContent = 'Klik baris atau tombol Fokuskan untuk memfokuskan ke ULTG';
    if (thScopeName) thScopeName.textContent = 'ULTG';
  }

  // Update summary KPI & tables
  renderL2AssetTypeSummary();

  initLucide();
}
window.updateAnalyticsViews = updateAnalyticsViews;

function avgLat(list) {
  return list.length ? list.reduce((s, g) => s + g.lat, 0) / list.length : -2;
}
function avgLng(list) {
  return list.length ? list.reduce((s, g) => s + g.lng, 0) / list.length : 118;
}

function buildIndonesiaContext() {
  const brand = document.getElementById('filterMerk')?.value || 'Semua';
  const hi = document.getElementById('filterHI')?.value || 'Semua';
  const jenis = document.getElementById('filterJenisAset')?.value || 'Power Transformer';

  let titleStr = 'Indonesia';
  let subtitleStr = 'Ringkasan Kondisi Wilayah & Aset Transmisi';

  if (brand !== 'Semua' || hi !== 'Semua' || jenis !== 'Power Transformer') {
    titleStr = `Nasional: ${jenis}`;
    if (brand !== 'Semua') titleStr += ` (${brand})`;
    subtitleStr = `Filter Aktif: ${jenis} • Merk: ${brand} • AHI: ${hi}`;
  }

  return {
    title: titleStr,
    subtitleExtra: subtitleStr,
    total: nationalStats.totalAssetsLabel,
    brands: nationalStats.totalBrands,
    avgHI: fmtNum(nationalStats.avgHI, 2),
    hi45: `${nationalStats.hi45Label} (${fmtPct(nationalStats.hi45Pct)})`,
    onClickBtn: () => navigateTo(2, { region: 'Jawa' })
  };
}

function resetOrgFilter() {
  ['filterUnitInduk', 'filterUPT', 'filterULTG', 'filterGI', 'filterBay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = 'Semua';
  });

  const bSelect = document.getElementById('filterMerk');
  if (bSelect) bSelect.value = 'Semua';
  const hiSelect = document.getElementById('filterHI');
  if (hiSelect) hiSelect.value = 'Semua';
  const jSelect = document.getElementById('filterJenisAset');
  if (jSelect) jSelect.value = 'Power Transformer';
  if (typeof populateBrandDropdown === 'function') {
    populateBrandDropdown('Power Transformer');
  }
  const tSelect = document.getElementById('filterTegangan');
  if (tSelect) tSelect.value = 'Semua';

  const input = document.getElementById('globalSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('globalSearchClear');
  if (clearBtn) clearBtn.hidden = true;
  hideSearchResults();
  highlightMapMatches('');
  cascadeUnitInduk();
  if (typeof onAssetFiltersChanged === 'function') {
    onAssetFiltersChanged();
  } else {
    updateBreadcrumbs();
  }
}
window.resetOrgFilter = resetOrgFilter;

let orgFilterInitialized = false;
function initOrgFilter() {
  const uiSelect = document.getElementById('filterUnitInduk');
  if (uiSelect && (!uiSelect.children.length || uiSelect.children.length <= 1)) {
    setSelectOptions(uiSelect, ORG_HIERARCHY.map(u => u.code), 'Semua Unit Induk');
  }

  if (!orgFilterInitialized) {
    orgFilterInitialized = true;
    if (uiSelect) uiSelect.addEventListener('change', cascadeUnitInduk);

    const uptSelect = document.getElementById('filterUPT');
    if (uptSelect) uptSelect.addEventListener('change', cascadeUpt);

    const ultgSelect = document.getElementById('filterULTG');
    if (ultgSelect) ultgSelect.addEventListener('change', cascadeUltg);

    const giSelect = document.getElementById('filterGI');
    if (giSelect) giSelect.addEventListener('change', cascadeGi);

    const baySelect = document.getElementById('filterBay');
    if (baySelect) baySelect.addEventListener('change', cascadeBay);

    const resetBtn = document.getElementById('btnResetFilter');
    if (resetBtn) resetBtn.addEventListener('click', resetOrgFilter);
  }

  cascadeUnitInduk();
}

// Isi dropdown Merk: 5 merk utama + grup "Lainnya" yang dinamis per jenis aset.
function populateBrandFilter() {
  const jenis = document.getElementById('filterJenisAset')?.value || 'Power Transformer';
  populateBrandDropdown(jenis);
}

function triggerSearchSubmit() {
  const searchInput = document.getElementById('globalSearchInput');
  const query = (searchInput?.value || '').trim();
  if (!query) {
    resetOrgFilter();
    return;
  }
  if (!searchResults.length) {
    runGlobalSearch(query);
  }
  if (searchResults.length > 0) {
    const item = (searchActiveIndex >= 0 && searchActiveIndex < searchResults.length)
      ? searchResults[searchActiveIndex]
      : searchResults[0];
    selectSearchResult(item);
  }
}
window.triggerSearchSubmit = triggerSearchSubmit;

function setupFilterListeners() {
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.filters.searchQuery = e.target.value;
      const clearBtn = document.getElementById('globalSearchClear');
      if (clearBtn) clearBtn.hidden = !e.target.value;

      if (appState.currentLevel === 5) {
        filterAndRenderAssetTable();
        return;
      }
      runGlobalSearch(e.target.value);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) runGlobalSearch(searchInput.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSearchHighlight(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSearchHighlight(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerSearchSubmit();
      } else if (e.key === 'Escape') {
        clearGlobalSearch();
        hideSearchResults();
        searchInput.blur();
      }
    });
  }

  // Klik di luar menutup daftar hasil
  document.addEventListener('click', (e) => {
    const wrapper = e.target.closest('.search-input-wrapper');
    if (!wrapper || !wrapper.contains(document.getElementById('globalSearchInput'))) {
      hideSearchResults();
    }
  });

  const tableSearchInput = document.getElementById('tableSearchInput');
  if (tableSearchInput) {
    tableSearchInput.addEventListener('input', (e) => {
      appState.filters.searchQuery = e.target.value;
      filterAndRenderAssetTable();
    });
  }

  // Event Listeners untuk Filter Analitik (Merk, Health Index, Jenis Aset, Tegangan)
  const bSelect = document.getElementById('filterMerk');
  if (bSelect) {
    bSelect.addEventListener('change', onAssetFiltersChanged);
  }

  const hiSelect = document.getElementById('filterHI');
  if (hiSelect) {
    hiSelect.addEventListener('change', onAssetFiltersChanged);
  }

  const jSelect = document.getElementById('filterJenisAset');
  if (jSelect) {
    jSelect.addEventListener('change', onJenisAsetChanged);
  }

  const tSelect = document.getElementById('filterTegangan');
  if (tSelect) {
    tSelect.addEventListener('change', onAssetFiltersChanged);
  }
}

function onAssetFiltersChanged() {
  const brand = document.getElementById('filterMerk')?.value || 'Semua';
  const hi = document.getElementById('filterHI')?.value || 'Semua';
  const jenis = document.getElementById('filterJenisAset')?.value || 'Power Transformer';
  const tegangan = document.getElementById('filterTegangan')?.value || 'Semua';

  appState.filters.merk = brand;
  appState.filters.healthIndex = hi;
  appState.filters.jenisAset = jenis;
  appState.filters.tegangan = tegangan;

  if (brand !== 'Semua') {
    appState.brand = brand;
  }
  if (jenis) {
    appState.assetType = jenis;
  }

  // Update Summary Pill di Tier 1
  const summaryEl = document.getElementById('filterActiveSummaryText');
  if (summaryEl) {
    let text = `Fokus: ${jenis}`;
    if (brand !== 'Semua') text += ` • Merk: ${brand}`;
    if (hi !== 'Semua') text += ` • ${hi}`;
    if (tegangan !== 'Semua') text += ` • ${tegangan}`;
    summaryEl.textContent = text;
  }

  // Update Breadcrumbs
  updateBreadcrumbs();

  // Update Context Card bila sedang di Peta Nasional Level 1
  const uiCode = document.getElementById('filterUnitInduk')?.value || 'Semua';
  if (appState.currentLevel === 1 && uiCode === 'Semua') {
    setNationalContextCard(buildIndonesiaContext());
  }

  // Update Analytics Views (tables dan charts di panel 4 tab)
  updateAnalyticsViews();

  // Bila tabel aset aktif (Level 5), jalankan filter
  if (appState.currentLevel === 5) {
    filterAndRenderAssetTable();
  }
}
window.onAssetFiltersChanged = onAssetFiltersChanged;

// -------------------------------------------------------------
// COMPARISON MODAL
// -------------------------------------------------------------
function openBrandComparisonModal() {
  const modal = document.getElementById('brandComparisonModal');
  if (!modal) return;
  modal.classList.add('open');

  renderComparisonTable();
  setTimeout(renderComparisonChart, 100);
}

function closeBrandComparisonModal() {
  const modal = document.getElementById('brandComparisonModal');
  if (modal) modal.classList.remove('open');
}

// Modal harus selalu bisa ditutup, kalau tidak backdrop-nya memblokir seluruh UI
function setupModalDismiss() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('brandListModal')?.classList.contains('open')) {
      closeBrandModal();
      return;
    }
    closeBrandComparisonModal();
  });

  document.addEventListener('click', (e) => {
    const modal = document.getElementById('brandComparisonModal');
    if (modal && modal.classList.contains('open') && e.target === modal) {
      closeBrandComparisonModal();
    }

    const listModal = document.getElementById('brandListModal');
    if (listModal && listModal.classList.contains('open') && e.target === listModal) {
      closeBrandModal();
    }
  });
}

// Modal generik untuk daftar merk (dipakai kategori "Lainnya")
function openBrandModal({ eyebrow, title, subtitle, head, rows, footer }) {
  const modal = document.getElementById('brandListModal');
  if (!modal) return;

  document.getElementById('brandListEyebrow').textContent = eyebrow;
  document.getElementById('brandListTitle').textContent = title;
  document.getElementById('brandListSubtitle').textContent = subtitle;
  document.getElementById('brandListHead').innerHTML = `<tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>`;
  document.getElementById('brandListBody').innerHTML = rows;
  document.getElementById('brandListFooter').innerHTML = footer;

  modal.classList.add('open');
  initLucide();
}

function closeBrandModal() {
  const modal = document.getElementById('brandListModal');
  if (modal) modal.classList.remove('open');
}

const COMPARE_BRANDS = ['ABB', 'Siemens', 'Toshiba'];
const COMPARE_TONES = [
  { cls: 'font-mono text-brand-600', ok: '' },
  { cls: 'font-mono text-emerald-600', ok: 'ok' },
  { cls: 'font-mono text-amber-600', ok: '' }
];

// Tabel komparasi mengikuti scope + data merk aktif
function renderComparisonTable() {
  const head = document.getElementById('compareTableHead');
  const tbody = document.getElementById('compareTableBody');
  if (!head || !tbody) return;

  const stats = COMPARE_BRANDS.map(name => getBrandStats(name));

  head.innerHTML = `<th>Parameter Komparasi</th>${stats
    .map(s => `<th>${s.brand}</th>`)
    .join('')}`;

  const rows = [
    {
      label: 'Populasi Unit Aset',
      cells: s => `${fmtInt(s.count)} unit (${fmtNum(s.pctOfType, 1)}%)`
    },
    {
      label: 'Rata-rata Health Index',
      cells: (s, i) => `<strong class="${COMPARE_TONES[i].cls}">${fmtNum(s.avgHI, 2)}</strong>`
    },
    {
      label: 'Persentase Kondisi Baik (HI 1–2)',
      cells: (s, i) => (s.hi12Pct >= 60
        ? `<span class="status-badge good">${s.hi12Pct}%</span>`
        : `${s.hi12Pct}%`)
    },
    {
      label: 'Persentase Kritis (HI 4–5)',
      cells: (s, i) => (s.hi45Pct <= 18
        ? `<span class="status-badge good">${s.hi45Pct}%</span>`
        : `${s.hi45Pct}%`)
    },
    {
      label: 'Rata-rata Umur Operasi',
      cells: s => `${fmtNum(s.avgAge, 1)} tahun`
    },
    {
      label: 'Unit Berumur &gt; 20 Tahun',
      cells: s => `${fmtInt(s.over20)} unit (${fmtPct(s.over20Pct, 0)})`
    }
  ];

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><strong>${r.label}</strong></td>
      ${stats.map((s, i) => `<td>${r.cells(s, i)}</td>`).join('')}
    </tr>
  `).join('');
}

function renderComparisonChart() {
  const ctx = document.getElementById('canvasCompareRadar');
  if (!ctx) return;

  if (chartCompareRadar) chartCompareRadar.destroy();

  chartCompareRadar = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Reliabilitas (1/HI)', 'Ketersediaan Suku Cadang', 'Rendah Laju Gangguan', 'Efisiensi Har', 'Kelayakan Usia Operasi'],
      datasets: [
        {
          label: 'ABB',
          data: [78, 85, 80, 88, 72],
          backgroundColor: 'rgba(0, 86, 179, 0.2)',
          borderColor: '#0056b3',
          pointBackgroundColor: '#0056b3'
        },
        {
          label: 'Siemens',
          data: [84, 82, 86, 80, 82],
          backgroundColor: 'rgba(0, 163, 224, 0.2)',
          borderColor: '#00a3e0',
          pointBackgroundColor: '#00a3e0'
        },
        {
          label: 'Toshiba',
          data: [75, 76, 78, 75, 74],
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderColor: '#f59e0b',
          pointBackgroundColor: '#f59e0b'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 40,
          max: 100,
          ticks: { display: false }
        }
      }
    }
  });
}
