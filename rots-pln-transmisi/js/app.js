/**
 * ROTS PLN TRANSMISI - Main Application Controller
 * Menghubungkan seluruh modul tampilan, store data, router navigasi, filter global, dan modal.
 */

import { CalculationService } from './calculation.js?v=8';
import { store } from './store.js?v=8';
import { chartService } from './charts.js?v=8';
import { dailyView } from './dailyView.js?v=8';
import { outageView } from './outageView.js?v=8';
import { parameterView } from './parameterView.js?v=8';
import { importExportService } from './importExport.js?v=8';

class RotsApp {
  constructor() {
    this.store = store;
    this.chartService = chartService;
    this.dailyView = dailyView;
    this.outageView = outageView;
    this.parameterView = parameterView;
    this.importExport = importExportService;
  }

  init() {
    this.bindGlobalNavigation();
    this.bindFilterBar();
    this.bindModals();
    this.bindRealisasiModal();
    this.bindQuickUploadRealisasiModal();
    this.bindInputRencanaModal();
    this.bindUploadRencanaModal();
    this.bindCatalogModal();

    this.dailyView.init();
    this.outageView.init();
    this.parameterView.init();
    this.importExport.init();

    // Subscribe to store updates
    this.store.subscribe((event) => {
      this.handleStoreEvent(event);
    });

    // Check initial hash route before rendering
    const initialHash = window.location.hash.replace('#', '').trim();
    if (initialHash && document.getElementById(`view-${initialHash}`)) {
      this.switchView(initialHash);
    } else {
      this.switchView('dashboard');
    }
    this.updateThresholdBadges();
  }

  handleStoreEvent(event) {
    if (
      event.type === 'PARAMETER_UPDATED' ||
      event.type === 'FILTERS_CHANGED' ||
      event.type === 'STORE_RESET' ||
      event.type === 'VIEW_MODE_CHANGED' ||
      event.type === 'REALISASI_UPDATED' ||
      event.type === 'REALISASI_DELETED' ||
      event.type === 'REALISASI_IMPORTED' ||
      event.type === 'PLAN_RECORD_UPDATED' ||
      event.type === 'PLAN_RECORDS_IMPORTED' ||
      event.type === 'PLANNING_PERIOD_CHANGED'
    ) {
      // Update badge tanggal dan dropdown periode jika ada perubahan periode
      if (event.type === 'PLANNING_PERIOD_CHANGED' || event.type === 'FILTERS_CHANGED') {
        const { dateStart, dateEnd } = this.store.filters;
        const rangeBadge = document.getElementById('displayDateRange');
        if (rangeBadge && dateStart && dateEnd) {
          const fmt = (d) => {
            const p = d.split('-');
            const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            return `${parseInt(p[2])} ${months[parseInt(p[1])]} ${p[0]}`;
          };
          rangeBadge.textContent = `${fmt(dateStart)} - ${fmt(dateEnd)}`;
        }
        const pType = this.store.planningPeriod.type || 'ROTS';
        const pVal = this.store.planningPeriod.value;
        this.updatePeriodBadge(pType);
        this.populatePeriodValues(pType);
        const selVal = document.getElementById('filterPeriodValueSelect');
        if (selVal && pVal) selVal.value = pVal;

        // Sync threshold badge (cadMin bisa berubah per periode)
        this.updateThresholdBadges();
      }
      // Dapatkan view yang sedang aktif langsung dari DOM agar sinkron 100%
      const activeSec = document.querySelector('.view-section.active');
      const current = activeSec ? activeSec.id.replace('view-', '') : (this.store.currentView || 'dashboard');
      this.store.currentView = current;

      if (current === 'dashboard') {
        this.renderDashboard();
      } else if (current === 'kondisi-harian') {
        this.dailyView.render();
      } else if (current === 'rencana-outage') {
        this.outageView.render();
      } else if (current === 'parameter') {
        this.parameterView.render();
      }
      this.updateThresholdBadges();
    } else if (event.type === 'SELECTED_DATE_CHANGED') {
      this.updateDaySpecificWidgets();
    } else if (event.type === 'VIEW_CHANGED') {
      this.switchView(event.payload);
    } else if (event.type === 'SYSTEMS_UPDATED') {
      this.populateSystemSelect();
      this.parameterView.renderSystems();
    }
  }

  bindGlobalNavigation() {
    const navLinks = document.querySelectorAll('[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.getAttribute('data-view');
        if (viewId) {
          window.location.hash = viewId;
          this.store.setCurrentView(viewId);
        }
      });
    });

    // Donut chart "Lihat Detail Harian ->" link
    const linkDetailHarian = document.getElementById('linkLihatDetailHarian');
    if (linkDetailHarian) {
      linkDetailHarian.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = 'kondisi-harian';
        this.store.setCurrentView('kondisi-harian');
      });
    }

    // URL Hash Routing Support (#kondisi-harian, #dashboard, etc.)
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && document.getElementById(`view-${hash}`)) {
        this.store.setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    // Jalankan saat pertama kali halaman dimuat jika ada hash
    setTimeout(handleHash, 50);
  }

  switchView(viewId) {
    this.store.currentView = viewId;

    // Sync URL hash
    if (window.location.hash.replace('#', '') !== viewId) {
      window.location.hash = viewId;
    }

    // Update active nav in top navbar and sidebar
    document.querySelectorAll('[data-view]').forEach(link => {
      if (link.getAttribute('data-view') === viewId) {
        link.classList.add('active');
        if (link.parentElement && link.parentElement.classList.contains('sidebar-item')) {
          link.parentElement.classList.add('active');
        }
      } else {
        link.classList.remove('active');
        if (link.parentElement && link.parentElement.classList.contains('sidebar-item')) {
          link.parentElement.classList.remove('active');
        }
      }
    });

    // Update page title in subheader
    const titleMap = {
      'dashboard': 'ROTS – Rencana Operasi Tahunan Semester',
      'kondisi-harian': 'Kondisi Harian Sistem Kelistrikan',
      'rencana-outage': 'Rencana Pemeliharaan & Outage',
      'ringkasan-bulanan': 'Ringkasan & Evaluasi Bulanan',
      'detail-pembangkit': 'Detail Kapasitas Unit Pembangkit & Transmisi',
      'parameter': 'Parameter & Pengaturan Ambang Batas',
      'master-data': 'Master Data Sistem Tenaga Listrik',
      'import-data': 'Impor Data Excel & Template ROTS',
      'laporan': 'Pusat Laporan & Cetak PDF Resmi',
      'pengaturan': 'Pengaturan Sistem ROTS'
    };
    const titleEl = document.getElementById('pageTitleText');
    if (titleEl && titleMap[viewId]) {
      titleEl.textContent = titleMap[viewId];
    }

    // Update visible view container
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${viewId}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Refresh charts if entering dashboard or outage view
    if (viewId === 'dashboard') {
      this.renderDashboard();
    } else if (viewId === 'rencana-outage') {
      this.outageView.render();
    } else if (viewId === 'kondisi-harian') {
      this.dailyView.render();
    } else if (viewId === 'parameter') {
      this.parameterView.render();
    }
  }

  // Helper: isi dropdown nilai periode di dashboard
  populatePeriodValues(type) {
    const selectPeriodValue = document.getElementById('filterPeriodValueSelect');
    if (!selectPeriodValue) return;
    const options = this.store.getAvailablePeriodValues(type);
    selectPeriodValue.innerHTML = options
      .map(o => `<option value="${o.value}">${o.label}</option>`)
      .join('');
  }

  // Helper: update badge + title + horizon pills + view mode label
  updatePeriodBadge(type) {
    const badge = document.getElementById('activePeriodTypeBadge');
    if (badge) {
      badge.textContent = type;
      badge.className = `period-type-badge period-badge-${type}`;
    }
    const titleEl = document.getElementById('pageTitleText');
    const titleMap = {
      ROT:  'ROT \u2013 Rencana Operasi Tahunan',
      ROTS: 'ROTS \u2013 Rencana Operasi Tahunan Semester',
      ROB:  'ROB \u2013 Rencana Operasi Bulanan',
      ROM:  'ROM \u2013 Rencana Operasi Mingguan'
    };
    if (titleEl) titleEl.textContent = titleMap[type] || 'ROTS';

    // Update label tombol Mode Rencana (agar dinamis: Rencana (ROB), Rencana (ROT), dll)
    const pillModeLabel = document.getElementById('pillModeRencanaLabel');
    if (pillModeLabel) pillModeLabel.textContent = `Rencana (${type})`;

    // Update pills di top global filter bar
    const globalPills = document.querySelectorAll('#globalHorizonPillGroup .horizon-pill');
    globalPills.forEach(p => {
      if (p.getAttribute('data-type') === type) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  bindFilterBar() {
    this.populateSystemSelect();

    // View Mode Switcher Pills (Rencana / Realisasi / Komparasi)
    const modePills = document.querySelectorAll('.view-mode-pill');
    modePills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = pill.getAttribute('data-mode');
        modePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.store.setViewMode(mode);
      });
    });

    const selectSystem = document.getElementById('filterSystemSelect');
    if (selectSystem) {
      selectSystem.addEventListener('change', (e) => {
        this.store.setFilters({ sistem: e.target.value });
      });
    }

    // ── Dropdown Jenis Periode (ROT / ROTS / ROB / ROM) ──────────
    const selectPeriodType = document.getElementById('filterPeriodTypeSelect');
    const selectPeriodValue = document.getElementById('filterPeriodValueSelect');

    // Event delegation untuk Pill Tingkat Rencana di Global Filter Bar (ROT / ROTS / ROB / ROM)
    const globalPillsGroup = document.getElementById('globalHorizonPillGroup');
    if (globalPillsGroup) {
      globalPillsGroup.addEventListener('click', (e) => {
        const pill = e.target.closest('.horizon-pill');
        if (!pill) return;
        const type = pill.getAttribute('data-type');
        if (!type) return;
        if (selectPeriodType) selectPeriodType.value = type;
        this.populatePeriodValues(type);
        const firstValue = this.store.getAvailablePeriodValues(type)[0]?.value;
        if (firstValue) {
          this.store.setPlanningPeriod(type, firstValue);
        }
        this.updatePeriodBadge(type);
      });
    }

    if (selectPeriodType) {
      selectPeriodType.addEventListener('change', (e) => {
        const type = e.target.value;
        this.populatePeriodValues(type);
        const firstValue = this.store.getAvailablePeriodValues(type)[0]?.value;
        if (firstValue) {
          this.store.setPlanningPeriod(type, firstValue);
        }
        this.updatePeriodBadge(type);
      });
    }

    if (selectPeriodValue) {
      selectPeriodValue.addEventListener('change', (e) => {
        const type = selectPeriodType ? selectPeriodType.value : this.store.planningPeriod.type;
        this.store.setPlanningPeriod(type, e.target.value);
      });
    }

    // Inisialisasi awal: isi dropdown nilai sesuai ROTS
    this.populatePeriodValues('ROTS');
    this.updatePeriodBadge('ROTS');

    // Tombol Layar Penuh Seluruh Aplikasi (Topbar)
    const btnAppFs = document.getElementById('btnAppWindowFullscreen');
    if (btnAppFs) {
      btnAppFs.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          btnAppFs.innerHTML = '<i class="fa fa-compress-arrows-alt"></i> <span>Keluar Penuh</span>';
        } else {
          document.exitFullscreen().catch(() => {});
          btnAppFs.innerHTML = '<i class="fa fa-expand-arrows-alt"></i> <span>Layar Penuh</span>';
        }
      });
    }

    // Quick edit threshold button
    const quickThresholdBtn = document.getElementById('quickEditThresholdBadge');
    if (quickThresholdBtn) {
      quickThresholdBtn.addEventListener('click', () => {
        this.openQuickThresholdModal();
      });
    }

    // Tombol Expand Neraca Daya ROTS
    const btnExpandNeraca = document.getElementById('btnExpandNeracaDaya');
    if (btnExpandNeraca) {
      btnExpandNeraca.addEventListener('click', () => {
        this.openFullscreenChartModal('neraca');
      });
    }

    // Tombol Expand Trend Cadangan Daya
    const btnExpandTrend = document.getElementById('btnExpandTrend');
    if (btnExpandTrend) {
      btnExpandTrend.addEventListener('click', () => {
        this.openFullscreenChartModal('cadangan');
      });
    }

    // Switcher Tab di Fullscreen Modal (Neraca Daya vs Trend Cadangan)
    const btnFsTabNeraca = document.getElementById('btnFsTabNeraca');
    const btnFsTabCadangan = document.getElementById('btnFsTabCadangan');

    if (btnFsTabNeraca && btnFsTabCadangan) {
      btnFsTabNeraca.addEventListener('click', () => {
        btnFsTabNeraca.classList.add('active');
        btnFsTabCadangan.classList.remove('active');
        document.getElementById('fsContainerNeraca').style.display = 'block';
        document.getElementById('fsContainerCadangan').style.display = 'none';
        this.activeFullscreenChartType = 'neraca';
        this.renderFullscreenContent();
      });

      btnFsTabCadangan.addEventListener('click', () => {
        btnFsTabCadangan.classList.add('active');
        btnFsTabNeraca.classList.remove('active');
        document.getElementById('fsContainerCadangan').style.display = 'block';
        document.getElementById('fsContainerNeraca').style.display = 'none';
        this.activeFullscreenChartType = 'cadangan';
        this.renderFullscreenContent();
      });
    }

    // Navigasi Bulan di Fullscreen Modal
    const selectFsMonth = document.getElementById('selectFsMonth');
    const btnFsPrev = document.getElementById('btnFsPrevMonth');
    const btnFsNext = document.getElementById('btnFsNextMonth');

    if (selectFsMonth) {
      selectFsMonth.addEventListener('change', () => {
        this.renderFullscreenContent();
      });
    }

    if (btnFsPrev && selectFsMonth) {
      btnFsPrev.addEventListener('click', () => {
        if (selectFsMonth.selectedIndex > 0) {
          selectFsMonth.selectedIndex--;
          this.renderFullscreenContent();
        }
      });
    }

    if (btnFsNext && selectFsMonth) {
      btnFsNext.addEventListener('click', () => {
        if (selectFsMonth.selectedIndex < selectFsMonth.options.length - 1) {
          selectFsMonth.selectedIndex++;
          this.renderFullscreenContent();
        }
      });
    }

    // Download PNG dari Fullscreen Modal
    const btnDownloadImg = document.getElementById('btnDownloadTrendImage');
    if (btnDownloadImg) {
      btnDownloadImg.addEventListener('click', () => {
        const sys = this.store.filters.sistem;
        const activeCanvas = this.activeFullscreenChartType === 'neraca' 
          ? 'neracaDayaCanvasFullscreen' 
          : 'trendCadanganCanvasFullscreen';
        const prefix = this.activeFullscreenChartType === 'neraca' ? 'Neraca_Daya' : 'Trend_CAD';
        this.chartService.exportChartImage(activeCanvas, `ROTS_${prefix}_${sys}_LayarPenuh.png`);
      });
    }

    // Keyboard shortcut Esc to close any active modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });
  }

  populateSystemSelect() {
    const select = document.getElementById('filterSystemSelect');
    if (!select) return;

    const curVal = this.store.filters.sistem;
    select.innerHTML = this.store.systems
      .filter(s => s.active)
      .map(s => `<option value="${s.code}" ${s.code === curVal ? 'selected' : ''}>${s.code}</option>`)
      .join('');
  }

  updateThresholdBadges() {
    const val = this.store.params.minReserveThreshold;
    const formatted = CalculationService.formatNumber(val, 0) + ' MW';

    const headerBadge = document.getElementById('headerThresholdVal');
    if (headerBadge) headerBadge.textContent = formatted;

    const quickDisplay = document.getElementById('quickThresholdDisplay');
    if (quickDisplay) quickDisplay.textContent = formatted;
  }

  bindModals() {
    // Close modal on click overlay or close button
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    document.querySelectorAll('.modal-close-btn, .modal-close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Form Quick Edit Threshold in modal
    const formQuickParam = document.getElementById('formQuickThreshold');
    if (formQuickParam) {
      formQuickParam.addEventListener('submit', (e) => {
        e.preventDefault();
        const newVal = document.getElementById('inputQuickThreshold').value;
        const note = document.getElementById('inputQuickThresholdNote').value || 'Penyesuaian cepat ambang batas operasi';
        this.store.updateMinReserveThreshold(newVal, 'Administrator ROTS (Quick Edit)', note);
        document.getElementById('quickThresholdModal').classList.remove('active');
      });
    }

    // Help / Bantuan button
    const btnHelp = document.getElementById('btnHelpModal');
    if (btnHelp) {
      btnHelp.addEventListener('click', () => {
        const modal = document.getElementById('helpFormulaModal');
        if (modal) modal.classList.add('active');
      });
    }
  }

  openQuickThresholdModal() {
    const modal = document.getElementById('quickThresholdModal');
    const input = document.getElementById('inputQuickThreshold');
    if (modal && input) {
      input.value = this.store.params.minReserveThreshold;
      modal.classList.add('active');
    }
  }

  openFullscreenChartModal(type = 'neraca') {
    const modal = document.getElementById('fullscreenTrendModal');
    if (!modal) return;

    this.activeFullscreenChartType = type;
    modal.classList.add('active');

    const btnNeraca = document.getElementById('btnFsTabNeraca');
    const btnCadangan = document.getElementById('btnFsTabCadangan');
    const containerNeraca = document.getElementById('fsContainerNeraca');
    const containerCadangan = document.getElementById('fsContainerCadangan');

    if (type === 'neraca') {
      if (btnNeraca) btnNeraca.classList.add('active');
      if (btnCadangan) btnCadangan.classList.remove('active');
      if (containerNeraca) containerNeraca.style.display = 'block';
      if (containerCadangan) containerCadangan.style.display = 'none';
    } else {
      if (btnCadangan) btnCadangan.classList.add('active');
      if (btnNeraca) btnNeraca.classList.remove('active');
      if (containerCadangan) containerCadangan.style.display = 'block';
      if (containerNeraca) containerNeraca.style.display = 'none';
    }

    this.renderFullscreenContent();
  }

  renderFullscreenContent() {
    let records = this.store.getFilteredRecords();
    const threshold = this.store.params.minReserveThreshold;
    if (!records.length) return;

    // Filter by selected month in dropdown
    const selectFsMonth = document.getElementById('selectFsMonth');
    const selectedMonth = selectFsMonth ? selectFsMonth.value : 'ALL';

    if (selectedMonth && selectedMonth !== 'ALL') {
      records = records.filter(r => r.tanggal.startsWith(selectedMonth));
    }

    // Update system badge
    const sysBadge = document.getElementById('fullscreenModalSystemBadge');
    if (sysBadge) sysBadge.textContent = this.store.filters.sistem;

    // Hitung statistik untuk floating bar
    let cadSum = 0;
    let cadMin = Infinity;
    let bpMax = -Infinity;
    let siagaCount = 0;
    let defisitCount = 0;

    records.forEach(r => {
      cadSum += r.cad;
      if (r.cad < cadMin) cadMin = r.cad;
      if (r.bp > bpMax) bpMax = r.bp;
      if (r.statusKey === 'SIAGA') siagaCount++;
      else if (r.statusKey === 'DEFISIT') defisitCount++;
    });

    const cadAvg = cadSum / records.length;

    const elAvg = document.getElementById('fsStatCadAvg');
    const elMax = document.getElementById('fsStatCadMax');
    const elMin = document.getElementById('fsStatCadMin');
    const elCrit = document.getElementById('fsStatCriticalDays');

    if (elAvg) elAvg.textContent = `${CalculationService.formatNumber(cadAvg, 0)} MW`;
    if (elMax) elMax.textContent = `${CalculationService.formatNumber(bpMax, 0)} MW`;
    if (elMin) elMin.textContent = `${CalculationService.formatNumber(cadMin, 0)} MW`;
    if (elCrit) elCrit.textContent = `${siagaCount} Siaga / ${defisitCount} Defisit`;

    if (this.activeFullscreenChartType === 'neraca') {
      this.chartService.renderNeracaDayaChart('neracaDayaCanvasFullscreen', records);
    } else {
      this.chartService.renderFullscreenTrendChart('trendCadanganCanvasFullscreen', records, threshold);
    }
  }

  renderDashboard() {
    const selectedRecord = this.store.getSelectedRecord();
    const filteredRecords = this.store.getFilteredRecords();
    const threshold = this.store.params.minReserveThreshold;

    if (!selectedRecord || !filteredRecords.length) return;

    // Mode Komparasi: Tampilkan atau sembunyikan Kartu Evaluasi Deviasi
    const compGrid = document.getElementById('comparisonKpiGrid');
    if (compGrid) {
      if (this.store.viewMode === 'komparasi') {
        compGrid.style.display = 'grid';
        const comp = this.store.getComparisonSummary(filteredRecords);
        const elDeltaBp = document.getElementById('compValDeltaBp');
        const badgeDeltaBp = document.getElementById('compBadgeDeltaBp');
        const elDeltaOutage = document.getElementById('compValDeltaOutage');
        const elDeltaCad = document.getElementById('compValDeltaCad');
        const badgeDeltaCad = document.getElementById('compBadgeDeltaCad');
        const elAccuracy = document.getElementById('compValAccuracy');
        const elDaysReal = document.getElementById('compSubDaysRealized');

        if (elDeltaBp) elDeltaBp.textContent = CalculationService.formatDelta(comp.avgDeltaBP);
        if (badgeDeltaBp) {
          const sign = comp.avgDeltaBP > 0 ? '+' : '';
          badgeDeltaBp.textContent = `${sign}${(comp.avgDeltaBP / 33950.2 * 100).toFixed(2)}%`;
        }
        if (elDeltaOutage) elDeltaOutage.textContent = CalculationService.formatDelta(comp.avgDeltaOutage);
        if (elDeltaCad) elDeltaCad.textContent = CalculationService.formatDelta(comp.avgDeltaCAD);
        if (badgeDeltaCad) {
          badgeDeltaCad.textContent = comp.avgDeltaCAD >= 0 ? 'Cadangan Aman' : 'Cadangan Menipis';
          badgeDeltaCad.className = comp.avgDeltaCAD >= 0 ? 'comp-badge comp-badge-green' : 'comp-badge comp-badge-red';
        }
        if (elAccuracy) elAccuracy.textContent = `${comp.accuracyBP.toFixed(1)}%`;
        if (elDaysReal) elDaysReal.textContent = `${comp.totalDaysRealized} dari ${filteredRecords.length} Hari Terealisasi`;
      } else {
        compGrid.style.display = 'none';
      }
    }

    // 1. Render 6 KPI Cards (Berdasarkan data hari terpilih / seed 01 Juli 2026)
    this.updateKpiCards(selectedRecord);

    // 2. Status Hero Widget (Status Sistem Saat Ini + Gauge)
    this.updateStatusHero(selectedRecord, threshold);

    // 3. Ringkasan Periode Card
    this.updatePeriodSummaryCard(filteredRecords);

    // 4. Neraca Daya ROTS (Excel Summary & Stacked Area Chart)
    this.updateNeracaDayaWidget(filteredRecords);

    // 5. Trend Cadangan Daya Chart (Dukungan Rencana / Realisasi / Komparasi)
    this.chartService.renderTrendChart('trendCadanganCanvas', filteredRecords, threshold, this.store.viewMode);

    // 6. DMP vs BP Monthly Bar Chart
    const monthlySummary = this.store.getMonthlySummary(filteredRecords);
    this.chartService.renderDmpBpChart('dmpBpBarCanvas', monthlySummary);

    // 6. Ringkasan Status Donut Chart
    const statusCounts = {
      normal: monthlySummary.summaryRow.normal,
      siaga: monthlySummary.summaryRow.siaga,
      defisit: monthlySummary.summaryRow.defisit
    };
    this.chartService.renderStatusDonut('statusDonutCanvas', statusCounts);

    // 7. Donut legend & MANTAPS summary card numbers
    const totalDays = statusCounts.normal + statusCounts.siaga + statusCounts.defisit;
    const elNorm = document.getElementById('donutCountNormal');
    if (elNorm) elNorm.textContent = `${statusCounts.normal} hari (${((statusCounts.normal/totalDays)*100).toFixed(1)}%)`;
    const elSiaga = document.getElementById('donutCountSiaga');
    if (elSiaga) elSiaga.textContent = `${statusCounts.siaga} hari (${((statusCounts.siaga/totalDays)*100).toFixed(1)}%)`;
    const elDef = document.getElementById('donutCountDefisit');
    if (elDef) elDef.textContent = `${statusCounts.defisit} hari (${((statusCounts.defisit/totalDays)*100).toFixed(1)}%)`;

    // MANTAPS Right Panel Cards
    const mTotal = document.getElementById('mantapsTotalDays');
    const mDef = document.getElementById('mantapsCountDefisit');
    const mSiaga = document.getElementById('mantapsCountSiaga');
    const mNorm = document.getElementById('mantapsCountNormal');
    if (mTotal) mTotal.textContent = totalDays;
    if (mDef) mDef.textContent = statusCounts.defisit;
    if (mSiaga) mSiaga.textContent = statusCounts.siaga;
    if (mNorm) mNorm.textContent = statusCounts.normal;

    // 8. Ringkasan Bulanan Table di Dashboard
    this.renderDashboardMonthlyTable(monthlySummary);

    // 9. Komponen Outage Widget
    this.updateOutageWidget(selectedRecord);
  }

  updateDaySpecificWidgets() {
    const selected = this.store.getSelectedRecord();
    const threshold = this.store.params.minReserveThreshold;
    if (!selected) return;

    this.updateKpiCards(selected);
    this.updateStatusHero(selected, threshold);
    this.updateOutageWidget(selected);
  }

  updateKpiCards(rec) {
    const elDmn = document.getElementById('kpiValDmn');
    const elPlanned = document.getElementById('kpiValPlanned');
    const elUnplanned = document.getElementById('kpiValUnplanned');
    const elDmp = document.getElementById('kpiValDmp');
    const elBp = document.getElementById('kpiValBp');
    const elCad = document.getElementById('kpiValCad');

    if (elDmn) elDmn.textContent = CalculationService.formatNumber(rec.dmn);
    if (elPlanned) elPlanned.textContent = CalculationService.formatNumber(rec.plannedOutage);
    if (elUnplanned) elUnplanned.textContent = CalculationService.formatNumber(rec.unplannedOutage);
    if (elDmp) elDmp.textContent = CalculationService.formatNumber(rec.dmp);
    if (elBp) elBp.textContent = CalculationService.formatNumber(rec.bp);
    if (elCad) elCad.textContent = CalculationService.formatNumber(rec.cad);
  }

  updateStatusHero(rec, threshold) {
    const elDate = document.getElementById('statusHeroDate');
    const elStatusText = document.getElementById('statusHeroText');
    const elCondition = document.getElementById('statusHeroCondition');
    const elGaugeCad = document.getElementById('gaugeCurrentCadVal');
    const elLegendThresh1 = document.getElementById('legendThresholdNormal');
    const elLegendThresh2 = document.getElementById('legendThresholdSiaga');

    if (elDate) elDate.textContent = `Data per ${CalculationService.formatDateIndo(rec.tanggal)}`;
    if (elStatusText) {
      elStatusText.textContent = rec.statusLabel;
      elStatusText.className = `status-main-text status-text-${rec.statusKey.toLowerCase()}`;
    }

    if (elCondition) {
      let condText = '';
      if (rec.statusKey === 'NORMAL') {
        condText = `CAD ≥ ${CalculationService.formatNumber(threshold)} MW`;
        elCondition.className = 'status-condition-pill pill-normal';
      } else if (rec.statusKey === 'SIAGA') {
        condText = `CAD < ${CalculationService.formatNumber(threshold)} MW`;
        elCondition.className = 'status-condition-pill pill-siaga';
      } else {
        condText = 'CAD < 0 MW';
        elCondition.className = 'status-condition-pill pill-defisit';
      }
      elCondition.textContent = condText;
    }

    if (elGaugeCad) {
      elGaugeCad.textContent = `${CalculationService.formatNumber(rec.cad)} MW`;
    }

    if (elLegendThresh1) elLegendThresh1.textContent = `CAD ≥ ${CalculationService.formatNumber(threshold, 0)} MW`;
    if (elLegendThresh2) elLegendThresh2.textContent = `0 ≤ CAD < ${CalculationService.formatNumber(threshold, 0)} MW`;

    // Render Semi-circular Gauge hanya jika elemen sedang terlihat
    const gaugeCanvas = document.getElementById('statusGaugeCanvas');
    if (gaugeCanvas && gaugeCanvas.offsetParent !== null) {
      this.chartService.renderGauge('statusGaugeCanvas', rec.cad, threshold);
    }
  }

  updateNeracaDayaWidget(records) {
    const summary = this.store.getPeriodSummary(records);
    const sys = this.store.filters.sistem;

    const elTitle = document.getElementById('nerdaChartTitle');
    if (elTitle) elTitle.textContent = `Neraca Daya ROTS Sistem ${sys}`;

    const elDmn = document.getElementById('nerdaDmnVal');
    const elFoder = document.getElementById('nerdaFoderVal');
    const elDmpAvg = document.getElementById('nerdaDmpAvgVal');
    const elBpMax = document.getElementById('nerdaBpMaxVal');
    const elBpMaxDate = document.getElementById('nerdaBpMaxDate');
    const elCadAvg = document.getElementById('nerdaCadAvgVal');
    const elCadMin = document.getElementById('nerdaCadMinVal');
    const elCadMinDate = document.getElementById('nerdaCadMinDate');

    // Format tanggal modern untuk pill badge e.g. "2026-10-27" -> "27 Okt '26"
    const formatModernBadgeDate = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const mIdx = parseInt(parts[1], 10);
      return `${parseInt(parts[2], 10)} ${monthNames[mIdx] || parts[1]} '${parts[0].substring(2)}`;
    };

    if (elDmn) elDmn.textContent = CalculationService.formatNumber(summary.dmn, 0);
    if (elFoder) elFoder.textContent = `${(summary.foder * 100).toFixed(2).replace('.', ',')}%`;
    if (elDmpAvg) elDmpAvg.textContent = CalculationService.formatNumber(summary.dmpAvg, 0);
    if (elBpMax) elBpMax.textContent = CalculationService.formatNumber(summary.bpMax, 0);
    if (elBpMaxDate) elBpMaxDate.textContent = formatModernBadgeDate(summary.bpMaxDate);
    if (elCadAvg) elCadAvg.textContent = CalculationService.formatNumber(summary.cadAvg, 0);
    if (elCadMin) elCadMin.textContent = CalculationService.formatNumber(summary.cadMin, 0);
    if (elCadMinDate) elCadMinDate.textContent = formatModernBadgeDate(summary.cadMinDate);

    // Render Neraca Daya Chart (Dukungan Rencana / Realisasi / Komparasi)
    this.chartService.renderNeracaDayaChart('neracaDayaCanvas', records, this.store.viewMode);
  }

  updatePeriodSummaryCard(records) {
    const summary = this.store.getPeriodSummary(records);

    const elDmpAvg = document.getElementById('periodDmpAvg');
    const elBpMax = document.getElementById('periodBpMax');
    const elCadAvg = document.getElementById('periodCadAvg');
    const elCadMin = document.getElementById('periodCadMin');

    if (elDmpAvg) elDmpAvg.textContent = `${CalculationService.formatNumber(summary.dmpAvg)} MW`;
    if (elBpMax) elBpMax.textContent = `${CalculationService.formatNumber(summary.bpMax)} MW`;
    if (elCadAvg) elCadAvg.textContent = `${CalculationService.formatNumber(summary.cadAvg)} MW`;
    if (elCadMin) {
      elCadMin.textContent = `${CalculationService.formatNumber(summary.cadMin)} MW`;
      if (summary.cadMin < 0) {
        elCadMin.className = 'metric-value val-defisit';
      } else {
        elCadMin.className = 'metric-value';
      }
    }
  }

  renderDashboardMonthlyTable(monthlySummary) {
    const tbody = document.getElementById('dashboardMonthlyTableBody');
    const tfoot = document.getElementById('dashboardMonthlyTableFoot');
    const fullTbody = document.getElementById('fullMonthlyTableBody');
    if (!tbody || !tfoot) return;

    const rowsHtml = monthlySummary.rows.map(m => {
      const cadMinClass = m.cadMin < 0 ? 'text-danger' : '';
      return `
        <tr>
          <td style="font-weight: 600;">${m.monthLabel}</td>
          <td class="text-right">${CalculationService.formatNumber(m.dmpAvg)}</td>
          <td class="text-right">${CalculationService.formatNumber(m.bpMax)}</td>
          <td class="text-right">${CalculationService.formatNumber(m.cadAvg)}</td>
          <td class="text-right ${cadMinClass}">${CalculationService.formatNumber(m.cadMin)}</td>
          <td class="text-center" style="color: #059669; font-weight: 700;">${m.normal}</td>
          <td class="text-center" style="color: #D97706; font-weight: 700;">${m.siaga}</td>
          <td class="text-center" style="color: #DC2626; font-weight: 700;">${m.defisit}</td>
          <td class="text-center" style="font-weight: 700;">${m.totalDays}</td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rowsHtml;
    if (fullTbody) fullTbody.innerHTML = rowsHtml;

    const s = monthlySummary.summaryRow;
    const summaryCadMinClass = s.cadMin < 0 ? 'text-danger' : '';
    tfoot.innerHTML = `
      <tr>
        <td>TOTAL / RATA-RATA</td>
        <td class="text-right">${CalculationService.formatNumber(s.dmpAvg)}</td>
        <td class="text-right">${CalculationService.formatNumber(s.bpMax)}</td>
        <td class="text-right">${CalculationService.formatNumber(s.cadAvg)}</td>
        <td class="text-right ${summaryCadMinClass}">${CalculationService.formatNumber(s.cadMin)}</td>
        <td class="text-center" style="color: #059669; font-weight: 800;">${s.normal}</td>
        <td class="text-center" style="color: #D97706; font-weight: 800;">${s.siaga}</td>
        <td class="text-center" style="color: #DC2626; font-weight: 800;">${s.defisit}</td>
        <td class="text-center" style="font-weight: 800;">${s.totalDays}</td>
      </tr>
    `;
  }

  updateOutageWidget(rec) {
    const elSubtitle = document.getElementById('outageWidgetDate');
    if (elSubtitle) elSubtitle.textContent = `(${CalculationService.formatDateIndo(rec.tanggal)})`;

    // Planned Outage items
    const elPo = document.getElementById('outagePoVal');
    const elMo = document.getElementById('outageMoVal');
    const elTotalPlanned = document.getElementById('outageTotalPlannedVal');

    if (elPo) elPo.textContent = CalculationService.formatNumber(rec.po);
    if (elMo) elMo.textContent = CalculationService.formatNumber(rec.mo);
    if (elTotalPlanned) elTotalPlanned.textContent = CalculationService.formatNumber(rec.plannedOutage);

    // Unplanned Outage items
    const elFo = document.getElementById('outageFoVal');
    const elFoEp = document.getElementById('outageFoEpVal');
    const elDerKit = document.getElementById('outageDerKitVal');
    const elDerTrans = document.getElementById('outageDerTransVal');
    const elVarmus = document.getElementById('outageVarmusVal');
    const elTotalUnplanned = document.getElementById('outageTotalUnplannedVal');

    if (elFo) elFo.textContent = CalculationService.formatNumber(rec.fo);
    if (elFoEp) elFoEp.textContent = CalculationService.formatNumber(rec.foEp);
    if (elDerKit) elDerKit.textContent = CalculationService.formatNumber(rec.derKit);
    if (elDerTrans) elDerTrans.textContent = CalculationService.formatNumber(rec.derTrans);
    if (elVarmus) elVarmus.textContent = CalculationService.formatNumber(rec.varmus);
    if (elTotalUnplanned) elTotalUnplanned.textContent = CalculationService.formatNumber(rec.unplannedOutage);
  }

  // ==========================================================================
  // MODAL: INPUT & EDIT REALISASI HARIAN
  // ==========================================================================
  bindRealisasiModal() {
    const modal = document.getElementById('modalInputRealisasi');
    const btnOpen = document.getElementById('btnOpenInputRealisasi');
    const btnClose = document.getElementById('btnCloseModalRealisasi');
    const btnCancel = document.getElementById('btnCancelModalRealisasi');
    const btnSave = document.getElementById('btnSaveRealisasi');
    const btnDelete = document.getElementById('btnDeleteRealisasi');

    const datePicker = document.getElementById('formRealisasiDatePicker');
    const dateDisplay = document.getElementById('formRealisasiDateDisplay');
    const inputBp = document.getElementById('inputRealBp');
    const inputDmn = document.getElementById('inputRealDmn');
    const inputPo = document.getElementById('inputRealPo');
    const inputMo = document.getElementById('inputRealMo');
    const inputFo = document.getElementById('inputRealFo');
    const inputDerating = document.getElementById('inputRealDerating');
    const inputNotes = document.getElementById('inputRealNotes');

    const hintPlanBp = document.getElementById('hintPlanBp');
    const hintPlanDmn = document.getElementById('hintPlanDmn');

    const prevDmp = document.getElementById('previewRealDmp');
    const prevCad = document.getElementById('previewRealCad');
    const prevDeltaBp = document.getElementById('previewDeltaBp');
    const prevStatus = document.getElementById('previewRealStatus');

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    // Live preview update
    const updateLivePreview = (planRec) => {
      if (!planRec) return;
      const dmn = parseFloat(inputDmn.value) || planRec.dmn;
      const po = parseFloat(inputPo.value) || 0;
      const mo = parseFloat(inputMo.value) || 0;
      const fo = parseFloat(inputFo.value) || 0;
      const der = parseFloat(inputDerating.value) || 0;
      const bp = parseFloat(inputBp.value) || 0;

      const plannedOutage = CalculationService.calculatePlannedOutage(po, mo);
      const unplannedOutage = CalculationService.calculateUnplannedOutage(fo, 0, der, 0, 0);
      const dmp = CalculationService.calculateDMP(dmn, plannedOutage, unplannedOutage);
      const cad = CalculationService.calculateCAD(dmp, bp);
      const status = CalculationService.determineStatus(cad, this.store.params.minReserveThreshold);

      if (prevDmp) prevDmp.textContent = `${CalculationService.formatNumber(dmp, 0)} MW`;
      if (prevCad) {
        prevCad.textContent = `${CalculationService.formatNumber(cad, 0)} MW`;
        prevCad.style.color = status.color;
      }
      if (prevDeltaBp) {
        prevDeltaBp.textContent = CalculationService.formatDelta(bp - planRec.bp, 0);
      }
      if (prevStatus) {
        prevStatus.className = `status-badge ${status.badgeClass}`;
        prevStatus.textContent = status.label;
      }
    };

    const loadDateIntoModal = (dateStr) => {
      const records = this.store.getFilteredRecords();
      const rec = records.find(r => r.tanggal === dateStr) || records[0];
      if (!rec) return;

      if (datePicker) datePicker.value = rec.tanggal;
      if (dateDisplay) dateDisplay.textContent = CalculationService.formatDateIndo(rec.tanggal);

      if (hintPlanBp) hintPlanBp.textContent = `Rencana: ${CalculationService.formatNumber(rec.bp)} MW`;
      if (hintPlanDmn) hintPlanDmn.textContent = `Rencana: ${CalculationService.formatNumber(rec.dmn)} MW`;

      if (rec.realisasi) {
        inputBp.value = rec.realisasi.bp || '';
        inputDmn.value = rec.realisasi.dmn || rec.dmn;
        inputPo.value = rec.realisasi.po || '';
        inputMo.value = rec.realisasi.mo || '';
        inputFo.value = rec.realisasi.fo || '';
        inputDerating.value = rec.realisasi.derKit || '';
        inputNotes.value = rec.realisasi.notes || '';
        if (btnDelete) btnDelete.style.display = 'inline-flex';
      } else {
        inputBp.value = '';
        inputDmn.value = rec.dmn;
        inputPo.value = rec.po;
        inputMo.value = rec.mo;
        inputFo.value = rec.fo;
        inputDerating.value = rec.derKit;
        inputNotes.value = '';
        if (btnDelete) btnDelete.style.display = 'none';
      }

      updateLivePreview(rec);
      if (modal) modal.classList.add('active');
    };

    this.openRealisasiModal = loadDateIntoModal;
    window.ROTS_OPEN_REALISASI = loadDateIntoModal;

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        const selDate = this.store.filters.selectedDate || '2026-07-01';
        loadDateIntoModal(selDate);
      });
    }

    if (datePicker) {
      datePicker.addEventListener('change', (e) => {
        loadDateIntoModal(e.target.value);
      });
    }

    // Tombol Gunakan Nilai Rencana (Auto-Fill BP)
    const btnFillPlan = document.getElementById('btnFillPlanBp');
    if (btnFillPlan) {
      btnFillPlan.addEventListener('click', () => {
        const curDate = datePicker.value;
        const rec = this.store.getFilteredRecords().find(r => r.tanggal === curDate);
        if (rec) {
          inputBp.value = rec.bp;
          updateLivePreview(rec);
          window.showToast(`Nilai BP Rencana (${CalculationService.formatNumber(rec.bp)} MW) disalin ke form.`, 'info');
        }
      });
    }

    [inputBp, inputDmn, inputPo, inputMo, inputFo, inputDerating].forEach(inp => {
      if (inp) {
        inp.addEventListener('input', () => {
          const curDate = datePicker.value;
          const rec = this.store.getFilteredRecords().find(r => r.tanggal === curDate);
          if (rec) updateLivePreview(rec);
        });
      }
    });

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const dateStr = datePicker.value;
        const bp = parseFloat(inputBp.value);
        if (isNaN(bp) || bp <= 0) {
          alert('Mohon masukkan Beban Puncak (BP) Realisasi yang valid (> 0 MW)');
          return;
        }

        const data = {
          bp,
          dmn: parseFloat(inputDmn.value),
          po: parseFloat(inputPo.value) || 0,
          mo: parseFloat(inputMo.value) || 0,
          fo: parseFloat(inputFo.value) || 0,
          derKit: parseFloat(inputDerating.value) || 0,
          notes: inputNotes.value
        };

        this.store.setRealisasi(dateStr, data);
        closeModal();
        window.showToast(`✅ Data Realisasi ${CalculationService.formatDateIndo(dateStr)} berhasil disimpan!`);

        // Highlight baris di tabel kondisi harian
        setTimeout(() => {
          const row = document.querySelector(`#dailyTableBody tr[data-date="${dateStr}"]`);
          if (row) {
            row.classList.add('row-recently-updated');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => row.classList.remove('row-recently-updated'), 3500);
          }
        }, 100);
      });
    }

    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        const dateStr = datePicker.value;
        if (confirm(`Hapus data realisasi tanggal ${CalculationService.formatDateIndo(dateStr)}?`)) {
          this.store.deleteRealisasi(dateStr);
          closeModal();
          window.showToast(`🗑️ Data realisasi tanggal ${CalculationService.formatDateIndo(dateStr)} telah dihapus.`, 'info');
        }
      });
    }
  }

  // ==========================================================================
  // MODAL: UPLOAD FILE EXCEL REALISASI AKTUAL (KONDISI HARIAN)
  // ==========================================================================
  bindQuickUploadRealisasiModal() {
    const modal = document.getElementById('modalUploadRealisasi');
    const btnClose = document.getElementById('btnCloseModalUploadRealisasi');
    const btnCancel = document.getElementById('btnCancelModalUploadRealisasi');
    const btnDownloadTpl = document.getElementById('btnDownloadTemplateRealisasiModal');
    const dropzone = document.getElementById('quickUploadDropzone');
    const fileInput = document.getElementById('quickUploadFileInput');
    const stagingArea = document.getElementById('quickUploadStagingArea');
    const stagingSummary = document.getElementById('quickStagingSummary');
    const stagingBadge = document.getElementById('quickStagingBadge');
    const stagingTbody = document.getElementById('quickStagingTableBody');
    const btnCommit = document.getElementById('btnCommitQuickUpload');

    let stagedRows = [];

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
      stagedRows = [];
      if (fileInput) fileInput.value = '';
      if (stagingArea) stagingArea.style.display = 'none';
      if (btnCommit) btnCommit.disabled = true;
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    // Download template realisasi
    if (btnDownloadTpl) {
      btnDownloadTpl.addEventListener('click', () => {
        const records = this.store.getFilteredRecords();
        const tplData = records.slice(0, 31).map((r, i) => ({
          'Tanggal': r.tanggal,
          'BP_Realisasi': Math.round((r.bp + (i % 2 === 0 ? 150.25 : -95.50)) * 100) / 100,
          'DMN_Realisasi': r.dmn,
          'PO_Realisasi': r.po,
          'MO_Realisasi': r.mo,
          'FO_Realisasi': r.fo,
          'Derating_Realisasi': r.derKit,
          'Catatan': `Realisasi harian ${CalculationService.formatDateIndo(r.tanggal)}`
        }));
        const ws = XLSX.utils.json_to_sheet(tplData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template_Realisasi');
        XLSX.writeFile(wb, 'Template_Realisasi_Operasi_PLN.xlsx');
        window.showToast('📥 Berkas Template Realisasi berhasil diunduh.', 'info');
      });
    }

    // Dropzone interaction
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#2563EB';
        dropzone.style.background = '#EFF6FF';
      });

      ['dragleave', 'dragend'].forEach(evt => {
        dropzone.addEventListener(evt, () => {
          dropzone.style.borderColor = '#93C5FD';
          dropzone.style.background = '#F8FAFC';
        });
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#93C5FD';
        dropzone.style.background = '#F8FAFC';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          processFile(e.target.files[0]);
        }
      });
    }

    const processFile = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

          if (!rawRows || !rawRows.length) {
            alert('Berkas Excel kosong atau lembar kerja tidak terbaca.');
            return;
          }

          // Header normalization
          const normalize = (row, candidates) => {
            for (const c of candidates) {
              const key = Object.keys(row).find(k => k.trim().toLowerCase() === c.toLowerCase());
              if (key && row[key] !== '') return row[key];
            }
            return null;
          };

          const validRows = [];
          rawRows.forEach(r => {
            const tglRaw = normalize(r, ['Tanggal', 'Date', 'Tgl', 'Waktu']);
            const bpRaw = normalize(r, ['BP_Realisasi', 'BP', 'Beban Puncak', 'Beban_Puncak']);
            const dmnRaw = normalize(r, ['DMN_Realisasi', 'DMN']);
            const poRaw = normalize(r, ['PO_Realisasi', 'PO']);
            const moRaw = normalize(r, ['MO_Realisasi', 'MO']);
            const foRaw = normalize(r, ['FO_Realisasi', 'FO']);
            const derRaw = normalize(r, ['Derating_Realisasi', 'Derating', 'DER KIT']);
            const notesRaw = normalize(r, ['Catatan', 'Notes', 'Keterangan']);

            if (!tglRaw) return;
            let formattedDate = String(tglRaw).trim();
            if (typeof tglRaw === 'number') {
              const jsDate = new Date(Math.round((tglRaw - 25569) * 86400 * 1000));
              formattedDate = jsDate.toISOString().split('T')[0];
            }

            const bp = parseFloat(bpRaw);
            if (isNaN(bp) || bp <= 0) return;

            validRows.push({
              tanggal: formattedDate,
              bp,
              dmn: parseFloat(dmnRaw) || 0,
              po: parseFloat(poRaw) || 0,
              mo: parseFloat(moRaw) || 0,
              fo: parseFloat(foRaw) || 0,
              derKit: parseFloat(derRaw) || 0,
              notes: String(notesRaw || 'Upload Excel Realisasi').trim()
            });
          });

          if (!validRows.length) {
            alert('Tidak ditemukan data baris yang valid. Pastikan kolom Tanggal dan BP_Realisasi terisi angka valid.');
            return;
          }

          stagedRows = validRows;
          if (stagingSummary) stagingSummary.textContent = `${validRows.length} baris data realisasi valid ditemukan`;
          if (stagingBadge) {
            stagingBadge.className = 'badge-status badge-normal';
            stagingBadge.textContent = `${validRows.length} Siap Diimpor`;
          }

          if (stagingTbody) {
            stagingTbody.innerHTML = validRows.slice(0, 5).map(r => `
              <tr>
                <td><strong>${r.tanggal}</strong></td>
                <td class="text-right" style="color: #059669; font-weight: 700;">${CalculationService.formatNumber(r.bp)}</td>
                <td class="text-right">${r.dmn > 0 ? CalculationService.formatNumber(r.dmn) : '-'}</td>
                <td class="text-right">${r.po > 0 ? CalculationService.formatNumber(r.po) : '-'}</td>
                <td class="text-right">${r.fo > 0 ? CalculationService.formatNumber(r.fo) : '-'}</td>
                <td style="color: #64748B; font-size: 11px;">${r.notes}</td>
              </tr>
            `).join('');
          }

          if (stagingArea) stagingArea.style.display = 'block';
          if (btnCommit) {
            btnCommit.disabled = false;
            btnCommit.innerHTML = `<i class="fa fa-check"></i> Simpan & Terapkan ${validRows.length} Data Realisasi`;
          }
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan saat memproses file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    };

    if (btnCommit) {
      btnCommit.addEventListener('click', () => {
        if (!stagedRows.length) return;
        const count = this.store.importRealisasiRecords(stagedRows);
        closeModal();
        window.showToast(`🎉 Berhasil mengimpor ${count} data realisasi aktual ke sistem!`);
      });
    }
  }

  // ==========================================================================
  // MODAL: FORM INPUT / EDIT RENCANA OPERASI (ROT, ROTS, ROB, ROM)
  // ==========================================================================
  bindInputRencanaModal() {
    const modal = document.getElementById('modalInputRencana');
    const btnClose = document.getElementById('btnCloseModalInputRencana');
    const btnCancel = document.getElementById('btnCancelModalInputRencana');
    const tabButtons = document.querySelectorAll('.plan-doc-tab-btn');
    const datePicker = document.getElementById('formPlanDatePicker');
    const dateDisplay = document.getElementById('formPlanDateDisplay');

    const inputDmn = document.getElementById('inputPlanDmn');
    const inputBp = document.getElementById('inputPlanBp');
    const inputPo = document.getElementById('inputPlanPo');
    const inputMo = document.getElementById('inputPlanMo');
    const inputFo = document.getElementById('inputPlanFo');
    const inputFoEp = document.getElementById('inputPlanFoEp');
    const inputDerKit = document.getElementById('inputPlanDerKit');
    const inputVarmus = document.getElementById('inputPlanVarmus');
    const inputNotes = document.getElementById('inputPlanNotes');

    const previewTotalOutage = document.getElementById('previewPlanTotalOutage');
    const previewDmp = document.getElementById('previewPlanDmp');
    const previewCad = document.getElementById('previewPlanCad');
    const previewStatus = document.getElementById('previewPlanStatus');
    const previewBadge = document.getElementById('previewPlanDocBadge');
    const btnSaveText = document.getElementById('btnSaveRencanaText');
    const btnSave = document.getElementById('btnSaveRencana');

    let activeDoc = this.store.planningPeriod.type || 'ROTS';

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    const updatePreview = () => {
      const dmn = parseFloat(inputDmn.value) || 0;
      const bp = parseFloat(inputBp.value) || 0;
      const po = parseFloat(inputPo.value) || 0;
      const mo = parseFloat(inputMo.value) || 0;
      const fo = parseFloat(inputFo.value) || 0;
      const foEp = parseFloat(inputFoEp.value) || 0;
      const derKit = parseFloat(inputDerKit.value) || 0;
      const varmus = parseFloat(inputVarmus.value) || 0;

      const planned = po + mo;
      const unplanned = fo + foEp + derKit + varmus;
      const totalOutage = planned + unplanned;
      const dmp = dmn - totalOutage;
      const cad = dmp - bp;
      const threshold = this.store.params.minReserveThreshold;
      const status = CalculationService.determineStatus(cad, threshold);

      if (previewTotalOutage) previewTotalOutage.textContent = `${CalculationService.formatNumber(totalOutage, 0)} MW`;
      if (previewDmp) previewDmp.textContent = `${CalculationService.formatNumber(dmp, 0)} MW`;
      if (previewCad) {
        previewCad.textContent = `${CalculationService.formatNumber(cad, 0)} MW`;
        previewCad.style.color = status.color;
      }
      if (previewStatus) {
        previewStatus.className = `status-badge ${status.badgeClass}`;
        previewStatus.textContent = status.label;
      }
    };

    const loadDataIntoModal = (dateStr, docType) => {
      activeDoc = docType || activeDoc;
      const records = this.store.records;
      const rawRec = records.find(r => r.tanggal === dateStr) || records[0];
      if (!rawRec) return;

      if (datePicker) datePicker.value = rawRec.tanggal;
      if (dateDisplay) dateDisplay.textContent = CalculationService.formatDateIndo(rawRec.tanggal);

      // Sync active tab button
      tabButtons.forEach(btn => {
        if (btn.getAttribute('data-plan') === activeDoc) {
          btn.classList.add('active');
          btn.style.background = '#1E40AF';
          btn.style.color = '#FFFFFF';
          btn.style.borderColor = '#1E40AF';
        } else {
          btn.classList.remove('active');
          btn.style.background = '#FFFFFF';
          btn.style.color = '#475569';
          btn.style.borderColor = '#CBD5E1';
        }
      });

      if (previewBadge) previewBadge.textContent = activeDoc;
      if (btnSaveText) btnSaveText.textContent = `Simpan Data Rencana (${activeDoc})`;

      // Get period data
      const pData = CalculationService.getPeriodRecordData(rawRec, activeDoc);
      inputDmn.value = pData.dmn || '';
      inputBp.value = pData.bp || '';
      inputPo.value = pData.po || '';
      inputMo.value = pData.mo || '';
      inputFo.value = pData.fo || '';
      inputFoEp.value = pData.foEp || '';
      inputDerKit.value = pData.derKit || '';
      inputVarmus.value = pData.varmus || '';
      inputNotes.value = pData.notes || '';

      updatePreview();
      if (modal) modal.classList.add('active');
    };

    window.ROTS_OPEN_INPUT_RENCANA = loadDataIntoModal;

    // Tab switcher
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const doc = btn.getAttribute('data-plan');
        const curDate = datePicker.value;
        loadDataIntoModal(curDate, doc);
      });
    });

    if (datePicker) {
      datePicker.addEventListener('change', (e) => {
        loadDataIntoModal(e.target.value, activeDoc);
      });
    }

    [inputDmn, inputBp, inputPo, inputMo, inputFo, inputFoEp, inputDerKit, inputVarmus].forEach(inp => {
      if (inp) inp.addEventListener('input', updatePreview);
    });

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const dateStr = datePicker.value;
        const dmn = parseFloat(inputDmn.value);
        const bp = parseFloat(inputBp.value);

        if (isNaN(dmn) || dmn <= 0) {
          alert('Mohon masukkan nilai DMN yang valid (> 0 MW)');
          return;
        }
        if (isNaN(bp) || bp <= 0) {
          alert('Mohon masukkan nilai BP yang valid (> 0 MW)');
          return;
        }

        const data = {
          dmn,
          bp,
          po: parseFloat(inputPo.value) || 0,
          mo: parseFloat(inputMo.value) || 0,
          fo: parseFloat(inputFo.value) || 0,
          foEp: parseFloat(inputFoEp.value) || 0,
          derKit: parseFloat(inputDerKit.value) || 0,
          derTrans: 0,
          varmus: parseFloat(inputVarmus.value) || 0,
          notes: inputNotes.value
        };

        this.store.setPeriodPlanRecord(activeDoc, dateStr, data);
        closeModal();
        window.showToast(`✅ Data Rencana ${activeDoc} tanggal ${CalculationService.formatDateIndo(dateStr)} berhasil disimpan!`);

        setTimeout(() => {
          const row = document.querySelector(`#dailyTableBody tr[data-date="${dateStr}"]`);
          if (row) {
            row.classList.add('row-recently-updated');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => row.classList.remove('row-recently-updated'), 3500);
          }
        }, 100);
      });
    }
  }

  // ==========================================================================
  // MODAL: UPLOAD FILE EXCEL RENCANA OPERASI (ROT / ROTS / ROB / ROM)
  // ==========================================================================
  bindUploadRencanaModal() {
    const modal = document.getElementById('modalUploadRencana');
    const btnClose = document.getElementById('btnCloseModalUploadRencana');
    const btnCancel = document.getElementById('btnCancelModalUploadRencana');
    const tabButtons = document.querySelectorAll('.upload-doc-tab-btn');
    const tplTitle = document.getElementById('uploadRencanaTemplateTitle');
    const btnDownloadTpl = document.getElementById('btnDownloadTemplateRencanaModal');
    const dropzone = document.getElementById('quickPlanUploadDropzone');
    const fileInput = document.getElementById('quickPlanUploadFileInput');
    const stagingArea = document.getElementById('quickPlanStagingArea');
    const stagingSummary = document.getElementById('quickPlanStagingSummary');
    const stagingBadge = document.getElementById('quickPlanStagingBadge');
    const stagingTbody = document.getElementById('quickPlanStagingTableBody');
    const btnCommit = document.getElementById('btnCommitPlanUpload');
    const btnCommitText = document.getElementById('btnCommitPlanUploadText');

    let activeDoc = this.store.planningPeriod.type || 'ROTS';
    let stagedRows = [];

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
      stagedRows = [];
      if (fileInput) fileInput.value = '';
      if (stagingArea) stagingArea.style.display = 'none';
      if (btnCommit) btnCommit.disabled = true;
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    const setDocType = (doc) => {
      activeDoc = doc;
      tabButtons.forEach(btn => {
        if (btn.getAttribute('data-target') === doc) {
          btn.classList.add('active');
          btn.style.background = '#1E40AF';
          btn.style.color = '#FFFFFF';
          btn.style.borderColor = '#1E40AF';
        } else {
          btn.classList.remove('active');
          btn.style.background = '#FFFFFF';
          btn.style.color = '#475569';
          btn.style.borderColor = '#CBD5E1';
        }
      });
      if (tplTitle) tplTitle.innerHTML = `<i class="fa fa-file-excel"></i> Template Excel Rencana ${doc} (.xlsx)`;
      if (btnCommitText) btnCommitText.textContent = `Simpan & Terapkan Data Rencana (${doc})`;
    };

    window.ROTS_OPEN_UPLOAD_RENCANA = (periodType) => {
      setDocType(periodType || activeDoc);
      if (modal) modal.classList.add('active');
    };

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setDocType(btn.getAttribute('data-target'));
      });
    });

    // Download template rencana
    if (btnDownloadTpl) {
      btnDownloadTpl.addEventListener('click', () => {
        const records = this.store.records;
        const tplData = records.slice(0, 31).map(r => {
          const p = CalculationService.getPeriodRecordData(r, activeDoc);
          return {
            'Sistem': r.sistem,
            'Tanggal': r.tanggal,
            'DMN': p.dmn,
            'PO': p.po,
            'MO': p.mo,
            'FO': p.fo,
            'FO_EP': p.foEp,
            'DER_KIT': p.derKit,
            'VARMUS': p.varmus,
            'BP': p.bp,
            'Catatan': `Rencana Operasi ${activeDoc} ${r.tanggal}`
          };
        });

        const ws = XLSX.utils.json_to_sheet(tplData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Template_${activeDoc}`);
        XLSX.writeFile(wb, `Template_Rencana_${activeDoc}_PLN.xlsx`);
        window.showToast(`📥 Berkas Template Rencana ${activeDoc} berhasil diunduh.`, 'info');
      });
    }

    // Dropzone interaction
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#2563EB';
        dropzone.style.background = '#EFF6FF';
      });

      ['dragleave', 'dragend'].forEach(evt => {
        dropzone.addEventListener(evt, () => {
          dropzone.style.borderColor = '#93C5FD';
          dropzone.style.background = '#F8FAFC';
        });
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#93C5FD';
        dropzone.style.background = '#F8FAFC';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          processFile(e.target.files[0]);
        }
      });
    }

    const processFile = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

          if (!rawRows || !rawRows.length) {
            alert('Berkas Excel kosong atau lembar kerja tidak terbaca.');
            return;
          }

          const normalize = (row, candidates) => {
            for (const c of candidates) {
              const key = Object.keys(row).find(k => k.trim().toLowerCase() === c.toLowerCase());
              if (key && row[key] !== '') return row[key];
            }
            return null;
          };

          const validRows = [];
          rawRows.forEach(r => {
            const tglRaw = normalize(r, ['Tanggal', 'Date', 'Tgl', 'Waktu']);
            const dmnRaw = normalize(r, ['DMN', 'Daya Mampu Netto']);
            const bpRaw = normalize(r, ['BP', 'Beban Puncak', 'Beban_Puncak']);
            const poRaw = normalize(r, ['PO', 'Planned Outage']);
            const moRaw = normalize(r, ['MO', 'Maintenance Outage']);
            const foRaw = normalize(r, ['FO', 'Forced Outage']);
            const foEpRaw = normalize(r, ['FO_EP', 'FO EP']);
            const derRaw = normalize(r, ['DER_KIT', 'DER KIT', 'Derating']);
            const varmusRaw = normalize(r, ['VARMUS', 'Variasi Musim']);
            const notesRaw = normalize(r, ['Catatan', 'Notes']);

            if (!tglRaw) return;
            let formattedDate = String(tglRaw).trim();
            if (typeof tglRaw === 'number') {
              const jsDate = new Date(Math.round((tglRaw - 25569) * 86400 * 1000));
              formattedDate = jsDate.toISOString().split('T')[0];
            }

            const dmn = parseFloat(dmnRaw);
            const bp = parseFloat(bpRaw);
            if (isNaN(dmn) || isNaN(bp) || dmn <= 0 || bp <= 0) return;

            validRows.push({
              tanggal: formattedDate,
              dmn,
              bp,
              po: parseFloat(poRaw) || 0,
              mo: parseFloat(moRaw) || 0,
              fo: parseFloat(foRaw) || 0,
              foEp: parseFloat(foEpRaw) || 0,
              derKit: parseFloat(derRaw) || 0,
              derTrans: 0,
              varmus: parseFloat(varmusRaw) || 0,
              notes: String(notesRaw || `Import Excel Rencana ${activeDoc}`).trim()
            });
          });

          if (!validRows.length) {
            alert('Tidak ditemukan baris yang valid. Pastikan kolom Tanggal, DMN, dan BP terisi angka valid.');
            return;
          }

          stagedRows = validRows;
          if (stagingSummary) stagingSummary.textContent = `${validRows.length} baris data rencana valid untuk ${activeDoc}`;
          if (stagingBadge) {
            stagingBadge.className = 'badge-status badge-normal';
            stagingBadge.textContent = `${validRows.length} Siap Diimpor`;
          }

          if (stagingTbody) {
            stagingTbody.innerHTML = validRows.slice(0, 5).map(r => `
              <tr>
                <td><strong>${r.tanggal}</strong></td>
                <td class="text-right" style="color:#0284C7; font-weight:700;">${CalculationService.formatNumber(r.dmn)}</td>
                <td class="text-right" style="color:#D97706;">${CalculationService.formatNumber(r.po)}</td>
                <td class="text-right" style="color:#DC2626;">${CalculationService.formatNumber(r.fo)}</td>
                <td class="text-right" style="color:#7C3AED; font-weight:700;">${CalculationService.formatNumber(r.bp)}</td>
                <td style="color: #64748B; font-size: 11px;">${r.notes}</td>
              </tr>
            `).join('');
          }

          if (stagingArea) stagingArea.style.display = 'block';
          if (btnCommit) {
            btnCommit.disabled = false;
            btnCommit.innerHTML = `<i class="fa fa-check"></i> Simpan & Terapkan ${validRows.length} Data Rencana (${activeDoc})`;
          }
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan saat memproses file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    };

    if (btnCommit) {
      btnCommit.addEventListener('click', () => {
        if (!stagedRows.length) return;
        const count = this.store.importPeriodPlanRecords(activeDoc, stagedRows);
        closeModal();
        window.showToast(`🎉 Berhasil mengimpor ${count} data rencana ${activeDoc} ke dalam sistem!`);
      });
    }
  }

  bindCatalogModal() {
    const modal = document.getElementById('modalCatalogPeriods');
    const btnClose = document.getElementById('btnCloseCatalogModal');
    const btnCloseFooter = document.getElementById('btnCloseCatalogModalFooter');

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Tombol Pilih Periode dalam Katalog
    const selectBtns = document.querySelectorAll('.btn-catalog-select');
    selectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const val = btn.getAttribute('data-value');
        if (type && val) {
          this.store.setPlanningPeriod(type, val);
          closeModal();
          window.showToast && window.showToast(`Periode aktif diubah ke ${type}`, 'success');
        }
      });
    });

    // Tombol Input Rencana dari Katalog
    const inputBtns = document.querySelectorAll('.btn-catalog-input');
    inputBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        closeModal();
        if (window.ROTS_OPEN_INPUT_RENCANA) {
          window.ROTS_OPEN_INPUT_RENCANA(null, type);
        }
      });
    });
  }

}

// Global Toast Notification Helper
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toastContainer') || document.body;
  const toast = document.createElement('div');
  toast.className = `rots-toast rots-toast-${type}`;
  let icon = 'fa-check-circle';
  if (type === 'info') icon = 'fa-info-circle';
  if (type === 'warning') icon = 'fa-exclamation-triangle';
  if (type === 'error') icon = 'fa-times-circle';
  toast.innerHTML = `<i class="fa ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, 4000);
};

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.ROTS_APP = new RotsApp();
  window.ROTS_APP.init();
});

