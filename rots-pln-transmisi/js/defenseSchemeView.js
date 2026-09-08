/**
 * ROTS PLN TRANSMISI - Defense Scheme & Fasop View Module
 * Mengelola data Defense Scheme (OLS, OGS, UVLS, UFLS, SPS/RAS, dll.)
 * serta integrasi pemetaan peralatan FASOP & Proteksi Sistem.
 * Diadaptasi dan disempurnakan dari prototipe dashboard_proteksi2.html
 */

class DefenseSchemeView {
  constructor() {
    this.storageKeyDS = 'rots_defense_scheme_list';
    this.storageKeyFasop = 'rots_fasop_peralatan_list';
    this.storageKeySistem = 'rots_sistem_list';
    this.storageKeySubsistem = 'rots_subsistem_list';

    this.sistemList = [];
    this.subsistemList = [];
    this.peralatanList = [];
    this.defenseSchemeList = [];

    this.currentMappingTargetRowId = null;
    this.idCounter = 2000;

    this.initData();
  }

  newId() {
    return ++this.idCounter;
  }

  newRowId() {
    return 'skema_' + (++this.idCounter) + '_' + Date.now();
  }

  initData() {
    // 1. Data Sistem
    const savedSistem = localStorage.getItem(this.storageKeySistem);
    if (savedSistem) {
      try { this.sistemList = JSON.parse(savedSistem); } catch (e) { this.sistemList = this.getDefaultSistem(); }
    } else {
      this.sistemList = this.getDefaultSistem();
      this.saveSistem();
    }

    // 2. Data Sub Sistem
    const savedSub = localStorage.getItem(this.storageKeySubsistem);
    if (savedSub) {
      try { this.subsistemList = JSON.parse(savedSub); } catch (e) { this.subsistemList = this.getDefaultSubsistem(); }
    } else {
      this.subsistemList = this.getDefaultSubsistem();
      this.saveSubsistem();
    }

    // 3. Data Peralatan FASOP & Proteksi
    const savedFasop = localStorage.getItem(this.storageKeyFasop);
    if (savedFasop) {
      try { this.peralatanList = JSON.parse(savedFasop); } catch (e) { this.peralatanList = this.getDefaultFasop(); }
    } else {
      this.peralatanList = this.getDefaultFasop();
      this.saveFasop();
    }

    // 4. Data Defense Scheme
    const savedDS = localStorage.getItem(this.storageKeyDS);
    if (savedDS) {
      try { this.defenseSchemeList = JSON.parse(savedDS); } catch (e) { this.defenseSchemeList = this.getDefaultDS(); }
    } else {
      this.defenseSchemeList = this.getDefaultDS();
      this.saveDS();
    }
  }

  getDefaultSistem() {
    return [
      { id: 1, nama: "Jawa Madura Bali (Jamali)", unitInduk: ["UIP2B Jamali", "UIT JBB", "UIT JBT", "UIT JBM"], kapasitas: "49.040 MW" },
      { id: 2, nama: "Sumatera - Bangka", unitInduk: ["P3BS", "UIP3B Sumatera"], kapasitas: "8.500 MW" },
      { id: 3, nama: "Kalimantan Barat (Kalbar)", unitInduk: ["UIP3B Kalimantan", "UP2B Kalbar"], kapasitas: "650 MW" },
      { id: 4, nama: "Kalselteng - Kaltimra (Interkoneksi Kalimantan)", unitInduk: ["UIP3B Kalimantan", "UP2B Kalselteng", "UP2B Kaltimra"], kapasitas: "2.450 MW" },
      { id: 5, nama: "Sulawesi Bagian Selatan (Sulbagsel)", unitInduk: ["UIP3B Sulawesi", "UP2B Sulbagsel"], kapasitas: "2.100 MW" }
    ];
  }

  getDefaultSubsistem() {
    return [
      { id: 1, sistemId: 1, nama: "Sub Sistem Banten - Jabar Barat", unitPelaksana: "UP2B Banten & UP2B Jabar" },
      { id: 2, sistemId: 1, nama: "Sub Sistem DKI Jakarta - Jabar", unitPelaksana: "UP2B DKI & UP2B Jabar" },
      { id: 3, sistemId: 1, nama: "Sub Sistem Jateng - DIY", unitPelaksana: "UP2B Jateng-DIY" },
      { id: 4, sistemId: 1, nama: "Sub Sistem Jatim - Bali", unitPelaksana: "UP2B Jatim & UP2B Bali" },
      { id: 5, sistemId: 2, nama: "Sub Sistem Sumbagut", unitPelaksana: "UP2B Sumbagut" },
      { id: 6, sistemId: 2, nama: "Sub Sistem Sumbagteng - Sumbagsel", unitPelaksana: "UP2B Sumbagteng & UP2B Sumbagsel" },
      { id: 7, sistemId: 3, nama: "Sub Sistem Khatulistiwa", unitPelaksana: "UP2B Kalbar" },
      { id: 8, sistemId: 4, nama: "Sub Sistem Barito", unitPelaksana: "UP2B Kalselteng" },
      { id: 9, sistemId: 4, nama: "Sub Sistem Mahakam", unitPelaksana: "UP2B Kaltimra" }
    ];
  }

  getDefaultFasop() {
    return [
      {
        id: 1,
        jenisIED: "Relay Proteksi OLS",
        unitInduk: "UIP3B Kalimantan",
        unitPelaksana: "UP2B Kalbar",
        ultg: "ULTG Pontianak",
        garduInduk: "GI Siantan 150 kV",
        bay: "Bay Penghantar Cendana 1",
        noPeralatan: "FAS-KAL-001",
        merk: "Alstom",
        type: "Micom P141",
        tahunProduksi: 2018,
        tahunPasang: 2019,
        status: "Aktif"
      },
      {
        id: 2,
        jenisIED: "Master Trip IED",
        unitInduk: "UIP3B Kalimantan",
        unitPelaksana: "UP2B Kalbar",
        ultg: "ULTG Pontianak",
        garduInduk: "GI Siantan 150 kV",
        bay: "Bay Kopel 150 kV",
        noPeralatan: "FAS-KAL-002",
        merk: "Schneider Electric",
        type: "VAMP 255",
        tahunProduksi: 2019,
        tahunPasang: 2020,
        status: "Aktif"
      },
      {
        id: 3,
        jenisIED: "RTU FASOP Scada",
        unitInduk: "UIP3B Kalimantan",
        unitPelaksana: "UP2B Kaltimra",
        ultg: "ULTG Samarinda",
        garduInduk: "GI Mahakam 150 kV",
        bay: "Bay Komunikasi Fasop",
        noPeralatan: "RTU-MHK-01",
        merk: "Siemens",
        type: "SICAM PAS / AK 1703",
        tahunProduksi: 2020,
        tahunPasang: 2021,
        status: "Aktif"
      },
      {
        id: 4,
        jenisIED: "Relay UFLS / Frekuensi",
        unitInduk: "UIP3B Kalimantan",
        unitPelaksana: "UP2B Kalselteng",
        ultg: "ULTG Banjarmasin",
        garduInduk: "GI Barito 150 kV",
        bay: "Bay Trafo 1 60 MVA",
        noPeralatan: "FAS-BRT-004",
        merk: "SEL (Schweitzer)",
        type: "SEL-751A",
        tahunProduksi: 2021,
        tahunPasang: 2022,
        status: "Aktif"
      },
      {
        id: 5,
        jenisIED: "SPS / RAS Controller",
        unitInduk: "UIP2B Jamali",
        unitPelaksana: "UP2B Jabar",
        ultg: "ULTG Bandung Barat",
        garduInduk: "GITET Cirata 500 kV",
        bay: "Bay Interbus Trafo IBT 1",
        noPeralatan: "SPS-JML-501",
        merk: "ABB / Hitachi Energy",
        type: "REC670 / Relion",
        tahunProduksi: 2022,
        tahunPasang: 2022,
        status: "Aktif"
      },
      {
        id: 6,
        jenisIED: "Gateway FASOP & BCU",
        unitInduk: "UIP2B Jamali",
        unitPelaksana: "UP2B Jateng-DIY",
        ultg: "ULTG Semarang",
        garduInduk: "GITET Ungaran 500 kV",
        bay: "Bay Mandirancan 500 kV",
        noPeralatan: "GW-UNG-502",
        merk: "Siemens",
        type: "SICAM A8000",
        tahunProduksi: 2021,
        tahunPasang: 2021,
        status: "Aktif"
      },
      {
        id: 7,
        jenisIED: "Digital Fault Recorder (DFR)",
        unitInduk: "UIP2B Jamali",
        unitPelaksana: "UP2B Jatim",
        ultg: "ULTG Surabaya Barat",
        garduInduk: "GITET Krian 500 kV",
        bay: "Bay Busbar 500 kV",
        noPeralatan: "DFR-KRN-503",
        merk: "Qualitrol",
        type: "BEN 6000",
        tahunProduksi: 2020,
        tahunPasang: 2021,
        status: "Aktif"
      },
      {
        id: 8,
        jenisIED: "UVLS Under Voltage Relay",
        unitInduk: "UIP3B Sumatera",
        unitPelaksana: "UP2B Sumbagut",
        ultg: "ULTG Medan",
        garduInduk: "GI Binjai 150 kV",
        bay: "Bay Penghantar Paya Pasir",
        noPeralatan: "UVLS-BNJ-008",
        merk: "GE Multilin",
        type: "UR-T60",
        tahunProduksi: 2019,
        tahunPasang: 2020,
        status: "Aktif"
      }
    ];
  }

  getDefaultDS() {
    return [
      {
        id: 1,
        lokasi: "Sub Sistem",
        sistemId: 4,
        subsistemId: 8,
        skemas: [
          {
            id: "ds_101",
            type: "OLS",
            nama: "OLS Penghantar Barito - Selat",
            parameter: "Overload",
            lokasi: "GI Barito 150 kV",
            status: "Aktif",
            wiring: "Ready",
            peralatanIds: [4]
          },
          {
            id: "ds_102",
            type: "UFLS",
            nama: "UFLS Tahap 1 Barito (49.3 Hz)",
            parameter: "N-1",
            lokasi: "GI Cempaka 150 kV",
            status: "Aktif",
            wiring: "Ready",
            peralatanIds: [4]
          }
        ]
      },
      {
        id: 2,
        lokasi: "Sub Sistem",
        sistemId: 4,
        subsistemId: 9,
        skemas: [
          {
            id: "ds_201",
            type: "OLS",
            nama: "OLS Mahakam Overload Interkoneksi",
            parameter: "Overload",
            lokasi: "GI Mahakam 150 kV",
            status: "Aktif",
            wiring: "Ready",
            peralatanIds: [3]
          },
          {
            id: "ds_202",
            type: "DTT",
            nama: "Direct Transfer Trip Mahakam - Kuaro",
            parameter: "N-1",
            lokasi: "GI Harapan Baru 150 kV",
            status: "Aktif",
            wiring: "Ready",
            peralatanIds: [3]
          }
        ]
      },
      {
        id: 3,
        lokasi: "Sistem",
        sistemId: 1,
        subsistemId: null,
        skemas: [
          {
            id: "ds_301",
            type: "SPS/RAS",
            nama: "SPS Interkoneksi 500 kV Jalur Utara-Selatan",
            parameter: "N-2",
            lokasi: "GITET Cirata & Ungaran 500 kV",
            status: "Aktif",
            wiring: "Ready",
            peralatanIds: [5, 6, 7]
          },
          {
            id: "ds_302",
            type: "UVLS",
            nama: "UVLS Dynamic Load Shedding DKI-Jabar",
            parameter: "N-1",
            lokasi: "GITET Gandul & Kembangan 500 kV",
            status: "Aktif",
            wiring: "Ready",
            peralatanIds: [5]
          },
          {
            id: "ds_303",
            type: "Island Statis",
            nama: "Skema Island Paiton - Grati (Blackout Prevention)",
            parameter: "N-2",
            lokasi: "GITET Paiton 500 kV",
            status: "Aktif",
            wiring: "Ready",
            peralatanIds: [7]
          }
        ]
      },
      {
        id: 4,
        lokasi: "Sub Sistem",
        sistemId: 3,
        subsistemId: 7,
        skemas: [
          {
            id: "ds_401",
            type: "OLS",
            nama: "OLS Cendana - Siantan",
            parameter: "N-1",
            lokasi: "GI Siantan 150 kV",
            status: "Aktif",
            wiring: "Ready",
            peralatanIds: [1, 2]
          }
        ]
      },
      {
        id: 5,
        lokasi: "Sub Sistem",
        sistemId: 2,
        subsistemId: 5,
        skemas: [
          {
            id: "ds_501",
            type: "UVLS",
            nama: "UVLS Tegangan Rendah Sumbagut (138 kV)",
            parameter: "Overload",
            lokasi: "GI Binjai 150 kV",
            status: "Aktif",
            wiring: "Ready",
            peralatanIds: [8]
          },
          {
            id: "ds_502",
            type: "OGS",
            nama: "OGS Pelepasan Generator PLTU Labuhan Angin",
            parameter: "N-1",
            lokasi: "GI Labuhan Angin 150 kV",
            status: "Tidak Aktif",
            wiring: "Not Ready",
            peralatanIds: []
          }
        ]
      }
    ];
  }

  saveDS() {
    localStorage.setItem(this.storageKeyDS, JSON.stringify(this.defenseSchemeList));
  }

  saveFasop() {
    localStorage.setItem(this.storageKeyFasop, JSON.stringify(this.peralatanList));
  }

  saveSistem() {
    localStorage.setItem(this.storageKeySistem, JSON.stringify(this.sistemList));
  }

  saveSubsistem() {
    localStorage.setItem(this.storageKeySubsistem, JSON.stringify(this.subsistemList));
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // 1. Search filter
    const searchInput = document.getElementById('searchDefenseScheme');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterTable());
    }

    // 2. Dropdown filters
    const filterLokasi = document.getElementById('filterDSLokasi');
    if (filterLokasi) filterLokasi.addEventListener('change', () => this.filterTable());

    const filterType = document.getElementById('filterDSType');
    if (filterType) filterType.addEventListener('change', () => this.filterTable());

    const filterStatus = document.getElementById('filterDSStatus');
    if (filterStatus) filterStatus.addEventListener('change', () => this.filterTable());

    const filterWiring = document.getElementById('filterDSWiring');
    if (filterWiring) filterWiring.addEventListener('change', () => this.filterTable());

    // 3. Tombol Tambah Defense Scheme
    const btnAddDS = document.getElementById('btnOpenDefenseModal');
    if (btnAddDS) {
      btnAddDS.addEventListener('click', () => this.openDefenseModal());
    }

    // 4. Tombol Master FASOP
    const btnFasop = document.getElementById('btnOpenFasopModal');
    if (btnFasop) {
      btnFasop.addEventListener('click', () => this.openFasopModal());
    }

    // 5. Tombol Ekspor DS
    const btnExport = document.getElementById('btnExportDefense');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportDefenseData());
    }

    // 6. Form Tambah/Edit DS
    const formDS = document.getElementById('formDefenseScheme');
    if (formDS) {
      formDS.addEventListener('submit', (e) => this.handleSaveDefense(e));
    }

    // 7. Lokasi Change (Sistem vs Subsistem)
    const selectLokasi = document.getElementById('inputDSLokasi');
    if (selectLokasi) {
      selectLokasi.addEventListener('change', () => this.handleLokasiChange());
    }

    // 8. Sistem Change
    const selectSistem = document.getElementById('inputDSSistem');
    if (selectSistem) {
      selectSistem.addEventListener('change', () => this.handleSistemChange());
    }

    // 9. Tombol Tambah Baris Skema di Modal
    const btnAddSkemaRow = document.getElementById('btnAddSkemaRow');
    if (btnAddSkemaRow) {
      btnAddSkemaRow.addEventListener('click', () => this.addSkemaRow());
    }

    // 10. Close Modal Buttons
    document.querySelectorAll('.btn-close-ds-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // 11. Modal Mapping Peralatan
    const btnSaveMapping = document.getElementById('btnSaveEquipmentMapping');
    if (btnSaveMapping) {
      btnSaveMapping.addEventListener('click', () => this.saveEquipmentMapping());
    }

    const searchMapping = document.getElementById('searchMappingInput');
    if (searchMapping) {
      searchMapping.addEventListener('input', () => this.filterMappingTable());
    }

    const selectAllMapping = document.getElementById('checkAllMapping');
    if (selectAllMapping) {
      selectAllMapping.addEventListener('change', (e) => {
        const checks = document.querySelectorAll('#tableMappingBody input[type="checkbox"]');
        checks.forEach(c => {
          if (c.closest('tr').style.display !== 'none') {
            c.checked = e.target.checked;
          }
        });
      });
    }

    // 12. Modal Master FASOP: Form Tambah Peralatan
    const formNewFasop = document.getElementById('formNewFasop');
    if (formNewFasop) {
      formNewFasop.addEventListener('submit', (e) => this.handleSaveNewFasop(e));
    }

    const btnToggleAddFasop = document.getElementById('btnToggleAddFasop');
    if (btnToggleAddFasop) {
      btnToggleAddFasop.addEventListener('click', () => {
        const box = document.getElementById('boxNewFasopForm');
        if (box) box.classList.toggle('hidden');
      });
    }
  }

  render() {
    this.renderKPIs();
    this.renderTable();
  }

  renderKPIs() {
    const totalLokasi = this.defenseSchemeList.length;
    let totalSkema = 0;
    let totalAktif = 0;
    let totalWiringReady = 0;
    const mappedEquipmentSet = new Set();

    this.defenseSchemeList.forEach(ds => {
      (ds.skemas || []).forEach(sk => {
        totalSkema++;
        if (sk.status === 'Aktif') totalAktif++;
        if (sk.wiring === 'Ready') totalWiringReady++;
        (sk.peralatanIds || []).forEach(pId => mappedEquipmentSet.add(pId));
      });
    });

    const elTotalLokasi = document.getElementById('kpiDsTotalLokasi');
    if (elTotalLokasi) elTotalLokasi.textContent = totalLokasi;

    const elTotalSkema = document.getElementById('kpiDsTotalSkema');
    if (elTotalSkema) elTotalSkema.textContent = `${totalAktif} / ${totalSkema}`;

    const elTotalWiring = document.getElementById('kpiDsTotalWiring');
    if (elTotalWiring) {
      const pct = totalSkema > 0 ? Math.round((totalWiringReady / totalSkema) * 100) : 0;
      elTotalWiring.textContent = `${totalWiringReady} (${pct}%)`;
    }

    const elTotalFasop = document.getElementById('kpiDsTotalFasop');
    if (elTotalFasop) elTotalFasop.textContent = `${mappedEquipmentSet.size} Unit`;
  }

  renderTable() {
    const tbody = document.getElementById('defenseSchemeTableBody');
    const emptyState = document.getElementById('defenseSchemeEmptyState');
    if (!tbody) return;

    if (this.defenseSchemeList.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = this.defenseSchemeList.map((ds, idx) => {
      const sys = this.sistemList.find(s => s.id === ds.sistemId);
      const sub = ds.lokasi === 'Sub Sistem' ? this.subsistemList.find(s => s.id === ds.subsistemId) : null;
      const skemas = ds.skemas || [];
      const totalSkema = skemas.length;

      // Badges skema
      const skemaBadges = skemas.map(sk => {
        const badgeColorClass = this.getSchemeBadgeClass(sk.type);
        const wiringIcon = sk.wiring === 'Ready'
          ? '<i class="fa fa-check-circle" style="color: #10B981;" title="Wiring: Ready"></i>'
          : '<i class="fa fa-exclamation-circle" style="color: #EF4444;" title="Wiring: Not Ready"></i>';
        return `
          <span class="ds-pill-badge ${badgeColorClass}" title="${sk.nama} (${sk.lokasi}) - Kontingensi: ${sk.parameter}">
            ${sk.type} ${wiringIcon}
          </span>
        `;
      }).join(' ');

      // Total peralatan terpetakan
      const allPeralatanIds = new Set();
      skemas.forEach(sk => (sk.peralatanIds || []).forEach(pId => allPeralatanIds.add(pId)));
      const eqCount = allPeralatanIds.size;

      // Status agregat
      const allActive = skemas.length > 0 && skemas.every(s => s.status === 'Aktif');
      const allInactive = skemas.length > 0 && skemas.every(s => s.status === 'Tidak Aktif');
      let statusBadge = '<span class="badge-status badge-normal">AKTIF PENUH</span>';
      if (allInactive) {
        statusBadge = '<span class="badge-status badge-defisit">TIDAK AKTIF</span>';
      } else if (!allActive) {
        statusBadge = '<span class="badge-status badge-siaga">SEBAGIAN</span>';
      }

      const lokasiBadge = ds.lokasi === 'Sistem'
        ? '<span class="badge-lokasi-sistem"><i class="fa fa-network-wired"></i> Sistem</span>'
        : '<span class="badge-lokasi-subsistem"><i class="fa fa-code-branch"></i> Sub Sistem</span>';

      return `
        <tr data-ds-id="${ds.id}" class="ds-table-row">
          <td class="text-center font-semibold text-muted" style="width: 50px;">${idx + 1}</td>
          <td style="width: 130px;">${lokasiBadge}</td>
          <td>
            <strong>${sys ? sys.nama : '-'}</strong>
          </td>
          <td>
            <span class="${sub ? '' : 'text-muted'}">${sub ? sub.nama : '<em>(Seluruh Subsistem)</em>'}</span>
          </td>
          <td>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
              ${skemaBadges || '<span class="text-muted italic" style="font-size: 11px;">Belum ada skema</span>'}
              <span class="text-muted" style="font-size: 11px; margin-left: 4px;">(${totalSkema} Skema)</span>
            </div>
          </td>
          <td class="text-center" style="width: 140px;">
            <span class="ds-fasop-count-badge" title="Peralatan FASOP & Proteksi Terpetakan">
              <i class="fa fa-microchip"></i> ${eqCount} Peralatan
            </span>
          </td>
          <td class="text-center" style="width: 120px;">
            ${statusBadge}
          </td>
          <td class="text-center" style="width: 130px;">
            <div class="table-action-btns">
              <button type="button" class="btn-action-icon btn-action-view" onclick="window.defenseSchemeView.viewDefenseDetail(${ds.id})" title="Lihat Detail Rincian & Peralatan">
                <i class="fa fa-eye"></i>
              </button>
              <button type="button" class="btn-action-icon btn-action-edit" onclick="window.defenseSchemeView.openDefenseModal('Edit Data Defense Scheme', ${ds.id})" title="Edit Defense Scheme">
                <i class="fa fa-edit"></i>
              </button>
              <button type="button" class="btn-action-icon btn-action-delete" onclick="window.defenseSchemeView.deleteDefenseData(${ds.id})" title="Hapus Data">
                <i class="fa fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.filterTable();
  }

  getSchemeBadgeClass(type) {
    switch (type) {
      case 'OLS': return 'ds-badge-ols';
      case 'OGS': return 'ds-badge-ogs';
      case 'UVLS': return 'ds-badge-uvls';
      case 'UFLS': return 'ds-badge-ufls';
      case 'SPS/RAS': return 'ds-badge-sps';
      case 'DTT': return 'ds-badge-dtt';
      case 'Island Statis': return 'ds-badge-island';
      default: return 'ds-badge-default';
    }
  }

  filterTable() {
    const q = (document.getElementById('searchDefenseScheme')?.value || '').toLowerCase().trim();
    const filterLokasi = document.getElementById('filterDSLokasi')?.value || 'ALL';
    const filterType = document.getElementById('filterDSType')?.value || 'ALL';
    const filterStatus = document.getElementById('filterDSStatus')?.value || 'ALL';
    const filterWiring = document.getElementById('filterDSWiring')?.value || 'ALL';

    const rows = document.querySelectorAll('.ds-table-row');
    let visibleCount = 0;

    rows.forEach(row => {
      const dsId = parseInt(row.getAttribute('data-ds-id'));
      const ds = this.defenseSchemeList.find(d => d.id === dsId);
      if (!ds) return;

      const sys = this.sistemList.find(s => s.id === ds.sistemId);
      const sub = ds.subsistemId ? this.subsistemList.find(s => s.id === ds.subsistemId) : null;

      // Text search in row
      const textContent = `${ds.lokasi} ${sys ? sys.nama : ''} ${sub ? sub.nama : ''} ${(ds.skemas || []).map(s => `${s.type} ${s.nama} ${s.lokasi} ${s.parameter}`).join(' ')}`.toLowerCase();
      const matchText = !q || textContent.includes(q);

      // Filter Lokasi
      const matchLokasi = filterLokasi === 'ALL' || ds.lokasi === filterLokasi;

      // Filter Type
      const matchType = filterType === 'ALL' || (ds.skemas || []).some(s => s.type === filterType);

      // Filter Status
      const matchStatus = filterStatus === 'ALL' || (ds.skemas || []).some(s => s.status === filterStatus);

      // Filter Wiring
      const matchWiring = filterWiring === 'ALL' || (ds.skemas || []).some(s => s.wiring === filterWiring);

      if (matchText && matchLokasi && matchType && matchStatus && matchWiring) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const emptyState = document.getElementById('defenseSchemeEmptyState');
    if (emptyState) {
      emptyState.style.display = (visibleCount === 0 && this.defenseSchemeList.length > 0) ? 'block' : 'none';
    }
  }

  // =========================================================================
  // MODAL TAMBAH / EDIT DEFENSE SCHEME
  // =========================================================================
  openDefenseModal(title = 'Tambah Data Defense Scheme', editId = null) {
    const modal = document.getElementById('modalDefenseScheme');
    const form = document.getElementById('formDefenseScheme');
    const titleEl = document.getElementById('modalDefenseSchemeTitle');
    const idInput = document.getElementById('inputDSId');
    const skemasContainer = document.getElementById('dsSkemasContainer');

    if (!modal || !form) return;

    form.reset();
    idInput.value = '';
    skemasContainer.innerHTML = '';
    titleEl.textContent = title;

    this.populateSistemDropdown();

    if (editId) {
      const ds = this.defenseSchemeList.find(d => d.id === editId);
      if (ds) {
        idInput.value = ds.id;
        document.getElementById('inputDSLokasi').value = ds.lokasi;
        this.handleLokasiChange();

        document.getElementById('inputDSSistem').value = ds.sistemId;
        this.handleSistemChange();

        if (ds.lokasi === 'Sub Sistem' && ds.subsistemId) {
          document.getElementById('inputDSSubsistem').value = ds.subsistemId;
        }

        (ds.skemas || []).forEach(sk => this.addSkemaRow(sk));
      }
    } else {
      document.getElementById('inputDSLokasi').value = 'Sub Sistem';
      this.handleLokasiChange();
      // Tambahkan 1 baris skema default
      this.addSkemaRow();
    }

    modal.classList.add('active');
  }

  populateSistemDropdown() {
    const sel = document.getElementById('inputDSSistem');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Pilih Sistem Tenaga Listrik --</option>' +
      this.sistemList.map(s => `<option value="${s.id}">${s.nama} (${s.kapasitas || ''})</option>`).join('');
  }

  handleLokasiChange() {
    const lokasi = document.getElementById('inputDSLokasi')?.value;
    const subContainer = document.getElementById('containerDSSubsistem');
    const subSelect = document.getElementById('inputDSSubsistem');

    if (lokasi === 'Sistem') {
      if (subContainer) subContainer.style.opacity = '0.35';
      if (subSelect) {
        subSelect.disabled = true;
        subSelect.removeAttribute('required');
        subSelect.value = '';
      }
    } else {
      if (subContainer) subContainer.style.opacity = '1';
      if (subSelect) {
        subSelect.disabled = false;
        subSelect.setAttribute('required', 'required');
      }
    }
  }

  handleSistemChange() {
    const sistemId = parseInt(document.getElementById('inputDSSistem')?.value);
    const subSelect = document.getElementById('inputDSSubsistem');
    if (!subSelect) return;

    subSelect.innerHTML = '<option value="">-- Pilih Sub Sistem --</option>';
    if (!isNaN(sistemId)) {
      const filtered = this.subsistemList.filter(s => s.sistemId === sistemId);
      filtered.forEach(s => {
        subSelect.innerHTML += `<option value="${s.id}">${s.nama} (${s.unitPelaksana || ''})</option>`;
      });
    }
  }

  addSkemaRow(data = {}) {
    const rowId = data.id || this.newRowId();
    const d = Object.assign({
      type: 'OLS',
      nama: '',
      parameter: 'N-1',
      lokasi: '',
      status: 'Aktif',
      wiring: 'Ready',
      peralatanIds: []
    }, data);

    const cont = document.getElementById('dsSkemasContainer');
    if (!cont) return;

    const schemeOptions = ['OLS', 'OGS', 'UVLS', 'OVTS', 'UFLS', 'OFGS', 'SPS/RAS', 'DTT', 'Island Statis'];
    const paramOptions = ['Overload', 'N-1', 'N-2'];
    const mappedCount = (d.peralatanIds || []).length;
    const btnMapText = mappedCount > 0 ? `Mapped (${mappedCount})` : 'Map Fasop';

    const rowHtml = `
      <div id="skema-row-${rowId}" class="ds-builder-row">
        <input type="hidden" id="skema-peralatan-${rowId}" value='${JSON.stringify(d.peralatanIds || [])}'>

        <div class="ds-row-grid">
          <div style="flex: 1; min-width: 110px;">
            <label class="ds-form-label">Kode Skema</label>
            <select id="skema-type-${rowId}" class="form-control form-control-sm" required>
              ${schemeOptions.map(o => `<option value="${o}" ${d.type === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>

          <div style="flex: 2; min-width: 160px;">
            <label class="ds-form-label">Nama Skema Proteksi</label>
            <input type="text" id="skema-nama-${rowId}" class="form-control form-control-sm" value="${d.nama || ''}" placeholder="misal: OLS Cendana 150 kV" required>
          </div>

          <div style="flex: 1; min-width: 100px;">
            <label class="ds-form-label">Kontingensi</label>
            <select id="skema-param-${rowId}" class="form-control form-control-sm" required>
              ${paramOptions.map(p => `<option value="${p}" ${d.parameter === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>

          <div style="flex: 2; min-width: 150px;">
            <label class="ds-form-label">Lokasi / Kerawanan (GI/Bay)</label>
            <input type="text" id="skema-lokasi-${rowId}" class="form-control form-control-sm" value="${d.lokasi || ''}" placeholder="misal: GI SIANTAN Bay 1" required>
          </div>

          <div style="flex: 1; min-width: 90px;">
            <label class="ds-form-label">Status DS</label>
            <select id="skema-status-${rowId}" class="form-control form-control-sm">
              <option value="Aktif" ${d.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
              <option value="Tidak Aktif" ${d.status === 'Tidak Aktif' ? 'selected' : ''}>Tidak Aktif</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 95px;">
            <label class="ds-form-label">Wiring Diagram</label>
            <select id="skema-wiring-${rowId}" class="form-control form-control-sm">
              <option value="Ready" ${d.wiring === 'Ready' ? 'selected' : ''}>Ready</option>
              <option value="Not Ready" ${d.wiring === 'Not Ready' ? 'selected' : ''}>Not Ready</option>
            </select>
          </div>

          <div style="display: flex; gap: 6px; align-items: flex-end; padding-bottom: 2px;">
            <button type="button" class="header-btn btn-sm btn-map-fasop" onclick="window.defenseSchemeView.openEquipmentMapping('${rowId}')" title="Petakan Peralatan FASOP & Proteksi">
              <i class="fa fa-link"></i> <span id="btn-map-text-${rowId}">${btnMapText}</span>
            </button>
            <button type="button" class="header-btn btn-sm btn-delete-row" onclick="window.defenseSchemeView.removeSkemaRow('${rowId}')" title="Hapus Baris Skema">
              <i class="fa fa-trash-alt" style="color: #EF4444;"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    cont.insertAdjacentHTML('beforeend', rowHtml);
  }

  removeSkemaRow(rowId) {
    const row = document.getElementById(`skema-row-${rowId}`);
    if (row) row.remove();
    const cont = document.getElementById('dsSkemasContainer');
    if (cont && cont.children.length === 0) {
      this.addSkemaRow();
    }
  }

  handleSaveDefense(e) {
    e.preventDefault();
    const idVal = document.getElementById('inputDSId')?.value;
    const lokasi = document.getElementById('inputDSLokasi')?.value;
    const sistemId = parseInt(document.getElementById('inputDSSistem')?.value);
    const subVal = document.getElementById('inputDSSubsistem')?.value;
    const subsistemId = subVal ? parseInt(subVal) : null;

    if (!sistemId || isNaN(sistemId)) {
      this.showToast('Pilih Sistem Tenaga Listrik terlebih dahulu!', 'danger');
      return;
    }
    if (lokasi === 'Sub Sistem' && !subsistemId) {
      this.showToast('Pilih Sub Sistem terlebih dahulu!', 'danger');
      return;
    }

    const skemaRows = Array.from(document.getElementById('dsSkemasContainer')?.children || []);
    if (skemaRows.length === 0) {
      this.showToast('Tambahkan minimal satu skema proteksi!', 'danger');
      return;
    }

    const skemas = skemaRows.map(row => {
      const rowId = row.id.replace('skema-row-', '');
      return {
        id: rowId,
        type: document.getElementById(`skema-type-${rowId}`)?.value || 'OLS',
        nama: document.getElementById(`skema-nama-${rowId}`)?.value.trim() || '',
        parameter: document.getElementById(`skema-param-${rowId}`)?.value || 'N-1',
        lokasi: document.getElementById(`skema-lokasi-${rowId}`)?.value.trim() || '',
        status: document.getElementById(`skema-status-${rowId}`)?.value || 'Aktif',
        wiring: document.getElementById(`skema-wiring-${rowId}`)?.value || 'Ready',
        peralatanIds: JSON.parse(document.getElementById(`skema-peralatan-${rowId}`)?.value || '[]')
      };
    });

    const payload = { lokasi, sistemId, subsistemId, skemas };

    if (idVal) {
      const targetId = parseInt(idVal);
      const idx = this.defenseSchemeList.findIndex(d => d.id === targetId);
      if (idx !== -1) {
        this.defenseSchemeList[idx] = { id: targetId, ...payload };
        this.showToast('Data Defense Scheme berhasil diperbarui!', 'success');
      }
    } else {
      this.defenseSchemeList.unshift({ id: this.newId(), ...payload });
      this.showToast('Data Defense Scheme baru berhasil ditambahkan!', 'success');
    }

    this.saveDS();
    this.render();

    const modal = document.getElementById('modalDefenseScheme');
    if (modal) modal.classList.remove('active');
  }

  deleteDefenseData(id) {
    const ds = this.defenseSchemeList.find(d => d.id === id);
    if (!ds) return;
    const sys = this.sistemList.find(s => s.id === ds.sistemId);
    const label = `${ds.lokasi} - ${sys ? sys.nama : ''}`;

    if (confirm(`Apakah Anda yakin ingin menghapus data Defense Scheme (${label})?`)) {
      this.defenseSchemeList = this.defenseSchemeList.filter(d => d.id !== id);
      this.saveDS();
      this.render();
      this.showToast(`Defense Scheme ${label} berhasil dihapus!`, 'danger');
    }
  }

  // =========================================================================
  // MODAL DETAIL DEFENSE SCHEME
  // =========================================================================
  viewDefenseDetail(id) {
    const ds = this.defenseSchemeList.find(d => d.id === id);
    if (!ds) return;

    const sys = this.sistemList.find(s => s.id === ds.sistemId);
    const sub = ds.lokasi === 'Sub Sistem' ? this.subsistemList.find(s => s.id === ds.subsistemId) : null;
    const modal = document.getElementById('modalDefenseDetail');
    const content = document.getElementById('defenseDetailContent');
    if (!modal || !content) return;

    const skemasHtml = (ds.skemas || []).map((sk, i) => {
      const eqList = (sk.peralatanIds || []).map(pId => {
        const p = this.peralatanList.find(x => x.id === pId);
        if (!p) return null;
        return `
          <li style="margin-bottom: 4px;">
            <strong>[${p.jenisIED}]</strong> ${p.garduInduk} - ${p.bay} (No: ${p.noPeralatan} | ${p.merk} ${p.type})
          </li>
        `;
      }).filter(Boolean).join('');

      return `
        <div class="ds-detail-skema-card">
          <div class="ds-detail-skema-head">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="ds-pill-badge ${this.getSchemeBadgeClass(sk.type)}">${sk.type}</span>
              <strong>${i + 1}. ${sk.nama}</strong>
            </div>
            <div style="display: flex; gap: 6px;">
              <span class="badge-status ${sk.status === 'Aktif' ? 'badge-normal' : 'badge-defisit'}">${sk.status}</span>
              <span class="badge-status ${sk.wiring === 'Ready' ? 'badge-normal' : 'badge-siaga'}">Wiring: ${sk.wiring}</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 12px; margin: 10px 0; color: #475569;">
            <div><span class="text-muted block">Kontingensi:</span> <strong>${sk.parameter}</strong></div>
            <div><span class="text-muted block">Lokasi GI / Kerawanan:</span> <strong>${sk.lokasi}</strong></div>
            <div><span class="text-muted block">Peralatan Terpetakan:</span> <strong>${(sk.peralatanIds || []).length} Unit</strong></div>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px; font-size: 11.5px;">
            <strong style="color: #1E40AF; display: block; margin-bottom: 4px;">
              <i class="fa fa-microchip"></i> Peralatan FASOP & Proteksi Terintegrasi:
            </strong>
            ${eqList ? `<ul style="padding-left: 18px; margin: 0;">${eqList}</ul>` : '<em class="text-muted">Belum ada peralatan proteksi yang dipetakan ke skema ini.</em>'}
          </div>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div style="border-bottom: 1px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">LEVEL LOKASI DEFENSE SCHEME</span>
          <h3 style="font-size: 18px; font-weight: 800; color: #0F172A; margin-top: 2px;">
            ${ds.lokasi} – ${sys ? sys.nama : '-'} ${sub ? `(${sub.nama})` : ''}
          </h3>
        </div>
        <span class="ds-fasop-count-badge" style="font-size: 12px;">ID: ${ds.id}</span>
      </div>

      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 10px;">
          <i class="fa fa-shield-alt" style="color: #0284C7;"></i> Daftar Skema Proteksi Terpasang (${(ds.skemas || []).length} Skema)
        </h4>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${skemasHtml || '<p class="text-muted italic">Tidak ada skema terdaftar.</p>'}
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  // =========================================================================
  // MODAL PEMETAAN PERALATAN FASOP & PROTEKSI
  // =========================================================================
  openEquipmentMapping(rowId) {
    this.currentMappingTargetRowId = rowId;
    const modal = document.getElementById('modalEquipmentMapping');
    const tbody = document.getElementById('tableMappingBody');
    const hiddenInput = document.getElementById(`skema-peralatan-${rowId}`);

    if (!modal || !tbody) return;

    const currentIds = hiddenInput ? JSON.parse(hiddenInput.value || '[]') : [];

    tbody.innerHTML = this.peralatanList.map(p => {
      const isChecked = currentIds.includes(p.id);
      return `
        <tr class="mapping-row" data-eq-id="${p.id}">
          <td class="text-center" style="width: 40px;">
            <input type="checkbox" value="${p.id}" ${isChecked ? 'checked' : ''} class="checkbox-eq-item">
          </td>
          <td><strong>${p.jenisIED}</strong></td>
          <td>${p.garduInduk}</td>
          <td><span class="badge-status badge-siaga">${p.bay}</span></td>
          <td style="font-family: monospace; font-size: 11px;">${p.noPeralatan}</td>
          <td>${p.merk} ${p.type}</td>
          <td class="text-center">${p.tahunPasang || p.tahunProduksi || '-'}</td>
        </tr>
      `;
    }).join('');

    modal.classList.add('active');
  }

  filterMappingTable() {
    const q = (document.getElementById('searchMappingInput')?.value || '').toLowerCase();
    const rows = document.querySelectorAll('.mapping-row');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  }

  saveEquipmentMapping() {
    if (!this.currentMappingTargetRowId) return;
    const rowId = this.currentMappingTargetRowId;
    const checks = document.querySelectorAll('#tableMappingBody .checkbox-eq-item:checked');
    const selectedIds = Array.from(checks).map(c => parseInt(c.value));

    const hiddenInput = document.getElementById(`skema-peralatan-${rowId}`);
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(selectedIds);
    }

    const btnTextSpan = document.getElementById(`btn-map-text-${rowId}`);
    if (btnTextSpan) {
      btnTextSpan.textContent = selectedIds.length > 0 ? `Mapped (${selectedIds.length})` : 'Map Fasop';
    }

    const modal = document.getElementById('modalEquipmentMapping');
    if (modal) modal.classList.remove('active');

    this.showToast(`Pemetaan berhasil: ${selectedIds.length} peralatan dipilih.`, 'success');
  }

  // =========================================================================
  // MODAL MASTER PERALATAN FASOP
  // =========================================================================
  openFasopModal() {
    const modal = document.getElementById('modalFasopMaster');
    if (!modal) return;
    this.renderFasopMasterTable();
    modal.classList.add('active');
  }

  renderFasopMasterTable() {
    const tbody = document.getElementById('tableFasopMasterBody');
    if (!tbody) return;

    tbody.innerHTML = this.peralatanList.map((p, idx) => `
      <tr>
        <td class="text-center text-muted">${idx + 1}</td>
        <td><strong>${p.jenisIED}</strong></td>
        <td>${p.garduInduk}</td>
        <td>${p.bay}</td>
        <td style="font-family: monospace; font-size: 11px;">${p.noPeralatan}</td>
        <td>${p.merk} ${p.type}</td>
        <td>${p.unitInduk} (${p.unitPelaksana})</td>
        <td class="text-center">
          <span class="badge-status ${p.status === 'Aktif' ? 'badge-normal' : 'badge-defisit'}">${p.status}</span>
        </td>
      </tr>
    `).join('');
  }

  handleSaveNewFasop(e) {
    e.preventDefault();
    const jenis = document.getElementById('newFasopJenis')?.value.trim();
    const gi = document.getElementById('newFasopGI')?.value.trim();
    const bay = document.getElementById('newFasopBay')?.value.trim();
    const noPeralatan = document.getElementById('newFasopNo')?.value.trim();
    const merk = document.getElementById('newFasopMerk')?.value.trim();
    const type = document.getElementById('newFasopType')?.value.trim();
    const unitInduk = document.getElementById('newFasopUnitInduk')?.value.trim() || 'PLN Transmisi';
    const unitPelaksana = document.getElementById('newFasopUPT')?.value.trim() || 'UP2B / UPT';
    const tahun = parseInt(document.getElementById('newFasopTahun')?.value) || 2024;

    if (!jenis || !gi || !bay) {
      this.showToast('Lengkapi jenis peralatan, GI, dan Bay!', 'danger');
      return;
    }

    const newEq = {
      id: this.newId(),
      jenisIED: jenis,
      unitInduk,
      unitPelaksana,
      ultg: '-',
      garduInduk: gi,
      bay,
      noPeralatan: noPeralatan || `FAS-${Date.now().toString().slice(-4)}`,
      merk: merk || 'Generic',
      type: type || 'Standard',
      tahunProduksi: tahun,
      tahunPasang: tahun,
      status: 'Aktif'
    };

    this.peralatanList.unshift(newEq);
    this.saveFasop();
    this.renderFasopMasterTable();
    this.renderKPIs();

    const box = document.getElementById('boxNewFasopForm');
    if (box) box.classList.add('hidden');
    document.getElementById('formNewFasop')?.reset();

    this.showToast(`Peralatan FASOP ${jenis} (${gi}) berhasil ditambahkan!`, 'success');
  }

  // =========================================================================
  // EKSPOR DATA DEFENSE SCHEME (EXCEL / CSV)
  // =========================================================================
  exportDefenseData() {
    const rows = [];
    rows.push(['No', 'Level Lokasi', 'Sistem', 'Sub Sistem', 'Tipe Skema', 'Nama Skema', 'Kontingensi', 'Lokasi GI/Bay', 'Status DS', 'Wiring Diagram', 'Jumlah Peralatan FASOP', 'Rincian Peralatan FASOP']);

    let count = 1;
    this.defenseSchemeList.forEach(ds => {
      const sys = this.sistemList.find(s => s.id === ds.sistemId);
      const sub = ds.lokasi === 'Sub Sistem' ? this.subsistemList.find(s => s.id === ds.subsistemId) : null;

      (ds.skemas || []).forEach(sk => {
        const eqNames = (sk.peralatanIds || []).map(pId => {
          const p = this.peralatanList.find(x => x.id === pId);
          return p ? `${p.jenisIED} (${p.garduInduk})` : null;
        }).filter(Boolean).join('; ');

        rows.push([
          count++,
          ds.lokasi,
          sys ? sys.nama : '',
          sub ? sub.nama : '',
          sk.type,
          sk.nama,
          sk.parameter,
          sk.lokasi,
          sk.status,
          sk.wiring,
          (sk.peralatanIds || []).length,
          eqNames
        ]);
      });
    });

    if (window.XLSX) {
      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "DefenseScheme");
      window.XLSX.writeFile(wb, `Defense_Scheme_PLN_Operasi_Sistem_${new Date().toISOString().slice(0, 10)}.xlsx`);
      this.showToast('Data Defense Scheme berhasil diekspor ke Excel!', 'success');
    } else {
      const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(x => `"${x}"`).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Defense_Scheme_PLN_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast('Data Defense Scheme berhasil diekspor ke CSV!', 'success');
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'danger') icon = 'exclamation-circle';

    toast.innerHTML = `
      <i class="fa fa-${icon}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

export const defenseSchemeView = new DefenseSchemeView();
window.defenseSchemeView = defenseSchemeView;
