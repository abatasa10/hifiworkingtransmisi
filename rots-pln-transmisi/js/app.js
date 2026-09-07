/**
 * ROTS PLN TRANSMISI - Main Application Controller
 * Menghubungkan seluruh modul tampilan, store data, router navigasi, filter global, dan modal.
 */

import { CalculationService } from './calculation.js';
import { store } from './store.js';
import { chartService } from './charts.js';
import { dailyView } from './dailyView.js';
import { outageView } from './outageView.js';
import { parameterView } from './parameterView.js';
import { importExportService } from './importExport.js';

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

    this.dailyView.init();
    this.outageView.init();
    this.parameterView.init();
    this.importExport.init();

    // Subscribe to store updates
    this.store.subscribe((event) => {
      this.handleStoreEvent(event);
    });

    // Initial render
    this.renderDashboard();
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
      event.type === 'PLANNING_PERIOD_CHANGED'
    ) {
      // Update badge tanggal jika ada perubahan periode
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
        // Sync threshold badge (cadMin bisa berubah per periode)
        this.updateThresholdBadges();
      }
      this.renderDashboard();
      this.dailyView.render();
      this.outageView.render();
      this.parameterView.render();
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
        this.store.setCurrentView(viewId);
      });
    });

    // Donut chart "Lihat Detail Harian ->" link
    const linkDetailHarian = document.getElementById('linkLihatDetailHarian');
    if (linkDetailHarian) {
      linkDetailHarian.addEventListener('click', (e) => {
        e.preventDefault();
        this.store.setCurrentView('kondisi-harian');
      });
    }
  }

  switchView(viewId) {
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
    }
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

    // Helper: isi dropdown nilai periode berdasarkan jenis
    const populatePeriodValues = (type) => {
      if (!selectPeriodValue) return;
      const options = this.store.getAvailablePeriodValues(type);
      selectPeriodValue.innerHTML = options
        .map(o => `<option value="${o.value}">${o.label}</option>`)
        .join('');
    };

    // Helper: update badge + title
    const updatePeriodBadge = (type) => {
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
    };

    if (selectPeriodType) {
      selectPeriodType.addEventListener('change', (e) => {
        const type = e.target.value;
        populatePeriodValues(type);
        // Pilih value pertama secara default
        const firstValue = this.store.getAvailablePeriodValues(type)[0]?.value;
        if (firstValue) {
          this.store.setPlanningPeriod(type, firstValue);
        }
        updatePeriodBadge(type);
      });
    }

    if (selectPeriodValue) {
      selectPeriodValue.addEventListener('change', (e) => {
        const type = selectPeriodType ? selectPeriodType.value : this.store.planningPeriod.type;
        this.store.setPlanningPeriod(type, e.target.value);
      });
    }

    // Inisialisasi awal: isi dropdown nilai sesuai ROTS
    populatePeriodValues('ROTS');
    updatePeriodBadge('ROTS');

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
      });
    }

    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        const dateStr = datePicker.value;
        if (confirm(`Hapus data realisasi tanggal ${CalculationService.formatDateIndo(dateStr)}?`)) {
          this.store.deleteRealisasi(dateStr);
          closeModal();
        }
      });
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.ROTS_APP = new RotsApp();
  window.ROTS_APP.init();
});
