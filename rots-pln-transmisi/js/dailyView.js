/**
 * ROTS PLN TRANSMISI - Daily View Module
 * Menampilkan tabel kondisi harian lengkap, filter, pencarian, pagination,
 * dan modal "Detail Satu Hari" dengan traceability perhitungan matematis.
 */

import { CalculationService } from './calculation.js';
import { store } from './store.js';

export class DailyView {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 25;
    this.sortColumn = 'tanggal';
    this.sortDirection = 'asc';
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.realisasiFilter = 'ALL'; // 'ALL' | 'ADA' | 'BELUM'
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('dailyTableSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.renderTable();
      });
    }

    // Status filter dropdown
    const statusSelect = document.getElementById('dailyStatusFilter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.currentPage = 1;
        this.renderTable();
      });
    }

    // Realisasi filter dropdown
    const realFilter = document.getElementById('dailyRealisasiFilter');
    if (realFilter) {
      realFilter.addEventListener('change', (e) => {
        this.realisasiFilter = e.target.value; // 'ALL' | 'ADA' | 'BELUM'
        this.currentPage = 1;
        this.renderTable();
      });
    }

    // Page size dropdown
    const pageSizeSelect = document.getElementById('dailyPageSize');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        this.pageSize = parseInt(e.target.value, 10);
        this.currentPage = 1;
        this.renderTable();
      });
    }

    // Export button on daily table
    const btnExportDaily = document.getElementById('btnExportDailyTable');
    if (btnExportDaily) {
      btnExportDaily.addEventListener('click', () => {
        if (window.ROTS_APP && window.ROTS_APP.importExport) {
          window.ROTS_APP.importExport.exportToExcel();
        }
      });
    }

    // Tombol Input Rencana (buka modal input rencana sesuai periode aktif)
    const btnInputPlan = document.getElementById('btnOpenInputRencana');
    if (btnInputPlan) {
      btnInputPlan.addEventListener('click', () => {
        const dateStr = store.filters.selectedDate || store.getFilteredRecords()[0]?.tanggal || '2026-07-01';
        if (window.ROTS_OPEN_INPUT_RENCANA) {
          window.ROTS_OPEN_INPUT_RENCANA(dateStr, store.planningPeriod.type);
        }
      });
    }

    // Tombol Upload Rencana (buka modal upload rencana)
    const btnUploadPlan = document.getElementById('btnUploadRencanaQuick');
    if (btnUploadPlan) {
      btnUploadPlan.addEventListener('click', () => {
        if (window.ROTS_OPEN_UPLOAD_RENCANA) {
          window.ROTS_OPEN_UPLOAD_RENCANA(store.planningPeriod.type);
        }
      });
    }

    // Tombol Input Realisasi Harian (buka modal form)
    const btnInputReal = document.getElementById('btnOpenInputRealisasi');
    if (btnInputReal) {
      btnInputReal.addEventListener('click', () => {
        const dateStr = store.filters.selectedDate || store.getFilteredRecords()[0]?.tanggal || '2026-07-01';
        if (window.ROTS_OPEN_REALISASI) {
          window.ROTS_OPEN_REALISASI(dateStr);
        } else if (window.ROTS_APP && window.ROTS_APP.openRealisasiModal) {
          window.ROTS_APP.openRealisasiModal(dateStr);
        }
      });
    }

    // Tombol Upload/Import Realisasi (buka modal upload cepat)
    const btnUpload = document.getElementById('btnUploadRealisasiQuick');
    if (btnUpload) {
      btnUpload.addEventListener('click', () => {
        const modalUpload = document.getElementById('modalUploadRealisasi');
        if (modalUpload) {
          modalUpload.classList.add('active');
        } else {
          // Fallback ke halaman Import Data tab Realisasi
          store.setCurrentView('import-data');
          setTimeout(() => {
            const tabReal = document.getElementById('tabImportRealisasi');
            if (tabReal) tabReal.click();
          }, 120);
        }
      });
    }

    // Table Header Sorting
    const thElements = document.querySelectorAll('#dailyTable th.sortable');
    thElements.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (this.sortColumn === col) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = col;
          this.sortDirection = 'asc';
        }
        this.renderTable();
      });
    });
  }

  getProcessedAndFilteredData() {
    let records = store.getFilteredRecords();

    // Filter by status if not ALL
    if (this.statusFilter && this.statusFilter !== 'ALL') {
      records = records.filter(r => r.statusKey === this.statusFilter);
    }

    // Filter by text search
    if (this.searchQuery) {
      records = records.filter(r => {
        const indoDate = CalculationService.formatDateIndo(r.tanggal).toLowerCase();
        return (
          r.tanggal.includes(this.searchQuery) ||
          r.sistem.toLowerCase().includes(this.searchQuery) ||
          r.statusLabel.toLowerCase().includes(this.searchQuery) ||
          indoDate.includes(this.searchQuery)
        );
      });
    }

    // Sorting
    records.sort((a, b) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return this.sortDirection === 'asc' ? cmp : -cmp;
      }
      return this.sortDirection === 'asc' ? (valA - valB) : (valB - valA);
    });

    // Filter by realisasi
    if (this.realisasiFilter === 'ADA') {
      records = records.filter(r => !!r.realisasi);
    } else if (this.realisasiFilter === 'BELUM') {
      records = records.filter(r => !r.realisasi);
    }

    return records;
  }

  render() {
    const pType = store.planningPeriod.type || 'ROTS';
    const lblPlan = document.getElementById('btnInputRencanaLabel');
    if (lblPlan) lblPlan.textContent = `Input Rencana (${pType})`;
    const thHeader = document.getElementById('thHeaderDataRencana');
    if (thHeader) thHeader.textContent = `📋 DATA RENCANA (${pType})`;
    this.renderTable();
  }

  renderTable() {
    const tbody = document.getElementById('dailyTableBody');
    if (!tbody) return;

    const allRecords = this.getProcessedAndFilteredData();
    const totalCount = allRecords.length;
    const totalPages = Math.ceil(totalCount / this.pageSize) || 1;

    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, totalCount);
    const pageRecords = allRecords.slice(startIdx, endIdx);

    if (pageRecords.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="16" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            Tidak ada data yang sesuai dengan filter pencarian.
          </td>
        </tr>
      `;
      this.renderPagination(0, 0, 0, 1);
      return;
    }

    tbody.innerHTML = pageRecords.map(r => {
      const isSelected = r.tanggal === store.filters.selectedDate;
      const cadClass = r.cad < 0 ? 'text-danger' : (r.cad < store.params.minReserveThreshold ? 'text-warning' : 'text-success');

      // ── Kolom Realisasi ──────────────────────────────────────────
      const real = r.realisasi;
      const hasReal = !!real;
      const realBg = 'background: rgba(16,185,129,0.06);';
      const realBpCell   = hasReal ? `<span style="font-weight:700;color:#047857">${CalculationService.formatNumber(real.bp)}</span>` : `<span style="color:#CBD5E1;font-style:italic">–</span>`;
      const realDmpCell  = hasReal ? `<span style="font-weight:700;color:#0284C7">${CalculationService.formatNumber(real.dmp)}</span>` : `<span style="color:#CBD5E1;font-style:italic">–</span>`;
      const realCadCell  = hasReal ? `<span style="font-weight:700;color:${real.cad<0?'#DC2626':(real.cad<store.params.minReserveThreshold?'#D97706':'#059669')}">${CalculationService.formatNumber(real.cad)}</span>` : `<span style="color:#CBD5E1;font-style:italic">–</span>`;
      let deltaBpCell = `<span style="color:#CBD5E1;font-style:italic">–</span>`;
      if (hasReal) {
        const delta = real.deltaBP;
        const sign  = delta > 0 ? '+' : '';
        const col   = delta > 0 ? '#D97706' : (delta < 0 ? '#059669' : '#64748B');
        deltaBpCell = `<span style="font-weight:700;color:${col}">${sign}${CalculationService.formatNumber(delta, 0)}</span>`;
      }
      const realStatusCell = hasReal
        ? `<span class="badge-status ${real.statusBadge}" style="font-size:10px;padding:2px 6px;">${real.statusLabel}</span>`
        : `<span style="color:#CBD5E1;font-size:10px;">Belum</span>`;

      // ── Tombol aksi inline ────────────────────────────────────────
      const btnEdit = `<button class="btn-inline-real btn-edit-real" data-date="${r.tanggal}" title="${hasReal?'Ubah':'Input'} Realisasi" style="cursor:pointer;border:1px solid ${hasReal?'#10B981':'#94A3B8'};background:${hasReal?'#ECFDF5':'#F8FAFC'};color:${hasReal?'#047857':'#64748B'};border-radius:4px;padding:2px 7px;font-size:10.5px;font-weight:600;">
        <i class="fa ${hasReal?'fa-pencil-alt':'fa-plus'}"></i> ${hasReal?'Ubah':'+ Input'}
      </button>`;

      return `
        <tr class="${isSelected ? 'active-row' : ''}" data-date="${r.tanggal}" title="Klik baris untuk detail formula">
          <td style="font-weight: 600;">
            <a href="javascript:void(0)" class="daily-row-link" style="color: var(--pln-navy-dark); text-decoration: none; border-bottom: 1px dotted var(--pln-blue-primary);">
              ${CalculationService.formatDateIndo(r.tanggal)}
            </a>
            ${hasReal ? `<span class="badge-realisasi-tag" style="margin-left: 4px;" title="Realisasi tersimpan"><i class="fa fa-bolt"></i> Real</span>` : ''}
          </td>
          <td><span class="badge-system">${r.sistem}</span></td>
          <td class="text-right">${CalculationService.formatNumber(r.dmn)}</td>
          <td class="text-right" style="color: #D97706;">${CalculationService.formatNumber(r.po)}</td>
          <td class="text-right" style="color: #D97706;">${CalculationService.formatNumber(r.mo)}</td>
          <td class="text-right" style="font-weight: 700; color: #D97706; background: rgba(245, 158, 11, 0.04);">${CalculationService.formatNumber(r.plannedOutage)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(r.fo)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(r.foEp)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(r.derKit)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(r.derTrans)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(r.varmus)}</td>
          <td class="text-right" style="font-weight: 700; color: #DC2626; background: rgba(239, 68, 68, 0.04);">${CalculationService.formatNumber(r.unplannedOutage)}</td>
          <td class="text-right" style="font-weight: 700; color: #059669; background: rgba(16, 185, 129, 0.04);">${CalculationService.formatNumber(r.dmp)}</td>
          <td class="text-right" style="font-weight: 700; color: #7C3AED;">${CalculationService.formatNumber(r.bp)}</td>
          <td class="text-right ${cadClass}" style="font-weight: 800;">${CalculationService.formatNumber(r.cad)}</td>
          <td class="text-center">
            <span class="badge-status ${r.statusBadge}">
              <span class="legend-dot dot-${r.statusKey.toLowerCase()}"></span>
              ${r.statusLabel}
            </span>
          </td>
          <!-- ── Kolom REALISASI AKTUAL ─────────────────────── -->
          <td class="text-right" style="${realBg} border-left: 2px solid #A7F3D0;">${realBpCell}</td>
          <td class="text-right" style="${realBg}">${realDmpCell}</td>
          <td class="text-right" style="${realBg}">${realCadCell}</td>
          <td class="text-right" style="${realBg}">${deltaBpCell}</td>
          <td class="text-center" style="${realBg}">${realStatusCell}</td>
          <td class="text-center" style="${realBg} border-right: 2px solid #A7F3D0;" onclick="event.stopPropagation()">${btnEdit}</td>
        </tr>
      `;
    }).join('');

    // Attach click listener on row to open Day Detail Modal
    tbody.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', () => {
        const dateStr = tr.getAttribute('data-date');
        if (dateStr) {
          this.openDetailModal(dateStr);
          store.setSelectedDate(dateStr);
        }
      });
    });

    // Listener tombol inline "Ubah / + Input" realisasi per baris
    tbody.querySelectorAll('.btn-edit-real').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // jangan trigger row click
        const dateStr = btn.getAttribute('data-date');
        if (!dateStr) return;
        store.setSelectedDate(dateStr);
        // Buka modal input realisasi
        if (window.ROTS_OPEN_REALISASI) {
          window.ROTS_OPEN_REALISASI(dateStr);
        } else if (window.ROTS_APP && window.ROTS_APP.openRealisasiModal) {
          window.ROTS_APP.openRealisasiModal(dateStr);
        }
      });
    });

    this.renderPagination(startIdx + 1, endIdx, totalCount, totalPages);
  }

  renderPagination(start, end, total, totalPages) {
    const info = document.getElementById('dailyPaginationInfo');
    const controls = document.getElementById('dailyPaginationControls');
    if (!info || !controls) return;

    if (total === 0) {
      info.textContent = 'Menampilkan 0 dari 0 data';
      controls.innerHTML = '';
      return;
    }

    info.textContent = `Menampilkan ${start} - ${end} dari ${total} data`;

    let html = `
      <button class="btn-page" id="btnPrevPage" ${this.currentPage === 1 ? 'disabled' : ''}>
        <i class="fa fa-chevron-left"></i> Prev
      </button>
    `;

    // Limit pagination buttons around current page
    const pStart = Math.max(1, this.currentPage - 2);
    const pEnd = Math.min(totalPages, this.currentPage + 2);

    for (let p = pStart; p <= pEnd; p++) {
      html += `
        <button class="btn-page ${p === this.currentPage ? 'active' : ''}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    html += `
      <button class="btn-page" id="btnNextPage" ${this.currentPage === totalPages ? 'disabled' : ''}>
        Next <i class="fa fa-chevron-right"></i>
      </button>
    `;

    controls.innerHTML = html;

    // Listeners for page buttons
    controls.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.getAttribute('data-page'), 10);
        this.renderTable();
      });
    });

    const btnPrev = document.getElementById('btnPrevPage');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderTable();
        }
      });
    }

    const btnNext = document.getElementById('btnNextPage');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderTable();
        }
      });
    }
  }

  /**
   * Modal Detail Satu Hari dengan Visual Breakdown Perhitungan
   */
  openDetailModal(dateStr) {
    const modal = document.getElementById('dayDetailModal');
    if (!modal) return;

    const allRecords = store.getProcessedRecords();
    const record = allRecords.find(r => r.tanggal === dateStr && r.sistem === store.filters.sistem) || allRecords.find(r => r.tanggal === dateStr);

    if (!record) return;

    const modalTitle = document.getElementById('dayDetailModalTitle');
    const modalBody = document.getElementById('dayDetailModalBody');

    if (modalTitle) {
      modalTitle.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span>Detail Operasi Harian & Trace Formula</span>
          <span class="badge-status ${record.statusBadge}">${record.statusLabel}</span>
        </div>
      `;
    }

    if (modalBody) {
      const threshold = store.params.minReserveThreshold;
      modalBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #F0F9FF; border: 1px solid #BAE6FD; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 12px; color: #0369A1; font-weight: 600;">TANGGAL & SISTEM</div>
            <div style="font-size: 17px; font-weight: 800; color: #0C4A6E;">
              ${CalculationService.formatDateIndo(record.tanggal)} &bull; ${record.sistem}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #0369A1; font-weight: 600;">BATAS MINIMUM OPERASI</div>
            <div style="font-size: 16px; font-weight: 800; color: #0284C7;">${CalculationService.formatNumber(threshold)} MW</div>
          </div>
        </div>

        <!-- 1. Kondisi Pembangkitan -->
        <div class="formula-step-card">
          <div class="formula-step-header">
            <div class="formula-step-name">
              <i class="fa fa-bolt" style="color: #0284C7;"></i>
              1. Kondisi Pembangkitan
            </div>
          </div>
          <div class="formula-math-display">
            <div class="formula-math-row">
              <span>Daya Mampu Netto (DMN)</span>
              <span style="font-weight: 700;">${CalculationService.formatNumber(record.dmn)} MW</span>
            </div>
          </div>
        </div>

        <!-- 2. Planned Outage Breakdown -->
        <div class="formula-step-card">
          <div class="formula-step-header">
            <div class="formula-step-name">
              <i class="fa fa-wrench" style="color: #F59E0B;"></i>
              2. Planned Outage (PO + MO)
            </div>
            <span style="font-size: 11px; font-family: monospace; color: #D97706; font-weight: 600;">Formula: PO + MO</span>
          </div>
          <div class="formula-math-display">
            <div class="formula-math-row">
              <span>PO (Planned Outage)</span>
              <span>${CalculationService.formatNumber(record.po)} MW</span>
            </div>
            <div class="formula-math-row">
              <span>MO (Maintenance Outage)</span>
              <span>+ ${CalculationService.formatNumber(record.mo)} MW</span>
            </div>
            <div class="formula-math-row row-total" style="color: #D97706;">
              <span>Total Planned Outage</span>
              <span>= ${CalculationService.formatNumber(record.plannedOutage)} MW</span>
            </div>
          </div>
        </div>

        <!-- 3. Unplanned Outage Breakdown -->
        <div class="formula-step-card">
          <div class="formula-step-header">
            <div class="formula-step-name">
              <i class="fa fa-exclamation-triangle" style="color: #EF4444;"></i>
              3. Unplanned Outage
            </div>
            <span style="font-size: 11px; font-family: monospace; color: #DC2626; font-weight: 600;">FO + FO EP + DER KIT + DER TRANS + VARMUS</span>
          </div>
          <div class="formula-math-display">
            <div class="formula-math-row">
              <span>FO (Forced Outage)</span>
              <span>${CalculationService.formatNumber(record.fo)} MW</span>
            </div>
            <div class="formula-math-row">
              <span>FO EP (FO Extension Period)</span>
              <span>+ ${CalculationService.formatNumber(record.foEp)} MW</span>
            </div>
            <div class="formula-math-row">
              <span>DER KIT (Derating Pembangkit)</span>
              <span>+ ${CalculationService.formatNumber(record.derKit)} MW</span>
            </div>
            <div class="formula-math-row">
              <span>DER TRANS (Derating Transmisi)</span>
              <span>+ ${CalculationService.formatNumber(record.derTrans)} MW</span>
            </div>
            <div class="formula-math-row">
              <span>VARMUS (Variasi Musiman)</span>
              <span>+ ${CalculationService.formatNumber(record.varmus)} MW</span>
            </div>
            <div class="formula-math-row row-total" style="color: #DC2626;">
              <span>Total Unplanned Outage</span>
              <span>= ${CalculationService.formatNumber(record.unplannedOutage)} MW</span>
            </div>
          </div>
        </div>

        <!-- 4. Hasil Perhitungan DMP & CAD -->
        <div class="formula-step-card" style="border-left: 4px solid #00A3E0;">
          <div class="formula-step-header">
            <div class="formula-step-name">
              <i class="fa fa-calculator" style="color: #00A3E0;"></i>
              4. Perhitungan DMP (Daya Mampu Pembangkitan)
            </div>
            <span style="font-size: 11px; font-family: monospace; color: #0284C7; font-weight: 600;">DMP = DMN − Planned Outage − Unplanned Outage</span>
          </div>
          <div class="formula-math-display">
            <div class="formula-math-row">
              <span>Daya Mampu Netto (DMN)</span>
              <span>${CalculationService.formatNumber(record.dmn)} MW</span>
            </div>
            <div class="formula-math-row">
              <span>Planned Outage</span>
              <span style="color: #D97706;">− ${CalculationService.formatNumber(record.plannedOutage)} MW</span>
            </div>
            <div class="formula-math-row">
              <span>Unplanned Outage</span>
              <span style="color: #DC2626;">− ${CalculationService.formatNumber(record.unplannedOutage)} MW</span>
            </div>
            <div class="formula-math-row row-total" style="color: #059669; font-size: 14px;">
              <span>DMP (Daya Mampu Pembangkitan)</span>
              <span>= ${CalculationService.formatNumber(record.dmp)} MW</span>
            </div>
          </div>
        </div>

        <div class="formula-step-card" style="border-left: 4px solid #7C3AED;">
          <div class="formula-step-header">
            <div class="formula-step-name">
              <i class="fa fa-chart-line" style="color: #7C3AED;"></i>
              5. Perhitungan Cadangan Daya (CAD)
            </div>
            <span style="font-size: 11px; font-family: monospace; color: #7C3AED; font-weight: 600;">CAD = DMP − BP</span>
          </div>
          <div class="formula-math-display">
            <div class="formula-math-row">
              <span>DMP</span>
              <span>${CalculationService.formatNumber(record.dmp)} MW</span>
            </div>
            <div class="formula-math-row">
              <span>Beban Puncak (BP)</span>
              <span style="color: #7C3AED;">− ${CalculationService.formatNumber(record.bp)} MW</span>
            </div>
            <div class="formula-math-row row-total" style="color: #0D9488; font-size: 14px;">
              <span>Cadangan Daya (CAD)</span>
              <span>= ${CalculationService.formatNumber(record.cad)} MW</span>
            </div>
          </div>
        </div>

        <!-- 6. Penentuan Status Sistem -->
        <div class="formula-step-card" style="border: 2px solid ${record.statusColor}; background: #FFFFFF;">
          <div class="formula-step-header">
            <div class="formula-step-name" style="color: ${record.statusColor};">
              <i class="fa fa-shield-alt"></i>
              6. Kesimpulan Status Sistem
            </div>
          </div>
          <div style="font-size: 13px; color: var(--text-main); line-height: 1.6;">
            <div>Berdasarkan perbandingan CAD terhadap Batas Cadangan Minimum (<strong>${CalculationService.formatNumber(threshold)} MW</strong>):</div>
            <div style="margin-top: 6px; font-family: monospace; font-size: 13.5px; padding: 8px 12px; background: #F8FAFC; border-radius: 6px;">
              ${record.cad < 0 
                ? `CAD (${CalculationService.formatNumber(record.cad)} MW) < 0 MW &rarr; <span style="color: #EF4444; font-weight: 800;">DEFISIT</span>`
                : (record.cad < threshold 
                    ? `0 &le; CAD (${CalculationService.formatNumber(record.cad)} MW) < ${CalculationService.formatNumber(threshold)} MW &rarr; <span style="color: #F59E0B; font-weight: 800;">SIAGA</span>`
                    : `CAD (${CalculationService.formatNumber(record.cad)} MW) &ge; ${CalculationService.formatNumber(threshold)} MW &rarr; <span style="color: #10B981; font-weight: 800;">NORMAL</span>`
                  )
              }
            </div>
          </div>
        </div>

        <!-- 7. Evaluasi Komparasi Rencana vs Realisasi -->
        <div class="formula-step-card" style="border-left: 4px solid #10B981; background: #F0FDF4; margin-top: 14px;">
          <div class="formula-step-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="formula-step-name" style="color: #047857;">
              <i class="fa fa-balance-scale"></i>
              7. Data Realisasi Aktual & Evaluasi Deviasi
            </div>
            <button type="button" class="header-btn" id="btnModalEditRealisasi" style="background: #10B981; color: #FFFFFF; border-color: #10B981; font-size: 11.5px; padding: 4px 12px; cursor: pointer;">
              <i class="fa fa-pencil-alt"></i> ${record.realisasi ? 'Ubah Realisasi' : '+ Input Realisasi'}
            </button>
          </div>
          ${record.realisasi ? `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; text-align: center;">
              <div style="background: #FFFFFF; padding: 10px 8px; border-radius: 6px; border: 1px solid #D1FAE5;">
                <div style="font-size: 11px; color: #64748B;">BP Realisasi</div>
                <div style="font-size: 14px; font-weight: 700; color: #1E293B;">${CalculationService.formatNumber(record.realisasi.bp)} MW</div>
                <div style="font-size: 11px; color: ${record.realisasi.deltaBP > 0 ? '#D97706' : '#059669'}; font-weight: 700;">
                  ${CalculationService.formatDelta(record.realisasi.deltaBP)}
                </div>
              </div>
              <div style="background: #FFFFFF; padding: 10px 8px; border-radius: 6px; border: 1px solid #D1FAE5;">
                <div style="font-size: 11px; color: #64748B;">DMP Realisasi</div>
                <div style="font-size: 14px; font-weight: 700; color: #1E293B;">${CalculationService.formatNumber(record.realisasi.dmp)} MW</div>
                <div style="font-size: 11px; color: #64748B;">Plan: ${CalculationService.formatNumber(record.dmp)}</div>
              </div>
              <div style="background: #FFFFFF; padding: 10px 8px; border-radius: 6px; border: 1px solid #D1FAE5;">
                <div style="font-size: 11px; color: #64748B;">Cadangan (CAD) Real</div>
                <div style="font-size: 14px; font-weight: 700; color: #047857;">${CalculationService.formatNumber(record.realisasi.cad)} MW</div>
                <div style="font-size: 11px; color: ${record.realisasi.deltaCAD >= 0 ? '#059669' : '#DC2626'}; font-weight: 700;">
                  ${CalculationService.formatDelta(record.realisasi.deltaCAD)}
                </div>
              </div>
              <div style="background: #FFFFFF; padding: 10px 8px; border-radius: 6px; border: 1px solid #D1FAE5;">
                <div style="font-size: 11px; color: #64748B;">Akurasi Forecast BP</div>
                <div style="font-size: 14px; font-weight: 700; color: #1E293B;">${record.realisasi.accuracyBP.toFixed(1)}%</div>
                <span class="badge-status ${record.realisasi.statusBadge}" style="font-size: 9.5px; padding: 1px 6px;">${record.realisasi.statusLabel}</span>
              </div>
            </div>
            ${record.realisasi.notes ? `<div style="margin-top: 10px; font-size: 11.5px; color: #475569; font-style: italic;">Catatan: ${record.realisasi.notes}</div>` : ''}
          ` : `
            <div style="padding: 12px; font-size: 12.5px; color: #64748B; font-style: italic;">
              Belum ada data realisasi aktual untuk tanggal ini. Klik tombol di atas untuk memasukkan data realisasi.
            </div>
          `}
        </div>
      `;

      const btnEditReal = modalBody.querySelector('#btnModalEditRealisasi');
      if (btnEditReal) {
        btnEditReal.addEventListener('click', () => {
          this.closeDetailModal();
          if (window.ROTS_OPEN_REALISASI) {
            window.ROTS_OPEN_REALISASI(dateStr);
          }
        });
      }
    }

    modal.classList.add('active');
  }

  closeDetailModal() {
    const modal = document.getElementById('dayDetailModal');
    if (modal) modal.classList.remove('active');
  }
}

export const dailyView = new DailyView();
