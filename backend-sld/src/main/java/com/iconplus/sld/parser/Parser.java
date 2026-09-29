package com.iconplus.sld.parser;

import com.iconplus.sld.dto.EnginePayloadDto;
import com.iconplus.sld.dto.EnginePayloadDto.Connection;
import com.iconplus.sld.dto.EnginePayloadDto.Payload;
import com.iconplus.sld.dto.EnginePayloadDto.Risk;
import com.iconplus.sld.mapping.ColumnMapping;
import com.iconplus.sld.mapping.MappingDetector;
import com.iconplus.sld.reader.ExcelReader;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;

/**
 * Tahap 3 — port `parser.ts`: ubah Excel menjadi EnginePayload
 * (objek GI, connection, risk). Mendukung template fleksibel multi-sheet
 * dan template engine (Gardu_Induk_dan_Aset + Jalur_Transmisi + risiko).
 */
public class Parser {

  private final ExcelReader excel = new ExcelReader();
  private final MappingDetector detector = new MappingDetector();

  // ============================= helpers =================================
  private static String norm(Object v) {
    return String.valueOf(v == null ? "" : v).trim().toLowerCase();
  }

  private static String strO(Object v) {
    return String.valueOf(v == null ? "" : v).trim();
  }

  private static boolean blank(Object v) {
    return v == null || strO(v).isEmpty();
  }

  private static Double numOr(Object v) {
    if (blank(v)) return null;
    try {
      double n = Double.parseDouble(String.valueOf(v).replace(",", "."));
      return Double.isFinite(n) ? n : null;
    } catch (Exception e) {
      return null;
    }
  }

  private static Double pcOr(Object v) {
    Double n = numOr(v);
    if (n == null) return null;
    return n > 1 && n <= 1.5 ? n * 100 : n;
  }

  private static Double kvNum(Object v) {
    if (v == null) return null;
    String s = norm(v).replace("kv", "");
    if (s.contains("/")) s = s.substring(0, s.indexOf('/'));
    s = s.trim().replace(",", ".").replaceAll("[^0-9.]", "");
    try {
      double n = Double.parseDouble(s);
      return Double.isFinite(n) && n > 0 ? n : null;
    } catch (Exception e) {
      return null;
    }
  }

  private static Integer intOr(Object v) {
    Double n = numOr(v);
    return n == null ? null : (int) (double) n;
  }

  private static boolean boolOr(Object v) {
    return List.of("1", "true", "yes", "ya", "ada", "single", "satu fasa").contains(norm(v));
  }

  private static String firstLine(Object v) {
    String s = strO(v);
    for (String sep : new String[]{"\n", ". ", ";"}) {
      int i = s.indexOf(sep);
      if (i > 0) {
        String t = s.substring(0, i).replaceFirst("^[\\d.\\s]+", "");
        return t.length() > 180 ? t.substring(0, 180) : t;
      }
    }
    return s.length() > 180 ? s.substring(0, 180) : s;
  }

  private static List<String> tokens(Object v) {
    List<String> out = new ArrayList<>();
    for (String t : strO(v).replace(",", ";").replace("&", ";").split(";")) {
      String u = t.trim().toUpperCase();
      if (!u.isEmpty()) out.add(u);
    }
    return out;
  }

  private static List<Integer> riskNumbers(Object v) {
    List<Integer> out = new ArrayList<>();
    for (String t : tokens(v)) {
      try {
        double n = Double.parseDouble(t);
        if (Double.isFinite(n)) out.add((int) Math.round(n));
      } catch (Exception ignored) {
        // skip
      }
    }
    return out;
  }

  private static List<String> keyList(Object v) {
    List<String> out = new ArrayList<>();
    for (String t : tokens(v)) {
      String k = MappingDetector.cleanKey(t);
      if (!k.isEmpty() && !out.contains(k)) out.add(k);
    }
    return out;
  }

  private static boolean isRawan(String score) {
    return !"Normal".equals(score);
  }

  private static String normalizeRiskLevel(Object v) {
    String u = strO(v).toUpperCase();
    if (u.isEmpty()) return "Normal";
    if (u.contains("N-1-2") || u.contains("N12") || u.contains("N-1-1")) return "N-1-2";
    if (u.contains("N-2") || u.contains("N2")) return "N-2";
    if (u.contains("N-1") || u.contains("N1")) return "N-1";
    if (u.contains("SANGAT RAWAN") || u.contains("KRITIS")) return "Sangat Rawan";
    if (u.contains("SEDANG")) return "Sedang";
    if (u.contains("WASPADA") || u.contains("RAWAN")) return "Rawan";
    return "Normal";
  }

  private static String statusMap(Object v) {
    String s = norm(v);
    if (s.isEmpty()) return "ENERGIZED";
    if (s.contains("belum")) return "NEW_NOT_ENERGIZED";
    if (s.contains("rencana") || s.contains("planned")) return "PLANNED";
    if (s.contains("padam") || s.contains("de-energ")) return "DE_ENERGIZED";
    if (s.contains("pelanggan") || s.contains("ktt")) return "OWNED_BY_CUSTOMER";
    return "ENERGIZED";
  }

  private static String lineTypeHint(Object name) {
    String s = norm(name);
    if (s.contains("sktt") || s.contains("kabel") || s.contains("sku")) return "SKTT";
    return "SUTT";
  }

  private static String[] resolved(String sym, String name, String volt, String bus150) {
    String sL = norm(sym);
    String nL = norm(name);
    String vL = norm(volt);
    String bL = norm(bus150);
    if (sL.isEmpty() && nL.isEmpty()) return new String[]{"GI", "false", "null"};
    if (sL.contains("bay") || sL.contains("spur")
        || (!bL.isEmpty() && (nL.contains("bay") || nL.contains("feeder"))))
      return new String[]{"BAY", "true", sL.contains("sktt") || sL.contains("kabel") ? "SKTT" : "SUTT"};
    if (sL.contains("pembangkit") || sL.contains("generator") || sL.contains("genset") || sL.contains("plt"))
      return new String[]{"GENERATING_UNIT", "false", "null"};
    if (sL.contains("trafo") && !sL.contains("ibt")) return new String[]{"TRAFO", "false", "null"};
    if (sL.contains("kapasitor") || sL.contains("compensator") || sL.contains("reaktor") || sL.contains("shunt"))
      return new String[]{"KAPASITOR", "false", "null"};
    if (sL.contains("ibt") || nL.startsWith("ibt ")) return new String[]{"IBT", "false", "null"};
    if (sL.contains("gitet") || sL.contains("gistet")) return new String[]{"GITET", "false", "null"};
    if (sL.contains("gis")) return new String[]{"GIS", "false", "null"};
    if (sL.contains("beban") || sL.contains("ktt") || nL.contains("ktt") || nL.contains("konsumen"))
      return new String[]{"BEBAN", "false", "null"};
    if (sL.contains("busbar") || sL.contains("rel")) return new String[]{"GI", "false", "null"};
    if (nL.contains("busbar") || nL.contains("rel")) return new String[]{"GI", "false", "null"};
    if (sL.contains("gi") || sL.equals("gi")) return new String[]{"GI", "false", "null"};
    if (vL.contains("500") || vL.contains("275")) return new String[]{"GITET", "false", "null"};
    return new String[]{"GI", "false", "null"};
  }

  private static boolean isSourceObject(EnginePayloadDto.Object o) {
    if ("GENERATING_UNIT".equals(o.object_type)) return true;
    if ("GITET".equals(o.object_type)) return true;
    double hv = o.voltage_hv_kv != null ? o.voltage_hv_kv
        : (o.voltage_lv_kv != null ? o.voltage_lv_kv : 0);
    return hv >= 275 || "SOURCE".equals(norm(o.role_hint));
  }

  private static String guessSubsystemName(String filename) {
    String base = (filename == null || filename.isBlank() ? "subsistem" : filename)
        .replaceAll("\\.[^.]+$", "");
    base = base.replace("template_sld_subsistem_pln_", "")
        .replace("template_", "")
        .replace("_", " ")
        .replace("-", " ");
    return base.isBlank() ? "Subsistem" : base.trim();
  }

  // =========================== workbooks ================================

  public boolean hasEngineSheets(Workbook wb) {
    List<String> names = new ArrayList<>();
    for (String sn : excel.sheetNames(wb)) names.add(norm(sn));
    return names.contains("gardu_induk_dan_aset") && names.contains("jalur_transmisi");
  }

  private Sheet pickSheet(Workbook wb, String[] names) {
    List<String> wanted = new ArrayList<>();
    for (String n : names) wanted.add(norm(n));
    for (String sn : excel.sheetNames(wb)) {
      if (wanted.contains(norm(sn))) return wb.getSheet(sn);
    }
    return null;
  }

  /** object sheet helper: ambil nilai kolom pertama yang cocok (get() di TS). */
  private static Object get(Map<String, String> row, String... keys) {
    List<String> wanted = new ArrayList<>();
    for (String k : keys) wanted.add(norm(k));
    for (Map.Entry<String, String> e : row.entrySet()) {
      if (wanted.contains(norm(e.getKey()))) return e.getValue();
    }
    return null;
  }

  private static EnginePayloadDto.Issue issue(String level, String message) {
    EnginePayloadDto.Issue i = new EnginePayloadDto.Issue();
    i.level = level;
    i.message = message;
    return i;
  }

  private Payload emptyPayload(String filename) {
    Payload p = new Payload();
    p.meta.filename = filename;
    p.meta.document_type = "SLD_SHEET_XLSX";
    p.meta.analytical_hint = "SUBSYSTEM_500_150";
    p.subsystem.code = "SS_NEW";
    p.subsystem.name = guessSubsystemName(filename);
    p.subsystem.apb = "";
    return p;
  }

  // ---------------- flexible single-sheet ----------------

  private static String cel(Map<String, String> r, int idx, List<String> headers) {
    if (idx < 0) return null;
    if (idx >= headers.size()) return null;
    return r.getOrDefault(headers.get(idx), "");
  }

  /** true jika baris adalah baris penghantar (kolom Dari-GI dan Ke-GI terisi). */
  private static boolean isLineRow(Map<String, String> r, Integer[] col, List<String> headers) {
    return col[11] != null && col[11] >= 0 && !cel(r, col[11], headers).isEmpty()
        && col[12] != null && col[12] >= 0 && !cel(r, col[12], headers).isEmpty();
  }

  /** ambil objek GI yang sudah ada, atau buat baru dan gabungkan state dari baris-baris lain. */
  private static EnginePayloadDto.Object ensureObject(String name, Object codeValue, Object symbol,
                                                      Object voltageRaw, Integer tierHint, Object bus150Raw,
                                                      Map<String, Object> extra,
                                                      Map<String, EnginePayloadDto.Object> objects) {
    String key = MappingDetector.cleanKey(strO(codeValue));
    if (key.isEmpty()) key = MappingDetector.cleanKey(name);
    if (key.isEmpty()) key = "GI_" + MappingDetector.cleanKey(name);
    EnginePayloadDto.Object existing = objects.get(key);
    if (existing != null) {
      if (tierHint != null && existing.tier_hint == null) existing.tier_hint = tierHint;
      Object extraLvl = extra.get("risk_level");
      if ("Normal".equals(existing.risk_level) && isRawan(String.valueOf(extraLvl == null ? "Normal" : extraLvl))) {
        existing.risk_level = String.valueOf(extraLvl);
      }
      @SuppressWarnings("unchecked") List<Integer> extRisk = (List<Integer>) extra.getOrDefault("risk_seq", List.of());
      for (Integer rn : extRisk) if (!existing.risk_seq.contains(rn)) existing.risk_seq.add(rn);
      @SuppressWarnings("unchecked") List<String> extConn = (List<String>) extra.getOrDefault("connected_keys", List.of());
      for (String k : extConn) if (!existing.connected_keys.contains(k)) existing.connected_keys.add(k);
      @SuppressWarnings("unchecked") List<String> extImp = (List<String>) extra.getOrDefault("impacted_keys", List.of());
      for (String k : extImp) if (!existing.impacted_keys.contains(k)) existing.impacted_keys.add(k);
      String fl = (String) extra.get("funct_loc");
      if (existing.funct_loc == null && fl != null) existing.funct_loc = fl;
      if (blank(existing.condition)) existing.condition = (String) extra.get("condition");
      if (blank(existing.impact)) existing.impact = (String) extra.get("impact");
      if (blank(existing.mitigation)) existing.mitigation = (String) extra.get("mitigation");
      if (blank(existing.follow_up)) existing.follow_up = (String) extra.get("follow_up");
      return existing;
    }
    String[] rt = resolved(strO(symbol), name, strO(voltageRaw), strO(bus150Raw));
    double hv = kvNum(voltageRaw) == null ? 0 : kvNum(voltageRaw);
    EnginePayloadDto.Object obj = new EnginePayloadDto.Object();
    obj.external_key = key;
    obj.object_type = rt[0];
    obj.raw_label = name;
    obj.site_name = name;
    obj.voltage_hv_kv = hv == 0 ? null : hv;
    String voltStr = strO(voltageRaw);
    if (hv != 0 && voltStr.contains("/")) {
      obj.voltage_lv_kv = kvNum(voltStr.substring(voltStr.indexOf('/') + 1));
    }
    String unitNo = (String) extra.get("unit_no");
    obj.unit_no = unitNo;
    obj.tier_hint = tierHint;
    obj.status_hint = "ENERGIZED";
    obj.confidence = "GITET".equals(rt[0]) || "GENERATING_UNIT".equals(rt[0]) ? 0.9 : 0.8;
    obj.is_bay = "true".equals(rt[1]);
    obj.bay_feeder_key = null;
    obj.bay_kind = "null".equals(rt[2]) ? null : rt[2];
    obj.has_transformer = Boolean.parseBoolean(String.valueOf(extra.getOrDefault("has_transformer", false)));
    obj.has_capacitor = false;
    obj.transformer_count = null;
    obj.capacitor_count = null;
    obj.symbol_note = null;
    obj.outlet_key = bus150Raw == null ? null : strO(bus150Raw);
    obj.role_hint = "GENERATING_UNIT".equals(rt[0]) ? "SOURCE" : (String) extra.get("role_hint");
    obj.risk_seq = (List<Integer>) extra.getOrDefault("risk_seq", new ArrayList<>());
    obj.risk_level = String.valueOf(extra.getOrDefault("risk_level", "Normal"));
    obj.connected_keys = (List<String>) extra.getOrDefault("connected_keys", new ArrayList<>());
    obj.impacted_keys = (List<String>) extra.getOrDefault("impacted_keys", new ArrayList<>());
    obj.funct_loc = (String) extra.get("funct_loc");
    obj.condition = (String) extra.get("condition");
    obj.impact = (String) extra.get("impact");
    obj.mitigation = (String) extra.get("mitigation");
    obj.follow_up = (String) extra.get("follow_up");
    objects.put(key, obj);
    return obj;
  }

  private EnginePayloadDto.ParseResult parseFlexibleSheet(Sheet sheet, ColumnMapping m, String filename,
                                                          String region, String subsystem, String defaultVoltage) {
    EnginePayloadDto.ParseResult res = new EnginePayloadDto.ParseResult();
    ExcelReader.HeaderRows hr = sheet == null ? new ExcelReader.HeaderRows() : excel.readHeaderRows(sheet);
    List<String> headers = hr.headers;
    List<Map<String, String>> rows = hr.rows;
    if (headers.isEmpty() || rows.isEmpty()) {
      res.issues.add(issue("error", "Tidak ada baris data yang terbaca di sheet ini."));
      res.payload = emptyPayload(filename);
      return res;
    }

    Integer[] col = new Integer[39];
    col[0] = headers.indexOf(m.gi);
    col[1] = headers.indexOf(m.code);
    col[2] = headers.indexOf(m.tier);
    col[3] = headers.indexOf(m.tierFrom);
    col[4] = headers.indexOf(m.tierTo);
    col[5] = headers.indexOf(m.assetType);
    col[6] = headers.indexOf(m.symbolFrom);
    col[7] = headers.indexOf(m.symbolTo);
    col[8] = headers.indexOf(m.busbarShape);
    col[9] = headers.indexOf(m.capacity);
    col[10] = headers.indexOf(m.ibtNumber);
    col[11] = headers.indexOf(m.from);
    col[12] = headers.indexOf(m.to);
    col[13] = headers.indexOf(m.lineName);
    col[14] = headers.indexOf(m.voltage);
    col[15] = headers.indexOf(m.risk);
    col[16] = headers.indexOf(m.riskNumber);
    col[17] = headers.indexOf(m.load);
    col[18] = headers.indexOf(m.loadC2);
    col[19] = headers.indexOf(m.circuits);
    col[20] = headers.indexOf(m.circuitNumber);
    col[21] = headers.indexOf(m.lengthKm);
    col[22] = headers.indexOf(m.corridor);
    col[23] = headers.indexOf(m.uit);
    col[24] = headers.indexOf(m.condition);
    col[25] = headers.indexOf(m.impact);
    col[26] = headers.indexOf(m.mitigation);
    col[27] = headers.indexOf(m.solution);
    col[28] = headers.indexOf(m.bus150);
    col[29] = headers.indexOf(m.feeder);
    col[30] = headers.indexOf(m.bayKind);
    col[31] = headers.indexOf(m.viewKey);
    col[32] = headers.indexOf(m.status);
    col[33] = headers.indexOf(m.noKerawanan);
    col[34] = headers.indexOf(m.connectedTo);
    col[35] = headers.indexOf(m.impactedGis);
    col[36] = headers.indexOf(m.functLoc);

    Map<String, EnginePayloadDto.Object> objects = new LinkedHashMap<>();
    List<Connection> connections = new ArrayList<>();
    Set<String> viewKeys = new LinkedHashSet<>();
    String[] regionHint = new String[]{region == null ? "" : region};

    // pass 1: object rows
    for (Map<String, String> r : rows) {
      if (isLineRow(r, col, headers)) continue;
      String giVal = col[0] >= 0 ? cel(r, col[0], headers) : "";
      Object codeVal = col[1] >= 0 ? cel(r, col[1], headers) : null;
      String assetTypeVal = col[5] >= 0 ? cel(r, col[5], headers) : "";
      String nameVal = !giVal.isEmpty() ? giVal : (codeVal == null ? "" : strO(codeVal));
      Object voltRaw = col[14] >= 0 ? cel(r, col[14], headers) : defaultVoltage;
      Object bus150Raw = col[28] >= 0 ? cel(r, col[28], headers) : null;
      Integer tierVal = col[2] >= 0 ? intOr(cel(r, col[2], headers)) : null;
      String riskVal = col[15] >= 0 ? normalizeRiskLevel(cel(r, col[15], headers)) : "Normal";
      List<Integer> riskNo = col[16] >= 0 ? riskNumbers(cel(r, col[16], headers)) : new ArrayList<>();
      String ibtNo = col[10] >= 0 ? strO(cel(r, col[10], headers)) : null;
      String shapeVal = col[8] >= 0 ? cel(r, col[8], headers) : "";
      Double capVal = col[9] >= 0 ? numOr(cel(r, col[9], headers)) : null;
      if (nameVal.isEmpty()) continue;

      Map<String, Object> extra = new LinkedHashMap<>();
      extra.put("unit_no", ibtNo);
      extra.put("outlet_key", bus150Raw != null ? strO(bus150Raw) : null);
      if (isRawan(riskVal)) extra.put("role_hint", "RISK");
      extra.put("risk_seq", riskNo);
      extra.put("risk_level", riskVal);
      extra.put("connected_keys", col[34] >= 0 ? keyList(cel(r, col[34], headers)) : new ArrayList<String>());
      extra.put("impacted_keys", col[35] >= 0 ? keyList(cel(r, col[35], headers)) : new ArrayList<String>());
      extra.put("funct_loc", col[36] >= 0 && !cel(r, col[36], headers).isEmpty() ? cel(r, col[36], headers) : null);
      extra.put("condition", col[24] >= 0 && !cel(r, col[24], headers).isEmpty() ? cel(r, col[24], headers) : null);
      extra.put("impact", col[25] >= 0 && !cel(r, col[25], headers).isEmpty() ? cel(r, col[25], headers) : null);
      extra.put("mitigation", col[26] >= 0 && !cel(r, col[26], headers).isEmpty() ? cel(r, col[26], headers) : null);
      extra.put("follow_up", col[27] >= 0 && !cel(r, col[27], headers).isEmpty() ? cel(r, col[27], headers) : null);
      EnginePayloadDto.Object obj = ensureObject(nameVal, codeVal, assetTypeVal, voltRaw, tierVal, bus150Raw, extra, objects);
      if (norm(shapeVal).contains("panjang") || norm(shapeVal).contains("wide")) {
        obj.has_transformer = true;
      }
      if (col[31] >= 0) {
        String vk = cel(r, col[31], headers).trim().toUpperCase();
        if (!vk.isEmpty()) {
          viewKeys.add(vk);
          if (!obj.view_keys.contains(vk)) obj.view_keys.add(vk);
        }
      }
    }

    // pass 2: line rows
    for (Map<String, String> r : rows) {
      if (!isLineRow(r, col, headers)) continue;
      String dariVal = col[11] >= 0 ? cel(r, col[11], headers) : "";
      String keVal = col[12] >= 0 ? cel(r, col[12], headers) : "";
      if (dariVal.isEmpty() || keVal.isEmpty()) continue;
      String lineNameVal = col[13] >= 0 && !cel(r, col[13], headers).isEmpty()
          ? cel(r, col[13], headers) : dariVal + " - " + keVal;
      Object voltRaw = col[14] >= 0 ? cel(r, col[14], headers) : defaultVoltage;
      String voltStr = strO(voltRaw).isEmpty() ? defaultVoltage : strO(voltRaw);
      String sldTypeVal = col[5] >= 0 ? cel(r, col[5], headers) : "";
      boolean isIbt = norm(sldTypeVal).contains("ibt") || norm(lineNameVal).contains("ibt");
      String srcVolt = voltStr;
      String dstVolt = voltStr;
      if (isIbt && voltStr.contains("/")) {
        String[] parts = voltStr.split("/");
        srcVolt = parts[0].trim() + " kV";
        String lv = parts[1].trim();
        dstVolt = lv.matches(".*\\d.*") ? (norm(lv).contains("kv") ? lv : lv + " kV") : voltStr;
      }
      String riskLevelVal = col[15] >= 0 ? normalizeRiskLevel(cel(r, col[15], headers)) : "Normal";
      List<Integer> riskNo = col[16] >= 0 ? riskNumbers(cel(r, col[16], headers)) : new ArrayList<>();
      Integer tierFromVal = col[3] >= 0 ? intOr(cel(r, col[3], headers)) : null;
      Integer tierToVal = col[4] >= 0 ? intOr(cel(r, col[4], headers)) : null;
      String symbolFromVal = col[6] >= 0 ? cel(r, col[6], headers) : "";
      String symbolToVal = col[7] >= 0 ? cel(r, col[7], headers) : "";
      Object bus150Raw = col[28] >= 0 ? cel(r, col[28], headers) : null;

      Map<String, Object> endpointRisk;
      if (isIbt) {
        endpointRisk = new LinkedHashMap<>();
        endpointRisk.put("risk_seq", new ArrayList<Integer>());
        endpointRisk.put("risk_level", "Normal");
      } else {
        endpointRisk = new LinkedHashMap<>();
        endpointRisk.put("risk_seq", riskNo);
        endpointRisk.put("risk_level", riskLevelVal);
      }
      EnginePayloadDto.Object src = ensureObject(dariVal, null, symbolFromVal, srcVolt, tierFromVal, bus150Raw, endpointRisk, objects);
      EnginePayloadDto.Object dst = ensureObject(keVal, null, symbolToVal, dstVolt, tierToVal, null, endpointRisk, objects);

      Double lenVal = col[21] >= 0 ? numOr(cel(r, col[21], headers)) : null;
      Double loadVal = col[17] >= 0 ? pcOr(cel(r, col[17], headers)) : null;
      Double loadC2Val = col[18] >= 0 ? pcOr(cel(r, col[18], headers)) : null;
      Integer circuitsVal = col[19] >= 0 ? intOr(cel(r, col[19], headers)) : null;
      if (circuitsVal == null) circuitsVal = 2;
      String condVal = col[24] >= 0 && !cel(r, col[24], headers).isEmpty() ? cel(r, col[24], headers) : null;
      String impactVal = col[25] >= 0 && !cel(r, col[25], headers).isEmpty() ? cel(r, col[25], headers) : null;
      String mitigVal = col[26] >= 0 && !cel(r, col[26], headers).isEmpty() ? cel(r, col[26], headers) : null;
      String solVal = col[27] >= 0 && !cel(r, col[27], headers).isEmpty() ? cel(r, col[27], headers) : null;
      String corridorVal = col[22] >= 0 && !cel(r, col[22], headers).isEmpty() ? cel(r, col[22], headers) : null;
      String uitVal = col[23] >= 0 && !cel(r, col[23], headers).isEmpty() ? cel(r, col[23], headers) : null;
      if (corridorVal != null && regionHint[0].isEmpty()) regionHint[0] = corridorVal;
      String statusVal = col[32] >= 0 ? statusMap(cel(r, col[32], headers)) : "ENERGIZED";

      Connection c = new Connection();
      c.from_external_key = src.external_key;
      c.to_external_key = dst.external_key;
      c.relation_type = isIbt ? "IBT_LINK" : "CONNECTED_TO";
      c.circuit_type_hint = isIbt ? "IBT_LINK" : lineTypeHint(lineNameVal);
      c.status_hint = statusVal;
      c.circuit_count = isIbt ? 1 : circuitsVal;
      c.circuit_number = col[20] >= 0 ? intOr(cel(r, col[20], headers)) : null;
      c.unit_no = isIbt ? (lineNameVal.matches("(?i).*ibt\\s*\\d+.*") ? lineNameVal.replaceFirst("(?i).*ibt\\s*(\\d+).*", "$1") : null) : null;
      c.single_phi = false;
      c.confidence = isIbt ? 1.0 : ("Normal".equals(riskLevelVal) ? 0.85 : 0.8);
      c.note = lineNameVal;
      c.line_name = lineNameVal;
      Double kv = kvNum(dstVolt);
      c.voltage_kv = kv != null ? kv : kvNum(voltStr);
      c.length_km = lenVal;
      c.loading_c1 = loadVal;
      c.loading_c2 = loadC2Val;
      c.corridor = corridorVal;
      c.uit = uitVal;
      c.tier_from_hint = tierFromVal;
      c.tier_to_hint = tierToVal;
      c.risk_seq = riskNo;
      c.risk_level = riskLevelVal;
      c.condition = condVal;
      c.impact = impactVal;
      c.mitigation = mitigVal;
      c.follow_up = solVal;
      connections.add(c);
    }

    // pass 3: IBT -> Bus 150 kV links
    for (EnginePayloadDto.Object o : objects.values()) {
      if (!"IBT".equals(o.object_type)) continue;
      String lv = o.outlet_key == null ? null : MappingDetector.cleanKey(o.outlet_key);
      if (lv == null || lv.isEmpty()) continue;
      EnginePayloadDto.Object target = objects.get(lv);
      if (target == null) {
        res.issues.add(issue("warning", "Bus 150 kV \"" + o.outlet_key + "\" untuk IBT " + o.external_key + " tidak ditemukan."));
        continue;
      }
      boolean existing = connections.stream().anyMatch(c ->
          c.from_external_key.equals(o.external_key)
              && c.to_external_key.equals(target.external_key)
              && "IBT_LINK".equals(c.relation_type));
      if (!existing) {
        Connection c = new Connection();
        c.from_external_key = o.external_key;
        c.to_external_key = target.external_key;
        c.relation_type = "IBT_LINK";
        c.circuit_type_hint = "IBT_LINK";
        c.status_hint = o.status_hint;
        c.circuit_count = 1;
        c.unit_no = o.unit_no;
        c.single_phi = false;
        c.confidence = 1.0;
        c.note = "IBT" + (o.unit_no != null ? " " + o.unit_no : "") + " " + o.external_key;
        c.view_keys = new ArrayList<>(o.view_keys);
        c.line_name = "IBT" + (o.unit_no != null ? " " + o.unit_no : "") + " " + o.external_key;
        c.voltage_kv = o.voltage_lv_kv != null ? o.voltage_lv_kv : null;
        c.corridor = regionHint[0].isEmpty() ? null : regionHint[0];
        c.tier_from_hint = o.tier_hint;
        c.risk_seq = new ArrayList<>(o.risk_seq);
        c.risk_level = o.risk_level;
        connections.add(c);
        o.risk_seq = new ArrayList<>();
        o.risk_level = "Normal";
      }
    }

    List<EnginePayloadDto.Object> objList = new ArrayList<>(objects.values());
    List<Risk> risks = buildRisksFromState(objList, connections);

    Payload p = new Payload();
    p.meta.filename = filename;
    p.meta.document_type = "SLD_SHEET_XLSX";
    p.meta.analytical_hint = "SUBSYSTEM_500_150";
    p.meta.source_ref = "Template fleksibel (" + filename + ")";
    String subsystemName = subsystem != null ? subsystem
        : (regionHint[0].isEmpty() ? guessSubsystemName(filename) : regionHint[0]);
    p.subsystem.code = "SS_" + (MappingDetector.cleanKey(subsystemName).substring(0, Math.min(8, MappingDetector.cleanKey(subsystemName).length())).toUpperCase());
    p.subsystem.name = subsystemName;
    p.subsystem.apb = regionHint[0].isEmpty() ? "UP2B" : regionHint[0];
    if (viewKeys.isEmpty()) {
      EnginePayloadDto.View v = new EnginePayloadDto.View();
      v.view_key = "FLEX"; v.name = "Sudut Pandang Utama"; v.source_keys.add("flex");
      p.subsystem.views.add(v);
    } else {
      for (String vk : viewKeys) {
        EnginePayloadDto.View v = new EnginePayloadDto.View();
        v.view_key = vk; v.name = vk; v.source_keys.add("flex");
        p.subsystem.views.add(v);
      }
    }
    p.objects = objList;
    p.connections = connections;
    p.risks = risks;
    res.payload = p;
    return res;
  }

  private List<Risk> buildRisksFromState(List<EnginePayloadDto.Object> objList, List<Connection> connections) {
    Map<Integer, String[]> pinBySeq = new LinkedHashMap<>(); // seq -> [kind, key]
    for (EnginePayloadDto.Object o : objList) {
      for (Integer rn : o.risk_seq) pinBySeq.put(rn, new String[]{"SUBSTATION", o.external_key});
    }
    for (Connection c : connections) {
      for (Integer rn : c.risk_seq) pinBySeq.put(rn, new String[]{"CIRCUIT", c.from_external_key + "-" + c.to_external_key});
    }
    List<Risk> risks = new ArrayList<>();
    for (Map.Entry<Integer, String[]> e : pinBySeq.entrySet()) {
      int seq = e.getKey();
      Connection conn = connections.stream().filter(c -> c.risk_seq != null && c.risk_seq.contains(seq)).findFirst().orElse(null);
      EnginePayloadDto.Object obj = objList.stream().filter(o -> o.risk_seq != null && o.risk_seq.contains(seq)).findFirst().orElse(null);
      Risk r = new Risk();
      r.seq_no = seq;
      r.uit = conn != null && conn.uit != null ? conn.uit : "";
      r.category = conn != null ? conn.risk_level : (obj != null ? obj.risk_level : "Normal");
      r.title = conn != null && conn.line_name != null ? conn.line_name
          : (obj != null && obj.raw_label != null ? obj.raw_label : "Kerawanan #" + seq);
      r.condition = conn != null && conn.note != null ? conn.note
          : (obj != null && obj.raw_label != null ? obj.raw_label : "");
      r.impact = conn != null && conn.corridor != null ? conn.corridor : "";
      r.mitigation = "";
      r.follow_up = "";
      r.pin_kind = e.getValue()[0];
      r.pin_key = e.getValue()[1];
      risks.add(r);
    }
    return risks;
  }

  // ---------------- flexible multi-sheet workbook ----------------

  public EnginePayloadDto.ParseResult parseFlexibleWorkbook(Workbook wb, String filename, String region,
                                                            String subsystem, String defaultVoltage) {
    EnginePayloadDto.ParseResult res = new EnginePayloadDto.ParseResult();
    List<Map<String, Object>> objectSheets = new ArrayList<>();
    List<Map<String, Object>> lineSheets = new ArrayList<>();
    List<Map<String, Object>> riskSheets = new ArrayList<>();

    for (String sn : excel.sheetNames(wb)) {
      ExcelReader.HeaderRows hr = excel.readHeaderRows(wb.getSheet(sn));
      if (hr.headers.isEmpty()) continue;
      ColumnMapping m = detector.autoDetect(hr.headers);
      boolean isLine = m.from != null && !m.from.isEmpty() && m.to != null && !m.to.isEmpty();
      boolean shortGi = m.gi != null && m.gi.length() > 0 && m.gi.length() <= 40;
      boolean isObject = shortGi && (has(m.assetType) || has(m.code) || has(m.tier)
          || has(m.capacity) || has(m.ibtNumber) || has(m.busbarShape));
      boolean isRisk = has(m.noKerawanan) && (has(m.condition) || has(m.impact) || has(m.mitigation) || has(m.solution));
      Map<String, Object> sheetInfo = new LinkedHashMap<>();
      sheetInfo.put("name", sn);
      sheetInfo.put("sheet", wb.getSheet(sn));
      sheetInfo.put("mapping", m);
      if (isLine) lineSheets.add(sheetInfo);
      else if (isObject) objectSheets.add(sheetInfo);
      else if (isRisk) riskSheets.add(sheetInfo);
    }

    if (objectSheets.isEmpty() && lineSheets.isEmpty()) {
      res.issues.add(issue("error", "Tidak ada sheet Objek (GI) atau sheet Jalur Transmisi (kolom Dari-Ke GI) yang dikenali di workbook ini."));
      res.payload = emptyPayload(filename);
      return res;
    }

    Map<String, EnginePayloadDto.Object> objects = new LinkedHashMap<>();
    List<Connection> connections = new ArrayList<>();
    Set<String> viewKeys = new LinkedHashSet<>();
    List<String> regionHint = new ArrayList<>();

    // object sheets first, then line sheets
    List<Map<String, Object>> ordered = new ArrayList<>();
    ordered.addAll(objectSheets);
    ordered.addAll(lineSheets);

    for (Map<String, Object> s : ordered) {
      EnginePayloadDto.ParseResult r = parseFlexibleSheet(
          (Sheet) s.get("sheet"), (ColumnMapping) s.get("mapping"), filename,
          region, subsystem, defaultVoltage);
      res.issues.addAll(r.issues);
      mergePayload(objects, connections, viewKeys, regionHint, r.payload);
    }

    List<EnginePayloadDto.Object> objList = new ArrayList<>(objects.values());
    String regionStr = !regionHint.isEmpty() ? regionHint.get(0) : (region == null ? "" : region);
    String subsystemName = subsystem != null ? subsystem
        : (regionStr.isEmpty() ? guessSubsystemName(filename) : regionStr);

    List<Risk> risks;
    if (!riskSheets.isEmpty()) {
      risks = risksFromSheets(riskSheets, objList, connections);
    } else {
      risks = buildRisksFromState(objList, connections);
    }

    Payload p = new Payload();
    p.meta.filename = filename;
    p.meta.document_type = "SLD_WORKBOOK_XLSX";
    p.meta.analytical_hint = "SUBSYSTEM_500_150";
    p.meta.source_ref = "Template fleksibel multi-sheet (" + filename + ")";
    String ck = MappingDetector.cleanKey(subsystemName);
    String code = ck.length() == 0 ? "NEW" : ck.substring(0, Math.min(8, ck.length())).toUpperCase();
    p.subsystem.code = "SS_" + code;
    p.subsystem.name = subsystemName;
    p.subsystem.apb = regionStr.isEmpty() ? "UP2B" : regionStr;
    if (viewKeys.isEmpty()) {
      EnginePayloadDto.View v = new EnginePayloadDto.View();
      v.view_key = "FLEX"; v.name = "Sudut Pandang Utama"; v.source_keys.add("flex");
      p.subsystem.views.add(v);
    } else {
      for (String vk : viewKeys) {
        EnginePayloadDto.View v = new EnginePayloadDto.View();
        v.view_key = vk; v.name = vk; v.source_keys.add("flex");
        p.subsystem.views.add(v);
      }
    }
    p.objects = objList;
    p.connections = connections;
    p.risks = risks;
    res.payload = p;
    return res;
  }

  private static boolean has(String s) {
    return s != null && !s.isEmpty();
  }

  private List<Risk> risksFromSheets(List<Map<String, Object>> riskSheets, List<EnginePayloadDto.Object> objList,
                                     List<Connection> connections) {
    Map<Integer, String[]> pinBySeq = new LinkedHashMap<>();
    for (EnginePayloadDto.Object o : objList) {
      for (Integer rn : o.risk_seq) pinBySeq.put(rn, new String[]{"SUBSTATION", o.external_key});
    }
    for (Connection c : connections) {
      for (Integer rn : c.risk_seq) pinBySeq.put(rn, new String[]{"CIRCUIT", c.from_external_key + "-" + c.to_external_key});
    }
    Map<Integer, Risk> bySeq = new LinkedHashMap<>();
    for (Map<String, Object> rsInfo : riskSheets) {
      Sheet sheet = (Sheet) rsInfo.get("sheet");
      ExcelReader.HeaderRows hr = excel.readHeaderRows(sheet);
      List<String> headers = hr.headers;
      ColumnMapping m = (ColumnMapping) rsInfo.get("mapping");
      if (m == null) m = detector.autoDetect(headers);
      int colSeq = headers.indexOf(m.noKerawanan);
      int colUit = headers.indexOf(m.uit);
      int colCond = headers.indexOf(m.condition);
      int colImpact = headers.indexOf(m.impact);
      int colMitig = headers.indexOf(m.mitigation);
      int colSol = headers.indexOf(m.solution);
      for (Map<String, String> r : hr.rows) {
        List<Integer> seqs = colSeq >= 0 ? riskNumbers(cel(r, colSeq, headers)) : new ArrayList<>();
        if (seqs.isEmpty()) continue;
        String cond = colCond >= 0 ? cel(r, colCond, headers) : "";
        for (Integer seq : seqs) {
          if (bySeq.containsKey(seq)) continue;
          String[] pin = pinBySeq.get(seq);
          Connection conn = connections.stream().filter(c -> c.risk_seq != null && c.risk_seq.contains(seq)).findFirst().orElse(null);
          Risk rk = new Risk();
          rk.seq_no = seq;
          rk.uit = colUit >= 0 ? cel(r, colUit, headers) : "";
          rk.category = conn != null ? conn.risk_level : "Normal";
          rk.title = firstLine(cond);
          if (rk.title.isEmpty() && conn != null && conn.line_name != null) rk.title = conn.line_name;
          if (rk.title.isEmpty()) rk.title = "Kerawanan #" + seq;
          rk.condition = cond;
          rk.impact = colImpact >= 0 ? cel(r, colImpact, headers) : "";
          rk.mitigation = colMitig >= 0 ? cel(r, colMitig, headers) : "";
          rk.follow_up = colSol >= 0 ? cel(r, colSol, headers) : "";
          rk.pin_kind = pin != null ? pin[0] : null;
          rk.pin_key = pin != null ? pin[1] : null;
          bySeq.put(seq, rk);
        }
      }
    }
    return new ArrayList<>(bySeq.values());
  }

  private void mergePayload(Map<String, EnginePayloadDto.Object> objects, List<Connection> connections,
                            Set<String> viewKeys, List<String> regionHint, Payload p) {
    for (EnginePayloadDto.Object o : p.objects) {
      EnginePayloadDto.Object ex = objects.get(o.external_key);
      if (ex == null) {
        objects.put(o.external_key, o);
      } else {
        if (ex.tier_hint == null && o.tier_hint != null) ex.tier_hint = o.tier_hint;
        if ((ex.raw_label == null || ex.raw_label.isEmpty()) && o.raw_label != null) ex.raw_label = o.raw_label;
        for (Integer rn : o.risk_seq) if (!ex.risk_seq.contains(rn)) ex.risk_seq.add(rn);
        if ("Normal".equals(ex.risk_level) && isRawan(o.risk_level)) ex.risk_level = o.risk_level;
      }
      viewKeys.addAll(o.view_keys);
    }
    for (Connection c : p.connections) {
      boolean dup = connections.stream().anyMatch(x ->
          x.from_external_key.equals(c.from_external_key)
              && x.to_external_key.equals(c.to_external_key)
              && x.relation_type.equals(c.relation_type)
              && (x.circuit_number == null && c.circuit_number == null || x.circuit_number != null && x.circuit_number.equals(c.circuit_number))
              && (x.unit_no == null && c.unit_no == null || x.unit_no != null && x.unit_no.equals(c.unit_no)));
      if (!dup) connections.add(c);
      if (c.corridor != null && !c.corridor.isEmpty() && regionHint.isEmpty()) regionHint.add(c.corridor);
      viewKeys.addAll(c.view_keys);
    }
  }

  // ---------------- engine template workbook ----------------

  public EnginePayloadDto.ParseResult parseEngineWorkbook(Workbook wb, String filename) {
    EnginePayloadDto.ParseResult res = new EnginePayloadDto.ParseResult();
    if (!hasEngineSheets(wb)) {
      return parseFlexibleWorkbook(wb, filename, null, null, "150 kV");
    }

    Sheet wsAsset = pickSheet(wb, new String[]{"Gardu_Induk_dan_Aset", "Gardu Induk dan Aset", "Aset", "Asset"});
    Sheet wsLine = pickSheet(wb, new String[]{"Jalur_Transmisi", "Jalur Transmisi", "Penghantar"});
    Sheet wsRisk = pickSheet(wb, new String[]{"Data_Kerawanan_Detail", "Data Kerawanan Detail", "Kerawanan"});
    Sheet wsInfo = pickSheet(wb, new String[]{"Info", "Informasi", "Subsistem", "Header"});
    Sheet wsBay = pickSheet(wb, new String[]{"Bay", "Bays"});
    Sheet wsViews = pickSheet(wb, new String[]{"Views", "Sudut Pandang", "SLD Views"});

    // Info sheet: key/value
    Map<String, String> info = new LinkedHashMap<>();
    if (wsInfo != null) {
      for (Object rowObj : excel.grid(wsInfo)) {
        @SuppressWarnings("unchecked") List<String> row = (List<String>) rowObj;
        if (!row.isEmpty() && !row.get(0).isEmpty()) {
          info.put(norm(row.get(0)), row.size() > 1 ? row.get(1) : "");
        }
      }
    }
    String ssCode = info.getOrDefault("kode subsistem", info.getOrDefault("kode", "")).trim().toUpperCase();
    if (ssCode.isEmpty()) {
      String ck = MappingDetector.cleanKey(filename);
      ssCode = "SS_" + ck.substring(0, Math.min(6, ck.length())).toUpperCase();
    }
    String ssName = info.getOrDefault("nama subsistem", info.getOrDefault("nama", guessSubsystemName(filename))).trim();

    Map<String, EnginePayloadDto.Object> objects = new LinkedHashMap<>();
    if (wsAsset != null) {
      ExcelReader.HeaderRows hr = excel.readHeaderRows(wsAsset);
      for (Map<String, String> row : hr.rows) {
        Object code = get(row, "Kode Singkatan", "Kode", "Code");
        String atype = norm(get(row, "Tipe Asset", "Tipe", "Type"));
        if (code == null || strO(code).isEmpty() || atype.contains("ibt") || atype.contains("winding")) continue;
        String name = strO(get(row, "Nama Asset / GI", "Nama Asset", "Nama GI", "Name"));
        String[] rt = resolved(strO(get(row, "Tipe Asset", "Tipe", "Type")), name,
            strO(get(row, "Tegangan", "Voltage")), "");
        Object tierTmp = get(row, "Tier (Mulai 0)", "Tier", "Tier (Mulai 1)");
        boolean useZeroBased = row.keySet().stream().anyMatch(k -> norm(k).equals("tier (mulai 0)"));
        Integer tierRaw = intOr(tierTmp);
        Integer tier = tierRaw == null ? null : (useZeroBased ? tierRaw + 1 : tierRaw);
        String status = statusMap(get(row, "Status Operasi", "Status"));
        String riskLevel = normalizeRiskLevel(get(row, "Status Kerawanan", "Tingkat Kerawanan", "Kerawanan"));
        List<Integer> riskNo = riskNumbers(get(row, "No Kerawanan", "No. Kerawanan"));

        EnginePayloadDto.Object obj = new EnginePayloadDto.Object();
        obj.external_key = strO(code).trim();
        obj.object_type = rt[0];
        obj.raw_label = name.isEmpty() ? obj.external_key : name;
        obj.site_name = name.isEmpty() ? obj.external_key : name;
        obj.voltage_hv_kv = kvNum(get(row, "Tegangan", "Voltage"));
        obj.unit_no = null;
        obj.tier_hint = tier;
        obj.status_hint = status;
        obj.confidence = "GITET".equals(rt[0]) || "GISTET".equals(rt[0]) ? 0.9 : 0.8;
        obj.is_bay = "true".equals(rt[1]);
        String feeder = strO(get(row, "Feeder (GI Induk)", "Feeder", "GI Induk", "Induk"));
        obj.bay_feeder_key = feeder.isEmpty() ? null : feeder;
        obj.bay_kind = "null".equals(rt[2]) ? null : rt[2];
        obj.has_transformer = boolOr(get(row, "Ada Trafo", "Has Transformer"));
        obj.has_capacitor = boolOr(get(row, "Ada Kapasitor", "Has Capacitor"));
        obj.transformer_count = intOr(get(row, "Jumlah Trafo", "Transformer Count"));
        obj.capacitor_count = intOr(get(row, "Jumlah Kapasitor", "Capacitor Count"));
        String symNote = strO(get(row, "Catatan Simbol", "Symbol Note"));
        obj.symbol_note = symNote.isEmpty() ? null : symNote;
        obj.view_keys = tokens(get(row, "Sudut Pandang", "View", "View Key"));
        String outlet = strO(get(row, "Bus Terhubung", "Outlet Bus", "Terhubung ke Bus"));
        obj.outlet_key = outlet.isEmpty() ? null : outlet;
        String role = strO(get(row, "Role", "Peran", "Peran SLD")).trim().toUpperCase();
        obj.role_hint = role.isEmpty() ? null : role;
        obj.bay_circuit_count = intOr(get(row, "Jumlah Sirkit Bay", "Jumlah Sirkit", "Sirkit", "Circuit Count"));
        obj.risk_seq = riskNo;
        obj.risk_level = riskLevel;
        objects.put(obj.external_key, obj);
      }
    }

    List<Connection> pendingIbt = new ArrayList<>();
    if (wsAsset != null) {
      for (Map<String, String> row : excel.readHeaderRows(wsAsset).rows) {
        String atype = norm(get(row, "Tipe Asset", "Tipe", "Type"));
        if (!atype.contains("ibt") && !atype.contains("winding")) continue;
        String unit = strO(get(row, "No IBT", "Unit", "No Unit"));
        unit = unit.isEmpty() ? "1" : unit.trim();
        String rawCode = strO(get(row, "Kode Singkatan", "Kode", "Code"));
        Object hvRaw = get(row, "Bus HV", "Bus Primer", "GITET Induk");
        String hv;
        if (hvRaw == null) {
          String[] parts = rawCode.split("\\s+");
          hv = parts.length > 0 ? parts[parts.length - 1].toUpperCase() : "";
        } else {
          hv = strO(hvRaw).trim().toUpperCase();
        }
        Object lvRaw = get(row, "Bus 150 kV", "Bus 150kV", "Bus LV", "Ke Bus", "Bus");
        String lv = lvRaw == null ? null : strO(lvRaw).trim().toUpperCase();
        if (hv.isEmpty() || lv == null || lv.isEmpty()) continue;
        if (!objects.containsKey(hv) || !objects.containsKey(lv)) {
          res.issues.add(issue("warning", "IBT " + unit + " " + rawCode + ": endpooint tidak dikenal " + hv + " -> " + lv));
          continue;
        }
        EnginePayloadDto.Object gk = objects.get(hv);
        EnginePayloadDto.Object ok = objects.get(lv);
        String gitetKey = hv;
        if (gk.tier_hint == null) gk.tier_hint = 0;
        if (ok.tier_hint == null) ok.tier_hint = 1;
        List<Integer> riskNo = riskNumbers(get(row, "No Kerawanan", "No. Kerawanan"));
        Connection c = new Connection();
        c.from_external_key = gitetKey;
        c.to_external_key = ok.external_key;
        c.relation_type = "IBT_LINK";
        c.circuit_type_hint = "IBT_LINK";
        c.status_hint = statusMap(get(row, "Status Operasi", "Status"));
        c.circuit_count = 1;
        c.unit_no = unit;
        c.single_phi = false;
        c.confidence = 1.0;
        c.note = rawCode;
        c.view_keys = tokens(get(row, "Sudut Pandang", "View", "View Key"));
        c.line_name = "IBT " + unit + " " + hv;
        c.voltage_kv = 500.0;
        c.tier_from_hint = 0;
        c.tier_to_hint = 1;
        c.risk_seq = riskNo;
        c.risk_level = normalizeRiskLevel(get(row, "Status Kerawanan", "Tingkat Kerawanan"));
        pendingIbt.add(c);
      }
    }

    List<Connection> bayLinks = new ArrayList<>();
    if (wsBay != null) {
      for (Map<String, String> row : excel.readHeaderRows(wsBay).rows) {
        String code = strO(get(row, "Kode GI", "Kode", "Code")).trim();
        String feeder = strO(get(row, "Feeder (GI Induk)", "Feeder", "GI Induk", "Induk")).trim();
        if (code.isEmpty() || feeder.isEmpty()) continue;
        EnginePayloadDto.Object existing = objects.get(code);
        String bayKindRaw = strO(get(row, "Jenis", "Jenis Bay", "Tipe")).trim().toUpperCase();
        if (bayKindRaw.isEmpty()) bayKindRaw = "SUTT";
        if (existing != null) {
          existing.is_bay = true;
          existing.bay_feeder_key = feeder;
          existing.bay_circuit_count = intOr(get(row, "Jumlah Sirkit", "Sirkit", "Circuit Count"));
          existing.view_keys = tokens(get(row, "Sudut Pandang", "View", "View Key"));
          existing.risk_seq = new ArrayList<>(riskNumbers(get(row, "No Kerawanan", "No. Kerawanan")));
        } else {
          EnginePayloadDto.Object obj = new EnginePayloadDto.Object();
          obj.external_key = code;
          obj.object_type = "BAY";
          String nama = strO(get(row, "Nama GI", "Nama"));
          obj.raw_label = nama.isEmpty() ? code : nama;
          obj.site_name = nama.isEmpty() ? code : nama;
          obj.voltage_hv_kv = kvNum(get(row, "Tegangan"));
          obj.unit_no = null;
          obj.tier_hint = null;
          obj.status_hint = statusMap(get(row, "Status Operasi", "Status"));
          obj.confidence = 0.7;
          obj.is_bay = true;
          obj.bay_feeder_key = feeder;
          obj.bay_kind = bayKindRaw;
          obj.has_transformer = false;
          obj.has_capacitor = false;
          obj.view_keys = tokens(get(row, "Sudut Pandang", "View", "View Key"));
          obj.bay_circuit_count = intOr(get(row, "Jumlah Sirkit", "Sirkit", "Circuit Count"));
          obj.risk_seq = riskNumbers(get(row, "No Kerawanan", "No. Kerawanan"));
          obj.risk_level = "Normal";
          objects.put(code, obj);
        }
        if (objects.containsKey(feeder)) {
          Connection c = new Connection();
          c.from_external_key = code;
          c.to_external_key = feeder;
          c.relation_type = "CONNECTED_TO";
          c.circuit_type_hint = "SUTT";
          c.status_hint = "ENERGIZED";
          c.circuit_count = 1;
          c.single_phi = false;
          c.confidence = 0.7;
          c.risk_level = "Normal";
          bayLinks.add(c);
        }
      }
    }

    List<Connection> connections = new ArrayList<>();
    connections.addAll(pendingIbt);
    connections.addAll(bayLinks);
    if (wsLine != null) {
      for (Map<String, String> row : excel.readHeaderRows(wsLine).rows) {
        String fr = strO(get(row, "Dari GI", "Dari", "From")).trim();
        String to = strO(get(row, "Ke GI", "Ke", "To")).trim();
        if (fr.isEmpty() || to.isEmpty()) continue;
        String fk = fr;
        String tk = to;
        if (!objects.containsKey(fk)) {
          res.issues.add(issue("warning", "Endpoint at Jalur_Transmisi tidak dikenal: " + fr));
          continue;
        }
        if (!objects.containsKey(tk)) {
          res.issues.add(issue("warning", "Endpoint at Jalur_Transmisi tidak dikenal: " + to));
          continue;
        }
        String lineNameVal = strO(get(row, "Nama Penghantar", "Nama", "Name"));
        String riskLevel = normalizeRiskLevel(get(row, "Tingkat Kerawanan", "Kerawanan"));
        List<Integer> riskNo = riskNumbers(get(row, "No Kerawanan", "No. Kerawanan"));
        Connection c = new Connection();
        c.from_external_key = fk;
        c.to_external_key = tk;
        c.relation_type = "CONNECTED_TO";
        c.circuit_type_hint = lineTypeHint(get(row, "Nama Penghantar", "Nama", "Name"));
        c.status_hint = statusMap(get(row, "Status Operasi", "Status"));
        Integer circuits = intOr(get(row, "Jumlah Sirkit", "Sirkit"));
        c.circuit_count = circuits != null ? circuits : 2;
        c.circuit_number = intOr(get(row, "No Sirkit", "Nomor Sirkit", "Circuit Number", "Circuit No"));
        c.single_phi = boolOr(get(row, "Single Phi", "Single-phi", "Single Phase"));
        c.confidence = 0.85;
        c.note = lineNameVal.isEmpty() ? null : lineNameVal;
        c.view_keys = tokens(get(row, "Sudut Pandang", "View", "View Key"));
        c.line_name = lineNameVal.isEmpty() ? null : lineNameVal;
        c.voltage_kv = kvNum(get(row, "Tegangan"));
        c.length_km = numOr(get(row, "Panjang Saluran (km)", "Panjang"));
        c.loading_c1 = pcOr(get(row, "Pembebanan Sirkit 1 (%)", "Pembebanan 1", "Pembebanan Sirkit 1"));
        c.loading_c2 = pcOr(get(row, "Pembebanan Sirkit 2 (%)", "Pembebanan 2", "Pembebanan Sirkit 2"));
        String corridor = strO(get(row, "Koridor / Wilayah", "Koridor", "Wilayah"));
        c.corridor = corridor.isEmpty() ? null : corridor;
        String uit = strO(get(row, "UIT"));
        c.uit = uit.isEmpty() ? null : uit;
        c.tier_from_hint = intOr(get(row, "Tier Dari", "Tier Dari GI"));
        c.tier_to_hint = intOr(get(row, "Tier Ke", "Tier Ke GI"));
        c.risk_seq = riskNo;
        c.risk_level = riskLevel;
        String cond = strO(get(row, "Kondisi / Permasalahan", "Kondisi"));
        c.condition = cond.isEmpty() ? null : cond;
        String dampak = strO(get(row, "Dampak"));
        c.impact = dampak.isEmpty() ? null : dampak;
        String mitig = strO(get(row, "Mitigasi"));
        c.mitigation = mitig.isEmpty() ? null : mitig;
        String sol = strO(get(row, "Usulan / Solusi", "Usulan", "Solusi"));
        c.follow_up = sol.isEmpty() ? null : sol;
        connections.add(c);
      }
    }

    // dedupe
    Set<String> seen = new LinkedHashSet<>();
    for (int i = 0; i < connections.size(); ) {
      Connection c = connections.get(i);
      String suffix = "IBT_LINK".equals(c.relation_type) ? (c.unit_no != null ? c.unit_no : "1") : (c.circuit_number != null ? String.valueOf(c.circuit_number) : "");
      String k = c.from_external_key + "\u0000" + c.to_external_key + "\u0000" + c.relation_type + "\u0000" + suffix;
      if (seen.contains(k)) {
        connections.remove(i);
      } else {
        seen.add(k);
        i++;
      }
    }

    List<Risk> risks = new ArrayList<>();
    Map<Integer, String[]> pinBySeq = new LinkedHashMap<>();
    for (EnginePayloadDto.Object o : objects.values()) {
      for (Integer rn : o.risk_seq) pinBySeq.put(rn, new String[]{"SUBSTATION", o.external_key});
    }
    for (Connection c : connections) {
      for (Integer rn : c.risk_seq) pinBySeq.put(rn, new String[]{"CIRCUIT", c.from_external_key + "-" + c.to_external_key});
    }
    if (wsRisk != null) {
      for (Map<String, String> row : excel.readHeaderRows(wsRisk).rows) {
        Integer seq = intOr(get(row, "No", "Seq"));
        String uit = strO(get(row, "UIT"));
        String[] pin = seq != null ? pinBySeq.get(seq) : null;
        Risk r = new Risk();
        r.seq_no = seq;
        r.uit = uit.isEmpty() ? "JBB" : uit.trim();
        r.category = normalizeRiskLevel(get(row, "Kategori Kontingensi", "Kategori", "Category"));
        String cond = strO(get(row, "Kondisi / Permasalahan", "Kondisi"));
        r.title = firstLine(cond);
        r.condition = cond;
        r.impact = strO(get(row, "Dampak"));
        r.mitigation = strO(get(row, "Mitigasi"));
        r.follow_up = strO(get(row, "Usulan / Solusi", "Usulan", "Solusi"));
        r.pin_kind = pin != null ? pin[0] : null;
        r.pin_key = pin != null ? pin[1] : null;
        risks.add(r);
      }
    }

    List<EnginePayloadDto.View> viewRows = new ArrayList<>();
    if (wsViews != null) {
      for (Map<String, String> row : excel.readHeaderRows(wsViews).rows) {
        String vk = strO(get(row, "View Key", "Kunci View", "Kode View", "Sudut Pandang")).trim().toUpperCase();
        if (!vk.isEmpty()) {
          String name = strO(get(row, "Nama View", "Nama SLD", "Name"));
          EnginePayloadDto.View v = new EnginePayloadDto.View();
          v.view_key = vk;
          v.name = name.isEmpty() ? vk : name;
          v.source_keys = tokens(get(row, "Sumber Tier-1 (kode GI, pisah ;)", "Sumber Tier-1", "Source Keys"));
          viewRows.add(v);
        }
      }
    }

    Payload p = new Payload();
    p.meta.filename = filename;
    p.meta.document_type = "SLD_TEMPLATE_XLSX";
    p.meta.analytical_hint = "SUBSYSTEM_500_150";
    p.meta.source_ref = "Template subsistem PLN (" + filename + ")";
    p.subsystem.code = ssCode;
    p.subsystem.name = ssName;
    String apb = info.getOrDefault("apb", info.getOrDefault("up2b", "UP2B"));
    p.subsystem.apb = apb;
    p.subsystem.views = viewRows;
    p.objects = new ArrayList<>(objects.values());
    p.connections = connections;
    p.risks = risks;
    res.payload = p;
    return res;
  }

  public EnginePayloadDto.ParseResult parseWorkbookToPayload(Workbook wb, String filename) {
    return parseEngineWorkbook(wb, filename);
  }
}