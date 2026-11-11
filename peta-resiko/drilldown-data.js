// ==========================================================================
// PLN MANTAPS - DRILL-DOWN DATA (BAY, ASSET & DETAIL INSPEKSI)
// Full Max-OR Compliant Aggregation: GI = Max(Bays), Bay = Max(Assets)
// ==========================================================================

const BAYS_DATA = {};
const ASSETS_DATA = {};

function round(val, dec = 2) {
  const p = Math.pow(10, dec);
  return Math.round(val * p) / p;
}

// 1. DISTRIBUSI SUMBU Y BERDASARKAN LOGIKA MAX-OR
// Menjamin nilai maksimum di dalam tepat sama dengan induknya (tidak boleh lebih tinggi)
function getBayYDistribution(giY, count = 6) {
  if (giY === 5) {
    const arr = [5, 5, 4, 3, 2, 1, 4];
    return arr.slice(0, count);
  }
  if (giY === 4) {
    const arr = [4, 4, 3, 2, 2, 1, 3];
    return arr.slice(0, count);
  }
  if (giY === 3) {
    const arr = [3, 3, 2, 2, 1, 1, 2];
    return arr.slice(0, count);
  }
  if (giY === 2) {
    const arr = [2, 2, 1, 1, 1, 1, 1];
    return arr.slice(0, count);
  }
  return [1, 1, 1, 1, 1, 1, 1].slice(0, count);
}

function getAssetYDistribution(bayY, count = 12) {
  if (bayY === 5) {
    const arr = [5, 5, 4, 4, 3, 3, 2, 2, 2, 2, 1, 1, 4, 3, 2];
    return arr.slice(0, count);
  }
  if (bayY === 4) {
    const arr = [4, 4, 3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 3, 2, 2];
    return arr.slice(0, count);
  }
  if (bayY === 3) {
    const arr = [3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 1];
    return arr.slice(0, count);
  }
  if (bayY === 2) {
    const arr = [2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    return arr.slice(0, count);
  }
  return [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].slice(0, count);
}

// 2. GENERATOR BAY DENGAN ATURAN MAX-OR & TIER INHERITANCE
function getBaysForSubstation(sub) {
  if (!sub) return [];
  const giTier = (sub.tier !== undefined && sub.tier !== null) ? sub.tier : 1;
  const giY = (sub.levelAhiAge !== undefined && sub.levelAhiAge !== null) ? sub.levelAhiAge : 3;
  const is500 = (sub.tegangan && String(sub.tegangan).includes('500')) || (sub.name && sub.name.includes('500KV'));
  const isGrati = sub.id === 'GI-UITJBM-GRATI' || (sub.name && sub.name.includes('GRATI'));

  // Sumbu X: Matrix Col (Col 5 = Tier 1, Col 1 = Tier 5)
  const targetX = giTier;
  const targetCol = 6 - targetX;

  // Nama-nama Bay realistis
  let bayTemplates = [];
  if (isGrati) {
    bayTemplates = [
      { name: "PHT 500KV PAITON #1", type: "Penghantar 500kV" },
      { name: "PHT 500KV PAITON #2", type: "Penghantar 500kV" },
      { name: "PHT 500KV KRIAN #1", type: "Penghantar 500kV" },
      { name: "PHT 500KV KRIAN #2", type: "Penghantar 500kV" },
      { name: "BAY IBT 500/150KV #1", type: "Interbus Transformer" },
      { name: "BAY IBT 500/150KV #2", type: "Interbus Transformer" },
      { name: "BAY GENERATOR BLOK 1 PLTGU GRATI", type: "Generator Trafo" }
    ];
  } else if (is500) {
    bayTemplates = [
      { name: "PHT 500kV Feeder #1", type: "Penghantar 500kV" },
      { name: "PHT 500kV Feeder #2", type: "Penghantar 500kV" },
      { name: "BAY IBT 500/150kV #1", type: "Interbus Transformer" },
      { name: "BAY IBT 500/150kV #2", type: "Interbus Transformer" },
      { name: "BAY REAKTOR 500kV", type: "Shunt Reactor" },
      { name: "BAY KOPEL 500kV", type: "Kopel Busbar" }
    ];
  } else {
    bayTemplates = [
      { name: "PHT 150kV Feeder #1", type: "Penghantar 150kV" },
      { name: "PHT 150kV Feeder #2", type: "Penghantar 150kV" },
      { name: "BAY TRAFO 150/20kV #1", type: "Transformator Daya" },
      { name: "BAY TRAFO 150/20kV #2", type: "Transformator Daya" },
      { name: "BAY KOPEL 150kV", type: "Kopel Busbar" },
      { name: "BAY FEEDER CADANGAN", type: "Penghantar 150kV" }
    ];
  }

  const yLevels = getBayYDistribution(giY, bayTemplates.length);

  return bayTemplates.map((bt, idx) => {
    const bayId = `BAY-${sub.id}-${idx + 1}`;
    const dLat = (idx - 2) * 0.0004;
    const dLon = (idx - 2) * 0.0004;

    const targetY = yLevels[idx]; // Menjamin <= giY dan nilai max === giY
    const cellData = (MATRIX_CONFIG.cells && MATRIX_CONFIG.cells[targetY] && MATRIX_CONFIG.cells[targetY][targetCol]) || { cat: "Moderate", num: 15, title: "Moderate" };

    return {
      id: bayId,
      name: `${sub.name.replace(/(GI|GITET|GISTET)\s+[\w\s]+\s+/, '')} - ${bt.name}`,
      bayType: bt.type,
      giId: sub.id,
      giName: sub.name,
      unit: sub.unit,
      upt: sub.upt,
      ultg: sub.ultg,
      tegangan: is500 ? 500 : (sub.tegangan ? String(sub.tegangan).replace(/\D/g, '') : '150'),
      beban: round((sub.beban || 75.0) * (0.85 + (idx % 3) * 0.1), 2),
      tier: targetX,       // Sumbu X (Tier 1..5, Pasti sama dengan GI)
      matrixCol: targetCol,// Kolom Matrix Tier: 1..5
      kategoriPelanggan: sub.kategoriPelanggan || 1, // Kategori Pelanggan 1..5 (Pasti sama dengan GI)
      kategoriPelangganName: sub.kategoriPelangganName || 'OBVITNAS',
      kategoriPelangganLabel: sub.kategoriPelangganLabel || 'Kategori 1 (OBVITNAS)',
      kategoriPelangganDesc: sub.kategoriPelangganDesc || '',
      matrixColPelanggan: (sub.matrixColPelanggan !== undefined) ? sub.matrixColPelanggan : (6 - (sub.kategoriPelanggan || 1)),
      levelAhiAge: targetY,// Sumbu Y: 1..5 (Maksimal sama dengan GI)
      riskCategory: cellData.cat,
      cellNum: cellData.num,
      cellTitle: cellData.title,
      lat: round(sub.lat + dLat, 6),
      lon: round(sub.lon + dLon, 6),
      totalAssets: 12
    };
  });
}

// 3. GENERATOR ASET DENGAN ATURAN MAX-OR & TIER / KATEGORI PELANGGAN INHERITANCE
function getAssetsForBay(bay) {
  if (!bay) return [];
  const bayTier = (bay.tier !== undefined && bay.tier !== null) ? bay.tier : 1;
  const bayY = (bay.levelAhiAge !== undefined && bay.levelAhiAge !== null) ? bay.levelAhiAge : 3;
  const bayCol = (bay.matrixCol !== undefined && bay.matrixCol !== null) ? bay.matrixCol : (6 - bayTier);
  const bayKat = (bay.kategoriPelanggan !== undefined && bay.kategoriPelanggan !== null) ? bay.kategoriPelanggan : 1;
  const bayKatName = bay.kategoriPelangganName || 'OBVITNAS';
  const bayKatLabel = bay.kategoriPelangganLabel || 'Kategori 1 (OBVITNAS)';
  const bayKatDesc = bay.kategoriPelangganDesc || '';
  const bayColPelanggan = (bay.matrixColPelanggan !== undefined && bay.matrixColPelanggan !== null) ? bay.matrixColPelanggan : (6 - bayKat);

  const equipTemplates = [
    { jenis: "Lightning Arrester", merk: "SIEMENS", ph: "R" },
    { jenis: "Lightning Arrester", merk: "SIEMENS", ph: "S" },
    { jenis: "Lightning Arrester", merk: "SIEMENS", ph: "T" },
    { jenis: "Current Transformer", merk: "ABB", ph: "R" },
    { jenis: "Current Transformer", merk: "ABB", ph: "S" },
    { jenis: "Current Transformer", merk: "ABB", ph: "T" },
    { jenis: "Capacitive Voltage Transformer", merk: "HAEFELY", ph: "R" },
    { jenis: "Capacitive Voltage Transformer", merk: "HAEFELY", ph: "S" },
    { jenis: "Capacitive Voltage Transformer", merk: "HAEFELY", ph: "T" },
    { jenis: "Circuit Breaker", merk: "ALSTOM", ph: "3 Phase" },
    { jenis: "Disconnecting Switch", merk: "COOPER", ph: "3 Phase" },
    { jenis: "Wave Trap / Line Trap", merk: "TRENCH", ph: "R" }
  ];

  const yLevels = getAssetYDistribution(bayY, equipTemplates.length);

  return equipTemplates.map((eq, idx) => {
    const assetId = `AST-${bay.id}-${idx + 1}`;
    const targetY = yLevels[idx]; // Menjamin <= bayY dan nilai max === bayY
    const targetX = bayTier;      // Pasti sama dengan Bay & GI
    const targetCol = bayCol;

    const cellData = (MATRIX_CONFIG.cells && MATRIX_CONFIG.cells[targetY] && MATRIX_CONFIG.cells[targetY][targetCol]) || { cat: "Moderate", num: 15, title: "Moderate" };

    const dLat = (idx - 6) * 0.00008;
    const dLon = (idx - 6) * 0.00008;

    return {
      id: assetId,
      techidentno: `163614361361${idx + 100000}`,
      name: `${eq.jenis} - ${eq.merk} - ${idx + 22083040} - ${eq.ph}`,
      jenisAset: eq.jenis,
      merk: eq.merk,
      tipe: "STD-HV-SERIES",
      phasa: eq.ph,
      serialId: `${idx + 22083040}`,
      statusAset: "Operasi",
      usiaAset: Math.floor(Math.random() * 8) + 3,
      ahiScore: targetY >= 5 ? "5 - Critical" : targetY === 4 ? "4 - Poor" : targetY === 3 ? "3 - Fair" : "2 - Good",
      bebanMW: bay.beban,
      riskScore: `${cellData.num} - ${cellData.title}`,
      riskCategory: cellData.cat,
      cellNum: cellData.num,
      cellTitle: cellData.title,
      tier: targetX,
      matrixCol: targetCol,
      kategoriPelanggan: bayKat,
      kategoriPelangganName: bayKatName,
      kategoriPelangganLabel: bayKatLabel,
      kategoriPelangganDesc: bayKatDesc,
      matrixColPelanggan: bayColPelanggan,
      levelAhiAge: targetY,
      lat: round(bay.lat + dLat, 6),
      lon: round(bay.lon + dLon, 6),
      inspections: [
        { no: 1, subSistem: "Dielectric", parameter: "Tahanan Isolasi Primary Unit", skor: targetY >= 5 ? "5 - Critical" : targetY === 4 ? "4 - Poor" : "2 - Good", noInspeksi: `LOG2026${idx+100}`, tglInspeksi: "27 Januari 2024 00:00:00" },
        { no: 2, subSistem: "Primary Unit", parameter: "Thermovisi Body Aset", skor: "2 - Good", noInspeksi: `INS2026${idx+200}`, tglInspeksi: "09 November 2026 15:00:14" },
        { no: 3, subSistem: "Primary Unit", parameter: "Pengukuran Arus Bocor (LCM)", skor: "2 - Good", noInspeksi: `INS2026${idx+300}`, tglInspeksi: "20 Oktober 2026 09:34:29" },
        { no: 4, subSistem: "Primary Unit", parameter: "Kondisi Fisik Peralatan", skor: "-", noInspeksi: "-", tglInspeksi: "-" }
      ]
    };
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BAYS_DATA, ASSETS_DATA, getBaysForSubstation, getAssetsForBay, getBayYDistribution, getAssetYDistribution };
}
