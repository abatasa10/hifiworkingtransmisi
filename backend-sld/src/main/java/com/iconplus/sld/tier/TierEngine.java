package com.iconplus.sld.tier;

import com.iconplus.sld.dto.EnginePayloadDto;
import com.iconplus.sld.parser.Parser;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Tahap 4 — port `tier.ts` (`computeTiers`).
 *
 * Tier adalah jenjang 1-based menuju sumber pasokan. Bila workbook tidak
 * membawa kolom `Tier` eksplisit, jenjang dihitung dengan BFS multi-sumber:
 *   - GeneratingUnit & busbar kelas GITET (500/275 kV) = sumber default Tier-1,
 *   - objek yang punya tier eksplisit di-seed di jenjang itu (dianggap tercapai),
 *   - lainnya = 1 + jenjang terkecil yang bisa menjangkau.
 * Hasil di-reindex agar jenjang minimum = 1 (Tier 1 = sumber).
 */
public class TierEngine {

  public static Map<String, Integer> computeTiers(EnginePayloadDto.Payload payload) {
    Map<String, Integer> tiers = new LinkedHashMap<>();
    Map<String, Set<String>> adj = new LinkedHashMap<>();

    for (EnginePayloadDto.Object o : payload.objects) {
      adj.put(o.external_key, new LinkedHashSet<>());
    }
    for (EnginePayloadDto.Connection c : payload.connections) {
      Set<String> f = adj.get(c.from_external_key);
      if (f != null) f.add(c.to_external_key);
      Set<String> t = adj.get(c.to_external_key);
      if (t != null) t.add(c.from_external_key);
    }

    // template PLN memberi label kolom tier "Tier (Mulai 0)"; normalisasi
    // seluruh workbook ke 1-based bila ada hint 0-based
    boolean zeroBased = payload.objects.stream()
        .anyMatch(o -> o.tier_hint != null && o.tier_hint == 0);

    // seed: tier eksplisit (positif) + sumber
    for (EnginePayloadDto.Object o : payload.objects) {
      Integer h = o.tier_hint;
      if (h != null) {
        if (zeroBased) h = h + 1;
        if (h != null && h > 0) tiers.put(o.external_key, h);
      }
    }
    for (EnginePayloadDto.Object o : payload.objects) {
      if (!tiers.containsKey(o.external_key) && Parser.isSourceObject(o)) {
        tiers.put(o.external_key, 1);
      }
    }

    // multi-source BFS per jenjang, urutan jenjang naik stabil
    List<Map.Entry<String, Integer>> queue = new ArrayList<>(tiers.entrySet());
    queue.sort(Comparator.comparingInt(Map.Entry::getValue));
    int head = 0;
    while (head < queue.size()) {
      Map.Entry<String, Integer> e = queue.get(head++);
      String key = e.getKey();
      int band = e.getValue();
      int next = band + 1;
      for (String nb : adj.getOrDefault(key, Set.of())) {
        if (tiers.containsKey(nb)) continue;
        tiers.put(nb, next);
        // push; pertahankan urutan insertion (mirip queue.push di TS)
        queue.add(new java.util.AbstractMap.SimpleEntry<>(nb, next));
      }
    }

    // orphan node (tanpa jalur dari sumber)
    for (EnginePayloadDto.Object o : payload.objects) {
      if (tiers.containsKey(o.external_key)) continue;
      int minDown = Integer.MAX_VALUE;
      for (String nb : adj.getOrDefault(o.external_key, Set.of())) {
        Integer t = tiers.get(nb);
        if (t != null && t < minDown) minDown = t;
      }
      tiers.put(o.external_key, minDown == Integer.MAX_VALUE ? 1 : 1 + minDown);
    }

    // re-index ke min = 1
    int min = Integer.MAX_VALUE;
    for (int v : tiers.values()) min = Math.min(min, v);
    if (min > 1) {
      int shift = min - 1;
      for (String k : new ArrayList<>(tiers.keySet())) {
        tiers.put(k, tiers.get(k) - shift);
      }
    }
    return tiers;
  }
}