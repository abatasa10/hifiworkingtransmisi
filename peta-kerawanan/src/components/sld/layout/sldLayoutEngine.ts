import { ParsedGINode, ParsedTransmissionLine } from '../../../data/customSLDStore';

export interface BusbarTap {
  id: string; // e.g. 'tap-unit3', 'tap-slrda'
  connectedNodeId: string;
  x: number; // offset in px from left edge of busbar
  position: 'top' | 'bottom';
  label?: string;
}

export interface NodePosition {
  x: number;
  y: number;
  tier: number;
  isWideBusbar?: boolean;
  busbarWidth?: number;
  taps?: BusbarTap[];
}

/**
 * Intelligent Electrical SLD Layout Engine
 * Organizes nodes into strict non-overlapping top-to-bottom power-flow tiers:
 * Tier 0 (500 kV Grid & Pembangkit) -> Tier 0.5 (IBTs) -> Tier 1 (150 kV Main Busbars)
 * -> Tier 2 (150 kV Substation Distribution) -> Tier 3 (KTT Feeder Loads / Branch Substations)
 * -> Tier 4 (Secondary KTT Feeder Loads).
 *
 * Supports Wide Busbars for multi-connected hub GIs (e.g. SRLYA, CLBRU)
 * with distributed bay taps so incoming/outgoing lines connect vertically without entanglement.
 */
export function computeCleanSLDLayout(
  nodes: ParsedGINode[],
  lines: ParsedTransmissionLine[]
): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  if (!nodes || nodes.length === 0) return positions;

  // 1. Identify specific landmark nodes from Suralaya - Cilegon topology if present
  const isSuralayaCilegonSubsystem = nodes.some((n) => {
    const idL = (n.id || '').toLowerCase();
    const nameL = (n.name || '').toLowerCase();
    const codeL = (n.code || '').toLowerCase();
    return (
      idL.includes('srlya') ||
      idL.includes('suralaya') ||
      idL.includes('clbru') ||
      idL.includes('clgon') ||
      nameL.includes('srlya') ||
      nameL.includes('suralaya') ||
      nameL.includes('clbru') ||
      nameL.includes('cilegon') ||
      codeL.includes('srlya') ||
      codeL.includes('clbru')
    );
  });

  // Exact coordinated blueprint alignment for Suralaya - Cilegon matching authentic SLD
  if (isSuralayaCilegonSubsystem) {
    const knownCoords: Record<string, NodePosition> = {
      // Tier 0: 500 kV Grid & Generator Bay (Matching Gambar 2: Unit 3 green circle generator)
      'unit3': { x: 100, y: 60, tier: 0 },
      'pltusuralayaunit3': { x: 100, y: 60, tier: 0 },
      'suralayabaru': { x: 260, y: 60, tier: 0 },
      'suralaya': { x: 480, y: 60, tier: 0 },
      'cilegonbaru': { x: 920, y: 60, tier: 0 },

      // Tier 0.5: IBTs (500/150 kV inter-bus transformers with 3-winding rings)
      'ibt2': { x: 260, y: 195, tier: 1 },
      'ibt2srlbaru': { x: 260, y: 195, tier: 1 },
      'ibt2suralayabaru': { x: 260, y: 195, tier: 1 },
      'ibt1': { x: 480, y: 195, tier: 1 },
      'ibt1srlya': { x: 480, y: 195, tier: 1 },
      'ibt1suralaya': { x: 480, y: 195, tier: 1 },
      'ibt4': { x: 920, y: 195, tier: 1 },
      'ibt4clbru': { x: 920, y: 195, tier: 1 },
      'ibt4cilegonbaru': { x: 920, y: 195, tier: 1 },

      // Tier 1: 150 kV Main Busbars
      // SRLYA: Long horizontal busbar spanning from under Unit 3 to MCCI5 (width 670px)
      'srlya': {
        x: 60,
        y: 330,
        tier: 1,
        isWideBusbar: true,
        busbarWidth: 670,
        taps: [
          // Top bay taps from Tier 0 & Tier 0.5 (Incoming)
          { id: 'tap-unit3', connectedNodeId: 'unit3', x: 40, position: 'top', label: 'Bay Unit 3' },
          { id: 'tap-ibt2', connectedNodeId: 'ibt2', x: 200, position: 'top', label: 'Bay IBT 2' },
          { id: 'tap-ibt1', connectedNodeId: 'ibt1', x: 420, position: 'top', label: 'Bay IBT 1' },
          // Bottom bay taps to Tier 2 (Outgoing Distribution)
          { id: 'tap-slrda', connectedNodeId: 'slrda', x: 60, position: 'bottom', label: 'Bay SLRDA' },
          { id: 'tap-pendo', connectedNodeId: 'pendo', x: 220, position: 'bottom', label: 'Bay PENDO' },
          { id: 'tap-peni', connectedNodeId: 'peni', x: 420, position: 'bottom', label: 'Bay PENI' },
          { id: 'tap-mcci5', connectedNodeId: 'mcci5', x: 630, position: 'bottom', label: 'Bay MCCI5' }
        ]
      },
      'garduinduksrlya': {
        x: 60,
        y: 330,
        tier: 1,
        isWideBusbar: true,
        busbarWidth: 670
      },
      'garduinduksrlya150kv': {
        x: 60,
        y: 330,
        tier: 1,
        isWideBusbar: true,
        busbarWidth: 670
      },
      'gitesrlya': {
        x: 60,
        y: 330,
        tier: 1,
        isWideBusbar: true,
        busbarWidth: 670
      },

      // CLBRU: Long horizontal busbar spanning across KSTEL, CLGON, and POSCO
      'clbru': {
        x: 820,
        y: 330,
        tier: 1,
        isWideBusbar: true,
        busbarWidth: 230,
        taps: [
          // Top incoming from IBT 4
          { id: 'tap-ibt4', connectedNodeId: 'ibt4', x: 100, position: 'top', label: 'Bay IBT 4' },
          // Bottom outgoing to CLGON, KSTEL, POSCO
          { id: 'tap-kstel', connectedNodeId: 'kstel', x: 40, position: 'bottom', label: 'Bay KSTEL' },
          { id: 'tap-kstelclgon', connectedNodeId: 'kstelclgon', x: 40, position: 'bottom', label: 'Bay KSTEL' },
          { id: 'tap-clgon', connectedNodeId: 'clgon', x: 100, position: 'bottom', label: 'Bay CLGON' },
          { id: 'tap-posco', connectedNodeId: 'posco', x: 160, position: 'bottom', label: 'Bay POSCO' }
        ]
      },
      'garduindukclbru': {
        x: 820,
        y: 330,
        tier: 1,
        isWideBusbar: true,
        busbarWidth: 230
      },
      'garduindukclbru150kv': {
        x: 820,
        y: 330,
        tier: 1,
        isWideBusbar: true,
        busbarWidth: 230
      },
      'giteclbru': {
        x: 820,
        y: 330,
        tier: 1,
        isWideBusbar: true,
        busbarWidth: 230
      },

      // Tier 2: 150 kV Substation Distribution Busbars
      'slrda': { x: 120, y: 480, tier: 2 },
      'garduindukslrda150kv': { x: 120, y: 480, tier: 2 },
      'pendo': { x: 280, y: 480, tier: 2 },
      'garduindukpendo150kv': { x: 280, y: 480, tier: 2 },
      'peni': { x: 480, y: 480, tier: 2 },
      'garduindukpeni150kv': { x: 480, y: 480, tier: 2 },
      'mcci5': { x: 690, y: 480, tier: 2 },
      'garduindukmcci5150kv': { x: 690, y: 480, tier: 2 },
      'clgon': { x: 920, y: 480, tier: 2 },
      'garduindukclgon150kv': { x: 920, y: 480, tier: 2 },

      // Tier 3: Industrial KTT Loads & Substation MTSUI
      'kttslfdo1': { x: 60, y: 640, tier: 3 },
      'kttslfdo2': { x: 180, y: 640, tier: 3 },
      'kttpendo': { x: 280, y: 640, tier: 3 },
      'kttpeni': { x: 400, y: 640, tier: 3 },
      'mtsui': { x: 480, y: 640, tier: 3 },
      'garduindukmtsui150kv': { x: 480, y: 640, tier: 3 },
      'kttlci': { x: 570, y: 640, tier: 3 },
      'kttmcci': { x: 690, y: 640, tier: 3 },
      'kstel': { x: 860, y: 640, tier: 3 },
      'kstelclgon': { x: 860, y: 640, tier: 3 },
      'kstelclbru': { x: 860, y: 640, tier: 3 },
      'posco': { x: 980, y: 640, tier: 3 },

      // Tier 4: Customer under MTSUI
      'kttmtsui': { x: 480, y: 800, tier: 4 }
    };

    let matchedCount = 0;
    nodes.forEach((n) => {
      const clean = n.id.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^gi/, '');
      const rawClean = n.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanName = (n.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanCode = (n.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Direct exact match
      let match = knownCoords[clean] || knownCoords[rawClean] || knownCoords[cleanCode] || knownCoords[cleanName];

      // Exact GI prefix match (e.g. "gi_srlya" -> "srlya", "gitesrlya" -> "srlya")
      if (!match) {
        for (const [k, coord] of Object.entries(knownCoords)) {
          if (
            clean === k ||
            rawClean === k ||
            cleanCode === k ||
            cleanName === k ||
            clean === `gi${k}` ||
            rawClean === `gi${k}` ||
            clean === `gitet${k}` ||
            rawClean === `gitet${k}` ||
            clean === `garduinduk${k}` ||
            cleanName === `garduinduk${k}` ||
            cleanName === `gitet${k}` ||
            cleanName === `gi${k}`
          ) {
            match = coord;
            break;
          }
        }
      }

      // Safe prefix/suffix fallback only if not a different asset category
      if (!match) {
        const sortedKeys = Object.keys(knownCoords).sort((a, b) => b.length - a.length);
        for (const k of sortedKeys) {
          const isKBusbar = k === 'srlya' || k === 'clbru' || k === 'suralaya' || k === 'suralayabaru' || k === 'cilegonbaru';
          // Prevent trafo/feeder/ktt nodes from stealing busbars
          if (isKBusbar && (cleanName.includes('trafo') || cleanName.includes('feeder') || cleanName.includes('ktt'))) {
            continue;
          }
          if (
            clean.startsWith(k) ||
            clean.endsWith(k) ||
            cleanCode.startsWith(k) ||
            cleanCode.endsWith(k) ||
            cleanName.startsWith(k) ||
            cleanName.endsWith(k)
          ) {
            match = knownCoords[k];
            break;
          }
        }
      }

      if (match) {
        matchedCount++;
        positions[n.id] = {
          x: match.x,
          y: match.y,
          tier: match.tier,
          isWideBusbar: match.isWideBusbar,
          busbarWidth: match.busbarWidth,
          taps: match.taps
        };
      }
    });

    // If all or the vast majority (>= 80% or >= 8 nodes) matched known coordinates
    if (matchedCount >= Math.min(nodes.length, 8)) {
      // For any extra nodes, place them safely to the right
      nodes.forEach((n, idx) => {
        if (!positions[n.id]) {
          positions[n.id] = {
            x: 1050 + idx * 160,
            y: 480,
            tier: n.tier ?? 2
          };
        }
      });
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

  // Step F: Finalize Output Coordinates with Dynamic Wide Busbar Detection
  nodes.forEach((n) => {
    const t = nodeTierMap[n.id] ?? 2;
    const isIBT =
      n.assetType === 'ibt' ||
      (n.assetType !== 'trafo' && (n.name || '').toLowerCase().includes('ibt'));

    // Place IBT halfway between Tier 0 and Tier 1 if marked as Tier 1
    const finalY =
      isIBT && t === 1
        ? 190
        : tierYMap[t] ?? (70 + t * 180);

    const parents = parentsOf[n.id] || [];
    const children = childrenOf[n.id] || [];
    const totalConns = parents.length + children.length;
    const isBusbarLike = !isIBT && !n.name.toLowerCase().includes('plt') && !n.name.toLowerCase().includes('unit');

    let isWide = false;
    let widthVal = 144;
    let nodeTaps: BusbarTap[] | undefined = undefined;

    // If node connects to 3 or more lines, make it a wide busbar spanning its connections
    if (totalConns >= 3 && isBusbarLike) {
      isWide = true;
      const connectedIds = [...parents, ...children];
      const connXs = connectedIds.map((cId) => xOffsetMap[cId]).filter((v) => typeof v === 'number');

      if (connXs.length > 0) {
        const minConnX = Math.min(...connXs);
        const maxConnX = Math.max(...connXs);
        const startX = Math.min(xOffsetMap[n.id] ?? minConnX, minConnX) - 30;
        widthVal = Math.max(220, (Math.max(xOffsetMap[n.id] ?? maxConnX, maxConnX) - startX) + 50);
        xOffsetMap[n.id] = startX;

        nodeTaps = [];
        parents.forEach((pId) => {
          const pX = xOffsetMap[pId] ?? (startX + 40);
          nodeTaps?.push({
            id: `tap-${pId}`,
            connectedNodeId: pId,
            x: Math.max(20, pX - startX),
            position: 'top'
          });
        });
        children.forEach((cId) => {
          const cX = xOffsetMap[cId] ?? (startX + 60);
          nodeTaps?.push({
            id: `tap-${cId}`,
            connectedNodeId: cId,
            x: Math.max(20, cX - startX),
            position: 'bottom'
          });
        });
      }
    }

    positions[n.id] = {
      x: Math.round(xOffsetMap[n.id] ?? 100),
      y: Math.round(finalY),
      tier: t,
      isWideBusbar: isWide,
      busbarWidth: widthVal,
      taps: nodeTaps
    };
  });

  return positions;
}
