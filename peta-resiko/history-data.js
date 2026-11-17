// ==========================================================================
// PLN MANTAPS - ASSET RISK TRAJECTORY & 30 HISTORICAL DRIFT LOGS
// Provides:
// 1. -1 step previous position (T-1) with movement date for scatterplot trajectory
// 2. Up to 30 chronological movement records for table view audit trail
// ==========================================================================

function hashString(str) {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// 1. SCATTERPLOT MOVEMENT (-1 STEP)
function getPreviousMove(item, activeDimension = 'tier') {
  if (!item) return { hasMoved: false };

  const h = hashString(item.id || item.name || 'item');
  // Deterministic: ~55% of items have movement history
  const hasMoved = (h % 10) < 6;
  if (!hasMoved) return { hasMoved: false };

  const currRow = item.levelAhiAge || 3;
  let currCol = (item.matrixCol !== undefined) ? item.matrixCol : 3;
  if (activeDimension === 'pelanggan') {
    currCol = (item.matrixColPelanggan !== undefined) ? item.matrixColPelanggan : (item.levelPelanggan || (6 - (item.kategoriPelanggan || 1)));
  } else if (activeDimension === 'beban') {
    currCol = item.levelBeban || 3;
  } else if (activeDimension === 'kerawanan') {
    currCol = item.levelKerawanan || 3;
  }

  // Calculate previous row and col
  const moveType = (h % 4);
  let prevRow = currRow;
  let prevCol = currCol;
  let direction = 'improve'; // default improved after maintenance

  if (currRow >= 4) {
    if (moveType === 0) {
      prevRow = Math.min(5, currRow + 1);
      direction = 'improve';
    } else if (moveType === 1) {
      prevRow = Math.min(5, currRow + 1);
      direction = 'improve';
    } else {
      prevRow = Math.max(1, currRow - 1);
      direction = 'degrade';
    }
  } else if (currRow <= 2) {
    if (moveType === 0) {
      prevRow = Math.max(1, currRow - 1);
      direction = 'degrade';
    } else {
      prevRow = Math.min(5, currRow + 1);
      direction = 'improve';
    }
  } else {
    prevRow = (h % 2 === 0) ? Math.min(5, currRow + 1) : Math.max(1, currRow - 1);
    direction = (prevRow > currRow) ? 'improve' : 'degrade';
  }

  // Ensure prev position is not identical to current
  if (prevRow === currRow) {
    prevRow = currRow >= 3 ? currRow - 1 : currRow + 1;
    direction = (prevRow > currRow) ? 'improve' : 'degrade';
  }

  // Prev Col (occasionally moved across col if beban or tier changed)
  if ((h % 5) === 0) {
    prevCol = currCol >= 3 ? Math.max(1, currCol - 1) : Math.min(5, currCol + 1);
  }

  const cells = (typeof MATRIX_CONFIG !== 'undefined' && MATRIX_CONFIG.cells) ? MATRIX_CONFIG.cells : null;
  const rawPrev = (cells && cells[prevRow] && cells[prevRow][prevCol]) || {};
  const rawCurr = (cells && cells[currRow] && cells[currRow][currCol]) || {};

  const prevCell = {
    num: (rawPrev.num !== undefined) ? rawPrev.num : 15,
    title: rawPrev.title || 'Moderate',
    cat: rawPrev.cat || 'Moderate',
    color: rawPrev.color || '#fff200'
  };

  const currCell = {
    num: (rawCurr.num !== undefined) ? rawCurr.num : (item.cellNum || 15),
    title: rawCurr.title || item.cellTitle || item.riskCategory || 'Moderate',
    cat: rawCurr.cat || item.riskCategory || 'Moderate',
    color: rawCurr.color || '#fff200'
  };

  const dates = [
    '18 Okt 2024',
    '28 Agu 2024',
    '14 Jul 2024',
    '02 Jun 2024',
    '19 Mei 2024',
    '11 Apr 2024',
    '24 Feb 2024',
    '15 Jan 2024'
  ];
  const date = dates[h % dates.length];

  const reasons = {
    improve: 'Pemeliharaan 2 Tahunan & Treatment minyak trafo (Indeks AHI meningkat)',
    degrade: 'Kenaikan beban puncak subsistem & indikasi hotspot thermovisi pada klem jumper'
  };

  return {
    hasMoved: true,
    date,
    direction,
    directionLabel: direction === 'improve' ? 'Risiko Membaik' : 'Risiko Meningkat',
    prevRow,
    prevCol,
    prevCell,
    currRow,
    currCol,
    currCell,
    reason: reasons[direction]
  };
}

// 2. UP TO 30 MOVEMENT EVENTS FOR TABLE VIEW
function getItemHistory30(item) {
  if (!item) return [];

  const baseHash = hashString(item.id || item.name || 'item');
  const events = [];

  const workTypes = [
    { type: 'Pemeliharaan 2 Tahunan', dir: 'improve', note: 'Overhaul PMT, pengujian tahanan isolasi & kontak, pembersihan isolator busbar.' },
    { type: 'Anomali Thermovisi Hotspot', dir: 'degrade', note: 'Terdeteksi hotspot delta T > 15°C pada klem jumper konduktor phasa S.' },
    { type: 'Hasil Uji DGA (Dissolved Gas)', dir: 'degrade', note: 'Kenaikan gas C2H2 dan Ethylene mengindikasikan thermal hotspot internal trafo.' },
    { type: 'Treatment Minyak Trafo', dir: 'improve', note: 'Purifikasi & degassing minyak isolasi, pengujian breakdown voltage naik ke 68 kV.' },
    { type: 'Penggantian Lightning Arrester', dir: 'improve', note: 'Penggantian LA fasa R pasca arus bocor resistif melebihi batas standar SPLN.' },
    { type: 'Kenaikan Beban Puncak', dir: 'degrade', note: 'Beban feeder meningkat saat manuver transfer beban subsistem regional.' },
    { type: 'Inspeksi Level 2 Pasca Gangguan', dir: 'improve', note: 'Investigasi trip proteksi diferensial, perbaikan rele dan penormalan sistem.' },
    { type: 'Overhaul Disconnecting Switch', dir: 'improve', note: 'Penggantian finger kontak PMS yang aus dan penyetelan motor penggerak.' },
    { type: 'Penuaan Isolasi & Uji Polarisasi', dir: 'degrade', note: 'Indeks polarisasi (IP) turun di bawah 1.5 menandakan degradasi isolasi kertas.' },
    { type: 'Pembersihan Polusi & Coating RTV', dir: 'improve', note: 'Aplikasi silicone coating pada piring isolator area pesisir/korosif.' }
  ];

  let currRow = item.levelAhiAge || 3;
  let currCol = (item.matrixCol !== undefined) ? item.matrixCol : 3;

  const baseDate = new Date(2024, 9, 18, 10, 30); // 18 Okt 2024

  for (let i = 0; i < 30; i++) {
    const h = (baseHash + i * 17) % workTypes.length;
    const template = workTypes[h];

    baseDate.setDate(baseDate.getDate() - (i === 0 ? 0 : Math.floor(10 + ((i * 19) % 28))));

    const dateStr = baseDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + (8 + (i % 9)).toString().padStart(2, '0') + ':' + ((i * 17) % 60).toString().padStart(2, '0') + ' WIB';

    let fromRow = currRow;
    let fromCol = currCol;
    let toRow = currRow;
    let toCol = currCol;

    if (template.dir === 'improve') {
      fromRow = Math.min(5, currRow + 1);
    } else {
      fromRow = Math.max(1, currRow - 1);
    }

    if ((i % 4) === 0) {
      fromCol = currCol >= 3 ? Math.max(1, currCol - 1) : Math.min(5, currCol + 1);
    }

    const cells = (typeof MATRIX_CONFIG !== 'undefined' && MATRIX_CONFIG.cells) ? MATRIX_CONFIG.cells : null;
    const fromCell = (cells && cells[fromRow] && cells[fromRow][fromCol]) || { num: 15, title: 'Moderate', cat: 'Moderate', color: '#fff200' };
    const toCell = (cells && cells[toRow] && cells[toCol]) || { num: 15, title: 'Moderate', cat: 'Moderate', color: '#fff200' };

    const dirLabel = template.dir === 'improve' ? 'Risiko Membaik' : 'Risiko Meningkat';
    const dirClass = template.dir === 'improve' ? 'improve' : 'degrade';

    events.push({
      num: 30 - i,
      seq: i + 1,
      date: dateStr,
      fromCell,
      toCell,
      fromRow,
      fromCol,
      toRow,
      toCol,
      direction: dirClass,
      directionLabel: dirLabel,
      workType: template.type,
      note: template.note,
      ahi: template.dir === 'improve' ? '64% ➔ 82%' : '80% ➔ 58%',
      beban: (65 + ((baseHash + i * 3) % 25)).toFixed(1) + '%'
    });

    // Walk back
    currRow = fromRow;
    currCol = fromCol;
  }

  return events;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getPreviousMove,
    getItemHistory30,
    hashString
  };
}
