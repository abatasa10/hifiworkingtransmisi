/**
 * ROTS PLN OPERASI SISTEM - Import & Export Module
 * Validasi ketat import Excel/CSV, kalkulasi otomatis, unduh template,
 * dan export XLSX & PDF resmi.
 */

import { CalculationService } from './calculation.js?v=8';
import { store } from './store.js?v=8';

export class ImportExportService {
  constructor() {
    this.stagedRecords = [];
    this.validationErrors = [];
    this.importMode = 'rencana'; // 'rencana' | 'realisasi'
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Mode Switcher Tabs (Rencana vs Realisasi)
    const tabRencana = document.getElementById('tabImportRencana');
    const tabRealisasi = document.getElementById('tabImportRealisasi');
    const titleEl = document.getElementById('importViewTitle');
    const btnTemplateText = document.getElementById('btnDownloadTemplateText');
    const dropTitle = document.getElementById('dropzoneTitleText');
    const dropSub = document.getElementById('dropzoneSubText');
    const rulesBox = document.getElementById('importRulesBox');

    if (tabRencana && tabRealisasi) {
      tabRencana.addEventListener('click', () => {
        this.importMode = 'rencana';
        tabRencana.classList.add('active');
        tabRealisasi.classList.remove('active');
        if (titleEl) titleEl.textContent = 'Import Data Operasi ROTS Excel / CSV';
        if (btnTemplateText) btnTemplateText.textContent = 'Unduh Template Rencana ROTS (.xlsx)';
        if (dropTitle) dropTitle.textContent = 'Tarik & Letakkan File Excel ROTS di Sini';
        if (dropSub) dropSub.textContent = 'Mendukung format .xlsx, .xls, dan .csv dengan kolom standar perencanaan ROTS';
        if (rulesBox) {
          rulesBox.innerHTML = `
            <strong>Kriteria Validasi Sistem Rencana:</strong>
            <ul style="margin-left: 20px; margin-top: 6px;">
              <li>Kolom wajib: <code>Sistem</code>, <code>Tanggal</code>, <code>DMN</code>, <code>PO</code>, <code>MO</code>, <code>FO</code>, <code>FO EP</code>, <code>DER KIT</code>, <code>DER TRANS</code>, <code>VARMUS</code>, <code>BP</code>.</li>
              <li>Nilai MW harus numerik dan tidak boleh negatif.</li>
              <li>Sistem akan otomatis menghitung Planned Outage, DMP, CAD, dan Status sesuai formula standar.</li>
            </ul>
          `;
        }
      });

      tabRealisasi.addEventListener('click', () => {
        this.importMode = 'realisasi';
        tabRealisasi.classList.add('active');
        tabRencana.classList.remove('active');
        if (titleEl) titleEl.textContent = 'Import Data Realisasi Aktual Harian Excel / CSV';
        if (btnTemplateText) btnTemplateText.textContent = 'Unduh Template Realisasi Aktual (.xlsx)';
        if (dropTitle) dropTitle.textContent = 'Tarik & Letakkan File Excel Realisasi di Sini';
        if (dropSub) dropSub.textContent = 'Format Excel dengan kolom Tanggal, BP_Realisasi, Outage aktual untuk perbandingan Rencana vs Realisasi';
        if (rulesBox) {
          rulesBox.innerHTML = `
            <strong>Kriteria Validasi Sistem Realisasi Aktual:</strong>
            <ul style="margin-left: 20px; margin-top: 6px;">
              <li>Kolom wajib: <code>Tanggal</code> (format YYYY-MM-DD), <code>BP_Realisasi</code> (Beban Puncak aktual).</li>
              <li>Kolom opsional: <code>DMN_Realisasi</code>, <code>PO_Realisasi</code>, <code>MO_Realisasi</code>, <code>FO_Realisasi</code>, <code>Derating_Realisasi</code>, <code>Catatan</code>.</li>
              <li>Sistem akan otomatis membandingkan dengan rencana hari tersebut dan menghitung deviasi (Δ).</li>
            </ul>
          `;
        }
      });
    }

    // Dropzone events
    const dropzone = document.getElementById('excelDropzone');
    const fileInput = document.getElementById('excelFileInput');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFile(e.target.files[0]);
        }
      });
    }

    // Download Template button
    const btnDownloadTemplate = document.getElementById('btnDownloadExcelTemplate');
    if (btnDownloadTemplate) {
      btnDownloadTemplate.addEventListener('click', () => this.downloadTemplate());
    }

    // Commit Import button
    const btnCommitImport = document.getElementById('btnCommitImport');
    if (btnCommitImport) {
      btnCommitImport.addEventListener('click', () => this.commitImport());
    }

    // Global Export Buttons
    const btnGlobalExport = document.getElementById('btnGlobalExport');
    if (btnGlobalExport) {
      btnGlobalExport.addEventListener('click', () => this.exportToExcel());
    }

    const btnExportExcelPage = document.getElementById('btnExportExcelPage');
    if (btnExportExcelPage) {
      btnExportExcelPage.addEventListener('click', () => this.exportToExcel());
    }

    const btnExportPdf = document.getElementById('btnExportPdf');
    if (btnExportPdf) {
      btnExportPdf.addEventListener('click', () => this.exportToPdf());
    }
  }

  handleFile(file) {
    const reader = new FileReader();
    const isCsv = file.name.endsWith('.csv');

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        this.validateAndStage(rawJson, file.name);
      } catch (err) {
        alert('Gagal membaca file Excel: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  validateAndStage(rawRows, filename) {
    this.stagedRecords = [];
    this.validationErrors = [];

    const existingKeys = new Set();
    const threshold = store.params.minReserveThreshold;

    const normalizeHeader = (row, fieldNames) => {
      for (const name of fieldNames) {
        for (const k of Object.keys(row)) {
          if (k.trim().toUpperCase() === name.toUpperCase()) {
            return row[k];
          }
        }
      }
      return undefined;
    };
    if (this.importMode === 'realisasi') {
      this.validateAndStageRealisasi(rawRows, filename);
      return;
    }

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const errors = [];

      // Baca Kolom Wajib
      const sistemRaw = normalizeHeader(row, ['Sistem', 'SISTEM', 'System']);
      const tanggalRaw = normalizeHeader(row, ['Tanggal', 'TANGGAL', 'Date']);
      const dmnRaw = normalizeHeader(row, ['DMN', 'Daya Mampu Netto']);
      const poRaw = normalizeHeader(row, ['PO', 'Planned Outage PO']);
      const moRaw = normalizeHeader(row, ['MO', 'Maintenance Outage MO']);
      const foRaw = normalizeHeader(row, ['FO', 'Forced Outage FO']);
      const foEpRaw = normalizeHeader(row, ['FO EP', 'FO_EP', 'FOEP']);
      const derKitRaw = normalizeHeader(row, ['DER KIT', 'DER_KIT', 'DERKIT']);
      const derTransRaw = normalizeHeader(row, ['DER TRANS', 'DER_TRANS', 'DERTRANS']);
      const varmusRaw = normalizeHeader(row, ['VARMUS', 'Variasi Musiman']);
      const bpRaw = normalizeHeader(row, ['BP', 'Beban Puncak']);

      // 1. Validasi Sistem
      if (!sistemRaw || String(sistemRaw).trim() === '') {
        errors.push('Sistem wajib terisi');
      }

      // 2. Validasi Tanggal
      let formattedDate = '';
      if (!tanggalRaw) {
        errors.push('Tanggal wajib diisi');
      } else {
        if (typeof tanggalRaw === 'number') {
          // Excel serial date to JS Date
          const excelEpoch = new Date(1899, 11, 30);
          const dateObj = new Date(excelEpoch.getTime() + tanggalRaw * 86400000);
          formattedDate = dateObj.toISOString().substring(0, 10);
        } else {
          const str = String(tanggalRaw).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            formattedDate = str;
          } else {
            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) {
              formattedDate = parsed.toISOString().substring(0, 10);
            } else {
              errors.push(`Format tanggal '${str}' tidak valid`);
            }
          }
        }
      }

      // 3. Validasi Nilai Numerik MW
      const parseMw = (val, colName) => {
        if (val === undefined || val === null || val === '') return 0;
        const n = parseFloat(String(val).replace(',', '.'));
        if (isNaN(n) || n < 0) {
          errors.push(`Nilai ${colName} (${val}) tidak valid`);
          return 0;
        }
        return n;
      };

      const dmn = parseMw(dmnRaw, 'DMN');
      const po = parseMw(poRaw, 'PO');
      const mo = parseMw(moRaw, 'MO');
      const fo = parseMw(foRaw, 'FO');
      const foEp = parseMw(foEpRaw, 'FO EP');
      const derKit = parseMw(derKitRaw, 'DER KIT');
      const derTrans = parseMw(derTransRaw, 'DER TRANS');
      const varmus = parseMw(varmusRaw, 'VARMUS');
      const bp = parseMw(bpRaw, 'BP');

      // 4. Deteksi Duplikasi Sistem + Tanggal
      const key = `${sistemRaw}_${formattedDate}`;
      if (existingKeys.has(key)) {
        errors.push(`Duplikasi data untuk Sistem '${sistemRaw}' pada Tanggal '${formattedDate}'`);
      } else {
        existingKeys.add(key);
      }

      const rawRecord = {
        sistem: String(sistemRaw).trim(),
        tanggal: formattedDate,
        dmn, po, mo, fo, foEp, derKit, derTrans, varmus, bp
      };

      // Hitung kalkulasi otomatis ROTS
      const processed = CalculationService.processRecord(rawRecord, threshold);

      if (errors.length > 0) {
        this.validationErrors.push({ rowNum, errors, rawRecord });
      } else {
        this.stagedRecords.push(processed);
      }
    });

    this.renderValidationPreview(filename);
  }

  validateAndStageRealisasi(rawRows, filename) {
    const normalizeHeader = (row, fieldNames) => {
      for (const name of fieldNames) {
        for (const k of Object.keys(row)) {
          if (k.trim().toUpperCase() === name.toUpperCase()) {
            return row[k];
          }
        }
      }
      return undefined;
    };

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;
      const errors = [];

      const tanggalRaw = normalizeHeader(row, ['Tanggal', 'TANGGAL', 'Date']);
      const bpRaw = normalizeHeader(row, ['BP_Realisasi', 'BP', 'Beban Puncak', 'Beban_Puncak']);
      const dmnRaw = normalizeHeader(row, ['DMN_Realisasi', 'DMN']);
      const poRaw = normalizeHeader(row, ['PO_Realisasi', 'PO']);
      const moRaw = normalizeHeader(row, ['MO_Realisasi', 'MO']);
      const foRaw = normalizeHeader(row, ['FO_Realisasi', 'FO']);
      const derRaw = normalizeHeader(row, ['Derating_Realisasi', 'Derating', 'DER KIT']);
      const notesRaw = normalizeHeader(row, ['Catatan', 'Notes', 'Keterangan']);

      let formattedDate = '';
      if (!tanggalRaw) {
        errors.push('Tanggal wajib diisi');
      } else {
        if (typeof tanggalRaw === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const dateObj = new Date(excelEpoch.getTime() + tanggalRaw * 86400000);
          formattedDate = dateObj.toISOString().substring(0, 10);
        } else {
          const str = String(tanggalRaw).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            formattedDate = str;
          } else {
            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) {
              formattedDate = parsed.toISOString().substring(0, 10);
            } else {
              errors.push(`Format tanggal '${str}' tidak valid`);
            }
          }
        }
      }

      const bp = parseFloat(String(bpRaw || '').replace(',', '.'));
      if (isNaN(bp) || bp <= 0) {
        errors.push('Beban Puncak (BP) Realisasi wajib diisi angka > 0');
      }

      // Check matching plan record
      const planRec = store.records.find(r => r.tanggal === formattedDate);
      if (!planRec && formattedDate) {
        errors.push(`Tanggal ${formattedDate} tidak ditemukan pada data perencanaan ROTS aktif`);
      }

      const item = {
        tanggal: formattedDate,
        bp: isNaN(bp) ? 0 : bp,
        dmn: dmnRaw ? parseFloat(String(dmnRaw).replace(',', '.')) : (planRec ? planRec.dmn : 49040.62),
        po: poRaw ? parseFloat(String(poRaw).replace(',', '.')) : 0,
        mo: moRaw ? parseFloat(String(moRaw).replace(',', '.')) : 0,
        fo: foRaw ? parseFloat(String(foRaw).replace(',', '.')) : 0,
        derKit: derRaw ? parseFloat(String(derRaw).replace(',', '.')) : 0,
        derTrans: 0,
        foEp: 0,
        varmus: 0,
        notes: String(notesRaw || 'Import Excel Realisasi').trim(),
        planBP: planRec ? planRec.bp : 0
      };

      if (errors.length > 0) {
        this.validationErrors.push({ rowNum, errors, rawRecord: item });
      } else {
        this.stagedRecords.push(item);
      }
    });

    this.renderValidationPreview(filename);
  }

  renderValidationPreview(filename) {
    const container = document.getElementById('importPreviewContainer');
    if (!container) return;

    container.style.display = 'block';

    const validCount = this.stagedRecords.length;
    const errorCount = this.validationErrors.length;
    const total = validCount + errorCount;

    const summaryEl = document.getElementById('importValidationSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="val-stat" style="color: var(--pln-navy-dark);">
          <i class="fa fa-file-excel" style="color: #10B981;"></i> File: <strong>${filename}</strong> (${total} baris, Mode: ${this.importMode.toUpperCase()})
        </div>
        <div class="val-stat" style="color: #10B981;">
          <i class="fa fa-check-circle"></i> <strong>${validCount}</strong> baris valid & siap diimpor
        </div>
        ${errorCount > 0 ? `
          <div class="val-stat" style="color: #EF4444;">
            <i class="fa fa-times-circle"></i> <strong>${errorCount}</strong> baris error
          </div>
        ` : ''}
      `;
    }

    const btnCommit = document.getElementById('btnCommitImport');
    if (btnCommit) {
      btnCommit.disabled = validCount === 0;
      btnCommit.textContent = this.importMode === 'realisasi'
        ? `Simpan & Terapkan ${validCount} Data Realisasi`
        : `Simpan ${validCount} Data ke Sistem ROTS`;
    }

    const previewTbody = document.getElementById('importPreviewTbody');
    if (previewTbody) {
      let rowsHtml = '';

      // Tampilkan error rows dulu
      this.validationErrors.forEach(err => {
        rowsHtml += `
          <tr style="background: #FEF2F2;">
            <td><span class="badge-status badge-defisit">ERROR (Baris ${err.rowNum})</span></td>
            <td>${err.rawRecord.sistem || 'Jamali'}</td>
            <td>${err.rawRecord.tanggal || '-'}</td>
            <td colspan="6" style="color: #DC2626; font-weight: 600;">
              ${err.errors.join('; ')}
            </td>
          </tr>
        `;
      });

      // Tampilkan baris valid
      if (this.importMode === 'realisasi') {
        this.stagedRecords.slice(0, 10).forEach(r => {
          const delta = r.bp - r.planBP;
          rowsHtml += `
            <tr>
              <td><span class="badge-status badge-normal">REALISASI</span></td>
              <td><strong>Jamali</strong></td>
              <td>${CalculationService.formatDateIndo(r.tanggal)}</td>
              <td class="text-right">${CalculationService.formatNumber(r.dmn)}</td>
              <td class="text-right" style="color: #64748B;">Plan: ${CalculationService.formatNumber(r.planBP)}</td>
              <td class="text-right" style="color: #10B981; font-weight: 700;">Real: ${CalculationService.formatNumber(r.bp)}</td>
              <td class="text-right" style="font-weight: 700; color: ${delta > 0 ? '#F59E0B' : '#10B981'};">
                ${CalculationService.formatDelta(delta)}
              </td>
              <td class="text-right" style="color: #64748B;">${r.notes || '-'}</td>
              <td class="text-right"><span class="badge-realisasi-tag"><i class="fa fa-check"></i> Siap</span></td>
            </tr>
          `;
        });
      } else {
        this.stagedRecords.slice(0, 10).forEach(r => {
          rowsHtml += `
            <tr>
              <td><span class="badge-status badge-normal">VALID</span></td>
              <td><strong>${r.sistem}</strong></td>
              <td>${CalculationService.formatDateIndo(r.tanggal)}</td>
              <td class="text-right">${CalculationService.formatNumber(r.dmn)}</td>
              <td class="text-right" style="color: #D97706;">${CalculationService.formatNumber(r.plannedOutage)}</td>
              <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(r.unplannedOutage)}</td>
              <td class="text-right" style="color: #059669; font-weight: 700;">${CalculationService.formatNumber(r.dmp)}</td>
              <td class="text-right" style="color: #7C3AED; font-weight: 700;">${CalculationService.formatNumber(r.bp)}</td>
              <td class="text-right" style="font-weight: 800;">${CalculationService.formatNumber(r.cad)}</td>
            </tr>
          `;
        });
      }

      if (this.stagedRecords.length > 10) {
        rowsHtml += `
          <tr>
            <td colspan="9" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 12px;">
              ... dan ${this.stagedRecords.length - 10} baris valid lainnya ...
            </td>
          </tr>
        `;
      }

      previewTbody.innerHTML = rowsHtml;
    }
  }

  commitImport() {
    if (!this.stagedRecords.length) return;

    if (this.importMode === 'realisasi') {
      const count = store.importRealisasiRecords(this.stagedRecords);
      alert(`Berhasil mengimpor ${count} data realisasi aktual ke dalam sistem! Beralih ke tampilan Komparasi.`);
      const container = document.getElementById('importPreviewContainer');
      if (container) container.style.display = 'none';

      // Aktifkan mode komparasi
      store.setViewMode('komparasi');
      const pillKomparasi = document.getElementById('pillModeKomparasi');
      if (pillKomparasi) {
        document.querySelectorAll('.view-mode-pill').forEach(p => p.classList.remove('active'));
        pillKomparasi.classList.add('active');
      }
      store.setCurrentView('dashboard');
      return;
    }

    const rawRecordsToSave = this.stagedRecords.map(r => ({
      id: `${r.sistem}_${r.tanggal}`,
      sistem: r.sistem,
      tanggal: r.tanggal,
      dmn: r.dmn,
      po: r.po,
      mo: r.mo,
      fo: r.fo,
      foEp: r.foEp,
      derKit: r.derKit,
      derTrans: r.derTrans,
      varmus: r.varmus,
      bp: r.bp
    }));

    const overwrite = document.getElementById('checkOverwriteExisting')?.checked || false;
    store.importRecords(rawRecordsToSave, overwrite);

    alert(`Berhasil mengimpor ${rawRecordsToSave.length} data ke dalam sistem ROTS PLN Operasi Sistem!`);

    // Sembunyikan preview
    const container = document.getElementById('importPreviewContainer');
    if (container) container.style.display = 'none';

    // Beralih ke halaman Kondisi Harian
    store.setCurrentView('kondisi-harian');
  }

  downloadTemplate() {
    if (this.importMode === 'realisasi') {
      const sampleRecords = store.getFilteredRecords().slice(0, 5);
      const templateData = sampleRecords.map((r, i) => ({
        'Tanggal': r.tanggal,
        'BP_Realisasi': Math.round((r.bp + (i % 2 === 0 ? 150.25 : -95.50)) * 100) / 100,
        'DMN_Realisasi': r.dmn,
        'PO_Realisasi': r.po,
        'MO_Realisasi': r.mo,
        'FO_Realisasi': r.fo,
        'Derating_Realisasi': r.derKit,
        'Catatan': `Realisasi operasional ${CalculationService.formatDateIndo(r.tanggal)}`
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template_Realisasi');
      XLSX.writeFile(wb, 'Template_Realisasi_Operasi_PLN.xlsx');
      return;
    }

    const templateData = [
      {
        'Sistem': 'Jamali',
        'Tanggal': '2026-07-01',
        'DMN': 49040.624,
        'PO': 4490.551,
        'MO': 279.532,
        'FO': 1481.444,
        'FO EP': 4020.281,
        'DER KIT': 1481.444,
        'DER TRANS': 0,
        'VARMUS': 1393.890,
        'BP': 33950.208
      },
      {
        'Sistem': 'Jamali',
        'Tanggal': '2026-07-02',
        'DMN': 49040.624,
        'PO': 4350.200,
        'MO': 265.100,
        'FO': 1420.000,
        'FO EP': 3910.500,
        'DER KIT': 1450.000,
        'DER TRANS': 0,
        'VARMUS': 1380.000,
        'BP': 34120.500
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_ROTS_PLN');
    XLSX.writeFile(wb, 'ROTS_PLN_Operasi_Sistem_Template.xlsx');
  }

  exportToExcel() {
    const records = store.getFilteredRecords();
    const threshold = store.params.minReserveThreshold;

    // 1. Data Harian
    const excelRows = records.map(r => ({
      'Tanggal': r.tanggal,
      'Sistem': r.sistem,
      'DMN (MW)': r.dmn,
      'PO (MW)': r.po,
      'MO (MW)': r.mo,
      'Planned Outage (MW)': r.plannedOutage,
      'FO (MW)': r.fo,
      'FO EP (MW)': r.foEp,
      'DER KIT (MW)': r.derKit,
      'DER TRANS (MW)': r.derTrans,
      'VARMUS (MW)': r.varmus,
      'Unplanned Outage (MW)': r.unplannedOutage,
      'DMP (MW)': r.dmp,
      'BP (MW)': r.bp,
      'CAD (MW)': r.cad,
      'Status Operasi': r.statusLabel,
      'Batas Cadangan (MW)': threshold
    }));

    // 2. Ringkasan Bulanan
    const monthlySummary = store.getMonthlySummary();
    const monthlyRows = monthlySummary.rows.map(m => ({
      'Bulan': m.monthLabel,
      'DMP Average (MW)': m.dmpAvg,
      'BP Max (MW)': m.bpMax,
      'CAD Average (MW)': m.cadAvg,
      'CAD Min (MW)': m.cadMin,
      'Hari Normal': m.normal,
      'Hari Siaga': m.siaga,
      'Hari Defisit': m.defisit,
      'Total Hari': m.totalDays
    }));

    // Tambah baris total summary
    monthlyRows.push({
      'Bulan': 'TOTAL / RATA-RATA',
      'DMP Average (MW)': monthlySummary.summaryRow.dmpAvg,
      'BP Max (MW)': monthlySummary.summaryRow.bpMax,
      'CAD Average (MW)': monthlySummary.summaryRow.cadAvg,
      'CAD Min (MW)': monthlySummary.summaryRow.cadMin,
      'Hari Normal': monthlySummary.summaryRow.normal,
      'Hari Siaga': monthlySummary.summaryRow.siaga,
      'Hari Defisit': monthlySummary.summaryRow.defisit,
      'Total Hari': monthlySummary.summaryRow.totalDays
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(excelRows);
    const ws2 = XLSX.utils.json_to_sheet(monthlyRows);

    XLSX.utils.book_append_sheet(wb, ws1, 'Kondisi Harian');
    XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan Bulanan');

    const filename = `ROTS_PLN_${store.filters.sistem}_${store.filters.semester.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  exportToPdf() {
    window.print();
  }
}

export const importExportService = new ImportExportService();
