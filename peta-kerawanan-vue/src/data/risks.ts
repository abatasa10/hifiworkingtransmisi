import { RiskItem } from '../types/risk';

export const risksData: RiskItem[] = [
  {
    id: 1,
    number: 1,
    name: 'SUTET Cilegon - Cibinong Sirkit 1 & 2',
    lineGiSegment: 'GITET Cilegon → GITET Cibinong',
    uit: 'JBB',
    assetType: 'SUTET',
    voltage: '500 kV',
    riskLevel: 'Sangat Rawan',
    sourceGiId: 'GI_CLGON',
    targetGiId: 'GI_CIBNG',
    edgeId: 'LINE_CLGON_CIBNG',
    lengthKm: 104.2,
    circuits: 2,
    loadingCircuit1: 88,
    loadingCircuit2: 84,
    operatingStatus: 'Beroperasi',
    condition: 'Evakuasi daya pembangkit PLTU Banten menuju pusat beban Jawa Bagian Barat mendekati batas stabilitas termal saat beban puncak.',
    impact: '1. Jika terjadi trip salah satu sirkit (N-1), sirkit pasangannya akan overload >115%.\n2. Memicu pelepasan beban sistem otomatis (UFLS) hingga 650 MW.\n3. Defisit pasokan ke arah Jakarta Selatan dan Depok.',
    mitigation: '1. Implementasi System Defense Scheme (SDS) overload shedding di GITET Cilegon.\n2. Optimalisasi pola operasi PLTU Suralaya dan PLTU Jawa 7.\n3. Pengaturan kompensator reaktif pada GI Cibinong.',
    solution: {
      shortTerm: [
        'Pemasangan High Capacity Conductor (HTLS) pada span kritis.',
        'Pengaturan kompensator reaktif di GI Cibinong.'
      ],
      mediumTerm: [
        'Pembangunan SUTET Balaraja - Kembangan 500 kV sirkit 3 & 4.'
      ]
    },
    location: 'Banten - Jawa Barat',
    updatedAt: '28 Juni 2026',
    coordinates: [
      { lat: -6.0125, lng: 106.0538, label: 'GITET Cilegon' },
      { lat: -6.4812, lng: 106.8521, label: 'GITET Cibinong' }
    ],
    relatedAssetIds: ['GI_CLGON', 'GI_CIBNG']
  },
  {
    id: 2,
    number: 2,
    name: 'Kerawanan Subsistem Suralaya Unit #3 - Suralaya 1,2 - Cilegon 4 (Kasus 1)',
    lineGiSegment: 'GITET Suralaya → GITET Cilegon (IBT 1,2 Suralaya & IBT 4 Cilegon)',
    uit: 'JBB',
    assetType: 'IBT',
    voltage: '500/150 kV',
    riskLevel: 'Sangat Rawan',
    sourceGiId: 'GI_SRLYA',
    targetGiId: 'GI_CLGON',
    circuits: 2,
    loadingCircuit1: 86,
    loadingCircuit2: 82,
    operatingStatus: 'Beroperasi',
    condition: 'Pembebanan IBT-1,2 Suralaya tidak memenuhi kriteria N-1 saat PLTU Suralaya unit-3 tidak beroperasi dan IBT-4 Cilegon masuk subsistem Cilegon.',
    impact: '1. Pemeliharaan IBT sulit dilakukan.\n2. Pertumbuhan beban menjadi terhambat.\n3. Terjadi pemadaman apabila trip salah satu IBT di Suralaya.',
    mitigation: '1. Sudah terpasang DS OLS IBT 1,2 Suralaya dengan target total sebesar 102 MW (Berdasarkan buku DS Tahun 2025).\n2. Rencana penambahan target DS OLS SS Suralaya 1,2 dengan total target sebesar 137 MW (Berdasarkan buku DS Tahun 2025).\n3. Pemeliharaan IBT saat beban rendah dan pada saat PLTU Suralaya Unit-3 beroperasi.',
    solution: {
      shortTerm: [
        'Uprating IBT-1 & 2 Suralaya dari 250 MVA menjadi 500 MVA. Berdasarkan RUPTL 2025 - 2034, COD di Tahun 2025.'
      ],
      mediumTerm: [
        'Rekonfigurasi penyaluran 150 kV subsistem Suralaya - Cilegon.'
      ]
    },
    location: 'Banten (Suralaya - Cilegon)',
    updatedAt: '28 Juni 2026',
    coordinates: [
      { lat: -5.8892, lng: 106.0315, label: 'GITET Suralaya' },
      { lat: -6.0125, lng: 106.0538, label: 'GITET Cilegon' }
    ],
    relatedAssetIds: ['GI_SRLYA', 'GI_CLGON']
  },
  {
    id: 3,
    number: 3,
    name: 'Daya Mampu Pasok IBT Suralaya dan Cilegon (Kasus 2)',
    lineGiSegment: 'GITET Suralaya → GITET Cilegon (Kapasitas IBT Tidak Sama)',
    uit: 'JBB',
    assetType: 'IBT',
    voltage: '500/150 kV',
    riskLevel: 'Rawan',
    sourceGiId: 'GI_SRLYA',
    targetGiId: 'GI_CLGON',
    circuits: 2,
    loadingCircuit1: 78,
    loadingCircuit2: 74,
    operatingStatus: 'Beroperasi',
    condition: 'Daya Mampu Pasok IBT Suralaya dan Cilegon tidak sama (IBT #1,2 Suralaya 250 MVA sedangkan IBT #4 Cilegon 500 MVA).',
    impact: '1. Ketidakseimbangan beban antara IBT Suralaya dan IBT Cilegon.\n2. Kondisi N-1-1 (IBT Suralaya dan IBT Cilegon) berdampak overload pada IBT Suralaya yang beroperasi.',
    mitigation: '1. Sudah terpasang DS OLS IBT 1,2 Suralaya dengan target total sebesar 102 MW (Berdasarkan buku DS Tahun 2025).\n2. Rencana penambahan target DS OLS SS Suralaya 1,2 dengan total target sebesar 137 MW (Berdasarkan buku DS Tahun 2025).\n3. Pemeliharaan IBT saat beban rendah dan pada saat PLTU Suralaya Unit-3 beroperasi.',
    solution: {
      shortTerm: [
        'Uprating IBT-1 & 2 Suralaya dari 250 MVA menjadi 500 MVA. Berdasarkan RUPTL 2025 - 2034, COD di Tahun 2026.'
      ],
      mediumTerm: [
        'Penyamaan kapasitas rating transformator interbus regional Banten.'
      ]
    },
    location: 'Banten (Suralaya - Cilegon)',
    updatedAt: '28 Juni 2026',
    coordinates: [
      { lat: -5.8892, lng: 106.0315, label: 'GITET Suralaya' },
      { lat: -6.0125, lng: 106.0538, label: 'GITET Cilegon' }
    ],
    relatedAssetIds: ['GI_SRLYA', 'GI_CLGON']
  },
  {
    id: 5,
    number: 5,
    name: 'SUTET Cawang - Bekasi Sirkit 1 & 2',
    lineGiSegment: 'GITET Cawang → GITET Bekasi',
    uit: 'JBB',
    assetType: 'SUTET',
    voltage: '500 kV',
    riskLevel: 'Rawan',
    sourceGiId: 'GI_CWANG',
    targetGiId: 'GI_BKASI',
    edgeId: 'LINE_CWANG_BKASI',
    lengthKm: 28.6,
    circuits: 2,
    loadingCircuit1: 76,
    loadingCircuit2: 72,
    operatingStatus: 'Beroperasi',
    condition: 'Penyaluran beban padat koridor timur DKI Jakarta dan Jawa Barat bagian utara mengalami bottleneck saat transfer daya arah barat.',
    impact: '1. Potensi pemadaman parsial pelanggan VIP dan sentra industri Bekasi bila terjadi kegagalan bay penghantar.\n2. Keterbatasan manuver daya saat beban puncak.',
    mitigation: '1. Optimalisasi pola operasi pembangkit Muara Tawar dan interkoneksi 150 kV.\n2. Pengawasan termal koneksi bay secara periodik.',
    solution: {
      shortTerm: ['Penggantian CT Bay penghantar Cawang-Bekasi kapasitas 4000 A.'],
      mediumTerm: ['Penguatan jalur 500 kV Tambun - Cawang.']
    },
    location: 'DKI Jakarta - Jawa Barat',
    updatedAt: '25 Juni 2026',
    coordinates: [
      { lat: -6.2520, lng: 106.8710, label: 'GITET Cawang' },
      { lat: -6.2383, lng: 106.9756, label: 'GITET Bekasi' }
    ],
    relatedAssetIds: ['GI_CWANG', 'GI_BKASI']
  },
  {
    id: 7,
    number: 7,
    name: 'SUTET Gandul - Durkos - Kembangan',
    lineGiSegment: 'GITET Gandul → GITET Duri Kosambi → GITET Kembangan',
    uit: 'JBB',
    assetType: 'SUTET',
    voltage: '500 kV',
    riskLevel: 'Sedang',
    sourceGiId: 'GI_GNDUL',
    targetGiId: 'GI_KMBNG',
    edgeId: 'LINE_GNDUL_DKSBI',
    lengthKm: 72.5,
    circuits: 2,
    loadingCircuit1: 55,
    loadingCircuit2: 43,
    operatingStatus: 'Beroperasi',
    condition: 'SUTET Gandul-Durkos-Kembangan memasok 2 IBT Durkosambi dan 2 IBT Muarakarang secara radial, dengan pembebanan SUTET Gandul-Durkos mencapai 55%, sedangkan SUTET Kembangan-Durkos mencapai 43%.',
    impact: '1. Jika terjadi kondisi N-2 SUTET Gandul-Durkos-Kembangan, terjadi pembebanan Konsumen dikarenakan padam IBT Muarakarang dan Durikosambi sebesar 1.700 MW.\n2. Potensi gangguan kestabilan sistem kelistrikan DKI Jakarta.',
    mitigation: '1. Terpasang Defense Scheme N-2 pada SUTET Gandul-Durkos-Kembangan.\n2. Uji periodik teleproteksi dan transfer trip antar GI.',
    solution: {
      shortTerm: [
        '1. Percepatan pembangunan SUTET Muaratawar - Priok. RUPTL 2025-2034, COD Tahun 2025. COD timeline proyek Desember 2026.',
        '2. Percepatan pembangunan SUTET Priok - Muarakarang. RUPTL 2025-2034, COD di Tahun 2027.'
      ],
      mediumTerm: [
        'Rekonfigurasi sistem penyaluran 500 kV loop DKI Jakarta.',
        'Penambahan kapasitas interkoneksi GIS Muara Karang Baru.'
      ]
    },
    location: 'DKI Jakarta & Jawa Barat (Gandul - Duri Kosambi - Kembangan)',
    updatedAt: '30 Juni 2026',
    coordinates: [
      { lat: -6.3312, lng: 106.7871, label: 'GITET Gandul' },
      { lat: -6.1724, lng: 106.7163, label: 'GITET Duri Kosambi' },
      { lat: -6.1895, lng: 106.7350, label: 'GITET Kembangan' }
    ],
    relatedAssetIds: ['GI_GNDUL', 'GI_KMBNG', 'GI_DKSBI', 'GI_MKRNG', 'IBT_DKSBI_1', 'IBT_DKSBI_2', 'IBT_MKRNG_1', 'IBT_MKRNG_2']
  },
  {
    id: 9,
    number: 9,
    name: 'SUTET Gandul - Depok',
    lineGiSegment: 'GITET Gandul → GITET Depok',
    uit: 'JBB',
    assetType: 'SUTET',
    voltage: '500 kV',
    riskLevel: 'Rawan',
    sourceGiId: 'GI_GNDUL',
    targetGiId: 'GI_DEPOK',
    edgeId: 'LINE_GNDUL_DEPOK',
    lengthKm: 18.3,
    circuits: 2,
    loadingCircuit1: 68,
    loadingCircuit2: 65,
    operatingStatus: 'Beroperasi',
    condition: 'Saluran Gandul-Depok menampung aliran balik daya dari Selatan Jawa menuju Jakarta Selatan saat PLTU Pelabuhan Ratu beroperasi penuh.',
    impact: '1. Kondisi N-1 memicu tegangan drop di GI Depok dan sekitarnya hingga 0.92 pu.\n2. Overload transformator interbus Depok.',
    mitigation: '1. Pengaturan tap changer transformator IBT Depok dan kompensasi daya reaktif kapasitor.\n2. Pengawasan kestabilan profil tegangan 150 kV.',
    solution: {
      shortTerm: ['Operasi shunt capacitor 150 kV 2x50 MVAR.'],
      mediumTerm: ['Pembangunan interkoneksi Depok - Bogor 500 kV.']
    },
    location: 'Jawa Barat (Depok - Gandul)',
    updatedAt: '20 Juni 2026',
    coordinates: [
      { lat: -6.3312, lng: 106.7871, label: 'GITET Gandul' },
      { lat: -6.4025, lng: 106.7942, label: 'GITET Depok' }
    ],
    relatedAssetIds: ['GI_GNDUL', 'GI_DEPOK']
  },
  {
    id: 11,
    number: 11,
    name: 'SUTET Tambun - Cawang',
    lineGiSegment: 'GITET Tambun → GITET Cawang',
    uit: 'JBB',
    assetType: 'SUTET',
    voltage: '500 kV',
    riskLevel: 'Sedang',
    sourceGiId: 'GI_TMBUN',
    targetGiId: 'GI_CWANG',
    edgeId: 'LINE_TMBUN_CWANG',
    lengthKm: 21.4,
    circuits: 2,
    loadingCircuit1: 58,
    loadingCircuit2: 52,
    operatingStatus: 'Beroperasi',
    condition: 'Pembebanan fluktuatif akibat variasi pasokan PLTGU Muara Tawar ke ring 500 kV Jakarta.',
    impact: '1. Margin kestabilan berkurang saat kondisi cuaca ekstrem.\n2. Keterbatasan transfer daya cadangan.',
    mitigation: '1. Monitoring Real Time Thermal Rating (RTTR).\n2. Penyesuaian beban bay transmisi Tambun.',
    solution: {
      shortTerm: ['Rekonfigurasi bay Tambun 500 kV.'],
      mediumTerm: ['Penguatan jalur transmisi bawah tanah (SKTT).']
    },
    location: 'Jawa Barat - DKI Jakarta',
    updatedAt: '18 Juni 2026',
    coordinates: [
      { lat: -6.2625, lng: 107.0544, label: 'GITET Tambun' },
      { lat: -6.2520, lng: 106.8710, label: 'GITET Cawang' }
    ],
    relatedAssetIds: ['GI_TMBUN', 'GI_CWANG']
  },
  {
    id: 14,
    number: 14,
    name: 'SUTET Balaraja - Lengkong',
    lineGiSegment: 'GITET Balaraja → GITET Lengkong',
    uit: 'JBB',
    assetType: 'SUTET',
    voltage: '500 kV',
    riskLevel: 'Sedang',
    sourceGiId: 'GI_BLRJA',
    targetGiId: 'GI_LNGKG',
    edgeId: 'LINE_BLRJA_LNGKG',
    lengthKm: 34.0,
    circuits: 2,
    loadingCircuit1: 61,
    loadingCircuit2: 57,
    operatingStatus: 'Beroperasi',
    condition: 'Evakuasi beban kawasan Tangerang Selatan dan barat DKI Jakarta.',
    impact: '1. Potensi undervoltage pada GI 150 kV turunan bila terjadi gangguan bersamaan.\n2. Manuver beban ke GIS Serpong terbatas.',
    mitigation: '1. Pengaturan relay proteksi distance zone 2.\n2. Koordinasi setting overcurrent transfer trip.',
    solution: {
      shortTerm: ['Kalibrasi ulang relay teleproteksi.'],
      mediumTerm: ['Pembangunan gardu induk baru Serpong 500 kV.']
    },
    location: 'Banten',
    updatedAt: '15 Juni 2026',
    coordinates: [
      { lat: -6.1956, lng: 106.4522, label: 'GITET Balaraja' },
      { lat: -6.2912, lng: 106.6621, label: 'GITET Lengkong' }
    ],
    relatedAssetIds: ['GI_BLRJA', 'GI_LNGKG']
  },
  {
    id: 19,
    number: 19,
    name: 'SUTET Mandirancan - Tasikmalaya Sirkit 1 & 2',
    lineGiSegment: 'GITET Mandirancan → GITET Tasikmalaya',
    uit: 'JBT',
    assetType: 'SUTET',
    voltage: '500 kV',
    riskLevel: 'Sangat Rawan',
    sourceGiId: 'GI_MDCAN',
    targetGiId: 'GI_TSMYA',
    edgeId: 'LINE_MDCAN_TSMYA',
    lengthKm: 89.7,
    circuits: 2,
    loadingCircuit1: 82,
    loadingCircuit2: 80,
    operatingStatus: 'Beroperasi',
    condition: 'Merupakan jalur transfer daya utama lintas selatan Jawa Barat. Kontur geografis pegunungan rawan tanah longsor dan sambaran petir.',
    impact: '1. Pemutusan transfer daya Jawa Tengah - Jawa Barat sisi selatan.\n2. Berisiko islanding subsistem Tasikmalaya dan Priangan Timur.\n3. Potensi padam meluas hingga 850 MW.',
    mitigation: '1. Pemasangan Transmission Line Arrester (TLA) pada 45 tower rawan petir.\n2. Pembangunan retaining wall penahan longsor pada span kritis.',
    solution: {
      shortTerm: ['Perkuatan pondasi tower lereng bukit.'],
      mediumTerm: ['Pembangunan jalur ganda mandiri Mandirancan - Tasikmalaya sirkit 3 & 4.']
    },
    location: 'Jawa Barat (Kuningan - Tasikmalaya)',
    updatedAt: '24 Juni 2026',
    coordinates: [
      { lat: -6.8643, lng: 108.4821, label: 'GITET Mandirancan' },
      { lat: -7.3274, lng: 108.2207, label: 'GITET Tasikmalaya' }
    ],
    relatedAssetIds: ['GI_MDCAN', 'GI_TSMYA']
  },
  {
    id: 20,
    number: 20,
    name: 'SUTET Ungaran - Pedan',
    lineGiSegment: 'GITET Ungaran → GITET Pedan',
    uit: 'JBT',
    assetType: 'SUTET',
    voltage: '500 kV',
    riskLevel: 'Sangat Rawan',
    sourceGiId: 'GI_UNGRN',
    targetGiId: 'GI_PEDAN',
    edgeId: 'LINE_UNGRN_PEDAN',
    lengthKm: 68.4,
    circuits: 2,
    loadingCircuit1: 85,
    loadingCircuit2: 79,
    operatingStatus: 'Beroperasi',
    condition: 'Tumpuan penyaluran daya dari PLTU Tanjung Jati B dan Batang menuju DI Yogyakarta dan Solo Raya.',
    impact: '1. Defisit daya subsistem DIY dan Solo hingga 450 MW jika terjadi gangguan ganda.\n2. Penurunan tegangan signifikan di subsistem Pedan 150 kV.',
    mitigation: '1. Implementasi Special Protection Scheme (SPS) Pedan-Ungaran.\n2. Penambahan cadangan putar pembangkitan lokal.',
    solution: {
      shortTerm: ['Optimalisasi load tap changer IBT Pedan.'],
      mediumTerm: ['Re-conductoring SUTET Ungaran - Pedan dengan ACCC conductor.']
    },
    location: 'Jawa Tengah',
    updatedAt: '22 Juni 2026',
    coordinates: [
      { lat: -7.1397, lng: 110.4045, label: 'GITET Ungaran' },
      { lat: -7.6782, lng: 110.6698, label: 'GITET Pedan' }
    ],
    relatedAssetIds: ['GI_UNGRN', 'GI_PEDAN']
  },
  {
    id: 29,
    number: 29,
    name: 'SUTET Grati - Paiton Sirkit 1 & 2',
    lineGiSegment: 'GITET Grati → GITET Paiton',
    uit: 'JATIM',
    assetType: 'SUTET',
    voltage: '500 kV',
    riskLevel: 'Rawan',
    sourceGiId: 'GI_GRATI',
    targetGiId: 'GI_PITON',
    edgeId: 'LINE_GRATI_PITON',
    lengthKm: 98.1,
    circuits: 2,
    loadingCircuit1: 74,
    loadingCircuit2: 71,
    operatingStatus: 'Beroperasi',
    condition: 'Jalur utama evakuasi mega komplek PLTU Paiton (4.700 MW) ke pusat beban Surabaya dan sekitarnya.',
    impact: '1. Kelebihan pasokan lokal di Paiton yang berisiko trip unit pembangkit jika terjadi gangguan simultan.\n2. Tekanan stabilitas sudut generator PLTU Paiton.',
    mitigation: '1. Automatic Generation Control (AGC) dan Runback Scheme Paiton.\n2. Pemeliharaan bay penghantar Grati secara terjadwal ketat.',
    solution: {
      shortTerm: ['Uji periodik teleproteksi DTT (Direct Transfer Trip).'],
      mediumTerm: ['Penguatan jalur evakuasi utara Jawa Timur 500 kV.']
    },
    location: 'Jawa Timur (Pasuruan - Probolinggo - Situbondo)',
    updatedAt: '21 Juni 2026',
    coordinates: [
      { lat: -7.6923, lng: 113.0124, label: 'GITET Grati' },
      { lat: -7.7154, lng: 113.5621, label: 'GITET Paiton' }
    ],
    relatedAssetIds: ['GI_GRATI', 'GI_PITON']
  }
];
