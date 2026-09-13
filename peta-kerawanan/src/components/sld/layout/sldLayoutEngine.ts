import { ParsedGINode, ParsedTransmissionLine } from '../../../data/customSLDStore';

export interface NodePosition {
  x: number;
  y: number;
  tier: number;
}

/**
 * Intelligent Electrical SLD Layout Engine
 * Organizes nodes into strict non-overlapping top-to-bottom power-flow tiers:
 * Tier 0 (500 kV Grid & Pembangkit) -> Tier 0.5 (IBTs) -> Tier 1 (150 kV Main Busbars)
 * -> Tier 2 (150 kV Substation Distribution) -> Tier 3 (KTT Feeder Loads / Branch Substations)
 * -> Tier 4 (Secondary KTT Feeder Loads).
 *
 * Uses Parent-Child Barycentric Alignment so child nodes stay directly underneath
 * their feeding busbars without crossing lines, and enforces minGap so nodes NEVER collide.
 */
export function computeCleanSLDLayout(
  nodes: ParsedGINode[],
  lines: ParsedTransmissionLine[]
): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  if (!nodes || nodes.length === 0) return positions;

  // 1. Identify specific landmark nodes from Suralaya - Cilegon topology if present
  const isSuralayaCilegonSubsystem = nodes.some(
    (n) =>
      n.id.includes('srlya') ||
      n.id.includes('suralaya') ||
      n.id.includes('clbru') ||
      n.id.includes('clgon')
  );

  // Exact coordinated blueprint alignment for Suralaya - Cilegon matching Gambar 1
  if (isSuralayaCilegonSubsystem) {
    const knownCoords: Record<string, { x: number; y: number; tier: number }> = {
      // Tier 0: 500 kV Grid & Generator Bay
      'unit3': { x: 70, y: 60, tier: 0 },
      'pltusuralayaunit3': { x: 70, y: 60, tier: 0 },
      'suralayabaru': { x: 230, y: 60, tier: 0 },
      'suralaya': { x: 480, y: 60, tier: 0 },
      'cilegonbaru': { x: 920, y: 60, tier: 0 },

      // Tier 0.5: IBTs (500/150 kV inter-bus transformers)
      'ibt2': { x: 250, y: 195, tier: 1 },
      'ibt2suralayabaru': { x: 250, y: 195, tier: 1 },
      'ibt1': { x: 480, y: 195, tier: 1 },
      'ibt1suralaya': { x: 480, y: 195, tier: 1 },
      'ibt4': { x: 920, y: 195, tier: 1 },
      'ibt4cilegonbaru': { x: 920, y: 195, tier: 1 },

      // Tier 1: 150 kV Main Busbars
      'srlya': { x: 380, y: 320, tier: 1 },
      'gitesrlya': { x: 380, y: 320, tier: 1 },
      'clbru': { x: 920, y: 320, tier: 1 },
      'giteclbru': { x: 920, y: 320, tier: 1 },

      // Tier 2: 150 kV Substation Distribution Busbars
      'slrda': { x: 120, y: 470, tier: 2 },
      'pendo': { x: 280, y: 470, tier: 2 },
      'peni': { x: 480, y: 470, tier: 2 },
      'mcci5': { x: 690, y: 470, tier: 2 },
      'clgon': { x: 920, y: 470, tier: 2 },

      // Tier 3: Industrial KTT Loads & Substation MTSUI
      'kttslfdo1': { x: 60, y: 630, tier: 3 },
      'kttslfdo2': { x: 180, y: 630, tier: 3 },
      'kttpendo': { x: 280, y: 630, tier: 3 },
      'kttpeni': { x: 400, y: 630, tier: 3 },
      'mtsui': { x: 480, y: 630, tier: 3 },
      'kttlci': { x: 570, y: 630, tier: 3 },
      'kttmcci': { x: 690, y: 630, tier: 3 },
      'kstel': { x: 860, y: 630, tier: 3 },
      'kstelclgon': { x: 860, y: 630, tier: 3 },
      'kstelclbru': { x: 920, y: 630, tier: 3 },
      'posco': { x: 980, y: 630, tier: 3 },

      // Tier 4: Customer under MTSUI
      'kttmtsui': { x: 480, y: 790, tier: 4 }
    };

    let allMatched = true;
    nodes.forEach((n) => {
      const clean = n.id.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^gi/, '');
      const cleanName = n.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      let match = knownCoords[clean] || knownCoords[cleanName];
      if (!match) {
        for (const [k, coord] of Object.entries(knownCoords)) {
          if (clean.includes(k) || cleanName.includes(k)) {
            match = coord;
            break;
          }
        }
      }

      if (match) {
        positions[n.id] = { x: match.x, y: match.y, tier: match.tier };
      } else {
        allMatched = false;
      }
    });

    if (allMatched && Object.keys(positions).length === nodes.length) {
      return positions;
    }
  }

  // 2. Generic Algorithmic Barycentric Layered Layout (for any system / upload)
  // Step A: Determine Tier per node
  const nodeTierMap: Record<string, number> = {};
  nodes.forEach((n) => {
    let t = n.tier;
    if (typeof t !== 'number') {
      const nameL = n.name.toLowerCase();
      const volt = String(n.voltage || '');
      if (nameL.includes('plt') || nameL.includes('pembangkit') || nameL.includes('unit')) {
        t = 0;
      } else if (volt.includes('500') && (nameL.includes('baru') || nameL.includes('500'))) {
        t = 0;
      } else if (nameL.includes('ibt') || nameL.includes('trafo') || volt.includes('/')) {
        t = 1;
      } else if (nameL.includes('ktt') || nameL.includes('posco') || nameL.includes('kstel') || nameL.includes('mtsui')) {
        t = 3;
      } else {
        t = 2;
      }
    }
    nodeTierMap[n.id] = t;
  });

  // Check for deep KTT leaf nodes (e.g. KTT MTSUI connected to MTSUI which is already Tier 3)
  lines.forEach((l) => {
    const sTier = nodeTierMap[l.sourceId] ?? 0;
    const tTier = nodeTierMap[l.targetId] ?? 0;
    if (sTier >= tTier && sTier === 3) {
      nodeTierMap[l.targetId] = 4;
    }
  });

  // Step B: Group nodes by tier
  const tiers: Record<number, ParsedGINode[]> = {};
  nodes.forEach((n) => {
    const t = nodeTierMap[n.id] ?? 2;
    if (!tiers[t]) tiers[t] = [];
    tiers[t].push(n);
  });

  // Step C: Build parent-child connections
  const parentsOf: Record<string, string[]> = {};
  const childrenOf: Record<string, string[]> = {};
  nodes.forEach((n) => {
    parentsOf[n.id] = [];
    childrenOf[n.id] = [];
  });

  lines.forEach((l) => {
    const sTier = nodeTierMap[l.sourceId] ?? 0;
    const tTier = nodeTierMap[l.targetId] ?? 0;
    if (sTier < tTier) {
      parentsOf[l.targetId]?.push(l.sourceId);
      childrenOf[l.sourceId]?.push(l.targetId);
    } else if (tTier < sTier) {
      parentsOf[l.sourceId]?.push(l.targetId);
      childrenOf[l.targetId]?.push(l.sourceId);
    }
  });

  // Y-coordinates for clean vertical separation
  const tierYMap: Record<number, number> = {
    0: 60,
    1: 270,
    2: 470,
    3: 650,
    4: 800,
    5: 950
  };

  const minGap = 200; // Minimum horizontal gap between nodes to guarantee NO overlap
  const xOffsetMap: Record<string, number> = {};

  // Step D: Place Tier 0 nodes
  const tier0 = tiers[0] || [];
  const tier0Count = tier0.length;
  tier0.forEach((n, idx) => {
    const isGen = (n.name || '').toLowerCase().includes('unit') || (n.name || '').toLowerCase().includes('plt');
    // Place generator bay on the left of main busbar
    const xPos = isGen ? 80 : 180 + idx * 260;
    xOffsetMap[n.id] = xPos;
  });

  // Step E: Place subsequent tiers using barycentric parent alignment
  const sortedTierKeys = Object.keys(tiers)
    .map(Number)
    .sort((a, b) => a - b);

  sortedTierKeys.forEach((tierNum) => {
    if (tierNum === 0) return;
    const tierNodes = tiers[tierNum] || [];

    // Calculate target X for each node based on parent barycenter
    tierNodes.forEach((n) => {
      const parents = parentsOf[n.id] || [];
      const parentXList = parents
        .map((pId) => xOffsetMap[pId])
        .filter((x) => typeof x === 'number');

      if (parentXList.length > 0) {
        const avgX = parentXList.reduce((sum, x) => sum + x, 0) / parentXList.length;
        xOffsetMap[n.id] = avgX;
      } else {
        // Fallback if no parent above
        xOffsetMap[n.id] = 150;
      }
    });

    // Sub-cluster siblings sharing the same single parent
    const parentClusters: Record<string, ParsedGINode[]> = {};
    tierNodes.forEach((n) => {
      const parents = parentsOf[n.id] || [];
      if (parents.length === 1) {
        const pId = parents[0];
        if (!parentClusters[pId]) parentClusters[pId] = [];
        parentClusters[pId].push(n);
      }
    });

    Object.entries(parentClusters).forEach(([pId, siblings]) => {
      if (siblings.length > 1) {
        const pX = xOffsetMap[pId] ?? 200;
        const count = siblings.length;
        const siblingSpan = 110;
        siblings.forEach((sib, sibIdx) => {
          const sibOffset = (sibIdx - (count - 1) / 2) * siblingSpan;
          xOffsetMap[sib.id] = pX + sibOffset;
        });
      }
    });

    // Sort nodes in this tier by their target X
    tierNodes.sort((a, b) => (xOffsetMap[a.id] ?? 0) - (xOffsetMap[b.id] ?? 0));

    // Collision avoidance sweep (Left-to-Right)
    for (let i = 1; i < tierNodes.length; i++) {
      const prevId = tierNodes[i - 1].id;
      const currId = tierNodes[i].id;
      const prevX = xOffsetMap[prevId] ?? 0;
      const currX = xOffsetMap[currId] ?? 0;

      if (currX < prevX + minGap) {
        xOffsetMap[currId] = prevX + minGap;
      }
    }
  });

  // Step F: Finalize Output Coordinates
  nodes.forEach((n) => {
    const t = nodeTierMap[n.id] ?? 2;
    const isIBT =
      n.assetType === 'ibt' ||
      (n.name || '').toLowerCase().includes('ibt') ||
      String(n.voltage || '').includes('/');

    // Place IBT halfway between Tier 0 and Tier 1 if marked as Tier 1
    const finalY =
      isIBT && t === 1
        ? 190
        : tierYMap[t] ?? (70 + t * 180);

    positions[n.id] = {
      x: Math.round(xOffsetMap[n.id] ?? 100),
      y: Math.round(finalY),
      tier: t
    };
  });

  return positions;
}
