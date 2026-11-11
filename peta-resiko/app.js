// ==========================================================================
// PLN MANTAPS - PETA RISIKO ASET NASIONAL & MULTI-LEVEL DRILLDOWN
// Level 1: Gardu Induk (Unit Scale - Gambar Awal / Gambar 2)
// Level 2: Bay Level (Gambar 1 - GITET 500KV GRATI / 7 Bay)
// Level 3: Asset Level (Gambar 2 - PHT 500KV PAITON #1 / 15 Aset)
// Level 4: Asset Detail (Gambar 3 - Lightning Arrester SIEMENS)
// ==========================================================================

// Global App State
const state = {
  currentView: 'national',      // 'national' | 'detail'
  hierarchyLevel: 'gi',         // 'gi' | 'bay' | 'asset' | 'asset-detail'
  selectedUnit: 'UITJBB',       // Default UITJBB (persis gambar awal)
  selectedGI: null,             // object GI (e.g., GITET 500KV GRATI)
  selectedBay: null,            // object Bay (e.g., PHT 500KV PAITON #1)
  selectedAsset: null,          // object Asset (e.g., Lightning Arrester SIEMENS)
  selectedSubstationId: null,   // active GI ID for selection/highlight
  activeDimension: 'tier',      // 'tier' (default per permintaan: sumbu X tier, sumbu Y AHI/Umur) | 'beban' | 'kerawanan' | 'pelanggan'
  viewMode: 'matrix',           // 'matrix' | 'table'
  activeRiskFilter: null,       // null | 'High' | 'Mod-High' | 'Moderate' | 'Low-Mod' | 'Low'
  tableSearchQuery: '',
  filters: {
    upt: 'all',
    ultg: 'all',
    voltage: 'all'
  },
  nationalMap: null,
  unitMap: null,
  nationalBadges: [],
  unitMarkers: new Map(),
  activeBayPopupId: null
};

// Indonesia Bounds (Archipelago view)
const INDONESIA_BOUNDS = [
  [-11, 92],
  [7, 146]
];

// Color mapping based on risk
const RISK_COLOR_MAP = {
  'High': '#ed1c24',
  'Mod-High': '#f7941d',
  'Moderate': '#eab308',
  'Low-Mod': '#8dc63f',
  'Low': '#00a65a'
};

// Exact Unit Badges Coordinates and Info (Matching Screenshot)
const NATIONAL_BADGES_CONFIG = {
  P3BS: {
    unitKey: 'P3BS',
    name: 'P3BS',
    totalGI: 258,
    badgeRisk: 'HIGH',
    badgeCount: '7 GI',
    badgeColor: 'red',
    coord: [0.65, 100.8],
    fullName: 'P3BS (Penyaluran & Pusat Pengatur Beban Sumatera)'
  },
  BABEL: {
    unitKey: 'BABEL',
    name: 'BABEL',
    totalGI: 0,
    badgeRisk: '-',
    badgeCount: '0 GI',
    badgeColor: 'blue',
    coord: [-2.15, 106.3],
    fullName: 'PLN UIW Bangka Belitung'
  },
  P3BKAL: {
    unitKey: 'P3BKAL',
    name: 'P3BKAL',
    totalGI: 101,
    badgeRisk: 'HIGH',
    badgeCount: '2 GI',
    badgeColor: 'red',
    coord: [-0.3, 114.5],
    fullName: 'P3BKAL (Pusat Pengatur Beban Kalimantan)'
  },
  P3BSUL: {
    unitKey: 'P3BSUL',
    name: 'P3BSUL',
    totalGI: 120,
    badgeRisk: 'HIGH',
    badgeCount: '1 GI',
    badgeColor: 'red',
    coord: [-2.8, 120.2],
    fullName: 'P3BSUL (Pusat Pengatur Beban Sulawesi)'
  },
  UITJBB: {
    unitKey: 'UITJBB',
    name: 'UITJBB',
    totalGI: 176,
    badgeRisk: 'HIGH',
    badgeCount: '4 GI',
    badgeColor: 'red',
    coord: [-6.25, 106.6],
    fullName: 'UITJBB (Unit Induk Transmisi Jawa Bagian Barat)'
  },
  UITJBT: {
    unitKey: 'UITJBT',
    name: 'UITJBT',
    totalGI: 247,
    badgeRisk: 'HIGH',
    badgeCount: '1 GI',
    badgeColor: 'red',
    coord: [-7.2, 109.8],
    fullName: 'UITJBT (Unit Induk Transmisi Jawa Bagian Tengah)'
  },
  UITJBM: {
    unitKey: 'UITJBM',
    name: 'UITJBM',
    totalGI: 175,
    badgeRisk: 'HIGH',
    badgeCount: '2 GI',
    badgeColor: 'red',
    coord: [-7.55, 112.6],
    fullName: 'UITJBM (Unit Induk Transmisi Jawa Bagian Timur & Madura)'
  },
  NTB: {
    unitKey: 'NTB',
    name: 'NTB',
    totalGI: 27,
    badgeRisk: 'MOD - HIGH',
    badgeCount: '2 GI',
    badgeColor: 'orange',
    coord: [-8.65, 117.4],
    fullName: 'PLN UIW Nusa Tenggara Barat'
  },
  NTT: {
    unitKey: 'NTT',
    name: 'NTT',
    totalGI: 21,
    badgeRisk: 'MOD - HIGH',
    badgeCount: '2 GI',
    badgeColor: 'orange',
    coord: [-9.45, 122.8],
    fullName: 'PLN UIW Nusa Tenggara Timur'
  },
  MMU: {
    unitKey: 'MMU',
    name: 'MMU',
    totalGI: 6,
    badgeRisk: 'MODERATE',
    badgeCount: '2 GI',
    badgeColor: 'yellow',
    coord: [-3.3, 128.5],
    fullName: 'PLN UIW Maluku & Maluku Utara'
  },
  PPB: {
    unitKey: 'PPB',
    name: 'PPB',
    totalGI: 11,
    badgeRisk: 'HIGH',
    badgeCount: '1 GI',
    badgeColor: 'red',
    coord: [-3.8, 137.5],
    fullName: 'PLN UIW Papua & Papua Barat'
  }
};

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  initNationalMap();
  initUnitMap();
  setupEventListeners();
  renderMatrixGrid();
  renderXTicks();
});

// ==========================================================================
// 1. NATIONAL MAP INITIALIZATION & RENDERING
// ==========================================================================
function initNationalMap() {
  if (state.nationalMap) return;

  state.nationalMap = L.map('national-map', {
    zoomControl: false,
    attributionControl: false,
    minZoom: 4,
    maxZoom: 10
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.95
  }).addTo(state.nationalMap);

  L.control.zoom({ position: 'bottomright' }).addTo(state.nationalMap);
  renderNationalBadges();
  resetToNationalBounds();
}

function resetToNationalBounds() {
  if (!state.nationalMap) return;
  state.nationalMap.fitBounds(INDONESIA_BOUNDS, {
    padding: [20, 20],
    animate: true
  });
}

function renderNationalBadges() {
  state.nationalBadges.forEach(m => state.nationalMap.removeLayer(m));
  state.nationalBadges = [];

  Object.values(NATIONAL_BADGES_CONFIG).forEach(cfg => {
    const iconHtml = `
      <div class="map-badge-anchor" onclick="openDetailView('${cfg.unitKey}')" title="${cfg.fullName} - Klik untuk buka Peta Risiko">
        <div class="map-badge-pill badge-color-${cfg.badgeColor}">
          <div class="badge-part-left">
            <span class="badge-title">${cfg.name}</span>
            <span class="badge-sub">${cfg.totalGI} GI</span>
          </div>
          <div class="badge-divider"></div>
          <div class="badge-part-right">
            <span class="badge-title">${cfg.badgeRisk}</span>
            <span class="badge-sub">${cfg.badgeCount}</span>
          </div>
        </div>
        <div class="badge-anchor-dot"></div>
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: 'custom-leaflet-pill-badge',
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const marker = L.marker(cfg.coord, { icon, zIndexOffset: 500 }).addTo(state.nationalMap);
    state.nationalBadges.push(marker);
  });
}

// ==========================================================================
// 2. UNIT MAP INITIALIZATION & RENDERING (CARTO-DB LIGHT)
// ==========================================================================
function initUnitMap() {
  if (state.unitMap) return;

  state.unitMap = L.map('unit-map', {
    zoomControl: false,
    attributionControl: false,
    minZoom: 5,
    maxZoom: 19
  });

  // OpenStreetMap matching Peta Kerawanan
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.95
  }).addTo(state.unitMap);

  L.control.zoom({ position: 'bottomright' }).addTo(state.unitMap);
}

function clearUnitMarkers() {
  state.unitMarkers.forEach(m => state.unitMap.removeLayer(m));
  state.unitMarkers.clear();
}

function renderUnitMarkers(items) {
  clearUnitMarkers();
  if (!items || items.length === 0) return;

  const latLngs = [];

  items.forEach(item => {
    if (!item.lat || !item.lon) return;
    const latlng = [item.lat, item.lon];
    latLngs.push(latlng);

    let color = RISK_COLOR_MAP[item.riskCategory] || '#00a65a';
    let radius = 6;
    let weight = 1.5;
    let strokeColor = '#ffffff';

    if (state.hierarchyLevel === 'bay') {
      // Bay dots in Gambar 1: yellow-filled with dark blue ring
      color = '#f59e0b';
      strokeColor = '#1e3a8a';
      radius = 7;
      weight = 2.5;
    } else if (state.hierarchyLevel === 'asset') {
      color = '#f59e0b';
      strokeColor = '#ffffff';
      radius = 6;
      weight = 2;
    } else if (state.hierarchyLevel === 'asset-detail') {
      color = '#f59e0b';
      strokeColor = '#1e293b';
      radius = 9;
      weight = 3;
    }

    const marker = L.circleMarker(latlng, {
      radius: radius,
      fillColor: color,
      fillOpacity: 0.9,
      color: strokeColor,
      weight: weight
    }).addTo(state.unitMap);

    // Interactive handlers per hierarchy level: Langsung masuk ke dalem saat diklik
    if (state.hierarchyLevel === 'gi') {
      marker.on('mouseover', () => {
        highlightScatterDot(item.id);
        marker.setRadius(9);
        marker.setStyle({ weight: 2.5 });
      });

      marker.on('mouseout', () => {
        unhighlightScatterDots();
        marker.setRadius(6);
        marker.setStyle({ weight: 1.5 });
      });

      // Klik marker GI di peta -> langsung masuk ke Bay level
      marker.on('click', () => {
        drillDownToBayLevel(item.id);
      });
    } else if (state.hierarchyLevel === 'bay') {
      marker.on('mouseover', (e) => {
        showBayFloatingPopup(item, e.originalEvent);
        highlightScatterDot(item.id);
      });
      marker.on('mouseout', () => {
        unhighlightScatterDots();
      });

      // Klik marker Bay di peta -> langsung masuk ke Asset level
      marker.on('click', () => {
        drillDownToAssetLevel(item.id);
      });
    } else if (state.hierarchyLevel === 'asset') {
      marker.on('mouseover', (e) => {
        showAssetTooltip(item, e.originalEvent);
        highlightScatterDot(item.id);
      });
      marker.on('mouseout', () => {
        hideSubstationTooltip();
        unhighlightScatterDots();
      });

      // Klik marker Asset di peta -> langsung masuk ke Asset Detail
      marker.on('click', () => {
        drillDownToAssetDetail(item.id);
      });
    }

    state.unitMarkers.set(item.id, marker);
  });

  // Fit map bounds cleanly
  if (latLngs.length > 0) {
    if (state.hierarchyLevel === 'asset-detail') {
      state.unitMap.setView(latLngs[0], 17);
    } else if (state.hierarchyLevel === 'bay' || state.hierarchyLevel === 'asset') {
      const bounds = L.latLngBounds(latLngs);
      state.unitMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    } else {
      const bounds = L.latLngBounds(latLngs);
      if (bounds.isValid()) {
        state.unitMap.fitBounds(bounds, { padding: [35, 35], maxZoom: 11 });
      }
    }
  }
}

// ==========================================================================
// 3. MATRIX GRID & X-TICKS
// ==========================================================================
function renderMatrixGrid() {
  const root = document.getElementById('matrix-grid-root');
  if (!root) return;

  const overlay = document.getElementById('scatter-overlay');
  root.innerHTML = '';
  if (overlay) root.appendChild(overlay);

  // 5 rows: row 5 at top down to row 1 at bottom
  // 5 cols: col 1 at left to col 5 at right
  for (let r = 5; r >= 1; r--) {
    for (let c = 1; c <= 5; c++) {
      const cellData = MATRIX_CONFIG.cells[r][c];
      const cellDiv = document.createElement('div');
      cellDiv.className = 'matrix-cell';
      cellDiv.style.backgroundColor = cellData.color;
      cellDiv.dataset.row = r;
      cellDiv.dataset.col = c;
      cellDiv.dataset.cat = cellData.cat;

      const labelDiv = document.createElement('div');
      labelDiv.className = 'cell-info-label';
      labelDiv.innerHTML = `${cellData.title}<br><strong>${cellData.num}</strong>`;

      if (cellData.color === '#fff200' || cellData.color === '#8dc63f') {
        labelDiv.style.color = 'rgba(15, 23, 42, 0.7)';
      } else if (cellData.color === '#ed1c24') {
        labelDiv.style.color = 'rgba(255, 255, 255, 0.9)';
      } else {
        labelDiv.style.color = 'rgba(255, 255, 255, 0.85)';
      }

      // Klik kotak matriks langsung masuk ke item di kotak tersebut
      cellDiv.addEventListener('click', () => {
        const r = parseInt(cellDiv.dataset.row, 10);
        const c = parseInt(cellDiv.dataset.col, 10);
        const items = getActiveLevelItems();
        const matching = items.filter(item => {
          let itemCol = 1;
          if (state.hierarchyLevel === 'gi') {
            if (state.activeDimension === 'tier') itemCol = (item.matrixCol !== undefined) ? item.matrixCol : (6 - (item.tier || 1));
            else if (state.activeDimension === 'beban') itemCol = item.levelBeban || 1;
            else if (state.activeDimension === 'kerawanan') itemCol = item.levelKerawanan || 1;
            else if (state.activeDimension === 'pelanggan') itemCol = (item.matrixColPelanggan !== undefined) ? item.matrixColPelanggan : (item.levelPelanggan || (6 - (item.kategoriPelanggan || 1)));
            return itemCol === c && (item.levelAhiAge || 1) === r;
          } else if (state.hierarchyLevel === 'bay') {
            let itemCol = (item.matrixCol !== undefined) ? item.matrixCol : (6 - (item.tier || 1));
            if (state.activeDimension === 'pelanggan') itemCol = (item.matrixColPelanggan !== undefined) ? item.matrixColPelanggan : (6 - (item.kategoriPelanggan || 1));
            return itemCol === c && (item.levelAhiAge || 1) === r;
          } else if (state.hierarchyLevel === 'asset') {
            let itemCol = (item.matrixCol !== undefined) ? item.matrixCol : (6 - (item.tier || 1));
            if (state.activeDimension === 'pelanggan') itemCol = (item.matrixColPelanggan !== undefined) ? item.matrixColPelanggan : (6 - (item.kategoriPelanggan || 1));
            return itemCol === c && (item.levelAhiAge || 1) === r;
          }
          return false;
        });

        if (matching.length > 0) {
          const target = matching[0];
          if (state.hierarchyLevel === 'gi') {
            drillDownToBayLevel(target.id);
          } else if (state.hierarchyLevel === 'bay') {
            drillDownToAssetLevel(target.id);
          } else if (state.hierarchyLevel === 'asset') {
            drillDownToAssetDetail(target.id);
          }
        }
      });

      cellDiv.appendChild(labelDiv);
      root.appendChild(cellDiv);
    }
  }

  if (overlay) root.appendChild(overlay);
}

function renderXTicks() {
  const container = document.getElementById('x-ticks-container');
  if (!container) return;

  container.innerHTML = '';
  // MATRIX_CONFIG.cols is defined in data.js
  const cols = (MATRIX_CONFIG.cols && MATRIX_CONFIG.cols[state.activeDimension]) || 
               (MATRIX_CONFIG.cols && MATRIX_CONFIG.cols.tier) || [];

  cols.forEach(col => {
    const tick = document.createElement('div');
    tick.className = 'x-tick';
    if (state.activeDimension === 'pelanggan') {
      tick.innerHTML = `
        <span class="num">${col.label}</span>
        <span class="sub">${col.sub} (X=${col.num})</span>
      `;
    } else {
      tick.innerHTML = `
        <span class="num">${col.num}</span>
        <span class="sub">${col.label}</span>
      `;
    }
    container.appendChild(tick);
  });
}

// ==========================================================================
// 4. DATA RETRIEVAL FOR ACTIVE LEVEL
// ==========================================================================
function getFilteredSubstations() {
  let list = SUBSTATIONS_BY_UNIT[state.selectedUnit] || [];

  // Ensure GITET GRATI is present in UITJBM
  if (state.selectedUnit === 'UITJBM' && !list.some(g => g.id === 'GI-UITJBM-GRATI')) {
    const grati = {
      id: "GI-UITJBM-GRATI",
      name: "GITET 500KV GRATI",
      unit: "UITJBM",
      upt: "UPT PROBOLINGGO",
      ultg: "ULTG PROBOLINGGO",
      tegangan: "500 kV",
      lat: -7.69742,
      lon: 113.01348,
      tier: 4,
      tierLabel: "Tier 2 (Industri Strategis)",
      ahi: 42.5,
      usia: 24,
      levelAhiAge: 4,
      beban: 78.5,
      levelBeban: 4,
      kerawanan: "Sedang",
      levelKerawanan: 3,
      jenisPelanggan: "KTT / Obvitnas",
      levelPelanggan: 5,
      riskCategory: "Mod-High",
      cellCode: "Moderate to High 19",
      totalBays: 7
    };
    list = [grati, ...list];
  }

  return list.filter(sub => {
    if (state.filters.upt !== 'all' && sub.upt !== state.filters.upt) return false;
    if (state.filters.ultg !== 'all' && sub.ultg !== state.filters.ultg) return false;
    if (state.filters.voltage !== 'all' && sub.tegangan !== state.filters.voltage) return false;
    if (state.activeRiskFilter && sub.riskCategory !== state.activeRiskFilter) return false;
    return true;
  });
}

function getActiveLevelItems() {
  if (state.hierarchyLevel === 'gi') {
    return getFilteredSubstations();
  }

  if (state.hierarchyLevel === 'bay') {
    let bays = [];
    if (state.selectedGI && typeof getBaysForSubstation === 'function') {
      bays = getBaysForSubstation(state.selectedGI);
    }
    if (state.activeRiskFilter) {
      bays = bays.filter(b => b.riskCategory === state.activeRiskFilter);
    }
    return bays;
  }

  if (state.hierarchyLevel === 'asset') {
    let assets = [];
    if (state.selectedBay && typeof getAssetsForBay === 'function') {
      assets = getAssetsForBay(state.selectedBay);
    }
    if (state.activeRiskFilter) {
      assets = assets.filter(a => a.riskCategory === state.activeRiskFilter);
    }
    return assets;
  }

  return [];
}

// ==========================================================================
// 5. SCATTER PLOT DOTS RENDERING (PERCENTAGE-BASED & RESPONSIVE)
// ==========================================================================
function renderScatterDots(items) {
  const overlay = document.getElementById('scatter-overlay');
  if (!overlay) return;
  overlay.innerHTML = '';

  if (!items || items.length === 0) return;

  if (state.hierarchyLevel === 'gi') {
    // Level 1: Gardu Induk View (Persis Gambar 2 Awal)
    items.forEach((sub, index) => {
      let col = 1;
      if (state.activeDimension === 'tier') {
        col = (sub.matrixCol !== undefined) ? sub.matrixCol : (6 - (sub.tier || 1));
      } else if (state.activeDimension === 'beban') {
        col = sub.levelBeban || 1;
      } else if (state.activeDimension === 'kerawanan') {
        col = sub.levelKerawanan || 1;
      } else if (state.activeDimension === 'pelanggan') {
        col = (sub.matrixColPelanggan !== undefined) ? sub.matrixColPelanggan : (sub.levelPelanggan || (6 - (sub.kategoriPelanggan || 1)));
      }

      const row = sub.levelAhiAge || 1;

      // Col 1: 0% to 20%, Col 2: 20% to 40%, etc.
      // Row 5: 0% to 20% from top, Row 4: 20% to 40%, etc.
      const colBasePercent = (col - 1) * 20;
      const rowBasePercent = (5 - row) * 20;

      const jitterX = 3.5 + (((index * 37) % 73) / 73) * 13;
      const jitterY = 3.5 + (((index * 59) % 79) / 79) * 13;

      const leftPercent = colBasePercent + jitterX;
      const topPercent = rowBasePercent + jitterY;

      const dot = document.createElement('div');
      dot.className = 'scatter-dot';
      dot.id = `dot-${sub.id}`;
      dot.style.left = `${leftPercent}%`;
      dot.style.top = `${topPercent}%`;
      dot.dataset.subId = sub.id;
      dot.title = `${sub.name} (${sub.riskCategory})`;

      if (state.selectedSubstationId === sub.id) {
        dot.classList.add('selected');
      }

      dot.addEventListener('mouseenter', (e) => {
        showSubstationTooltip(sub, e);
        highlightUnitMapMarker(sub.id);
      });

      dot.addEventListener('mousemove', (e) => {
        const tt = document.getElementById('gi-floating-tooltip');
        positionTooltip(tt, e);
      });

      dot.addEventListener('mouseleave', () => {
        hideSubstationTooltip();
        if (state.selectedSubstationId !== sub.id) {
          unhighlightUnitMapMarker(sub.id);
        }
      });

      // Klik dot GI di scatterplot -> langsung masuk ke Bay level
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        drillDownToBayLevel(sub.id);
      });

      overlay.appendChild(dot);
    });

  } else if (state.hierarchyLevel === 'bay') {
    // Level 2: Bay Level (Gambar 1)
    items.forEach((bay, index) => {
      let col = (bay.matrixCol !== undefined) ? bay.matrixCol : (6 - (bay.tier || 1));
      if (state.activeDimension === 'pelanggan') {
        col = (bay.matrixColPelanggan !== undefined) ? bay.matrixColPelanggan : (6 - (bay.kategoriPelanggan || 1));
      }
      const row = bay.levelAhiAge || 3;

      const colBasePercent = (col - 1) * 20;
      const rowBasePercent = (5 - row) * 20;

      // Distribute bay dots cleanly
      const count = items.length;
      const angle = (index / count) * 2 * Math.PI;
      const r = Math.min(6, count * 1.5);
      const jitterX = 10 + Math.cos(angle) * r;
      const jitterY = 10 + Math.sin(angle) * r;

      const leftPercent = colBasePercent + jitterX;
      const topPercent = rowBasePercent + jitterY;

      const dot = document.createElement('div');
      dot.className = 'scatter-dot';
      dot.id = `dot-${bay.id}`;
      dot.style.left = `${leftPercent}%`;
      dot.style.top = `${topPercent}%`;
      dot.dataset.bayId = bay.id;
      dot.title = bay.name;

      if (bay.id === 'BAY-GRATI-PAITON-1') {
        dot.classList.add('selected-bay-dot');
      }

      dot.addEventListener('mouseenter', (e) => {
        showBayTooltip(bay, e);
        highlightUnitMapMarker(bay.id);
      });

      dot.addEventListener('mousemove', (e) => {
        const tt = document.getElementById('gi-floating-tooltip');
        positionTooltip(tt, e);
      });

      dot.addEventListener('mouseleave', () => {
        hideSubstationTooltip();
        unhighlightUnitMapMarker(bay.id);
      });

      // Klik dot Bay di scatterplot -> langsung masuk ke Asset level
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        drillDownToAssetLevel(bay.id);
      });

      overlay.appendChild(dot);
    });

    // Auto-open floating popup for PHT 500KV PAITON #1 matching Gambar 1
    const paitonBay = items.find(b => b.id === 'BAY-GRATI-PAITON-1') || items[0];
    if (paitonBay && !state.activeBayPopupId) {
      setTimeout(() => {
        showBayFloatingPopup(paitonBay);
      }, 150);
    }

  } else if (state.hierarchyLevel === 'asset') {
    // Level 3: Asset Level (Gambar 2)
    items.forEach((asset, index) => {
      let col = (asset.matrixCol !== undefined) ? asset.matrixCol : (6 - (asset.tier || 1));
      if (state.activeDimension === 'pelanggan') {
        col = (asset.matrixColPelanggan !== undefined) ? asset.matrixColPelanggan : (6 - (asset.kategoriPelanggan || 1));
      }
      const row = asset.levelAhiAge || 3;

      const colBasePercent = (col - 1) * 20;
      const rowBasePercent = (5 - row) * 20;

      let jitterX = 10;
      let jitterY = 10;

      if (row === 2) {
        // 12 dots in cell 16 aligned in neat grid matching screenshot
        const colsInRow = 6;
        const colIdx = index % colsInRow;
        const rowIdx = Math.floor(index / colsInRow);
        jitterX = 4 + colIdx * 2.4;
        jitterY = 8 + rowIdx * 4;
      } else if (row === 4) {
        // 2 dots in cell 19
        jitterX = index === 0 ? 7 : 13;
        jitterY = 10;
      } else {
        // 1 dot in cell 18
        jitterX = 10;
        jitterY = 10;
      }

      const leftPercent = colBasePercent + jitterX;
      const topPercent = rowBasePercent + jitterY;

      const dot = document.createElement('div');
      dot.className = 'scatter-dot';
      dot.id = `dot-${asset.id}`;
      dot.style.left = `${leftPercent}%`;
      dot.style.top = `${topPercent}%`;
      dot.dataset.assetId = asset.id;
      dot.title = asset.name;

      dot.addEventListener('mouseenter', (e) => {
        showAssetTooltip(asset, e);
        highlightUnitMapMarker(asset.id);
      });

      dot.addEventListener('mousemove', (e) => {
        const tt = document.getElementById('gi-floating-tooltip');
        positionTooltip(tt, e);
      });

      dot.addEventListener('mouseleave', () => {
        hideSubstationTooltip();
        unhighlightUnitMapMarker(asset.id);
      });

      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        drillDownToAssetDetail(asset.id);
      });

      overlay.appendChild(dot);
    });
  }
}

// ==========================================================================
// 6. BIDIRECTIONAL HIGHLIGHTING & TOOLTIP
// ==========================================================================
function highlightScatterDot(subId) {
  const dot = document.getElementById(`dot-${subId}`);
  if (dot) dot.classList.add('selected');
}

function unhighlightScatterDots() {
  document.querySelectorAll('.scatter-dot.selected').forEach(d => {
    if (d.dataset.subId !== state.selectedSubstationId) {
      d.classList.remove('selected');
    }
  });
}

function highlightUnitMapMarker(subId) {
  const marker = state.unitMarkers.get(subId);
  if (marker) {
    marker.setRadius(10);
    marker.setStyle({ weight: 3 });
  }
}

function unhighlightUnitMapMarker(subId) {
  const marker = state.unitMarkers.get(subId);
  if (marker && state.selectedSubstationId !== subId) {
    marker.setRadius(6);
    marker.setStyle({ weight: 1.5 });
  }
}

function selectSubstation(subId) {
  state.selectedSubstationId = subId;

  document.querySelectorAll('.scatter-dot').forEach(d => {
    d.classList.toggle('selected', d.dataset.subId === subId);
  });

  const marker = state.unitMarkers.get(subId);
  if (marker) {
    state.unitMap.panTo(marker.getLatLng(), { animate: true, duration: 0.4 });
    marker.openPopup();
    marker.setRadius(10);
    marker.setStyle({ weight: 3 });
  }
}

const KATEGORI_PELANGGAN_DESC = {
  1: "Berdasarkan ketetapan Kementerian dan Lembaga Negara (ESDM, Kemenperin, dll)",
  2: "Istana Negara, Kantor Pemerintah Pusat, Kedubes, KPU, Transportasi Listrik (MRT, LRT, KCIC, KRL), KTT, RS & Stadion Internasional/Nasional",
  3: "Kantor Pemprov, Konjen, Bandara/Pelabuhan/Terminal Provinsi, RS Provinsi, Pusat BUMN, Media Nasional, PTN/PTS, Pelanggan TM Prioritas",
  4: "Kantor Pemkot/Pemkab, Pelayanan Publik Kota/Kab, TNI & POLRI Kota/Kab, TR Prioritas, Stakeholder akses BOD/BOC/Menteri",
  5: "Pelanggan Umum, Residensial, Komersial biasa (selain dari Kategori 1 sampai 4)"
};

const TIER_TECHNICAL_INFO = "Nilai indeks Tier berbanding terbalik terhadap dampak risiko: semakin kecil Tier (Tier 1), semakin tinggi signifikansi konsekuensi dan dampak kontingensi terhadap keandalan sistem penyaluran.";

function getRiskTheme(category, cellNum) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('high') && !cat.includes('mod')) {
    return { bg: '#e50914', text: '#e50914' }; // Red matching screenshot
  } else if (cat.includes('mod-high') || cat.includes('moderate to high')) {
    return { bg: '#f97316', text: '#ea580c' }; // Vibrant Orange
  } else if (cat.includes('moderate')) {
    return { bg: '#f59e0b', text: '#d97706' }; // Amber
  } else if (cat.includes('low-mod') || cat.includes('low to moderate')) {
    return { bg: '#84cc16', text: '#65a30d' }; // Lime Green
  } else {
    return { bg: '#10b981', text: '#059669' }; // Green
  }
}

function positionTooltip(tt, event) {
  if (!tt || !event) return;
  const tooltipWidth = 300;
  const tooltipHeight = 320;
  let x = event.clientX + 16;
  let y = event.clientY - 35;

  if (x + tooltipWidth > window.innerWidth - 12) {
    x = event.clientX - tooltipWidth - 16;
  }
  if (y + tooltipHeight > window.innerHeight - 12) {
    y = window.innerHeight - tooltipHeight - 12;
  }
  if (y < 12) y = 12;

  tt.style.position = 'fixed';
  tt.style.left = `${x}px`;
  tt.style.top = `${y}px`;
}

function showSubstationTooltip(sub, event) {
  const tt = document.getElementById('gi-floating-tooltip');
  if (!tt) return;

  // Resolve column in active matrix dimension
  let col = 1;
  if (state.activeDimension === 'tier') {
    col = (sub.matrixCol !== undefined) ? sub.matrixCol : (6 - (sub.tier || 1));
  } else if (state.activeDimension === 'beban') {
    col = sub.levelBeban || 1;
  } else if (state.activeDimension === 'kerawanan') {
    col = sub.levelKerawanan || 1;
  } else if (state.activeDimension === 'pelanggan') {
    col = (sub.matrixColPelanggan !== undefined) ? sub.matrixColPelanggan : (sub.levelPelanggan || (6 - (sub.kategoriPelanggan || 1)));
  }
  const row = sub.levelAhiAge || 1;

  const cell = (MATRIX_CONFIG.cells && MATRIX_CONFIG.cells[row] && MATRIX_CONFIG.cells[row][col]) || {
    num: sub.cellNum || 22,
    title: sub.cellTitle || sub.riskCategory || 'High',
    cat: sub.riskCategory || 'High'
  };

  const theme = getRiskTheme(cell.title || cell.cat, cell.num);

  const headerBg = document.getElementById('tt-header-bg');
  if (headerBg) headerBg.style.background = theme.bg;

  const iconSvg = document.getElementById('tt-icon-svg');
  if (iconSvg) iconSvg.style.stroke = theme.text;

  const pillText = document.getElementById('tt-pill-text');
  if (pillText) {
    pillText.textContent = `${cell.num} - ${cell.title}`;
    pillText.style.color = theme.text;
  }

  const nameEl = document.getElementById('tt-name');
  if (nameEl) nameEl.textContent = sub.name;

  const subEl = document.getElementById('tt-sub');
  if (subEl) subEl.textContent = 'Gardu Induk';

  // Baris ke-5 disesuaikan sama tier dan Kategori jenis pelanggan
  let dimKey = 'Tier :';
  let dimVal = `Tier ${sub.tier || 1}`;
  let descTitle = 'Kritikalitas:';
  let descText = TIER_TECHNICAL_INFO;
  let calloutClass = 'callout-tier';

  if (state.activeDimension === 'pelanggan') {
    const katNum = sub.kategoriPelanggan || 1;
    dimKey = 'Kategori Pelanggan :';
    dimVal = sub.kategoriPelangganLabel || `Kategori ${katNum}`;
    descTitle = 'Kriteria:';
    descText = sub.kategoriPelangganDesc || KATEGORI_PELANGGAN_DESC[katNum] || '';
    calloutClass = 'callout-pelanggan';
  } else if (state.activeDimension === 'beban') {
    dimKey = 'Beban Rata-rata :';
    dimVal = (sub.beban !== undefined ? Number(sub.beban).toFixed(2) : '269.63');
    descText = '';
  } else if (state.activeDimension === 'kerawanan') {
    dimKey = 'Kerawanan :';
    dimVal = sub.kerawanan || 'Sedang';
    descText = '';
  }

  const teganganVal = sub.tegangan ? String(sub.tegangan).replace(/\D/g, '') : '500';

  const kvContainer = document.getElementById('tt-kv-container');
  if (kvContainer) {
    let extraDescHtml = '';
    if (descText) {
      extraDescHtml = `
        <div class="hover-desc-callout ${calloutClass}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0; margin-top:1.5px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span><strong>${descTitle}</strong> ${descText}</span>
        </div>
      `;
    }

    kvContainer.innerHTML = `
      <div class="hover-kv-row"><span class="k">Unit Induk :</span><span class="v">${sub.unit || state.selectedUnit}</span></div>
      <div class="hover-kv-row"><span class="k">UPT :</span><span class="v">${sub.upt || '-'}</span></div>
      <div class="hover-kv-row"><span class="k">ULTG :</span><span class="v">${sub.ultg || '-'}</span></div>
      <div class="hover-kv-row"><span class="k">Tegangan :</span><span class="v">${teganganVal}</span></div>
      <div class="hover-kv-row"><span class="k">${dimKey}</span><span class="v" title="${descText || dimVal}">${dimVal}</span></div>
      ${extraDescHtml}
    `;
  }

  tt.style.display = 'block';
  positionTooltip(tt, event);
}

function showBayTooltip(bay, event) {
  const tt = document.getElementById('gi-floating-tooltip');
  if (!tt) return;

  let col = (bay.matrixCol !== undefined) ? bay.matrixCol : (6 - (bay.tier || 1));
  if (state.activeDimension === 'pelanggan') {
    col = (bay.matrixColPelanggan !== undefined) ? bay.matrixColPelanggan : (6 - (bay.kategoriPelanggan || 1));
  }
  const row = bay.levelAhiAge || 3;

  const cell = (MATRIX_CONFIG.cells && MATRIX_CONFIG.cells[row] && MATRIX_CONFIG.cells[row][col]) || {
    num: bay.cellNum || 19,
    title: bay.cellTitle || bay.riskCategory || 'Moderate to High',
    cat: bay.riskCategory || 'Mod-High'
  };

  const theme = getRiskTheme(cell.title || cell.cat, cell.num);

  const headerBg = document.getElementById('tt-header-bg');
  if (headerBg) headerBg.style.background = theme.bg;

  const iconSvg = document.getElementById('tt-icon-svg');
  if (iconSvg) iconSvg.style.stroke = theme.text;

  const pillText = document.getElementById('tt-pill-text');
  if (pillText) {
    pillText.textContent = `${cell.num} - ${cell.title}`;
    pillText.style.color = theme.text;
  }

  const nameEl = document.getElementById('tt-name');
  if (nameEl) nameEl.textContent = bay.name;

  const subEl = document.getElementById('tt-sub');
  if (subEl) subEl.textContent = bay.bayType || 'Bay';

  let dimKey = 'Tier :';
  let dimVal = `Tier ${bay.tier || 4}`;
  let descTitle = 'Kritikalitas:';
  let descText = TIER_TECHNICAL_INFO;
  let calloutClass = 'callout-tier';

  if (state.activeDimension === 'pelanggan') {
    const katNum = bay.kategoriPelanggan || 1;
    dimKey = 'Kategori Pelanggan :';
    dimVal = bay.kategoriPelangganLabel || `Kategori ${katNum}`;
    descTitle = 'Kriteria:';
    descText = bay.kategoriPelangganDesc || KATEGORI_PELANGGAN_DESC[katNum] || '';
    calloutClass = 'callout-pelanggan';
  } else if (state.activeDimension === 'beban') {
    dimKey = 'Beban :';
    dimVal = (bay.beban !== undefined ? `${Number(bay.beban).toFixed(2)} MW` : '-');
    descText = '';
  }

  const teganganVal = bay.tegangan ? String(bay.tegangan).replace(/\D/g, '') : '500';

  const kvContainer = document.getElementById('tt-kv-container');
  if (kvContainer) {
    let extraDescHtml = '';
    if (descText) {
      extraDescHtml = `
        <div class="hover-desc-callout ${calloutClass}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0; margin-top:1.5px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span><strong>${descTitle}</strong> ${descText}</span>
        </div>
      `;
    }

    kvContainer.innerHTML = `
      <div class="hover-kv-row"><span class="k">Unit Induk :</span><span class="v">${bay.unit || state.selectedUnit}</span></div>
      <div class="hover-kv-row"><span class="k">UPT :</span><span class="v">${bay.upt || '-'}</span></div>
      <div class="hover-kv-row"><span class="k">ULTG :</span><span class="v">${bay.ultg || '-'}</span></div>
      <div class="hover-kv-row"><span class="k">Gardu Induk :</span><span class="v">${bay.giName || (state.selectedGI ? state.selectedGI.name : '-')}</span></div>
      <div class="hover-kv-row"><span class="k">Tegangan :</span><span class="v">${teganganVal}</span></div>
      <div class="hover-kv-row"><span class="k">${dimKey}</span><span class="v" title="${descText || dimVal}">${dimVal}</span></div>
      ${extraDescHtml}
    `;
  }

  tt.style.display = 'block';
  positionTooltip(tt, event);
}

function showAssetTooltip(asset, event) {
  const tt = document.getElementById('gi-floating-tooltip');
  if (!tt) return;

  let col = (asset.matrixCol !== undefined) ? asset.matrixCol : (6 - (asset.tier || 1));
  if (state.activeDimension === 'pelanggan') {
    col = (asset.matrixColPelanggan !== undefined) ? asset.matrixColPelanggan : (6 - (asset.kategoriPelanggan || 1));
  }
  const row = asset.levelAhiAge || 3;

  const cell = (MATRIX_CONFIG.cells && MATRIX_CONFIG.cells[row] && MATRIX_CONFIG.cells[row][col]) || {
    num: asset.cellNum || 19,
    title: asset.cellTitle || asset.riskCategory || 'Moderate to High',
    cat: asset.riskCategory || 'Mod-High'
  };

  const theme = getRiskTheme(cell.title || cell.cat, cell.num);

  const headerBg = document.getElementById('tt-header-bg');
  if (headerBg) headerBg.style.background = theme.bg;

  const iconSvg = document.getElementById('tt-icon-svg');
  if (iconSvg) iconSvg.style.stroke = theme.text;

  const pillText = document.getElementById('tt-pill-text');
  if (pillText) {
    pillText.textContent = `${cell.num} - ${cell.title}`;
    pillText.style.color = theme.text;
  }

  const nameEl = document.getElementById('tt-name');
  if (nameEl) nameEl.textContent = asset.name;

  const subEl = document.getElementById('tt-sub');
  if (subEl) subEl.textContent = asset.jenisAset || 'Peralatan';

  let dimKey = 'Tier :';
  let dimVal = `Tier ${asset.tier || 4}`;
  let descTitle = 'Kritikalitas:';
  let descText = TIER_TECHNICAL_INFO;
  let calloutClass = 'callout-tier';

  if (state.activeDimension === 'pelanggan') {
    const katNum = asset.kategoriPelanggan || 1;
    dimKey = 'Kategori Pelanggan :';
    dimVal = asset.kategoriPelangganLabel || `Kategori ${katNum}`;
    descTitle = 'Kriteria:';
    descText = asset.kategoriPelangganDesc || KATEGORI_PELANGGAN_DESC[katNum] || '';
    calloutClass = 'callout-pelanggan';
  }

  const kvContainer = document.getElementById('tt-kv-container');
  if (kvContainer) {
    let extraDescHtml = '';
    if (descText) {
      extraDescHtml = `
        <div class="hover-desc-callout ${calloutClass}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0; margin-top:1.5px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span><strong>${descTitle}</strong> ${descText}</span>
        </div>
      `;
    }

    kvContainer.innerHTML = `
      <div class="hover-kv-row"><span class="k">Unit Induk :</span><span class="v">${state.selectedUnit}</span></div>
      <div class="hover-kv-row"><span class="k">Gardu Induk :</span><span class="v">${state.selectedGI ? state.selectedGI.name : '-'}</span></div>
      <div class="hover-kv-row"><span class="k">Bay :</span><span class="v">${state.selectedBay ? state.selectedBay.name : '-'}</span></div>
      <div class="hover-kv-row"><span class="k">Merk / Phasa :</span><span class="v">${asset.merk || '-'} (${asset.phasa || '3 Phase'})</span></div>
      <div class="hover-kv-row"><span class="k">AHI Score :</span><span class="v">${asset.ahiScore || '5 - Critical'}</span></div>
      <div class="hover-kv-row"><span class="k">${dimKey}</span><span class="v" title="${descText || dimVal}">${dimVal}</span></div>
      ${extraDescHtml}
    `;
  }

  tt.style.display = 'block';
  positionTooltip(tt, event);
}

function hideSubstationTooltip() {
  const tt = document.getElementById('gi-floating-tooltip');
  if (tt) tt.style.display = 'none';
}

// ==========================================================================
// 7. DRILL-DOWN ROUTING (GI -> BAY -> ASSET -> DETAIL)
// ==========================================================================
function drillDownToBayLevel(giId) {
  let gi = null;
  const list = SUBSTATIONS_BY_UNIT[state.selectedUnit] || [];
  gi = list.find(g => g.id === giId) || {
    id: giId,
    name: "GITET 500KV GRATI",
    unit: state.selectedUnit,
    upt: "UPT PROBOLINGGO",
    ultg: "ULTG PROBOLINGGO",
    tegangan: "500 kV",
    lat: -7.69742,
    lon: 113.01348,
    tier: 1,
    levelAhiAge: 5,
    matrixCol: 5
  };

  state.selectedGI = gi;
  state.selectedBay = null;
  state.selectedAsset = null;
  state.hierarchyLevel = 'bay';
  state.activeRiskFilter = null;
  state.activeBayPopupId = null;

  hideSubstationTooltip();
  hideBayPopup();
  hideAssetDetailView();
  updateBreadcrumb();
  updateDetailViewUI();
}

function drillDownToAssetLevel(bayId) {
  let bay = null;
  const bays = getBaysForSubstation(state.selectedGI);
  bay = bays.find(b => b.id === (bayId || (state.selectedBay && state.selectedBay.id))) || bays[0];

  state.selectedBay = bay;
  state.selectedAsset = null;
  state.hierarchyLevel = 'asset';
  state.activeRiskFilter = null;
  state.activeBayPopupId = null;

  hideBayPopup();
  hideAssetDetailView();
  updateBreadcrumb();
  updateDetailViewUI();
}

function drillDownToAssetDetail(assetId) {
  let asset = null;
  const assets = getAssetsForBay(state.selectedBay);
  asset = assets.find(a => a.id === assetId) || assets[0];

  state.selectedAsset = asset;
  state.hierarchyLevel = 'asset-detail';

  hideBayPopup();
  showAssetDetailView(asset);
  updateBreadcrumb();
  updateDetailViewUI();
}

function handleDetailClose() {
  if (state.hierarchyLevel === 'asset-detail') {
    drillDownToAssetLevel(state.selectedBay.id);
  } else if (state.hierarchyLevel === 'asset') {
    drillDownToBayLevel(state.selectedGI.id);
  } else if (state.hierarchyLevel === 'bay') {
    state.hierarchyLevel = 'gi';
    state.selectedGI = null;
    hideBayPopup();
    updateBreadcrumb();
    updateDetailViewUI();
  } else {
    showNationalView();
  }
}

// ==========================================================================
// 8. BREADCRUMB & HEADER
// ==========================================================================
function updateBreadcrumb() {
  const breadcrumbEl = document.getElementById('detail-breadcrumb');
  const unitTitleEl = document.getElementById('detail-unit-title');
  const unitSubEl = document.getElementById('detail-unit-sub');

  if (!breadcrumbEl || !unitTitleEl || !unitSubEl) return;

  const unitName = state.selectedUnit;
  unitTitleEl.textContent = `PETA RISIKO - ${unitName}`;

  if (state.hierarchyLevel === 'gi') {
    unitSubEl.textContent = `Gardu Induk / ${unitName}`;
    unitSubEl.style.display = 'block';
    breadcrumbEl.style.display = 'none';
    breadcrumbEl.innerHTML = '';
    return;
  }

  unitSubEl.style.display = 'none';
  breadcrumbEl.style.display = 'flex';

  let html = `
    <span class="breadcrumb-link" onclick="openDetailView('${unitName}')">← Kembali ke Peta Risiko</span>
  `;

  if (state.hierarchyLevel === 'bay') {
    html += `
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">${state.selectedGI ? state.selectedGI.name : 'Gardu Induk'}</span>
    `;
  } else if (state.hierarchyLevel === 'asset') {
    html += `
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-link" onclick="drillDownToBayLevel('${state.selectedGI ? state.selectedGI.id : ''}')">${state.selectedGI ? state.selectedGI.name : 'Gardu Induk'}</span>
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">${state.selectedBay ? state.selectedBay.name : 'Bay'}</span>
    `;
  } else if (state.hierarchyLevel === 'asset-detail') {
    html += `
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-link" onclick="drillDownToBayLevel('${state.selectedGI ? state.selectedGI.id : ''}')">${state.selectedGI ? state.selectedGI.name : 'Gardu Induk'}</span>
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-link" onclick="drillDownToAssetLevel('${state.selectedBay ? state.selectedBay.id : ''}')">${state.selectedBay ? state.selectedBay.name : 'Bay'}</span>
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">${state.selectedAsset ? state.selectedAsset.name : 'Aset'}</span>
    `;
  }

  breadcrumbEl.innerHTML = html;
}

// ==========================================================================
// 9. ASSET DETAIL DASHBOARD (GAMBAR 3)
// ==========================================================================
function showAssetDetailView(asset) {
  const matrixDisp = document.getElementById('matrix-display');
  const tableDisp = document.getElementById('table-display');
  const assetDetailDisp = document.getElementById('asset-detail-display');
  const filtersRow = document.getElementById('detail-filters-row');
  const toggleGroup = document.getElementById('view-toggle-container');

  if (matrixDisp) matrixDisp.style.display = 'none';
  if (tableDisp) tableDisp.style.display = 'none';
  if (filtersRow) filtersRow.style.display = 'none';
  if (toggleGroup) toggleGroup.style.display = 'none';
  if (assetDetailDisp) assetDetailDisp.style.display = 'flex';

  const unitSubEl = document.getElementById('detail-unit-sub');
  if (unitSubEl) {
    unitSubEl.style.display = 'block';
    unitSubEl.textContent = `Techidentno: ${asset.name || 'Lightning Arrester - SIEMENS - 22083049 - R'}`;
  }

  setElemText('ad-risk-score', asset.riskScore || '19 - Moderate to High');
  setElemText('ad-ahi-score', asset.ahiScore || '5 - Critical');

  let xLbl = 'TIER';
  let xVal = asset.tier ? `Tier ${asset.tier}` : 'Tier 4';
  if (state.activeDimension === 'pelanggan') {
    xLbl = 'KATEGORI PELANGGAN';
    xVal = asset.kategoriPelangganLabel || `Kategori ${asset.kategoriPelanggan || 1}`;
  }

  // Force label & value across both ID and CSS selectors
  const tierLbl = document.getElementById('ad-tier-lbl') || 
                  document.querySelector('.asset-metrics-sub .metric-sub-item:last-child .sub-lbl');
  if (tierLbl) tierLbl.textContent = xLbl;

  const tierValEl = document.getElementById('ad-tier-val') || 
                    document.getElementById('ad-beban-val') ||
                    document.querySelector('.asset-metrics-sub .metric-sub-item:last-child .sub-val');
  if (tierValEl) tierValEl.textContent = xVal;

  setElemText('ad-unit', state.selectedUnit);
  setElemText('ad-upt', state.selectedGI ? state.selectedGI.upt : 'UPT PROBOLINGGO');
  setElemText('ad-ultg', state.selectedGI ? state.selectedGI.ultg : 'ULTG PROBOLINGGO');
  setElemText('ad-gi', state.selectedGI ? state.selectedGI.name : 'GITET 500KV GRATI');
  setElemText('ad-bay', state.selectedBay ? state.selectedBay.name : 'PHT 500KV PAITON #1');
  setElemText('ad-penempatan', state.selectedBay ? state.selectedBay.name : 'PHT 500KV PAITON #1');

  setElemText('ad-techid', asset.techidentno || '16361436136100000014');
  setElemText('ad-jenis', asset.jenisAset || 'Lightning Arrester');
  setElemText('ad-merk', asset.merk || 'SIEMENS');
  setElemText('ad-tipe', asset.tipe || '3EL3 420-4PL54-4TA1-Z');
  setElemText('ad-phasa', asset.phasa || 'R');
  setElemText('ad-serial', asset.serialId || '22083049');
  setElemText('ad-status', asset.statusAset || 'Operasi');
  setElemText('ad-usia', asset.usiaAset !== undefined ? asset.usiaAset : '4');

  setElemText('ad-alert-title', `Status Peralatan ${asset.cellTitle || 'Moderate to High'}!`);

  const tbody = document.getElementById('ad-inspections-tbody');
  if (tbody) {
    const list = asset.inspections || [
      { no: 1, subSistem: "Dielectric", parameter: "Tahanan Isolasi Primary Unit", skor: "5 - Critical", noInspeksi: "LOGSMARTNES202500195613", tglInspeksi: "27 Januari 2024 00:00:00" },
      { no: 2, subSistem: "Primary Unit", parameter: "Thermovisi Body Aset", skor: "2 - Good", noInspeksi: "INS202602198425", tglInspeksi: "09 November 2026 15:00:14" },
      { no: 3, subSistem: "Primary Unit", parameter: "Pengukuran Arus Bocor (LCM) - R", skor: "2 - Good", noInspeksi: "INS202602016941", tglInspeksi: "20 Oktober 2026 09:34:29" },
      { no: 4, subSistem: "Primary Unit", parameter: "Pengukuran Arus Bocor (LCM)", skor: "2 - Good", noInspeksi: "LOG202400044968", tglInspeksi: "01 Januari 2024 00:00:00" },
      { no: 5, subSistem: "Primary Unit", parameter: "Kondisi Fisik LA", skor: "-", noInspeksi: "-", tglInspeksi: "-" }
    ];

    tbody.innerHTML = list.map(row => {
      let skorClass = 'skor-dash';
      if (row.skor.includes('Critical')) skorClass = 'skor-critical';
      else if (row.skor.includes('Good')) skorClass = 'skor-good';
      else if (row.skor.includes('Warning')) skorClass = 'skor-warning';

      return `
        <tr>
          <td style="color: var(--text-muted); font-size: 11px;">${row.no}</td>
          <td>${row.subSistem}</td>
          <td style="font-weight: 500;">${row.parameter}</td>
          <td><span class="${skorClass}">${row.skor}</span></td>
          <td style="font-family: monospace; font-size: 11px;">${row.noInspeksi}</td>
          <td style="color: var(--text-muted); font-size: 11px;">${row.tglInspeksi}</td>
        </tr>
      `;
    }).join('');
  }
}

function hideAssetDetailView() {
  const assetDetailDisp = document.getElementById('asset-detail-display');
  const matrixDisp = document.getElementById('matrix-display');
  const filtersRow = document.getElementById('detail-filters-row');
  const toggleGroup = document.getElementById('view-toggle-container');

  if (assetDetailDisp) assetDetailDisp.style.display = 'none';
  if (state.viewMode === 'matrix' && matrixDisp) matrixDisp.style.display = 'flex';
  if (toggleGroup) toggleGroup.style.display = 'flex';
  if (filtersRow) {
    filtersRow.style.display = state.hierarchyLevel === 'gi' ? 'flex' : 'none';
  }
}

function setElemText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

// ==========================================================================
// 10. BAY FLOATING POPUP CARD (GAMBAR 1)
// ==========================================================================
function showBayFloatingPopup(bay, evt) {
  const popup = document.getElementById('bay-floating-popup');
  if (!popup) return;

  state.activeBayPopupId = bay.id;

  let col = (bay.matrixCol !== undefined) ? bay.matrixCol : (6 - (bay.tier || 1));
  if (state.activeDimension === 'pelanggan') {
    col = (bay.matrixColPelanggan !== undefined) ? bay.matrixColPelanggan : (6 - (bay.kategoriPelanggan || 1));
  }
  const row = bay.levelAhiAge || 3;

  const cell = (MATRIX_CONFIG.cells && MATRIX_CONFIG.cells[row] && MATRIX_CONFIG.cells[row][col]) || {
    num: bay.cellNum || 19,
    title: bay.cellTitle || bay.riskCategory || 'Moderate to High',
    cat: bay.riskCategory || 'Mod-High'
  };

  const theme = getRiskTheme(cell.title || cell.cat, cell.num);

  const headerBg = document.getElementById('bp-header-bg');
  if (headerBg) headerBg.style.background = theme.bg;

  const iconSvg = document.getElementById('bp-icon-svg');
  if (iconSvg) iconSvg.style.stroke = theme.text;

  const pillText = document.getElementById('bp-tag-text');
  if (pillText) {
    pillText.textContent = `${cell.num} - ${cell.title}`;
    pillText.style.color = theme.text;
  }

  setElemText('bp-title', bay.name);
  const subEl = document.getElementById('bp-sub');
  if (subEl) subEl.textContent = bay.bayType || 'Bay';

  let dimKey = 'Tier :';
  let dimVal = `Tier ${bay.tier || 4}`;
  let descTitle = 'Kritikalitas:';
  let descText = TIER_TECHNICAL_INFO;
  let calloutClass = 'callout-tier';

  if (state.activeDimension === 'pelanggan') {
    const katNum = bay.kategoriPelanggan || 1;
    dimKey = 'Kategori Pelanggan :';
    dimVal = bay.kategoriPelangganLabel || `Kategori ${katNum}`;
    descTitle = 'Kriteria:';
    descText = bay.kategoriPelangganDesc || KATEGORI_PELANGGAN_DESC[katNum] || '';
    calloutClass = 'callout-pelanggan';
  } else if (state.activeDimension === 'beban') {
    dimKey = 'Beban :';
    dimVal = bay.beban !== undefined ? `${bay.beban} MW` : '-';
    descText = '';
  }

  const teganganVal = bay.tegangan ? String(bay.tegangan).replace(/\D/g, '') : '500';

  const kvContainer = document.getElementById('bp-kv-container');
  if (kvContainer) {
    let extraDescHtml = '';
    if (descText) {
      extraDescHtml = `
        <div class="hover-desc-callout ${calloutClass}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0; margin-top:1.5px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span><strong>${descTitle}</strong> ${descText}</span>
        </div>
      `;
    }

    kvContainer.innerHTML = `
      <div class="hover-kv-row"><span class="k">Unit Induk :</span><span class="v">${bay.unit || state.selectedUnit}</span></div>
      <div class="hover-kv-row"><span class="k">UPT :</span><span class="v">${bay.upt || '-'}</span></div>
      <div class="hover-kv-row"><span class="k">ULTG :</span><span class="v">${bay.ultg || '-'}</span></div>
      <div class="hover-kv-row"><span class="k">Gardu Induk :</span><span class="v">${bay.giName || (state.selectedGI ? state.selectedGI.name : '-')}</span></div>
      <div class="hover-kv-row"><span class="k">Tegangan :</span><span class="v">${teganganVal}</span></div>
      <div class="hover-kv-row"><span class="k">${dimKey}</span><span class="v" title="${descText || dimVal}">${dimVal}</span></div>
      ${extraDescHtml}
    `;
  }

  const drillBtn = document.getElementById('bp-drill-btn');
  if (drillBtn) {
    drillBtn.onclick = () => {
      drillDownToAssetLevel(bay.id);
    };
  }

  popup.style.display = 'block';

  // Position nicely over matrix or near mouse
  if (evt && evt.clientX && evt.clientY) {
    positionTooltip(popup, evt);
  } else {
    popup.style.position = 'absolute';
    const matrixWorkspace = document.getElementById('matrix-display');
    if (matrixWorkspace) {
      const rect = matrixWorkspace.getBoundingClientRect();
      popup.style.left = `${rect.width * 0.38}px`;
      popup.style.top = `${rect.height * 0.36}px`;
    }
  }
}

function hideBayPopup() {
  const popup = document.getElementById('bay-floating-popup');
  if (popup) popup.style.display = 'none';
  state.activeBayPopupId = null;
}

// ==========================================================================
// 11. UPDATE DETAIL VIEW & SUMMARY CARD (GAMBAR 2 STATS)
// ==========================================================================
function updateDetailViewUI() {
  const items = getActiveLevelItems();

  if (state.hierarchyLevel !== 'asset-detail') {
    renderScatterDots(items);
  }

  if (state.hierarchyLevel === 'asset-detail') {
    renderUnitMarkers([state.selectedAsset]);
  } else {
    renderUnitMarkers(items);
  }

  renderTableRows(items);
  updateSummaryCard(items);
}

function updateSummaryCard(items) {
  const unitNameEl = document.getElementById('summary-unit-name');
  const totalNumEl = document.getElementById('summary-total-num');
  const totalLblEl = document.querySelector('.summary-total-gi .lbl');
  const unitSubEl = document.querySelector('.summary-unit-info p');

  if (!unitNameEl || !totalNumEl) return;

  unitNameEl.textContent = state.selectedUnit;

  let totalCount = items.length;
  let labelText = 'Total GI';
  let subText = 'Semua Gardu Induk';

  if (state.hierarchyLevel === 'bay') {
    labelText = 'Total Bay';
    subText = state.selectedGI ? state.selectedGI.name : 'GITET 500KV GRATI';
  } else if (state.hierarchyLevel === 'asset') {
    labelText = 'Total Aset';
    subText = state.selectedBay ? state.selectedBay.name : 'PHT 500KV PAITON #1';
  } else if (state.hierarchyLevel === 'asset-detail') {
    labelText = 'Aset Dipilih';
    subText = state.selectedAsset ? state.selectedAsset.name : 'Detail Peralatan';
    totalCount = 1;
  }

  totalNumEl.textContent = totalCount;
  if (totalLblEl) totalLblEl.textContent = labelText;
  if (unitSubEl) unitSubEl.textContent = subText;

  let highCount = 0;
  let modHighCount = 0;
  let modCount = 0;
  let lowModCount = 0;
  let lowCount = 0;

  if (state.hierarchyLevel === 'bay') {
    // Exact counts from Gambar 1: 0 High, 6 Mod-High, 1 Moderate, 0 Low-Mod, 0 Low
    highCount = items.filter(i => i.riskCategory === 'High').length;
    modHighCount = items.filter(i => i.riskCategory === 'Mod-High').length;
    modCount = items.filter(i => i.riskCategory === 'Moderate').length;
    lowModCount = items.filter(i => i.riskCategory === 'Low-Mod').length;
    lowCount = items.filter(i => i.riskCategory === 'Low').length;
  } else if (state.hierarchyLevel === 'asset') {
    // Exact counts from Gambar 2: 0 High, 15 Mod-High, 0 Moderate, 0 Low-Mod, 0 Low
    highCount = items.filter(i => i.riskCategory === 'High').length;
    modHighCount = items.filter(i => i.riskCategory === 'Mod-High').length;
    modCount = items.filter(i => i.riskCategory === 'Moderate').length;
    lowModCount = items.filter(i => i.riskCategory === 'Low-Mod').length;
    lowCount = items.filter(i => i.riskCategory === 'Low').length;
  } else if (state.hierarchyLevel === 'asset-detail') {
    const cat = state.selectedAsset ? state.selectedAsset.riskCategory : 'Mod-High';
    if (cat === 'High') highCount = 1;
    else if (cat === 'Mod-High') modHighCount = 1;
    else if (cat === 'Moderate') modCount = 1;
    else if (cat === 'Low-Mod') lowModCount = 1;
    else lowCount = 1;
  } else {
    // Exact GI Level Counts (e.g. UITJBB: 4 High, 4 Mod-High, 0 Moderate, 43 Low-Mod, 125 Low)
    const allUnitGIs = SUBSTATIONS_BY_UNIT[state.selectedUnit] || [];
    highCount = allUnitGIs.filter(g => g.riskCategory === 'High').length;
    modHighCount = allUnitGIs.filter(g => g.riskCategory === 'Mod-High').length;
    modCount = allUnitGIs.filter(g => g.riskCategory === 'Moderate').length;
    lowModCount = allUnitGIs.filter(g => g.riskCategory === 'Low-Mod').length;
    lowCount = allUnitGIs.filter(g => g.riskCategory === 'Low').length;
  }

  setElemText('stat-count-high', highCount);
  setElemText('stat-count-mod-high', modHighCount);
  setElemText('stat-count-mod', modCount);
  setElemText('stat-count-low-mod', lowModCount);
  setElemText('stat-count-low', lowCount);
}

// ==========================================================================
// 12. TABLE VIEW & FILTERING
// ==========================================================================
function renderTableRows(items) {
  const tbody = document.getElementById('substation-table-body');
  const countEl = document.getElementById('table-total-records');
  const theadRow = document.getElementById('table-dynamic-headers');
  if (!tbody) return;

  let filtered = [...items];
  if (state.tableSearchQuery) {
    const q = state.tableSearchQuery.toLowerCase();
    filtered = filtered.filter(i => (i.name || '').toLowerCase().includes(q));
  }

  if (countEl) countEl.textContent = `Menampilkan ${filtered.length} data`;

  if (theadRow) {
    const isPelanggan = state.activeDimension === 'pelanggan';
    const xHeader = isPelanggan ? 'Kategori Pelanggan' : 'Tier';
    if (state.hierarchyLevel === 'gi') {
      theadRow.innerHTML = `
        <th>Nama Gardu Induk</th>
        <th>UPT</th>
        <th>ULTG</th>
        <th>Tegangan</th>
        <th>${xHeader}</th>
        <th>AHI (%)</th>
        <th>Usia</th>
        <th>Beban (%)</th>
        <th>Status Risiko</th>
        <th style="width: 50px;">Aksi</th>
      `;
    } else if (state.hierarchyLevel === 'bay') {
      theadRow.innerHTML = `
        <th>Nama Bay</th>
        <th>Tipe Bay</th>
        <th>UPT</th>
        <th>ULTG</th>
        <th>Tegangan</th>
        <th>${xHeader}</th>
        <th>Jumlah Aset</th>
        <th>Status Risiko</th>
        <th style="width: 50px;">Aksi</th>
      `;
    } else {
      theadRow.innerHTML = `
        <th>Nama Peralatan</th>
        <th>Jenis Aset</th>
        <th>Merk</th>
        <th>Phasa</th>
        <th>Serial ID</th>
        <th>Usia (Th)</th>
        <th>AHI Score</th>
        <th>Status Risiko</th>
        <th style="width: 50px;">Aksi</th>
      `;
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 24px; color: var(--text-muted);">Tidak ada data yang sesuai filter</td></tr>`;
    return;
  }

  const isPelanggan = state.activeDimension === 'pelanggan';

  tbody.innerHTML = filtered.map(item => {
    const badgeCls = `pill-${(item.riskCategory || 'low').toLowerCase().replace(' ', '-')}`;

    if (state.hierarchyLevel === 'gi') {
      const xDisplay = isPelanggan ? (item.kategoriPelangganLabel || `Kategori ${item.kategoriPelanggan || 1}`) : `Tier ${item.tier || '-'}`;
      return `
        <tr onclick="selectSubstation('${item.id}')" style="cursor: pointer;" title="Klik untuk lihat di peta">
          <td style="font-weight: 600; color: #1e3a8a;">${item.name}</td>
          <td>${item.upt || '-'}</td>
          <td>${item.ultg || '-'}</td>
          <td><span class="badge-volt">${item.tegangan || '-'}</span></td>
          <td>${xDisplay}</td>
          <td>${item.ahi ? item.ahi.toFixed(1) + '%' : '-'}</td>
          <td>${item.usia || item.age || '-'} th</td>
          <td>${item.beban ? item.beban.toFixed(1) + '%' : '-'}</td>
          <td><span class="pill-status ${badgeCls}">${item.riskCategory || '-'}</span></td>
          <td><button class="btn-table-action" onclick="event.stopPropagation(); drillDownToBayLevel('${item.id}')" title="Buka Bay & Aset">&rarr;</button></td>
        </tr>
      `;
    } else if (state.hierarchyLevel === 'bay') {
      const xDisplay = isPelanggan ? (item.kategoriPelangganLabel || `Kategori ${item.kategoriPelanggan || 1}`) : `Tier ${item.tier || 4}`;
      return `
        <tr onclick="drillDownToAssetLevel('${item.id}')" style="cursor: pointer;" title="Klik untuk lihat 15 aset di Bay ini">
          <td style="font-weight: 600; color: #1e3a8a;">${item.name}</td>
          <td>${item.bayType || 'Penghantar'}</td>
          <td>${item.upt || '-'}</td>
          <td>${item.ultg || '-'}</td>
          <td><span class="badge-volt">${item.tegangan || '500'} kV</span></td>
          <td style="font-weight: 600;">${xDisplay}</td>
          <td>${item.totalAssets || 15}</td>
          <td><span class="pill-status ${badgeCls}">${item.cellTitle || item.riskCategory}</span></td>
          <td><button class="btn-table-action" onclick="event.stopPropagation(); drillDownToAssetLevel('${item.id}')">&rarr;</button></td>
        </tr>
      `;
    } else {
      return `
        <tr onclick="drillDownToAssetDetail('${item.id}')" style="cursor: pointer;" title="Klik untuk buka detail aset">
          <td style="font-weight: 600; color: #1e3a8a;">${item.name}</td>
          <td>${item.jenisAset || '-'}</td>
          <td>${item.merk || '-'}</td>
          <td>${item.phasa || '-'}</td>
          <td style="font-family: monospace;">${item.serialId || '-'}</td>
          <td>${item.usiaAset || '-'}</td>
          <td style="color: #ef4444; font-weight: 600;">${item.ahiScore || '-'}</td>
          <td><span class="pill-status ${badgeCls}">${item.riskCategory || '-'}</span></td>
          <td><button class="btn-table-action" onclick="event.stopPropagation(); drillDownToAssetDetail('${item.id}')">&rarr;</button></td>
        </tr>
      `;
    }
  }).join('');
}

function populateFilterDropdowns() {
  const uptSelect = document.getElementById('filter-upt');
  const ultgSelect = document.getElementById('filter-ultg');
  if (!uptSelect || !ultgSelect) return;

  const substations = SUBSTATIONS_BY_UNIT[state.selectedUnit] || [];
  const upts = [...new Set(substations.map(s => s.upt).filter(Boolean))].sort();
  const ultgs = [...new Set(substations.map(s => s.ultg).filter(Boolean))].sort();

  uptSelect.innerHTML = '<option value="all">Pilih UPT</option>' + upts.map(u => `<option value="${u}">${u}</option>`).join('');
  ultgSelect.innerHTML = '<option value="all">Pilih ULTG</option>' + ultgs.map(u => `<option value="${u}">${u}</option>`).join('');

  const unitFilterLabel = document.getElementById('filter-unit-label');
  if (unitFilterLabel) unitFilterLabel.textContent = state.selectedUnit;
}

function applyFilters() {
  const uptSelect = document.getElementById('filter-upt');
  const ultgSelect = document.getElementById('filter-ultg');
  const voltSelect = document.getElementById('filter-voltage');

  state.filters.upt = uptSelect ? uptSelect.value : 'all';
  state.filters.ultg = ultgSelect ? ultgSelect.value : 'all';
  state.filters.voltage = voltSelect ? voltSelect.value : 'all';

  updateDetailViewUI();
}

function filterByRiskCategory(category) {
  if (state.activeRiskFilter === category) {
    state.activeRiskFilter = null;
  } else {
    state.activeRiskFilter = category;
  }
  updateDetailViewUI();
}

function switchDimension(dimKey) {
  state.activeDimension = dimKey;
  document.querySelectorAll('.matrix-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.dim === dimKey);
  });
  renderXTicks();
  updateDetailViewUI();
}

function switchDetailViewMode(mode) {
  state.viewMode = mode;
  const matrixDisp = document.getElementById('matrix-display');
  const tableDisp = document.getElementById('table-display');
  const btnMatrix = document.getElementById('btn-view-matrix');
  const btnTable = document.getElementById('btn-view-table');

  if (state.hierarchyLevel === 'asset-detail') {
    hideAssetDetailView();
  }

  if (mode === 'matrix') {
    if (matrixDisp) matrixDisp.style.display = 'flex';
    if (tableDisp) tableDisp.style.display = 'none';
    if (btnMatrix) btnMatrix.classList.add('active');
    if (btnTable) btnTable.classList.remove('active');
    updateDetailViewUI();
  } else {
    if (matrixDisp) matrixDisp.style.display = 'none';
    if (tableDisp) tableDisp.style.display = 'flex';
    if (btnMatrix) btnMatrix.classList.remove('active');
    if (btnTable) btnTable.classList.add('active');
    updateDetailViewUI();
  }
}

function handleTableSearch(val) {
  state.tableSearchQuery = val;
  const items = getActiveLevelItems();
  renderTableRows(items);
}

// ==========================================================================
// 13. VIEW TRANSITIONS (NATIONAL <-> DETAIL)
// ==========================================================================
function openDetailView(unitKey) {
  state.selectedUnit = unitKey || 'UITJBB';
  state.currentView = 'detail';
  state.hierarchyLevel = 'gi';
  state.selectedGI = null;
  state.selectedBay = null;
  state.selectedAsset = null;
  state.selectedSubstationId = null;
  state.activeRiskFilter = null;

  document.getElementById('national-view').style.display = 'none';
  document.getElementById('detail-view').style.display = 'flex';

  populateFilterDropdowns();
  updateBreadcrumb();
  hideAssetDetailView();
  hideBayPopup();
  hideSubstationTooltip();

  setTimeout(() => {
    if (state.unitMap) {
      state.unitMap.invalidateSize();
    }
    updateDetailViewUI();
  }, 100);
}

function showNationalView() {
  state.currentView = 'national';
  state.hierarchyLevel = 'gi';
  state.selectedGI = null;
  state.selectedBay = null;
  state.selectedAsset = null;
  state.selectedSubstationId = null;

  document.getElementById('detail-view').style.display = 'none';
  document.getElementById('national-view').style.display = 'flex';
  hideBayPopup();
  hideSubstationTooltip();

  setTimeout(() => {
    if (state.nationalMap) {
      state.nationalMap.invalidateSize();
      resetToNationalBounds();
    }
  }, 100);
}

function exportDataCSV() {
  const items = getActiveLevelItems();
  if (!items || items.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  const keys = Object.keys(items[0]).filter(k => typeof items[0][k] !== 'object');
  let csvContent = 'data:text/csv;charset=utf-8,' + keys.join(',') + '\n';

  items.forEach(item => {
    const row = keys.map(k => `"${(item[k] !== undefined ? item[k] : '').toString().replace(/"/g, '""')}"`).join(',');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Peta_Risiko_${state.selectedUnit}_${state.hierarchyLevel}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function setupEventListeners() {
  window.addEventListener('resize', () => {
    if (state.currentView === 'national' && state.nationalMap) {
      state.nationalMap.invalidateSize();
    } else if (state.currentView === 'detail' && state.unitMap) {
      state.unitMap.invalidateSize();
    }
  });
}
