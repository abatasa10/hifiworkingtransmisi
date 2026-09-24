export interface ColumnMapping {
  gi: string;         // Kolom Nama Gardu Induk / Asset
  code: string;       // Kolom Kode Singkatan
  tier: string;       // Kolom Tier (Mulai 0) - untuk Sheet 2 (GI)
  tierFrom: string;   // Kolom Tier Dari GI - untuk Sheet 1 (Jalur Transmisi)
  tierTo: string;     // Kolom Tier Ke GI - untuk Sheet 1 (Jalur Transmisi)
  assetType: string;  // Kolom Tipe Simbol SLD / Tipe Asset
  symbolFrom: string; // Kolom Tipe Simbol Dari GI (Sheet 1)
  symbolTo: string;   // Kolom Tipe Simbol Ke GI (Sheet 1)
  busbarShape: string; // Kolom Bentuk Busbar (Normal / Panjang)
  capacity: string;   // Kolom Kapasitas (MVA / MW)
  ibtNumber: string;  // Kolom No IBT (1, 2, 4, dll)
  from: string;       // Kolom Dari GI
  to: string;         // Kolom Ke GI
  lineName: string;   // Kolom Nama Penghantar
  voltage: string;    // Kolom Tegangan
  risk: string;       // Kolom Status / Tingkat Kerawanan
  riskNumber: string; // Kolom No Kerawanan (#11, 1, 2, 1&2)
  load: string;       // Kolom Pembebanan Sirkit 1 / Nilai MW
  loadC2: string;     // Kolom Pembebanan Sirkit 2
  circuits: string;   // Kolom Jumlah Sirkit
  circuitNumber: string; // Kolom No Sirkit (1, 2) untuk 2-Line
  lengthKm: string;   // Kolom Panjang Saluran (km)
  corridor: string;   // Kolom Koridor / Wilayah
  uit: string;        // Kolom UIT (Unit Induk Transmisi)
  condition: string;  // Kolom Kondisi / Permasalahan
  impact: string;     // Kolom Dampak
  mitigation: string; // Kolom Mitigasi
  solution: string;   // Kolom Usulan / Solusi
  bus150: string;     // Kolom Bus 150 kV (IBT 3-Winding -> busbar tujuan) [engine]
  feeder: string;     // Kolom Feeder / GI Induk (Bay) [engine]
  bayKind: string;    // Kolom Jenis Bay / Tipe [engine]
  viewKey: string;    // Kolom Sudut Pandang / View [engine]
  status: string;     // Kolom Status Operasi [engine]
  noKerawanan: string; // Kolom No Kerawanan [engine]
  connectedTo: string; // Kolom Terhubung ke (kode GI, pisah ;) — info aset terkait
  impactedGis: string; // Kolom GI Terdampak (kode GI, pisah ;) — info dampak gangguan
  functLoc: string;    // Kolom ID FunctLoc — kunci join ke DB aset/bay
}

export const emptyColumnMapping = (): ColumnMapping => ({
  gi: '', code: '', tier: '', tierFrom: '', tierTo: '', assetType: '',
  symbolFrom: '', symbolTo: '', busbarShape: '', capacity: '', ibtNumber: '',
  from: '', to: '', lineName: '', voltage: '', risk: '', riskNumber: '',
  load: '', loadC2: '', circuits: '', circuitNumber: '', lengthKm: '',
  corridor: '', uit: '', condition: '', impact: '', mitigation: '', solution: '',
  bus150: '', feeder: '', bayKind: '', viewKey: '', status: '', noKerawanan: '',
  connectedTo: '', impactedGis: '', functLoc: ''
});

export const cleanKey = (str: unknown): string => {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

export const autoDetectMapping = (headers: string[]): ColumnMapping => {
  const colMap: Record<string, string> = {};
  headers.forEach((h) => {
    colMap[cleanKey(h)] = h;
  });

  const findHeader = (patterns: string[], exclude: string[] = []): string => {
    for (const p of patterns) {
      for (const k of Object.keys(colMap)) {
        const originalHeader = colMap[k];
        if (exclude.includes(originalHeader)) continue;
        if (k === p || k.includes(p)) return originalHeader;
      }
    }
    return '';
  };

  // Strict Dari/Ke detection: only treat a column as a line endpoint when its
  // header IS a dari/ke-style column name. The loose substring matches (`asal`
  // inside "Permasalahan", `ke` inside "Status Kerawanan") misclassified
  // object/description sheets as line sheets.
  const headerKeys = headers.map(cleanKey);
  const fromRaw =
    headerKeys.find((k) => /^(darigi|bus1|source|pangkal|dari|from|asal)$/.test(k)) ||
    headerKeys.find((k) => k.includes('darigi'));
  const toRaw =
    headerKeys.find((k) => /^(kegi|bus2|target|ujung|ke|to|tujuan)$/.test(k)) ||
    headerKeys.find((k) => k.includes('kegi'));
  const fromCol = fromRaw ? colMap[fromRaw] || '' : '';
  const toCol = toRaw ? colMap[toRaw] || '' : '';
  const lineNameCol = findHeader(['namapenghantar', 'penghantar', 'namaline', 'line', 'jalur', 'transmisi', 'bay'], [fromCol, toCol]);
  const isLineSheet = Boolean(fromCol && toCol);
  const giCol =
    findHeader(
      ['namaasset', 'namagarduinduk', 'namagi', 'garduinduk', 'namagardu', 'functlocgarduinduk', 'substation', 'functloc'],
      [fromCol, toCol, lineNameCol]
    ) || (isLineSheet ? '' : findHeader(['gi', 'gardu', 'nama'], [fromCol, toCol, lineNameCol]));
  const codeCol = findHeader(['kodesingkatan', 'kodesingkat', 'kode', 'code', 'singkatan']);
  const tierCol = findHeader(['tiermulai0', 'tier', 'leveltier', 'hirarki', 'hierarchy', 'level']);
  const tierFromCol = findHeader(['tierdarigi', 'tierdari', 'tierfrom', 'tiersumber', 'tierasal']);
  const tierToCol = findHeader(['tierkegi', 'tierke', 'tierto', 'tiertujuan', 'tierujung']);
  const assetTypeCol = findHeader(['tipesimbolsld', 'tipesimbol', 'jenissimbol', 'tipeasset', 'tipe', 'jenisasi', 'jenis', 'type']);
  const symbolFromCol = findHeader(['tipesimboldarigi', 'tipesimboldari', 'simboldarigi', 'simboldari', 'tipedarigi', 'tipedari']);
  const symbolToCol = findHeader(['tipesimbolkegi', 'tipesimbolke', 'simbolkegi', 'simbolke', 'tipekegi', 'tipeke']);
  const busbarShapeCol = findHeader(['bentukbusbar', 'bentukrel', 'busbarshape', 'tipebusbar']);
  const capacityCol = findHeader(['kapasitasmva', 'kapasitasmw', 'kapasitas', 'capacity', 'mva', 'mw']);
  const ibtNumCol = findHeader(['noibt', 'nomoribt', 'nomeribt', 'ibt', 'unitibt']);
  const voltageCol = findHeader(['tegangan', 'kv', 'voltage', 'level']);
  const riskCol = findHeader(['tingkatkerawanan', 'statuskerawanan', 'kerawanan', 'statusasset', 'status', 'kategori', 'risk']);
  const riskNumCol = findHeader(['nokerawanan', 'nomorkerawanan', 'nomerkerawanan', 'idkerawanan', 'norisk']);
  const loadCol = findHeader(['pembebanansirkit1', 'pembebanan', 'loading', 'bebanmw', 'load', 'beban', 'mw', 'mva', 'arus', 'ampere'], [capacityCol || '']);
  const loadC2Col = findHeader(['pembebanansirkit2', 'beban2', 'load2', 'loading2']);
  const circuitsCol = findHeader(['jumlahsirkit', 'sirkit', 'circuits', 'jmlsirkit']);
  const circuitNumCol = findHeader(['nosirkit', 'nomorsirkit', 'sirkitke', 'circuitno', 'circuitnum', 'linesirkit']);
  const lengthKmCol = findHeader(['panjangsaluran', 'panjangkm', 'panjang', 'length', 'km']);
  const corridorCol = findHeader(['koridor', 'wilayah', 'region', 'lokasi', 'provinsi']);
  const uitCol = findHeader(['uit', 'unitinduktransmisi', 'unitinduk', 'unit']);
  const conditionCol = findHeader(['kondisipermasalahan', 'permasalahan', 'kondisi', 'kendala', 'isu']);
  const impactCol = findHeader(['dampak', 'impact', 'akibat', 'risiko']);
  const mitigationCol = findHeader(['mitigasi', 'mitigation', 'pencegahan', 'penanganan']);
  const solutionCol = findHeader(['usulansolusi', 'usulan', 'solusi', 'solution', 'rekomendasi', 'jangkapendek']);
  const bus150Col = findHeader(['bus150kv', 'bus150', 'buslv', 'kebus', 'outlet', 'terhubungkebus']);
  const feederCol = findHeader(['feeder', 'feedergiinduk', 'giinduk', 'induk', 'feeder']);
  const bayKindCol = findHeader(['jenisbay', 'jenis', 'tipebay'], [assetTypeCol]);
  const viewKeyCol = findHeader(['sudutpandang', 'viewkey', 'kunciview', 'view', 'kodesudutpandang']);
  const statusCol = findHeader(['statusoperasi', 'status'],
    riskCol && riskCol === 'status' ? [riskCol] : []);
  const noKerawananCol = findHeader(['nokerawanan', 'nomorkerawanan', 'norisik', 'norisk']);
  // Explicit related-asset columns. Headers must be specific ('Terhubung ke',
  // 'GI Terdampak'): bare 'ke'/'dampak' belong to the line/risk detectors.
  const connectedToCol = findHeader(['terhubungke', 'terhubung', 'koneksi', 'connectedto', 'connected']);
  const impactedGisCol = findHeader(['giterdampak', 'dampakgi', 'zonaterdampak', 'affectedgis']);
  // ID FunctLoc (kunci join DB aset/bay). Header spesifik dulu; pola umum
  // 'functloc'/'funtloc' terakhir agar tidak mencuri kolom nama.
  const functLocCol = findHeader(['idfunctloc', 'functlocid', 'idfuntloc', 'funtlocid', 'functionallocation', 'functloc', 'funtloc']);

  return {
    gi: giCol,
    code: codeCol,
    tier: tierCol,
    tierFrom: tierFromCol,
    tierTo: tierToCol,
    assetType: assetTypeCol,
    symbolFrom: symbolFromCol,
    symbolTo: symbolToCol,
    busbarShape: busbarShapeCol,
    capacity: capacityCol,
    ibtNumber: ibtNumCol,
    from: fromCol,
    to: toCol,
    lineName: lineNameCol,
    voltage: voltageCol,
    risk: riskCol,
    riskNumber: riskNumCol,
    load: loadCol,
    loadC2: loadC2Col,
    circuits: circuitsCol,
    circuitNumber: circuitNumCol,
    lengthKm: lengthKmCol,
    corridor: corridorCol,
    uit: uitCol,
    condition: conditionCol,
    impact: impactCol,
    mitigation: mitigationCol,
    solution: solutionCol,
    bus150: bus150Col,
    feeder: feederCol,
    bayKind: bayKindCol,
    viewKey: viewKeyCol,
    status: statusCol,
    noKerawanan: noKerawananCol,
    connectedTo: connectedToCol,
    impactedGis: impactedGisCol,
    functLoc: functLocCol
  };
};