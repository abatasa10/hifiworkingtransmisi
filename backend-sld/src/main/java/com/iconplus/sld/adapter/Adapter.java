package com.iconplus.sld.adapter;

import com.iconplus.sld.dto.EnginePayloadDto;
import com.iconplus.sld.dto.ViewModelDto;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Tahap 4 — port `adapter.ts` (`toViewModel`).
 * Mengonversi EnginePayload (hasil parser) menjadi node/line flat model
 * yang dipakai renderer (React Flow). Koneksi IBT_LINK dijadikan baris
 * `transformer_link` khusus agar simbol 3-belitan digambar di sisi edge.
 */
public class Adapter {

  public static String riskStatusOf(String level) {
    String l = level == null ? "" : level.toUpperCase();
    if (l.contains("N-1-2") || l.contains("N-1-1") || l.contains("N12")) return "N-1-2";
    if (l.contains("N-2") || l.contains("N2")) return "N-2";
    if (l.contains("SANGAT RAWAN") || l.contains("KRITIS")) return "Sangat Rawan";
    if (l.contains("SEDANG")) return "Sedang";
    if (l.contains("RAWAN") || l.contains("N-1") || l.contains("N1")) return "N-1";
    return "Normal";
  }

  private static boolean isBlank(String s) {
    return s == null || s.trim().isEmpty();
  }

  private static String voltageLabel(Double hv, Double lv, String fallback) {
    boolean hasHv = hv != null && hv != 0;
    boolean hasLv = lv != null && lv != 0;
    if (hasHv && hasLv) return Math.round(hv) + "/" + Math.round(lv) + " kV";
    if (hasHv) return Math.round(hv) + " kV";
    if (hasLv) return Math.round(lv) + " kV";
    return fallback;
  }

  private static String assetTypeOf(EnginePayloadDto.Object o) {
    switch (o.object_type) {
      case "GITET":
      case "GISTET":
        return "gitet";
      case "GENERATING_UNIT":
        return "pembangkit";
      case "IBT":
        return "ibt";
      case "TRAFO":
        return "trafo";
      case "BEBAN":
        return "beban";
      case "GI":
      case "GIS":
      case "BAY":
        return "gi";
      default:
        return "busbar";
    }
  }

  private static int tierOfKey(Map<String, Integer> tierMap, String key) {
    Integer t = tierMap.get(key);
    return t == null ? 99 : t;
  }

  /** Nodes yang "teraliri" ke hilir: hanya menuju tier yang lebih tinggi (tanpa loop). */
  private static List<String> downstreamFrom(Map<String, Set<String>> adj,
                                             Map<String, Integer> tierMap, String start) {
    Set<String> seen = new LinkedHashSet<>();
    seen.add(start);
    List<String> out = new ArrayList<>();
    List<String> queue = new ArrayList<>();
    queue.add(start);
    int qi = 0;
    while (qi < queue.size()) {
      String cur = queue.get(qi++);
      int ct = tierOfKey(tierMap, cur);
      for (String nb : adj.getOrDefault(cur, Set.of())) {
        if (seen.contains(nb) || tierOfKey(tierMap, nb) <= ct) continue;
        seen.add(nb);
        out.add(nb);
        queue.add(nb);
      }
    }
    return out;
  }

  private static String displayNameOf(Map<String, EnginePayloadDto.Object> objByKey, String key) {
    EnginePayloadDto.Object o = objByKey.get(key);
    if (o != null && !isBlank(o.raw_label)) return o.raw_label;
    if (o != null && !isBlank(o.site_name)) return o.site_name;
    return key.toUpperCase();
  }

  public static ViewModelDto.Result toViewModel(
      EnginePayloadDto.Payload payload,
      Map<String, Integer> tierMap,
      String subsystemName) {
    ViewModelDto.Result r = new ViewModelDto.Result();
    List<ViewModelDto.GiNode> giList = r.giList;
    List<ViewModelDto.Line> lineList = r.lineList;
    List<ViewModelDto.Line> ibrLinks = r.ibrLinks;

    // IBT yang bukan endpoint koneksi apapun dibuang (di template saat ini IBT
    // digambar sebagai edge IBT_LINK, bukan node; stub IBT yatim jadi node mati).
    Set<String> endpointKeys = new LinkedHashSet<>();
    for (EnginePayloadDto.Connection c : payload.connections) {
      endpointKeys.add(c.from_external_key);
      endpointKeys.add(c.to_external_key);
    }
    Set<String> droppedIbt = new LinkedHashSet<>();
    for (EnginePayloadDto.Object o : payload.objects) {
      if ("IBT".equals(o.object_type) && !endpointKeys.contains(o.external_key)) {
        droppedIbt.add(o.external_key);
      }
    }

    Map<String, EnginePayloadDto.Object> objByKey = new LinkedHashMap<>();
    for (EnginePayloadDto.Object o : payload.objects) objByKey.put(o.external_key, o);

    Map<String, Set<String>> adj = new LinkedHashMap<>();
    for (EnginePayloadDto.Object o : payload.objects) adj.put(o.external_key, new LinkedHashSet<>());
    for (EnginePayloadDto.Connection c : payload.connections) {
      if (droppedIbt.contains(c.from_external_key) || droppedIbt.contains(c.to_external_key)) continue;
      Set<String> f = adj.get(c.from_external_key);
      if (f != null) f.add(c.to_external_key);
      Set<String> t = adj.get(c.to_external_key);
      if (t != null) t.add(c.from_external_key);
    }

    String regionDefault;
    String apb = payload.subsystem.apb;
    String sname = payload.subsystem.name;
    regionDefault = !isBlank(apb) ? apb : (!isBlank(sname) ? sname : "UP2B");

    Map<String, ViewModelDto.GiNode> nodeByKey = new LinkedHashMap<>();
    for (EnginePayloadDto.Object o : payload.objects) {
      if (droppedIbt.contains(o.external_key)) continue;
      Integer tier = tierMap.get(o.external_key);
      String riskStatus = riskStatusOf(o.risk_level);
      String fallback = "IBT".equals(o.object_type) ? "500/150 kV" : "150 kV";
      String volt = voltageLabel(o.voltage_hv_kv, o.voltage_lv_kv, fallback);
      if ("GITET".equals(o.object_type) || "GISTET".equals(o.object_type)) {
        if (o.voltage_hv_kv == null) o.voltage_hv_kv = 500.0;
      }
      ViewModelDto.GiNode node = new ViewModelDto.GiNode();
      node.id = o.external_key;
      node.name = !isBlank(o.raw_label) ? o.raw_label : o.external_key;
      node.code = o.external_key;
      node.assetType = assetTypeOf(o);
      node.voltage = volt;
      node.tier = tier;
      node.ibtNumber = o.unit_no != null ? o.unit_no : ("IBT".equals(o.object_type) ? "1" : null);
      node.primaryVoltage = (o.voltage_hv_kv != null && o.voltage_hv_kv != 0)
          ? Math.round(o.voltage_hv_kv) + " kV" : null;
      node.secondaryVoltage = (o.voltage_lv_kv != null && o.voltage_lv_kv != 0)
          ? Math.round(o.voltage_lv_kv) + " kV" : null;
      node.capacityMVA = o.transformer_count != null ? (double) o.transformer_count : null;
      node.region = regionDefault;
      node.riskStatus = riskStatus;
      node.riskNumber = o.risk_seq.isEmpty() ? null : o.risk_seq.get(0);
      node.subsystem = subsystemName;
      node.condition = o.condition;
      node.impact = o.impact;
      node.mitigation = o.mitigation;
      node.solution = o.follow_up;
      node.isBay = o.is_bay;
      node.feederKey = o.bay_feeder_key;
      node.objectType = o.object_type;
      node.unitNo = o.unit_no;
      node.busLvKey = o.outlet_key;
      node.functLoc = o.funct_loc;

      List<String> connKeys = new ArrayList<>();
      for (String k : o.connected_keys) if (!k.equals(o.external_key)) connKeys.add(k);
      for (String k : adj.getOrDefault(o.external_key, Set.of())) {
        if (!k.equals(o.external_key) && !connKeys.contains(k)) connKeys.add(k);
      }
      List<String> impKeys = new ArrayList<>();
      for (String k : o.impacted_keys) if (!k.equals(o.external_key)) impKeys.add(k);
      for (String k : downstreamFrom(adj, tierMap, o.external_key)) {
        if (!impKeys.contains(k)) impKeys.add(k);
      }
      List<String> connNames = new ArrayList<>();
      for (String k : connKeys) connNames.add(displayNameOf(objByKey, k));
      List<String> impNames = new ArrayList<>();
      for (String k : impKeys) impNames.add(displayNameOf(objByKey, k));
      node.connectedKeys = connKeys;
      node.connectedNames = connNames;
      node.impactedKeys = impKeys;
      node.impactedNames = impNames;
      nodeByKey.put(o.external_key, node);
      giList.add(node);
    }

    java.util.function.Function<EnginePayloadDto.Connection, ViewModelDto.Line> lineFrom = c -> {
      ViewModelDto.Line line = new ViewModelDto.Line();
      line.id = "IBT_LINK".equals(c.relation_type)
          ? "INTERNAL_IBT_" + (c.unit_no != null ? c.unit_no : "1") + "_"
              + c.from_external_key + "-" + c.to_external_key
          : "LINE_" + c.from_external_key + "-" + c.to_external_key
              + (c.unit_no != null && !c.unit_no.isEmpty() ? "_" + c.unit_no : "");
      line.sourceId = c.from_external_key;
      line.targetId = c.to_external_key;
      String ln = c.line_name;
      if (isBlank(ln)) ln = c.note;
      if (isBlank(ln)) ln = c.from_external_key + " - " + c.to_external_key;
      line.lineName = ln;
      line.circuit = c.circuit_count + " Sirkit";
      line.circuitCount = (c.circuit_number != null && c.circuit_number != 0) ? 1 : c.circuit_count;
      line.circuitNumber = c.circuit_number;
      line.lengthKm = c.length_km != null ? c.length_km : 0.0;
      line.loadingPct = c.loading_c1 != null ? c.loading_c1 : 0.0;
      line.loadingCircuit1 = c.loading_c1 != null ? c.loading_c1 : 0.0;
      line.loadingCircuit2 = c.loading_c2 != null ? c.loading_c2 : 0.0;
      line.voltage = (c.voltage_kv != null && c.voltage_kv != 0)
          ? Math.round(c.voltage_kv) + " kV" : "150 kV";
      if ("ENERGIZED".equals(c.status_hint)) line.operatingStatus = "Beroperasi";
      else if ("PLANNED".equals(c.status_hint)) line.operatingStatus = "Rencana";
      else line.operatingStatus = "Dalam Perbaikan";
      line.riskStatus = riskStatusOf(c.risk_level);
      line.riskNumber = c.risk_seq.isEmpty() ? null : c.risk_seq.get(0);
      line.region = !isBlank(c.corridor) ? c.corridor : (payload.subsystem.name != null ? payload.subsystem.name : "");
      line.corridor = c.corridor;
      line.uit = c.uit;
      line.condition = c.condition;
      line.impact = c.impact;
      line.mitigation = c.mitigation;
      line.solution = c.follow_up;
      return line;
    };

    for (EnginePayloadDto.Connection c : payload.connections) {
      if (droppedIbt.contains(c.from_external_key) || droppedIbt.contains(c.to_external_key)) continue;
      ViewModelDto.Line line = lineFrom.apply(c);
      ViewModelDto.GiNode sn = nodeByKey.get(c.from_external_key);
      ViewModelDto.GiNode tn = nodeByKey.get(c.to_external_key);
      line.sourceName = (sn != null && !isBlank(sn.name)) ? sn.name : c.from_external_key.toUpperCase();
      line.targetName = (tn != null && !isBlank(tn.name)) ? tn.name : c.to_external_key.toUpperCase();
      int sT = tierOfKey(tierMap, c.from_external_key);
      int tT = tierOfKey(tierMap, c.to_external_key);
      List<String> affected = new ArrayList<>();
      if (sT == tT) {
        LinkedHashSet<String> all = new LinkedHashSet<>();
        all.addAll(downstreamFrom(adj, tierMap, c.from_external_key));
        all.addAll(downstreamFrom(adj, tierMap, c.to_external_key));
        all.remove(c.from_external_key);
        all.remove(c.to_external_key);
        affected.addAll(all);
      } else {
        String fed = sT > tT ? c.from_external_key : c.to_external_key;
        affected.add(fed);
        affected.addAll(downstreamFrom(adj, tierMap, fed));
      }
      List<String> affectedNames = new ArrayList<>();
      for (String k : affected) {
        ViewModelDto.GiNode n = nodeByKey.get(k);
        affectedNames.add(n != null && !isBlank(n.name) ? n.name : k.toUpperCase());
      }
      line.impactedNames = affectedNames;
      if ("IBT_LINK".equals(c.relation_type)) ibrLinks.add(line);
      else lineList.add(line);
    }

    return r;
  }
}