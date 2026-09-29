package com.iconplus.sld.layout;

import com.iconplus.sld.dto.ViewModelDto;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Port computeEngineLayout (src/lib/sld/layout.ts) — tahap 5.
 *
 * Aturan render engine-style SLD tanpa landmark subsystem yang di-hardcode:
 * objek dikelompokkan dalam pita Tier 1-based dari tier-engine, IBT duduk
 * setengah pita di bawah busbar HV-nya, busbar (3+ koneksi, non-generator)
 * digambar sebagai bar lebar dengan tap per bay, dan posisi X mengikuti
 * barycenter parent yang dilanjutkan sweep side-to-side anti-tumpang tindih.
 */
public class LayoutEngine {

  public static class BusbarTap {
    public String id;
    public String connectedNodeId;
    public double x;
    public String position; // top | bottom
    public String label;
  }

  public static class NodePosition {
    public double x;
    public double y;
    public int tier;
    public boolean isWideBusbar;
    public double busbarWidth;
    public List<BusbarTap> taps;
  }

  private static final double ROW_GUTTER = 110;
  private static final double TIER_Y_BASE = 90;
  private static final double TIER_Y_STEP = 200;
  private static final double IBT_Y_OFFSET = 95;

  private static boolean isSideBusbar(ViewModelDto.GiNode n) {
    String a = n.assetType == null ? "" : n.assetType;
    String nm = (n.name == null ? "" : n.name).toLowerCase();
    return !"ibt".equals(a)
        && !"trafo".equals(a)
        && !"pembangkit".equals(a)
        && !"beban".equals(a)
        && !nm.contains("plt")
        && !nm.contains("unit")
        && !nm.contains("trafo")
        && !nm.contains("ktt");
  }

  private static int fallbackTier(ViewModelDto.GiNode node, Map<String, Integer> tierMap) {
    Integer explicit = tierMap == null ? null : tierMap.get(node.id);
    if (explicit != null && explicit >= 0) return explicit;
    Integer tier = node.tier;
    if (tier != null && tier >= 0) return tier;
    String a = node.assetType == null ? "" : node.assetType;
    String n = (node.name == null ? "" : node.name).toLowerCase();
    String v = node.voltage == null ? "" : node.voltage;
    if ("pembangkit".equals(a) || n.contains("plt") || n.contains("pembangkit") || n.contains("unit")) return 1;
    if ("ibt".equals(a) || "trafo".equals(a) || v.contains("/")) return 2;
    if ("beban".equals(a) || n.contains("ktt") || n.contains("konsumen")) return 4;
    if (v.contains("500") || v.contains("275")) return 1;
    return 3;
  }

  public static Map<String, NodePosition> computeEngineLayout(
      List<ViewModelDto.GiNode> nodes,
      List<ViewModelDto.Line> lines,
      Map<String, Integer> tierMap) {
    Map<String, NodePosition> positions = new LinkedHashMap<>();
    if (nodes == null || nodes.isEmpty()) return positions;

    Map<String, List<String>> parentsOf = new LinkedHashMap<>();
    Map<String, List<String>> childrenOf = new LinkedHashMap<>();
    for (ViewModelDto.GiNode n : nodes) {
      parentsOf.put(n.id, new ArrayList<>());
      childrenOf.put(n.id, new ArrayList<>());
    }

    Map<String, ViewModelDto.Line> physicalByKey = new LinkedHashMap<>();
    for (ViewModelDto.Line line : lines) {
      String key = (line.sourceId == null ? "" : line.sourceId).compareTo(line.targetId == null ? "" : line.targetId) <= 0
          ? (line.sourceId == null ? "" : line.sourceId) + "___" + (line.targetId == null ? "" : line.targetId)
          : (line.targetId == null ? "" : line.targetId) + "___" + (line.sourceId == null ? "" : line.sourceId);
      if (!physicalByKey.containsKey(key)) physicalByKey.put(key, line);
    }
    List<ViewModelDto.Line> physicalLines = new ArrayList<>(physicalByKey.values());

    Map<String, ViewModelDto.GiNode> nodeById = new LinkedHashMap<>();
    for (ViewModelDto.GiNode node : nodes) nodeById.put(node.id, node);

    Map<String, Set<String>> neighbors = new LinkedHashMap<>();
    for (ViewModelDto.GiNode node : nodes) neighbors.put(node.id, new LinkedHashSet<>());

    for (ViewModelDto.Line l : physicalLines) {
      if (!parentsOf.containsKey(l.sourceId) || !parentsOf.containsKey(l.targetId)) continue;
      ViewModelDto.GiNode src = nodeById.get(l.sourceId);
      ViewModelDto.GiNode tgt = nodeById.get(l.targetId);
      if (src == null || tgt == null) continue;
      int sT = fallbackTier(src, tierMap);
      int tT = fallbackTier(tgt, tierMap);
      neighbors.get(l.sourceId).add(l.targetId);
      neighbors.get(l.targetId).add(l.sourceId);
      if (sT < tT) {
        parentsOf.get(l.targetId).add(l.sourceId);
        childrenOf.get(l.sourceId).add(l.targetId);
      } else if (tT < sT) {
        parentsOf.get(l.sourceId).add(l.targetId);
        childrenOf.get(l.targetId).add(l.sourceId);
      } else {
        parentsOf.get(l.targetId).add(l.sourceId);
        childrenOf.get(l.sourceId).add(l.targetId);
      }
    }

    Map<Integer, List<ViewModelDto.GiNode>> tiers = new LinkedHashMap<>();
    for (ViewModelDto.GiNode n : nodes) {
      int t = fallbackTier(n, tierMap);
      tiers.computeIfAbsent(t, x -> new ArrayList<>()).add(n);
    }
    List<Integer> tierKeys = new ArrayList<>(tiers.keySet());
    tierKeys.sort(Comparator.naturalOrder());
    int minTier = tierKeys.isEmpty() ? 1 : tierKeys.get(0);
    java.util.function.IntUnaryOperator tierY = t -> (int) Math.round(TIER_Y_BASE + (t - minTier) * TIER_Y_STEP);

    Map<String, Double> halfWidth = new LinkedHashMap<>();
    for (ViewModelDto.GiNode node : nodes) {
      int degree = neighbors.get(node.id).size();
      boolean wide = isSideBusbar(node) && degree >= 3;
      halfWidth.put(node.id, (double) (wide ? Math.max(120, degree * 23) : 75));
    }
    Map<String, Double> xOf = new LinkedHashMap<>();
    Map<Integer, List<String>> orderedTiers = new LinkedHashMap<>();
    for (Integer t : tierKeys) {
      List<ViewModelDto.GiNode> group = tiers.get(t);
      group.sort(Comparator.comparing(a -> a.name == null ? "" : a.name, String.CASE_INSENSITIVE_ORDER));
      List<String> ordered = new ArrayList<>();
      for (ViewModelDto.GiNode node : group) ordered.add(node.id);
      orderedTiers.put(t, ordered);
      double packedWidth = 0;
      for (String id : ordered) packedWidth += 2 * halfWidth.get(id);
      packedWidth += Math.max(0, ordered.size() - 1) * ROW_GUTTER;
      double cursor = -packedWidth / 2;
      for (String id : ordered) {
        double half = halfWidth.get(id);
        xOf.put(id, cursor + half);
        cursor += 2 * half + ROW_GUTTER;
      }
    }

    java.util.function.BiConsumer<Integer, Boolean> repackTier = (tier, center) -> {
      List<String> row = orderedTiers.get(tier);
      double packedWidth = 0;
      for (String id : row) packedWidth += 2 * halfWidth.get(id);
      packedWidth += Math.max(0, row.size() - 1) * ROW_GUTTER;
      double cursor = center ? -packedWidth / 2 : 0;
      for (String id : row) {
        double half = halfWidth.get(id);
        xOf.put(id, cursor + half);
        cursor += 2 * half + ROW_GUTTER;
      }
    };

    for (int sweep = 0; sweep < 16; sweep++) {
      List<Integer> rows = sweep % 2 == 0 ? tierKeys : new ArrayList<>(tierKeys);
      if (sweep % 2 == 1) java.util.Collections.reverse(rows);
      for (Integer tier : rows) {
        List<String> row = orderedTiers.get(tier);
        Map<String, Integer> priorIndex = new LinkedHashMap<>();
        for (int i = 0; i < row.size(); i++) priorIndex.put(row.get(i), i);
        row.sort((a, b) -> {
          List<Double> ax = new ArrayList<>();
          for (String id : neighbors.get(a)) if (xOf.containsKey(id)) ax.add(xOf.get(id));
          List<Double> bx = new ArrayList<>();
          for (String id : neighbors.get(b)) if (xOf.containsKey(id)) bx.add(xOf.get(id));
          double ac = !ax.isEmpty() ? ax.stream().mapToDouble(Double::doubleValue).average().getAsDouble() : (xOf.get(a) == null ? 0.0 : xOf.get(a));
          double bc = !bx.isEmpty() ? bx.stream().mapToDouble(Double::doubleValue).average().getAsDouble() : (xOf.get(b) == null ? 0.0 : xOf.get(b));
          int c = Double.compare(ac, bc);
          if (c != 0) return c;
          return priorIndex.get(a) - priorIndex.get(b);
        });
        repackTier.accept(tier, false);
      }
    }

    for (Integer tier : tierKeys) repackTier.accept(tier, true);

    for (ViewModelDto.GiNode n : nodes) {
      int t = fallbackTier(n, tierMap);
      List<String> parents = parentsOf.get(n.id);
      List<String> children = childrenOf.get(n.id);
      int total = parents.size() + children.size();
      String aT = n.assetType == null ? "" : n.assetType;
      boolean isIBT = "ibt".equals(aT);

      Double centerXv = xOf.get(n.id);
      double centerX = centerXv == null ? 120.0 : centerXv;
      double half = halfWidth.get(n.id);
      double width = half * 2;
      double x = centerX - width / 2;
      boolean isWide = isSideBusbar(n) && total >= 3;
      List<BusbarTap> taps = null;

      if (isWide) {
        taps = new ArrayList<>();
        for (final String[] side : new String[][]{{"top", "top"}, {"bottom", "bottom"}}) {
          String connSide = side[1];
          List<String> connectedIds = connSide.equals("top") ? new ArrayList<>(parents) : new ArrayList<>(children);
          connectedIds.sort(Comparator.comparingDouble(id -> xOf.get(id) == null ? 0.0 : xOf.get(id)));
          int sz = connectedIds.size();
          for (int idx = 0; idx < sz; idx++) {
            String connectedNodeId = connectedIds.get(idx);
            double xTap = width * (idx + 1) / (sz + 1);
            BusbarTap tap = new BusbarTap();
            tap.id = "tap-" + connSide + "-" + connectedNodeId;
            tap.connectedNodeId = connectedNodeId;
            tap.x = xTap;
            tap.position = connSide;
            tap.label = "Bay " + connectedNodeId;
            taps.add(tap);
          }
        }
      }

      double y = isIBT ? tierY.applyAsInt(t) + IBT_Y_OFFSET : isWide ? tierY.applyAsInt(t) - 40 : tierY.applyAsInt(t);

      NodePosition pos = new NodePosition();
      pos.x = Math.round(x);
      pos.y = Math.round(y);
      pos.tier = t;
      pos.isWideBusbar = isWide;
      pos.busbarWidth = Math.round(width);
      pos.taps = taps;
      positions.put(n.id, pos);
    }

    return positions;
  }
}