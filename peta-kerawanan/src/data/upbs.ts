import { UPB } from '../types/system';

export const jamaliUPBs: UPB[] = [
  {
    id: 'upb-banten',
    systemId: 'jamali',
    name: 'UP2B Banten',
    shortName: 'BANTEN',
    region: 'Banten',
    giCount: 38,
    subsystemCount: 2,
    riskCount: 4,
    riskLevel: 'Rawan',
    lat: -6.1200,
    lng: 106.1503,
    keySubstations: ['GITET Suralaya', 'GITET Balaraja', 'GITET Cilegon', 'GI Serang']
  },
  {
    id: 'upb-jakarta',
    systemId: 'jamali',
    name: 'UP2B Jakarta dan Banten (P2B DKI)',
    shortName: 'JAKARTA',
    region: 'DKI Jakarta',
    giCount: 52,
    subsystemCount: 3,
    riskCount: 8,
    riskLevel: 'Sangat Rawan',
    lat: -6.2088,
    lng: 106.8456,
    keySubstations: ['GITET Gandul', 'GITET Kembangan', 'GITET Duri Kosambi', 'GITET Muara Karang', 'GITET Cawang']
  },
  {
    id: 'upb-jabar',
    systemId: 'jamali',
    name: 'UP2B Jawa Barat',
    shortName: 'JAWA BARAT',
    region: 'Jawa Barat',
    giCount: 58,
    subsystemCount: 3,
    riskCount: 6,
    riskLevel: 'Rawan',
    lat: -6.9175,
    lng: 107.6191,
    keySubstations: ['GITET Cibinong', 'GITET Bandung Selatan', 'GITET Cirata', 'GITET Saguling', 'GITET Bekasi', 'GITET Tasikmalaya']
  },
  {
    id: 'upb-jateng',
    systemId: 'jamali',
    name: 'UP2B Jawa Tengah dan DIY',
    shortName: 'JAWA TENGAH',
    region: 'Jawa Tengah & D.I. Yogyakarta',
    giCount: 49,
    subsystemCount: 2,
    riskCount: 5,
    riskLevel: 'Sedang',
    lat: -7.1509,
    lng: 110.1402,
    keySubstations: ['GITET Ungaran', 'GITET Kesugihan', 'GITET Pemalang', 'GITET Tanjung Jati', 'GITET Pedan']
  },
  {
    id: 'upb-jatim',
    systemId: 'jamali',
    name: 'UP2B Jawa Timur',
    shortName: 'JAWA TIMUR',
    region: 'Jawa Timur & Madura',
    giCount: 54,
    subsystemCount: 2,
    riskCount: 7,
    riskLevel: 'Rawan',
    lat: -7.5360,
    lng: 112.2384,
    keySubstations: ['GITET Krian', 'GITET Gresik', 'GITET Ngimbang', 'GITET Kediri', 'GITET Grati', 'GITET Paiton']
  },
  {
    id: 'upb-bali',
    systemId: 'jamali',
    name: 'UP2B Bali',
    shortName: 'BALI',
    region: 'Bali',
    giCount: 12,
    subsystemCount: 1,
    riskCount: 1,
    riskLevel: 'Sedang',
    lat: -8.4095,
    lng: 115.1889,
    keySubstations: ['GIS Kapal', 'GI Pesanggaran', 'GI Gilimanuk', 'GI Antosari']
  }
];
