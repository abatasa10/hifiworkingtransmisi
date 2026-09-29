package com.iconplus.sld.mapping;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Tahap 2 — deteksi kolom otomatis (port `autoDetectMapping` di mapping.ts).
 * Semua regex / urutan pencarian header disalin apa adanya.
 */
public class MappingDetector {

  /** port `cleanKey` mapping.ts (dipakai untuk normalisasi header). */
  public static String cleanKey(String s) {
    StringBuilder sb = new StringBuilder();
    for (char ch : (s == null ? "" : s).toLowerCase().toCharArray()) {
      if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) sb.append(ch);
    }
    return sb.toString();
  }

  public ColumnMapping autoDetect(List<String> headers) {
    Map<String, String> colMap = new LinkedHashMap<>();
    for (String h : headers) {
      colMap.put(cleanKey(h), h);
    }

    java.util.function.BiFunction<String[], List<String>, String> findHeader = (patterns, exclude) -> {
      List<String> ex = exclude == null ? List.of() : exclude;
      for (String p : patterns) {
        for (Map.Entry<String, String> e : colMap.entrySet()) {
          String originalHeader = e.getValue();
          if (ex.contains(originalHeader)) continue;
          String k = e.getKey();
          if (k.equals(p) || k.contains(p)) return originalHeader;
        }
      }
      return "";
    };
    List<String> none = List.of();

    List<String> headerKeys = headers.stream().map(MappingDetector::cleanKey).toList();
    String fromRaw = headerKeys.stream()
        .filter(k -> k.matches("darigi|bus1|source|pangkal|dari|from|asal")).findFirst().orElse("");
    if (fromRaw.isBlank()) {
      fromRaw = headerKeys.stream().filter(k -> k.contains("darigi")).findFirst().orElse("");
    }
    String toRaw = headerKeys.stream()
        .filter(k -> k.matches("kegi|bus2|target|ujung|ke|to|tujuan")).findFirst().orElse("");
    if (toRaw.isBlank()) {
      toRaw = headerKeys.stream().filter(k -> k.contains("kegi")).findFirst().orElse("");
    }
    String fromCol = fromRaw.isBlank() ? "" : colMap.getOrDefault(fromRaw, "");
    String toCol = toRaw.isBlank() ? "" : colMap.getOrDefault(toRaw, "");
    String lineNameCol = findHeader.apply(
        new String[]{"namapenghantar", "penghantar", "namaline", "line", "jalur", "transmisi", "bay"},
        List.of(fromCol, toCol));
    boolean isLineSheet = !fromCol.isBlank() && !toCol.isBlank();

    String giCol = findHeader.apply(
        new String[]{"namaasset", "namagarduinduk", "namagi", "garduinduk", "namagardu",
            "functlocgarduinduk", "substation", "functloc"},
        List.of(fromCol, toCol, lineNameCol));
    if (giCol.isBlank() && !isLineSheet) {
      giCol = findHeader.apply(new String[]{"gi", "gardu", "nama"}, List.of(fromCol, toCol, lineNameCol));
    }
    String codeCol = findHeader.apply(new String[]{"kodesingkatan", "kodesingkat", "kode", "code", "singkatan"}, none);
    String tierCol = findHeader.apply(new String[]{"tiermulai0", "tier", "leveltier", "hirarki", "hierarchy", "level"}, none);
    String tierFromCol = findHeader.apply(new String[]{"tierdarigi", "tierdari", "tierfrom", "tiersumber", "tierasal"}, none);
    String tierToCol = findHeader.apply(new String[]{"tierkegi", "tierke", "tierto", "tiertujuan", "tierujung"}, none);
    String assetTypeCol = findHeader.apply(
        new String[]{"tipesimbolsld", "tipesimbol", "jenissimbol", "tipeasset", "tipe", "jenisasi", "jenis", "type"}, none);
    String symbolFromCol = findHeader.apply(
        new String[]{"tipesimboldarigi", "tipesimboldari", "simboldarigi", "simboldari", "tipedarigi", "tipedari"}, none);
    String symbolToCol = findHeader.apply(
        new String[]{"tipesimbolkegi", "tipesimbolke", "simbolkegi", "simbolke", "tipekegi", "tipeke"}, none);
    String busbarShapeCol = findHeader.apply(new String[]{"bentukbusbar", "bentukrel", "busbarshape", "tipebusbar"}, none);
    String capacityCol = findHeader.apply(new String[]{"kapasitasmva", "kapasitasmw", "kapasitas", "capacity", "mva", "mw"}, none);
    String ibtNumCol = findHeader.apply(new String[]{"noibt", "nomoribt", "nomeribt", "ibt", "unitibt"}, none);
    String voltageCol = findHeader.apply(new String[]{"tegangan", "kv", "voltage", "level"}, none);
    String riskCol = findHeader.apply(
        new String[]{"tingkatkerawanan", "statuskerawanan", "kerawanan", "statusasset", "status", "kategori", "risk"}, none);
    String riskNumCol = findHeader.apply(
        new String[]{"nokerawanan", "nomorkerawanan", "nomerkerawanan", "idkerawanan", "norisk"}, none);
    List<String> capacityExclude = capacityCol.isBlank() ? List.of() : List.of(capacityCol);
    String loadCol = findHeader.apply(
        new String[]{"pembebanansirkit1", "pembebanan", "loading", "bebanmw", "load", "beban", "mw", "mva", "arus", "ampere"},
        capacityExclude);
    String loadC2Col = findHeader.apply(new String[]{"pembebanansirkit2", "beban2", "load2", "loading2"}, none);
    String circuitsCol = findHeader.apply(new String[]{"jumlahsirkit", "sirkit", "circuits", "jmlsirkit"}, none);
    String circuitNumCol = findHeader.apply(
        new String[]{"nosirkit", "nomorsirkit", "sirkitke", "circuitno", "circuitnum", "linesirkit"}, none);
    String lengthKmCol = findHeader.apply(new String[]{"panjangsaluran", "panjangkm", "panjang", "length", "km"}, none);
    String corridorCol = findHeader.apply(new String[]{"koridor", "wilayah", "region", "lokasi", "provinsi"}, none);
    String uitCol = findHeader.apply(new String[]{"uit", "unitinduktransmisi", "unitinduk", "unit"}, none);
    String conditionCol = findHeader.apply(new String[]{"kondisipermasalahan", "permasalahan", "kondisi", "kendala", "isu"}, none);
    String impactCol = findHeader.apply(new String[]{"dampak", "impact", "akibat", "risiko"}, none);
    String mitigationCol = findHeader.apply(new String[]{"mitigasi", "mitigation", "pencegahan", "penanganan"}, none);
    String solutionCol = findHeader.apply(
        new String[]{"usulansolusi", "usulan", "solusi", "solution", "rekomendasi", "jangkapendek"}, none);
    String bus150Col = findHeader.apply(
        new String[]{"bus150kv", "bus150", "buslv", "kebus", "outlet", "terhubungkebus"}, none);
    String feederCol = findHeader.apply(new String[]{"feeder", "feedergiinduk", "giinduk", "induk", "feeder"}, none);
    List<String> bayKindExclude = assetTypeCol.isBlank() ? List.of() : List.of(assetTypeCol);
    String bayKindCol = findHeader.apply(new String[]{"jenisbay", "jenis", "tipebay"}, bayKindExclude);
    String viewKeyCol = findHeader.apply(
        new String[]{"sudutpandang", "viewkey", "kunciview", "view", "kodesudutpandang"}, none);
    List<String> statusExclude = (riskCol != null && riskCol.equals("status")) ? List.of(riskCol) : List.of();
    String statusCol = findHeader.apply(new String[]{"statusoperasi", "status"}, statusExclude);
    String noKerawananCol = findHeader.apply(new String[]{"nokerawanan", "nomorkerawanan", "norisik", "norisk"}, none);
    String connectedToCol = findHeader.apply(new String[]{"terhubungke", "terhubung", "koneksi", "connectedto", "connected"}, none);
    String impactedGisCol = findHeader.apply(new String[]{"giterdampak", "dampakgi", "zonaterdampak", "affectedgis"}, none);
    String functLocCol = findHeader.apply(
        new String[]{"idfunctloc", "functlocid", "idfuntloc", "funtlocid", "functionallocation", "functloc", "funtloc"}, none);

    ColumnMapping m = ColumnMapping.empty();
    m.gi = giCol; m.code = codeCol; m.tier = tierCol;
    m.tierFrom = tierFromCol; m.tierTo = tierToCol;
    m.assetType = assetTypeCol; m.symbolFrom = symbolFromCol; m.symbolTo = symbolToCol;
    m.busbarShape = busbarShapeCol; m.capacity = capacityCol; m.ibtNumber = ibtNumCol;
    m.from = fromCol; m.to = toCol; m.lineName = lineNameCol;
    m.voltage = voltageCol; m.risk = riskCol; m.riskNumber = riskNumCol;
    m.load = loadCol; m.loadC2 = loadC2Col; m.circuits = circuitsCol;
    m.circuitNumber = circuitNumCol; m.lengthKm = lengthKmCol; m.corridor = corridorCol;
    m.uit = uitCol; m.condition = conditionCol; m.impact = impactCol;
    m.mitigation = mitigationCol; m.solution = solutionCol; m.bus150 = bus150Col;
    m.feeder = feederCol; m.bayKind = bayKindCol; m.viewKey = viewKeyCol;
    m.status = statusCol; m.noKerawanan = noKerawananCol; m.connectedTo = connectedToCol;
    m.impactedGis = impactedGisCol; m.functLoc = functLocCol;
    return m;
  }
}