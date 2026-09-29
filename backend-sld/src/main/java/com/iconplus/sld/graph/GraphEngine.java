package com.iconplus.sld.graph;

import com.iconplus.sld.dto.EngineDto;
import com.iconplus.sld.dto.EnginePayloadDto;
import com.iconplus.sld.dto.ViewModelDto;
import com.iconplus.sld.layout.LayoutEngine;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Port toEngSldGraph (src/lib/sld/engineSld.ts) — tahap 5.
 *
 * Mengubah view-model flat (giList + lineList + posisi layout + risiko)
 * menjadi graf SLD deklaratif ala engine. Tier di-rebase sehingga pita 1
 * (sumber 500 kV) menjadi tier 0 yang digambar di atas Tier 1.
 */
public class GraphEngine {

  private static final Pattern KV_RE = Pattern.compile("(\\d[\\d.,]*)");
  private static final Pattern PAREN_RE = Pattern.compile("\\s*\\(.*?\\)\\s*");
  private static final Pattern KONSUMEN_RE = Pattern.compile("^\\s*konsumen\\s+", Pattern.CASE_INSENSITIVE);
  private static final Pattern UNIT_RE = Pattern.compile("unit\\s*\\d+", Pattern.CASE_INSENSITIVE);
  private static final Pattern SKTT_RE = Pattern.compile("sktt|kabel", Pattern.CASE_INSENSITIVE);

  private static double kvOf(String label, double fallback) {
    String s = label == null ? "" : label;
    Matcher m = KV_RE.matcher(s);
    if (!m.find()) return fallback;
    String v = m.group(1).replace(",", ".");
    double n;
    try {
      n = Double.parseDouble(v);
    } catch (NumberFormatException e) {
      return fallback;
    }
    return Double.isFinite(n) && n > 0 ? Math.round(n) : fallback;
  }

  private static String opStatus(String v) {
    return "Rencana".equals(v) ? "PLANNED" : "ENERGIZED";
  }

  private static String shortLabel(String code, String name) {
    String c = code == null ? "" : code;
    if (c.length() >= 3 && c.length() <= 6 && c.toUpperCase().matches("[A-Z0-9]{3,6}")) {
      return c.toUpperCase();
    }
    String stripped = PAREN_RE.matcher(name == null ? "" : name).replaceAll("").trim();
    if (stripped.length() > 0 && stripped.length() <= 16) return stripped;
    if (c.length() > 0 && c.length() <= 8) return c.toUpperCase();
    String sliced = stripped.length() > 26 ? stripped.substring(0, 26) : stripped;
    return sliced.isEmpty() ? c : sliced;
  }

  private static String bebanLabel(String name, String code) {
    String s = PAREN_RE.matcher(name == null ? "" : name).replaceAll("");
    s = KONSUMEN_RE.matcher(s).replaceAll("").trim();
    String sliced = s.length() > 24 ? s.substring(0, 24) : s;
    return sliced.isEmpty() ? code.toUpperCase() : sliced;
  }

  private static String cleanId(String s) {
    return (s == null ? "" : s).toLowerCase().replaceAll("[^a-z0-9]", "");
  }

  private static final class TapEntry {
    double w;
    List<Tap> taps = new ArrayList<>();
  }

  private static final class Tap {
    String connectedNodeId;
    double x;
  }

  private static double findTapPort(
      Map<String, TapEntry> tapTable,
      Map<String, EngineDto.Node> byCode,
      String code,
      String otherId) {
    TapEntry entry = tapTable.get(code);
    EngineDto.Node node = byCode.get(code);
    if (entry == null || node == null || entry.taps.isEmpty()) return 0;
    String want = cleanId(otherId);
    Tap tap = null;
    for (Tap t : entry.taps) {
      String c = cleanId(t.connectedNodeId);
      if (want.contains(c) || c.contains(want)) { tap = t; break; }
    }
    if (tap == null) return 0;
    double port = tap.x - entry.w / 2;
    return Math.max(-(node.halfWidth - 10), Math.min(node.halfWidth - 10, port));
  }

  public static EngineDto.Graph toEngSldGraph(
      List<ViewModelDto.GiNode> giList,
      List<ViewModelDto.Line> lineList,
      Map<String, LayoutEngine.NodePosition> positions,
      List<EnginePayloadDto.Risk> risks,
      String id,
      String title,
      String viewName) {

    Map<String, ViewModelDto.GiNode> nodeById = new LinkedHashMap<>();
    for (ViewModelDto.GiNode n : giList) nodeById.put(n.id, n);

    Map<String, Integer> degree = new LinkedHashMap<>();
    List<ViewModelDto.Line> validLines = new ArrayList<>();
    for (ViewModelDto.Line l : lineList) {
      if (nodeById.containsKey(l.sourceId) && nodeById.containsKey(l.targetId)) {
        validLines.add(l);
        degree.put(l.sourceId, degree.getOrDefault(l.sourceId, 0) + 1);
        degree.put(l.targetId, degree.getOrDefault(l.targetId, 0) + 1);
      }
    }

    final java.util.function.Function<ViewModelDto.GiNode, Integer> bandOf = n -> {
      Integer t = n.tier;
      LayoutEngine.NodePosition pos = positions.get(n.id);
      if (t == null && pos != null) t = pos.tier;
      return (t != null && t >= 0) ? Math.round(t) : 3;
    };

    int minBand = Integer.MAX_VALUE;
    for (ViewModelDto.GiNode n : giList) minBand = Math.min(minBand, bandOf.apply(n));
    if (!giList.isEmpty() && minBand == Integer.MAX_VALUE) minBand = 1;
    if (giList.isEmpty()) minBand = 1;
    final int mBand = minBand;
    final java.util.function.IntUnaryOperator sldTierOf = band -> Math.max(0, band - mBand);

    Set<String> endpointIds = new LinkedHashSet<>();
    for (ViewModelDto.Line l : validLines) {
      endpointIds.add(l.sourceId);
      endpointIds.add(l.targetId);
    }

    List<EngineDto.Bay> bays = new ArrayList<>();
    Set<String> bayIds = new HashSet<>();
    Map<String, List<ViewModelDto.GiNode>> baysByBus = new LinkedHashMap<>();
    for (ViewModelDto.GiNode n : giList) {
      boolean isBay = n.isBay != null && n.isBay;
      if (isBay && n.feederKey != null && nodeById.containsKey(n.feederKey)) {
        bayIds.add(n.id);
        baysByBus.computeIfAbsent(n.feederKey, k -> new ArrayList<>()).add(n);
      }
    }
    for (Map.Entry<String, List<ViewModelDto.GiNode>> e : baysByBus.entrySet()) {
      String busCode = e.getKey();
      List<ViewModelDto.GiNode> arr = e.getValue();
      LayoutEngine.NodePosition bpos = positions.get(busCode);
      double px = bpos == null ? 0.0 : bpos.x;
      double pw = bpos == null ? 150.0 : bpos.busbarWidth;
      for (int i = 0; i < arr.size(); i++) {
        ViewModelDto.GiNode b = arr.get(i);
        EngineDto.Bay bay = new EngineDto.Bay();
        bay.id = "bay-" + b.id;
        bay.code = (b.code == null || b.code.isEmpty()) ? b.id : b.code;
        bay.name = (b.name == null || b.name.isEmpty()) ? b.id : b.name;
        bay.busCode = busCode;
        bay.x = px + pw / 2 + (i - (arr.size() - 1) / 2.0) * 46;
        bay.circuitCount = 1;
        bay.status = "ENERGIZED";
        bays.add(bay);
      }
    }

    List<EngineDto.Node> nodes = new ArrayList<>();
    for (ViewModelDto.GiNode n : giList) {
      if (bayIds.contains(n.id)) continue;
      String aT0 = (n.assetType == null ? "" : n.assetType).toLowerCase();
      if ("ibt".equals(aT0) && !endpointIds.contains(n.id)) continue;
      int band = bandOf.apply(n);
      int tier = sldTierOf.applyAsInt(band);
      String aT = aT0;
      String type;
      if ("gitet".equals(aT)) type = "GITET";
      else if ("pembangkit".equals(aT)) type = "GENERATING_UNIT";
      else if ("beban".equals(aT)) type = "BEBAN";
      else if ("gis".equals(aT)) type = "GIS";
      else type = "GI";

      boolean isBeban = "BEBAN".equals(type);
      String pv = (n.primaryVoltage == null || n.primaryVoltage.isEmpty()) ? n.voltage : n.primaryVoltage;
      double voltageKv = kvOf(pv, isBeban ? 20 : 150);

      LayoutEngine.NodePosition pos = positions.get(n.id);
      boolean wide = pos != null && pos.isWideBusbar;
      double posW = pos == null ? 150.0 : pos.busbarWidth;
      double halfWidth = Math.max(40, wide ? posW / 2 : 75);
      int deg = degree.getOrDefault(n.id, 0);
      String role = tier == 0 || "GENERATING_UNIT".equals(type) ? "SOURCE" : deg == 0 ? "BOUNDARY" : "CORE";

      String name = (n.name == null ? "" : n.name);
      String label;
      if ("GENERATING_UNIT".equals(type)) {
        Matcher um = UNIT_RE.matcher(name);
        label = um.find() ? um.group() : shortLabel(n.code, name);
      } else if ("BEBAN".equals(type)) {
        label = bebanLabel(name, n.id);
      } else {
        label = shortLabel(n.code, name);
      }

      EngineDto.Node node = new EngineDto.Node();
      node.code = n.id;
      node.label = label;
      node.name = (n.name == null || n.name.isEmpty()) ? n.id : n.name;
      node.type = type;
      node.voltageKv = voltageKv;
      node.role = role;
      node.tier = tier;
      node.status = "ENERGIZED";
      node.x = ((pos == null) ? 0.0 : pos.x) + posW / 2;
      node.halfWidth = halfWidth;
      node.labelTop = tier == 0;
      nodes.add(node);
    }

    Set<String> nodeSet = new LinkedHashSet<>();
    for (EngineDto.Node n : nodes) nodeSet.add(n.code);
    Map<String, EngineDto.Node> byCode = new LinkedHashMap<>();
    for (EngineDto.Node n : nodes) byCode.put(n.code, n);

    Map<String, List<String>> neighOf = new LinkedHashMap<>();
    for (EngineDto.Node n : nodes) neighOf.put(n.code, new ArrayList<>());
    for (ViewModelDto.Line l : validLines) {
      if (!nodeSet.contains(l.sourceId) || !nodeSet.contains(l.targetId)) continue;
      neighOf.get(l.sourceId).add(l.targetId);
      neighOf.get(l.targetId).add(l.sourceId);
    }

    Map<String, String> genPair = new LinkedHashMap<>();
    int tier0Count = 0;
    for (EngineDto.Node n : nodes) if (n.tier == 0) tier0Count++;
    if (tier0Count > 12) {
      Map<String, Integer> usedSlots = new LinkedHashMap<>();
      for (EngineDto.Node g : nodes) {
        if (!"GENERATING_UNIT".equals(g.type)) continue;
        LinkedHashSet<String> candCodes = new LinkedHashSet<>(neighOf.get(g.code));
        List<EngineDto.Node> cands = new ArrayList<>();
        for (String c : candCodes) {
          EngineDto.Node cand = byCode.get(c);
          if (cand != null && !"GENERATING_UNIT".equals(cand.type)) cands.add(cand);
        }
        cands.sort(Comparator.comparingInt((EngineDto.Node a) -> a.tier).thenComparingDouble(a -> a.x));
        if (cands.isEmpty()) continue;
        EngineDto.Node bus = cands.get(0);
        int k = usedSlots.getOrDefault(bus.code, 0);
        usedSlots.put(bus.code, k + 1);
        genPair.put(g.code, bus.code);
        g.x = bus.x + (k == 0 ? 0 : k % 2 == 1 ? 44 : -44);
        g.label = "";
        g.stackedAbove = true;
      }
    }

    Map<String, TapEntry> tapTable = new LinkedHashMap<>();
    for (EngineDto.Node n : nodes) {
      LayoutEngine.NodePosition pos = positions.get(n.code);
      if (pos != null && pos.isWideBusbar && pos.taps != null && !pos.taps.isEmpty()) {
        TapEntry entry = new TapEntry();
        entry.w = pos.busbarWidth;
        for (LayoutEngine.BusbarTap t : pos.taps) {
          Tap tap = new Tap();
          tap.connectedNodeId = t.connectedNodeId;
          tap.x = t.x;
          entry.taps.add(tap);
        }
        tapTable.put(n.code, entry);
      }
    }

    int denseN = 10;
    double denseMaxHalf = 70;
    double denseGap = 40;
    Map<Integer, List<EngineDto.Node>> tierGroups = new LinkedHashMap<>();
    for (EngineDto.Node n : nodes) {
      tierGroups.computeIfAbsent(n.tier, k -> new ArrayList<>()).add(n);
    }
    for (List<EngineDto.Node> members : tierGroups.values()) {
      List<EngineDto.Node> buses = new ArrayList<>();
      for (EngineDto.Node m : members) {
        if (!("GENERATING_UNIT".equals(m.type) && genPair.containsKey(m.code))) buses.add(m);
      }
      if (buses.size() <= denseN) continue;
      buses.sort(Comparator.comparingDouble(a -> a.x));
      double cursor = 0;
      for (EngineDto.Node n : buses) {
        TapEntry entry = tapTable.get(n.code);
        double oldW = entry == null ? n.halfWidth * 2 : entry.w;
        double newHalf = Math.min(n.halfWidth, denseMaxHalf);
        if (entry != null && oldW > 0) {
          double k = (newHalf * 2) / oldW;
          for (Tap tp : entry.taps) tp.x = tp.x * k;
          entry.w = newHalf * 2;
        }
        n.halfWidth = newHalf;
        n.x = cursor + newHalf;
        cursor += newHalf * 2 + denseGap;
      }
      double shift = -(cursor - denseGap) / 2;
      for (EngineDto.Node n : buses) n.x += shift;
      Map<String, Integer> slotUse = new LinkedHashMap<>();
      for (EngineDto.Node gm : members) {
        if (!("GENERATING_UNIT".equals(gm.type) && genPair.containsKey(gm.code))) continue;
        EngineDto.Node bus = byCode.get(genPair.get(gm.code));
        int k = slotUse.getOrDefault(bus.code, 0);
        slotUse.put(bus.code, k + 1);
        gm.x = bus.x + (k == 0 ? 0 : k % 2 == 1 ? 44 : -44);
      }
    }

    Map<String, List<ViewModelDto.Line>> pairGroups = new LinkedHashMap<>();
    for (ViewModelDto.Line l : validLines) {
      if (l.id.startsWith("INTERNAL_IBT")) continue;
      String s = l.sourceId == null ? "" : l.sourceId;
      String t = l.targetId == null ? "" : l.targetId;
      String key = s.compareTo(t) <= 0 ? s + "___" + t : t + "___" + s;
      pairGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(l);
    }
    List<EngineDto.Circuit> circuits = new ArrayList<>();
    for (List<ViewModelDto.Line> group : pairGroups.values()) {
      List<ViewModelDto.Line> members = new ArrayList<>();
      for (ViewModelDto.Line l : group) {
        boolean drop = Objects.equals(genPair.get(l.sourceId), l.targetId)
            || Objects.equals(genPair.get(l.targetId), l.sourceId);
        if (!drop) members.add(l);
      }
      if (members.isEmpty()) continue;
      ViewModelDto.Line rep = members.get(0);
      boolean cable = rep.lineName != null && SKTT_RE.matcher(rep.lineName).find();
      EngineDto.Circuit c = new EngineDto.Circuit();
      c.id = "c-" + rep.id;
      c.code = rep.sourceId + "-" + rep.targetId;
      c.name = (rep.lineName == null || rep.lineName.isEmpty())
          ? rep.sourceId + " - " + rep.targetId : rep.lineName;
      c.type = cable ? "SKTT" : "SUTT";
      c.voltageKv = kvOf(rep.voltage, 150);
      c.from = rep.sourceId;
      c.to = rep.targetId;
      c.fromPort = findTapPort(tapTable, byCode, rep.sourceId, rep.targetId);
      c.toPort = findTapPort(tapTable, byCode, rep.targetId, rep.sourceId);
      c.circuitCount = Math.min(members.size(), 2);
      c.status = opStatus(rep.operatingStatus);
      c.loadingPct = rep.loadingPct == null ? 0.0 : rep.loadingPct;
      circuits.add(c);
    }

    List<EngineDto.Ibt> ibts = new ArrayList<>();
    for (ViewModelDto.Line l : validLines) {
      if (!l.id.startsWith("INTERNAL_IBT")) continue;
      LayoutEngine.NodePosition fx = positions.get(l.sourceId);
      double fw = fx == null ? 150.0 : fx.busbarWidth;
      EngineDto.Ibt ibt = new EngineDto.Ibt();
      ibt.id = l.id;
      ibt.code = l.sourceId + "-" + l.targetId;
      ibt.name = (l.lineName == null || l.lineName.isEmpty())
          ? "IBT " + l.sourceId + "-" + l.targetId : l.lineName;
      ibt.from = l.sourceId;
      ibt.to = l.targetId;
      ibt.x = (fx == null ? 0.0 : fx.x) + fw / 2;
      ibt.status = opStatus(l.operatingStatus);
      ibts.add(ibt);
    }

    Set<Integer> seenSeq = new HashSet<>();
    List<EngineDto.Pin> pins = new ArrayList<>();
    for (EnginePayloadDto.Risk r : risks) {
      if (r.seq_no == null || seenSeq.contains(r.seq_no)) continue;
      boolean hasKey = r.pin_key != null && !r.pin_key.isEmpty();
      if ("SUBSTATION".equals(r.pin_kind) && hasKey && nodeSet.contains(r.pin_key)) {
        seenSeq.add(r.seq_no);
        EngineDto.Pin pin = new EngineDto.Pin();
        pin.seq = r.seq_no;
        pin.kind = "SUBSTATION";
        pin.code = r.pin_key;
        pins.add(pin);
      } else if (("CIRCUIT".equals(r.pin_kind) || "TRANSFORMER".equals(r.pin_kind)) && hasKey) {
        seenSeq.add(r.seq_no);
        EngineDto.Pin pin = new EngineDto.Pin();
        pin.seq = r.seq_no;
        pin.kind = r.pin_kind;
        pin.code = r.pin_key;
        pins.add(pin);
      }
    }

    int tierCount = 1;
    for (EngineDto.Node n : nodes) tierCount = Math.max(tierCount, n.tier);

    EngineDto.Graph g = new EngineDto.Graph();
    g.id = id == null || id.isEmpty() ? "upload" : id;
    g.title = title;
    g.viewName = viewName;
    g.tierCount = tierCount;
    g.nodes.addAll(nodes);
    g.circuits.addAll(circuits);
    g.ibts.addAll(ibts);
    g.bays.addAll(bays);
    g.pins.addAll(pins);
    return g;
  }
}