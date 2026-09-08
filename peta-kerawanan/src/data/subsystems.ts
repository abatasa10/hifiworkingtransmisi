import { Subsystem } from '../types/system';

export const subsystems: Subsystem[] = [
  // UP2B Jawa Barat
  {
    id: 'sub-bogor',
    upbId: 'upb-jabar',
    name: 'Subsistem Bogor',
    giCount: 8,
    riskLevel: 'Rawan',
    riskCount: 2,
    transformerCount: 14,
    peakLoadMW: 920,
    description: 'Dipasok dari GITET Bogor 500 kV dengan IBT 500/150 kV melayani beban industri dan pemukiman Bogor Raya.'
  },
  {
    id: 'sub-depok',
    upbId: 'upb-jabar',
    name: 'Subsistem Depok',
    giCount: 6,
    riskLevel: 'Sedang',
    riskCount: 1,
    transformerCount: 10,
    peakLoadMW: 680,
    description: 'Mendapat pasokan daya dari GITET Depok 500 kV dan terhubung dengan GITET Gandul & Cibinong.'
  },
  {
    id: 'sub-cileungsi',
    upbId: 'upb-jabar',
    name: 'Subsistem Cileungsi',
    giCount: 7,
    riskLevel: 'Aman',
    riskCount: 0,
    transformerCount: 12,
    peakLoadMW: 750,
    description: 'Pusat kawasan industri manufaktur timur Jakarta dengan suplai dari GITET Cibatu dan GITET Bekasi.'
  },
  {
    id: 'sub-bandung',
    upbId: 'upb-jabar',
    name: 'Subsistem Bandung Selatan - Saguling - Cirata',
    giCount: 18,
    riskLevel: 'Sedang',
    riskCount: 2,
    transformerCount: 28,
    peakLoadMW: 1850,
    description: 'Disokong PLTA Saguling & Cirata serta GITET Bandung Selatan 500 kV.'
  },

  // UP2B Jakarta
  {
    id: 'sub-durkos-mkrng',
    upbId: 'upb-jakarta',
    name: 'Subsistem Duri Kosambi - Muara Karang',
    giCount: 12,
    riskLevel: 'Sangat Rawan',
    riskCount: 3,
    transformerCount: 22,
    peakLoadMW: 1700,
    description: 'Mendapat pasokan radial dari SUTET Gandul-Durkos-Kembangan dengan pembebanan tinggi (Kerawanan #7).'
  },
  {
    id: 'sub-gandul',
    upbId: 'upb-jakarta',
    name: 'Subsistem Gandul 500/150 kV',
    giCount: 15,
    riskLevel: 'Rawan',
    riskCount: 2,
    transformerCount: 26,
    peakLoadMW: 2100,
    description: 'Hub transmisi strategis DKI Jakarta Selatan dan pengatur beban P2B Gandul.'
  },
  {
    id: 'sub-cawang-priok',
    upbId: 'upb-jakarta',
    name: 'Subsistem Cawang - Priok',
    giCount: 14,
    riskLevel: 'Sedang',
    riskCount: 2,
    transformerCount: 24,
    peakLoadMW: 1950,
    description: 'Jaringan cincin 150 kV DKI Jakarta melayani pusat pemerintahan dan pelabuhan.'
  },

  // UP2B Jawa Timur
  {
    id: 'sub-krian-gresik',
    upbId: 'upb-jatim',
    name: 'Subsistem Krian 1,2 - Gresik 1,2',
    giCount: 16,
    riskLevel: 'Rawan',
    riskCount: 2,
    transformerCount: 28,
    peakLoadMW: 2250,
    description: 'Pusat beban industri Surabaya dan Gresik yang didukung PLTU/PLTGU Gresik dan GITET Krian.'
  },
  {
    id: 'sub-krian-345',
    upbId: 'upb-jatim',
    name: 'Subsistem Krian 3,4,5',
    giCount: 11,
    riskLevel: 'Sedang',
    riskCount: 1,
    transformerCount: 18,
    peakLoadMW: 1450,
    description: 'Memasok jaringan industri Sidoarjo, Mojokerto dan Surabaya Selatan.'
  },
  {
    id: 'sub-ngimbang',
    upbId: 'upb-jatim',
    name: 'Subsistem Ngimbang 1,2',
    giCount: 9,
    riskLevel: 'Sedang',
    riskCount: 1,
    transformerCount: 14,
    peakLoadMW: 980,
    description: 'Penyalur daya Jawa Timur bagian barat dan penghubung transfer daya Jawa Tengah.'
  },
  {
    id: 'sub-kediri-12',
    upbId: 'upb-jatim',
    name: 'Subsistem Kediri 1,2',
    giCount: 8,
    riskLevel: 'Aman',
    riskCount: 0,
    transformerCount: 12,
    peakLoadMW: 820,
    description: 'Melayani eks karesidenan Kediri, Blitar, dan Tulungagung.'
  },
  {
    id: 'sub-grati',
    upbId: 'upb-jatim',
    name: 'Subsistem Grati 1,2,3',
    giCount: 10,
    riskLevel: 'Sedang',
    riskCount: 1,
    transformerCount: 16,
    peakLoadMW: 1120,
    description: 'Disokong oleh PLTGU Grati 800 MW memasok Pasuruan, Probolinggo dan Malang.'
  },
  {
    id: 'sub-paiton',
    upbId: 'upb-jatim',
    name: 'Subsistem Paiton 1,2,3',
    giCount: 7,
    riskLevel: 'Rawan',
    riskCount: 2,
    transformerCount: 12,
    peakLoadMW: 950,
    description: 'Evakuasi daya sentral kompleks PLTU Paiton 4.700 MW ke arah timur (Bali) dan barat (Jawa).'
  },

  // UP2B Jawa Tengah
  {
    id: 'sub-ungaran',
    upbId: 'upb-jateng',
    name: 'Subsistem Ungaran 500/150 kV',
    giCount: 14,
    riskLevel: 'Rawan',
    riskCount: 2,
    transformerCount: 22,
    peakLoadMW: 1680,
    description: 'Sentral transfer daya Jateng utara menghubungkan Semarang, Kendal, dan Demak.'
  },
  {
    id: 'sub-pedan',
    upbId: 'upb-jateng',
    name: 'Subsistem Pedan 500/150 kV',
    giCount: 12,
    riskLevel: 'Sedang',
    riskCount: 1,
    transformerCount: 18,
    peakLoadMW: 1350,
    description: 'Penyokong utama beban Daerah Istimewa Yogyakarta dan Surakarta.'
  },

  // UP2B Bali
  {
    id: 'sub-bali',
    upbId: 'upb-bali',
    name: 'Subsistem Bali 150 kV',
    giCount: 12,
    riskLevel: 'Sedang',
    riskCount: 1,
    transformerCount: 18,
    peakLoadMW: 1050,
    description: 'Terhubung melalui Kabel Laut 150 kV Jawa-Bali Sirkit 1-4 dari Banyuwangi ke Gilimanuk.'
  }
];
