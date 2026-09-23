import { EngineObject, EnginePayload } from './types';
import { isSourceObject } from './parser';

/**
 * TierEngine (port of app/services/topology.py from the SLD engine).
 *
 * A tier is a 1-based hop band toward a supply source. When the workbook does
 * not carry an explicit `Tier` column the band is computed by a multi-source
 * BFS starting from the sources:
 *   - GeneratingUnits and GITET-class busbars (500 / 275 kV) are the default
 *     Tier-1 sources,
 *   - any object that already carries an explicit workbook tier is seeded at
 *     that band and treated as reachable,
 *   - everything else is 1 + the smallest tier it can be reached from.
 *
 * The result is re-indexed so the minimum band is 1, matching how a drawn
 * SLD is normally labelled (Tier 1 = sumber).
 */
export function computeTiers(payload: EnginePayload): Map<string, number> {
  const tiers = new Map<string, number>();
  const adj = new Map<string, Set<string>>();

  for (const o of payload.objects) {
    adj.set(o.external_key, new Set());
  }
  for (const c of payload.connections) {
    adj.get(c.from_external_key)?.add(c.to_external_key);
    adj.get(c.to_external_key)?.add(c.from_external_key);
  }

  // The app template labels its tier column "Tier (Mulai 0)"; normalise the
  // whole workbook to 1-based once if any 0-based hint is present (a genuine
  // 1-based workbook never carries a 0).
  const zeroBased = payload.objects.some((o) => typeof o.tier_hint === 'number' && o.tier_hint === 0);
  const hintOf = (o: EngineObject): number | null => {
    if (typeof o.tier_hint !== 'number' || !Number.isFinite(o.tier_hint)) return null;
    return zeroBased ? o.tier_hint + 1 : o.tier_hint;
  };

  // seed sources
  for (const o of payload.objects) {
    const h = hintOf(o);
    if (h !== null && h > 0) {
      tiers.set(o.external_key, h);
    }
  }
  for (const o of payload.objects) {
    if (!tiers.has(o.external_key) && isSourceObject(o)) {
      tiers.set(o.external_key, 1);
    }
  }

  // multi-source BFS by band
  const queue: { key: string; band: number }[] = [...tiers.entries()].map(([key, band]) => ({ key, band }));
  // stable increasing order
  queue.sort((a, b) => a.band - b.band);
  let head = 0;
  while (head < queue.length) {
    const { key, band } = queue[head++];
    const next = band + 1;
    for (const nb of adj.get(key) ?? []) {
      if (tiers.has(nb)) continue;
      tiers.set(nb, next);
      queue.push({ key: nb, band: next });
    }
  }

  // any orphan node (no path from a source)
  for (const o of payload.objects) {
    if (!tiers.has(o.external_key)) {
      const neighbors = [...(adj.get(o.external_key) ?? [])];
      const down = neighbors.reduce<number[]>((acc, nb) => {
        const t = tiers.get(nb);
        if (typeof t === 'number') acc.push(t);
        return acc;
      }, []);
      tiers.set(o.external_key, down.length ? 1 + Math.min(...down) : 1);
    }
  }

  // re-index to min = 1
  const min = tiers.size ? Math.min(...tiers.values()) : 1;
  if (min > 1) {
    const shift = min - 1;
    for (const [k, v] of [...tiers.entries()]) tiers.set(k, v - shift);
  }
  return tiers;
}