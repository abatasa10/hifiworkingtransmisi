/**
 * ROTS PLN TRANSMISI - State & Data Store
 * Menyimpan data operasional, parameter ambang batas, master data sistem, dan audit trail.
 */

import { CalculationService } from './calculation.js';
import { generateSeedData } from './seedData.js';

const STORAGE_KEY_RECORDS = 'ROTS_PLN_RECORDS_V3';
const STORAGE_KEY_PARAMS = 'ROTS_PLN_PARAMS_V2';
const STORAGE_KEY_AUDIT = 'ROTS_PLN_AUDIT_V2';
const STORAGE_KEY_SYSTEMS = 'ROTS_PLN_SYSTEMS_V2';

class Store {
  constructor() {
    this.listeners = [];
    this.init();
  }

  init() {
    // 1. Inisialisasi Parameter Batas Cadangan Minimum (Default 2.000 MW)
    const savedParams = localStorage.getItem(STORAGE_KEY_PARAMS);
    if (savedParams) {
      try {
        this.params = JSON.parse(savedParams);
      } catch (e) {
        this.params = { minReserveThreshold: 2000 };
      }
    } else {
      this.params = {
        minReserveThreshold: 2000,
        periodParams: {
          ROT:  { dmnAdjust: 0,    foderAdj: 0,     cadMin: 2000 },
          ROTS: { dmnAdjust: 0,    foderAdj: 0,     cadMin: 2000 },
          ROB:  { dmnAdjust: -200, foderAdj: 0.005, cadMin: 1800 },
          ROM:  { dmnAdjust: -350, foderAdj: 0.008, cadMin: 1500 }
        }
      };
      this.saveParams();
    }

    // Pastikan periodParams selalu ada (migrasi dari versi lama)
    if (!this.params.periodParams) {
      this.params.periodParams = {
        ROT:  { dmnAdjust: 0,    foderAdj: 0,     cadMin: 2000 },
        ROTS: { dmnAdjust: 0,    foderAdj: 0,     cadMin: 2000 },
        ROB:  { dmnAdjust: -200, foderAdj: 0.005, cadMin: 1800 },
        ROM:  { dmnAdjust: -350, foderAdj: 0.008, cadMin: 1500 }
      };
      this.saveParams();
    }

    // 2. Inisialisasi Master Data Sistem
    const savedSystems = localStorage.getItem(STORAGE_KEY_SYSTEMS);
    if (savedSystems) {
      try {
        this.systems = JSON.parse(savedSystems);
      } catch (e) {
        this.systems = null;
      }
    }
    if (!this.systems || !this.systems.length) {
      this.systems = [
        { id: 'sys-1', code: 'Jamali', name: 'Sistem Jawa Madura Bali', active: true, region: 'Jawa Bali' },
        { id: 'sys-2', code: 'Sumatera', name: 'Sistem Sumatera', active: true, region: 'Sumatera' },
        { id: 'sys-3', code: 'Interkoneksi', name: 'Sistem Interkoneksi Kalseltengtim', active: true, region: 'Kalimantan' },
        { id: 'sys-4', code: 'Khatulistiwa', name: 'Sistem Khatulistiwa', active: true, region: 'Kalimantan' },
        { id: 'sys-5', code: 'Sulbagsel', name: 'Sistem Sulawesi Bagian Selatan', active: true, region: 'Sulawesi' },
        { id: 'sys-6', code: 'Sulutgo', name: 'Sistem Sulawesi Utara dan Gorontalo', active: true, region: 'Sulawesi' }
      ];
      this.saveSystems();
    }

    // 3. Inisialisasi Records
    const savedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (savedRecords) {
      try {
        this.records = JSON.parse(savedRecords);
      } catch (e) {
        this.records = null;
      }
    }
    if (!this.records || !this.records.length) {
      const seed = generateSeedData();
      this.records = seed.records;
      this.saveRecords();
    }
    this.ensureFullYearRecords();

    // 4. Inisialisasi Audit Trail
    const savedAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (savedAudit) {
      try {
        this.auditLogs = JSON.parse(savedAudit);
      } catch (e) {
        this.auditLogs = [];
      }
    } else {
      this.auditLogs = [
        {
          id: 'audit-init',
          timestamp: '2026-06-30T10:00:00.000Z',
          user: 'Administrator ROTS (Admin Pusat)',
          action: 'PENGATURAN PARAMETER AWAL',
          paramName: 'Batas Cadangan Minimum',
          oldValue: '-',
          newValue: '2.000 MW',
          note: 'Setup nilai batas awal acuan operasi Semester II 2026'
        }
      ];
      this.saveAudit();
    }

    // 5. Active Navigation & Filter State
    this.currentView = 'dashboard';
    this.viewMode = 'rencana'; // 'rencana' | 'realisasi' | 'komparasi'
    // Jenis & nilai periode aktif
    this.planningPeriod = {
      type: 'ROTS',   // 'ROT' | 'ROTS' | 'ROB' | 'ROM'
      value: 'ROTS_2026_S2'  // key generik untuk nilai yang dipilih
    };
    this.filters = {
      sistem: 'Jamali',
      semester: 'Semester II 2026',
      dateStart: '2026-07-01',
      dateEnd: '2026-12-31',
      selectedDate: '2026-07-01'
    };

    // 6. Inisialisasi Seed Data Realisasi (46 hari: 01 Jul - 15 Agu 2026)
    this.initRealisasiSeed();
  }

  initRealisasiSeed() {
    let changed = false;
    this.records.forEach((rec, idx) => {
      // Seed data realisasi untuk 46 hari awal jika belum ada
      if (idx < 46 && !rec.realisasi && rec.sistem === 'Jamali') {
        const bpVariation = Math.round(((Math.sin(idx * 0.45) * 290) + (Math.cos(idx * 0.8) * 140)) * 100) / 100;
        const poVariation = Math.round((Math.sin(idx * 0.25) * 75) * 100) / 100;
        const foVariation = Math.round((Math.cos(idx * 0.35) * 110) * 100) / 100;

        rec.realisasi = {
          dmn: rec.dmn,
          po: Math.max(0, Math.round((rec.po + poVariation) * 100) / 100),
          mo: rec.mo,
          fo: Math.max(0, Math.round((rec.fo + foVariation) * 100) / 100),
          foEp: rec.foEp,
          derKit: rec.derKit,
          derTrans: rec.derTrans,
          varmus: rec.varmus,
          bp: Math.round((rec.bp + bpVariation) * 100) / 100,
          notes: 'Realisasi tersinkron dari logsheet SCADA',
          updatedAt: '2026-08-16T08:00:00.000Z'
        };
        changed = true;
      }
    });
    if (changed) {
      this.saveRecords();
    }
  }

  saveParams() {
    localStorage.setItem(STORAGE_KEY_PARAMS, JSON.stringify(this.params));
  }

  saveSystems() {
    localStorage.setItem(STORAGE_KEY_SYSTEMS, JSON.stringify(this.systems));
  }

  saveRecords() {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(this.records));
  }

  saveAudit() {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(event) {
    this.listeners.forEach(cb => cb(event));
  }

  // Update Parameter dengan Audit Trail
  updateMinReserveThreshold(newThreshold, user = 'Administrator ROTS', note = 'Penyesuaian batas operasi cadangan daya') {
    const oldVal = this.params.minReserveThreshold;
    const numVal = parseFloat(newThreshold);
    if (isNaN(numVal)) return false;

    this.params.minReserveThreshold = numVal;
    this.saveParams();

    const auditEntry = {
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      user: user,
      action: 'UPDATE PARAMETER',
      paramName: 'Batas Cadangan Minimum',
      oldValue: `${CalculationService.formatNumber(oldVal)} MW`,
      newValue: `${CalculationService.formatNumber(numVal)} MW`,
      note: note
    };
    this.auditLogs.unshift(auditEntry);
    this.saveAudit();

    this.notify({ type: 'PARAMETER_UPDATED', payload: numVal });
    return true;
  }

  // Filter setters
  setFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.notify({ type: 'FILTERS_CHANGED', payload: this.filters });
  }

  setSelectedDate(dateStr) {
    this.filters.selectedDate = dateStr;
    this.notify({ type: 'SELECTED_DATE_CHANGED', payload: dateStr });
  }

  setCurrentView(viewId) {
    this.currentView = viewId;
    this.notify({ type: 'VIEW_CHANGED', payload: viewId });
  }

  // View Mode Switcher: 'rencana' | 'realisasi' | 'komparasi'
  setViewMode(mode) {
    if (['rencana', 'realisasi', 'komparasi'].includes(mode)) {
      this.viewMode = mode;
      this.notify({ type: 'VIEW_MODE_CHANGED', payload: mode });
    }
  }

  // ============================================================
  // MULTI-PERIODE: ROT / ROTS / ROB / ROM
  // ============================================================

  /**
   * Set jenis periode dan pilihan periode aktif.
   * @param {string} type - 'ROT' | 'ROTS' | 'ROB' | 'ROM'
   * @param {string} value - key periode, mis: '2026', 'ROTS_2026_S2', 'ROB_2026_07', 'ROM_2026_W27'
   */
  setPlanningPeriod(type, value) {
    const validTypes = ['ROT', 'ROTS', 'ROB', 'ROM'];
    if (!validTypes.includes(type)) return;
    this.planningPeriod = { type, value };

    // Hitung date range otomatis berdasarkan type + value
    const range = this.getActiveDateRange(type, value);
    const cadMin = this.getPeriodConfig(type).cadMin;

    this.filters = {
      ...this.filters,
      dateStart: range.dateStart,
      dateEnd: range.dateEnd,
      selectedDate: range.dateStart
    };
    // Update threshold sesuai cadMin periode aktif (tidak audit, hanya runtime)
    this.params.minReserveThreshold = cadMin;

    this.notify({ type: 'PLANNING_PERIOD_CHANGED', payload: { periodType: type, periodValue: value, range, cadMin } });
    this.notify({ type: 'FILTERS_CHANGED', payload: this.filters });
  }

  /** Dapatkan konfigurasi parameter untuk jenis periode */
  getPeriodConfig(type) {
    const defaults = { dmnAdjust: 0, foderAdj: 0, cadMin: 2000 };
    return { ...defaults, ...(this.params.periodParams[type] || {}) };
  }

  /** Update parameter salah satu periode dan simpan */
  updatePeriodParam(type, key, value, user = 'Administrator ROTS') {
    const validTypes = ['ROT', 'ROTS', 'ROB', 'ROM'];
    if (!validTypes.includes(type)) return false;
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return false;

    const oldVal = this.params.periodParams[type][key];
    this.params.periodParams[type][key] = numVal;
    this.saveParams();

    // Update threshold runtime jika ini periode aktif
    if (this.planningPeriod.type === type && key === 'cadMin') {
      this.params.minReserveThreshold = numVal;
    }

    this.auditLogs.unshift({
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      user,
      action: 'UPDATE PARAMETER PERIODE',
      paramName: `${type} – ${key}`,
      oldValue: String(oldVal),
      newValue: String(numVal),
      note: `Penyesuaian parameter ${key} untuk jenis periode ${type}`
    });
    this.saveAudit();
    this.notify({ type: 'PARAMETER_UPDATED', payload: { type, key, value: numVal } });
    return true;
  }

  /**
   * Hitung dateStart & dateEnd berdasarkan jenis + nilai periode
   * Format value:
   *   ROT  → '2026'
   *   ROTS → 'ROTS_2026_S1' | 'ROTS_2026_S2'
   *   ROB  → 'ROB_2026_07'  (bulan 07)
   *   ROM  → 'ROM_2026_W27' (nomor ISO week)
   */
  getActiveDateRange(type, value) {
    const MONTH_NAMES = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                         'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    let dateStart, dateEnd, label;

    if (type === 'ROT') {
      const year = parseInt(value) || 2026;
      dateStart = `${year}-01-01`;
      dateEnd   = `${year}-12-31`;
      label = `ROT ${year} – Tahunan`;

    } else if (type === 'ROTS') {
      // value: 'ROTS_2026_S1' or 'ROTS_2026_S2'
      const parts = value.split('_');
      const year = parseInt(parts[1]) || 2026;
      const sem  = parts[2] || 'S2';
      if (sem === 'S1') {
        dateStart = `${year}-01-01`; dateEnd = `${year}-06-30`;
        label = `ROTS Semester I ${year}`;
      } else {
        dateStart = `${year}-07-01`; dateEnd = `${year}-12-31`;
        label = `ROTS Semester II ${year}`;
      }

    } else if (type === 'ROB') {
      // value: 'ROB_2026_07'
      const parts = value.split('_');
      const year  = parseInt(parts[1]) || 2026;
      const month = parseInt(parts[2]) || 7;
      const lastDay = new Date(year, month, 0).getDate();
      dateStart = `${year}-${String(month).padStart(2,'0')}-01`;
      dateEnd   = `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
      label = `ROB ${MONTH_NAMES[month]} ${year}`;

    } else if (type === 'ROM') {
      // value: 'ROM_2026_W27' — Minggu ke-27 ISO
      const parts = value.split('_');
      const year  = parseInt(parts[1]) || 2026;
      const week  = parseInt(parts[2].replace('W','')) || 27;
      // Hitung Senin dari ISO week number
      const jan4  = new Date(year, 0, 4);
      const startOfWeek1 = new Date(jan4);
      startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);
      const monday = new Date(startOfWeek1);
      monday.setDate(startOfWeek1.getDate() + (week - 1) * 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      dateStart = fmt(monday);
      dateEnd   = fmt(sunday);
      label = `ROM Minggu ${week} (${monday.getDate()} – ${sunday.getDate()} ${MONTH_NAMES[monday.getMonth()+1]} ${year})`;

    } else {
      dateStart = '2026-07-01'; dateEnd = '2026-12-31';
      label = 'Semester II 2026';
    }
    return { dateStart, dateEnd, label };
  }

  ensureFullYearRecords() {
    if (!this.records) return;
    let modified = false;

    // 1. Tambahkan data Jan - Jun 2026 jika belum ada
    const hasJan2026 = this.records.some(r => r.tanggal && r.tanggal.startsWith('2026-01'));
    if (!hasJan2026) {
      const newRecs2026 = [];
      const d = new Date(2026, 0, 1);
      const end = new Date(2026, 5, 30);
      while (d <= end) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const tgl = `${y}-${m}-${day}`;
        const dayNum = Math.floor((d - new Date(2026, 0, 1)) / 86400000);
        const sinWave = Math.sin(dayNum / 8);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

        newRecs2026.push({
          id: `Jamali_${tgl}`,
          sistem: 'Jamali',
          tanggal: tgl,
          dmn: 49040.624,
          po: Math.round((4100 + sinWave * 450) * 100) / 100,
          mo: Math.round((240 + (dayNum % 6) * 15) * 100) / 100,
          fo: Math.round((1440 + (dayNum % 4) * 20) * 100) / 100,
          foEp: Math.round((3960 + sinWave * 180) * 100) / 100,
          derKit: Math.round((1440 + (dayNum % 3) * 25) * 100) / 100,
          derTrans: 0.0,
          varmus: Math.round((1370 + sinWave * 40) * 100) / 100,
          bp: isWeekend ? Math.round(30600 + sinWave * 300) : Math.round(33750 + sinWave * 500)
        });
        d.setDate(d.getDate() + 1);
      }
      this.records = [...newRecs2026, ...this.records];
      modified = true;
    }

    // 2. Tambahkan data Tahun 2027 (ROT 2027) jika belum ada
    const has2027 = this.records.some(r => r.tanggal && r.tanggal.startsWith('2027'));
    if (!has2027) {
      const newRecs2027 = [];
      const d27 = new Date(2027, 0, 1);
      const end27 = new Date(2027, 11, 31);
      while (d27 <= end27) {
        const y = d27.getFullYear();
        const m = String(d27.getMonth() + 1).padStart(2, '0');
        const day = String(d27.getDate()).padStart(2, '0');
        const tgl = `${y}-${m}-${day}`;
        const dayNum = Math.floor((d27 - new Date(2027, 0, 1)) / 86400000);
        const sinWave = Math.sin(dayNum / 9);
        const isWeekend = d27.getDay() === 0 || d27.getDay() === 6;

        newRecs2027.push({
          id: `Jamali_${tgl}`,
          sistem: 'Jamali',
          tanggal: tgl,
          dmn: 51200.0, // Pertumbuhan kapasitas 2027
          po: Math.round((4350 + sinWave * 480) * 100) / 100,
          mo: Math.round((260 + (dayNum % 6) * 16) * 100) / 100,
          fo: Math.round((1520 + (dayNum % 4) * 22) * 100) / 100,
          foEp: Math.round((4120 + sinWave * 190) * 100) / 100,
          derKit: Math.round((1520 + (dayNum % 3) * 26) * 100) / 100,
          derTrans: 0.0,
          varmus: Math.round((1420 + sinWave * 45) * 100) / 100,
          bp: isWeekend ? Math.round(31800 + sinWave * 320) : Math.round(35200 + sinWave * 520)
        });
        d27.setDate(d27.getDate() + 1);
      }
      this.records = [...this.records, ...newRecs2027];
      modified = true;
    }

    if (modified) {
      this.records.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      this.saveRecords();
    }
  }

  /**
   * Daftar opsi periode yang tersedia berdasarkan type
   * Return: [{ value, label, shortLabel }, ...]
   */
  getAvailablePeriodValues(type) {
    const MONTH_NAMES_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                               'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const MONTH_NAMES_FULL  = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    if (type === 'ROT') {
      return [
        { value: '2026', label: 'Tahun 2026 (Tahunan)', shortLabel: '2026' },
        { value: '2027', label: 'Tahun 2027 (Tahunan)', shortLabel: '2027' }
      ];

    } else if (type === 'ROTS') {
      return [
        { value: 'ROTS_2026_S2', label: 'Semester II 2026 (Jul–Des)', shortLabel: 'Semester II (Jul-Des)' },
        { value: 'ROTS_2026_S1', label: 'Semester I 2026 (Jan–Jun)', shortLabel: 'Semester I (Jan-Jun)' }
      ];

    } else if (type === 'ROB') {
      // 12 bulan tahun 2026
      return [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({
        value: `ROB_2026_${String(m).padStart(2,'0')}`,
        label: `${MONTH_NAMES_FULL[m]} 2026`,
        shortLabel: `${MONTH_NAMES_SHORT[m]}`
      }));

    } else if (type === 'ROM') {
      const options = [];
      const MONTH_NAMES = MONTH_NAMES_SHORT;
      // Minggu 27 s/d 52 (Semester II) dan minggu lainnya
      let d = new Date(2026, 5, 29); // Senin 29 Jun 2026 (W27)
      const end = new Date(2026, 11, 31);
      while (d <= end) {
        const dayOfWeek = d.getDay() || 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - dayOfWeek + 1);
        const temp = new Date(monday);
        temp.setDate(temp.getDate() + 4 - (temp.getDay() || 7));
        const yearStart = new Date(temp.getFullYear(), 0, 1);
        const weekNo = Math.ceil(((temp - yearStart) / 86400000 + 1) / 7);
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        const fmtDay = (dt) => `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()+1]}`;
        options.push({
          value: `ROM_2026_W${weekNo}`,
          label: `Minggu ${weekNo}: ${fmtDay(monday)}–${fmtDay(sunday)}`,
          shortLabel: `W${weekNo}`
        });
        d = new Date(monday); d.setDate(monday.getDate() + 7);
      }
      return options.filter((o, i, a) => a.findIndex(x => x.value === o.value) === i);
    }
    return [];
  }

  // Set / Update Realisasi Harian
  setRealisasi(tanggal, data, user = 'Operator Dispatcher') {
    const rec = this.records.find(r => r.tanggal === tanggal);
    if (!rec) return false;

    rec.realisasi = {
      dmn: parseFloat(data.dmn) || rec.dmn,
      po: parseFloat(data.po) || 0,
      mo: parseFloat(data.mo) || 0,
      fo: parseFloat(data.fo) || 0,
      foEp: parseFloat(data.foEp) || 0,
      derKit: parseFloat(data.derKit) || 0,
      derTrans: parseFloat(data.derTrans) || 0,
      varmus: parseFloat(data.varmus) || 0,
      bp: parseFloat(data.bp) || 0,
      notes: data.notes || '',
      updatedAt: new Date().toISOString()
    };
    this.saveRecords();

    // Audit Log
    this.auditLogs.unshift({
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      user: user,
      action: 'INPUT / UPDATE REALISASI',
      paramName: `Realisasi ${tanggal}`,
      oldValue: '-',
      newValue: `BP: ${CalculationService.formatNumber(rec.realisasi.bp)} MW`,
      note: data.notes || 'Pembaruan realisasi harian via form'
    });
    this.saveAudit();

    this.notify({ type: 'REALISASI_UPDATED', payload: { tanggal, realisasi: rec.realisasi } });
    return true;
  }

  // Hapus Data Realisasi Harian
  deleteRealisasi(tanggal, user = 'Operator Dispatcher') {
    const rec = this.records.find(r => r.tanggal === tanggal);
    if (!rec || !rec.realisasi) return false;

    delete rec.realisasi;
    this.saveRecords();

    this.auditLogs.unshift({
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      user: user,
      action: 'HAPUS REALISASI',
      paramName: `Realisasi ${tanggal}`,
      oldValue: 'Ada data realisasi',
      newValue: 'Dihapus',
      note: 'Data realisasi dihapus'
    });
    this.saveAudit();

    this.notify({ type: 'REALISASI_DELETED', payload: { tanggal } });
    return true;
  }

  // Batch Import Realisasi
  importRealisasiRecords(list, user = 'Operator Dispatcher') {
    let imported = 0;
    list.forEach(item => {
      const rec = this.records.find(r => r.tanggal === item.tanggal);
      if (rec) {
        rec.realisasi = {
          dmn: parseFloat(item.dmn) || rec.dmn,
          po: parseFloat(item.po) || 0,
          mo: parseFloat(item.mo) || 0,
          fo: parseFloat(item.fo) || 0,
          foEp: parseFloat(item.foEp) || 0,
          derKit: parseFloat(item.derKit) || 0,
          derTrans: parseFloat(item.derTrans) || 0,
          varmus: parseFloat(item.varmus) || 0,
          bp: parseFloat(item.bp) || 0,
          notes: item.notes || 'Batch import Excel',
          updatedAt: new Date().toISOString()
        };
        imported++;
      }
    });

    if (imported > 0) {
      this.saveRecords();
      this.auditLogs.unshift({
        id: 'audit-' + Date.now(),
        timestamp: new Date().toISOString(),
        user: user,
        action: 'BATCH IMPORT REALISASI',
        paramName: `${imported} Hari Realisasi`,
        oldValue: '-',
        newValue: 'Sinkronisasi Excel',
        note: 'Import massal data realisasi'
      });
      this.saveAudit();
      this.notify({ type: 'REALISASI_IMPORTED', count: imported });
    }
    return imported;
  }

  // ============================================================
  // INPUT & IMPORT DATA RENCANA PER PERIODE (ROT, ROTS, ROB, ROM)
  // ============================================================

  /**
   * Set / Update Data Rencana untuk jenis periode tertentu (ROT, ROTS, ROB, ROM)
   */
  setPeriodPlanRecord(periodType, tanggal, data, user = 'Perencana Sistem') {
    const rec = this.records.find(r => r.tanggal === tanggal);
    if (!rec) return false;

    if (!rec.periods) rec.periods = {};
    rec.periods[periodType] = {
      dmn: parseFloat(data.dmn) || rec.dmn,
      po: parseFloat(data.po) || 0,
      mo: parseFloat(data.mo) || 0,
      fo: parseFloat(data.fo) || 0,
      foEp: parseFloat(data.foEp) || 0,
      derKit: parseFloat(data.derKit) || 0,
      derTrans: parseFloat(data.derTrans) || 0,
      varmus: parseFloat(data.varmus) || 0,
      bp: parseFloat(data.bp) || 0,
      notes: data.notes || '',
      updatedAt: new Date().toISOString()
    };

    this.saveRecords();
    this.auditLogs.unshift({
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      user,
      action: `INPUT RENCANA ${periodType}`,
      paramName: `${periodType} ${tanggal}`,
      oldValue: '-',
      newValue: `DMN: ${CalculationService.formatNumber(data.dmn)} MW, BP: ${CalculationService.formatNumber(data.bp)} MW`,
      note: data.notes || `Update data rencana operasional ${periodType}`
    });
    this.saveAudit();

    this.notify({ type: 'PLAN_RECORD_UPDATED', payload: { periodType, tanggal, data: rec.periods[periodType] } });
    return true;
  }

  /**
   * Batch Import Data Rencana per Periode (ROT / ROTS / ROB / ROM)
   */
  importPeriodPlanRecords(periodType, list, user = 'Perencana Sistem') {
    let imported = 0;
    list.forEach(item => {
      const rec = this.records.find(r => r.tanggal === item.tanggal);
      if (rec) {
        if (!rec.periods) rec.periods = {};
        rec.periods[periodType] = {
          dmn: parseFloat(item.dmn) || rec.dmn,
          po: parseFloat(item.po) || 0,
          mo: parseFloat(item.mo) || 0,
          fo: parseFloat(item.fo) || 0,
          foEp: parseFloat(item.foEp) || 0,
          derKit: parseFloat(item.derKit) || 0,
          derTrans: parseFloat(item.derTrans) || 0,
          varmus: parseFloat(item.varmus) || 0,
          bp: parseFloat(item.bp) || 0,
          notes: item.notes || `Batch import Excel ${periodType}`,
          updatedAt: new Date().toISOString()
        };
        imported++;
      }
    });

    if (imported > 0) {
      this.saveRecords();
      this.auditLogs.unshift({
        id: 'audit-' + Date.now(),
        timestamp: new Date().toISOString(),
        user,
        action: `BATCH IMPORT RENCANA ${periodType}`,
        paramName: `${imported} Hari Rencana ${periodType}`,
        oldValue: '-',
        newValue: 'Sinkronisasi Berkas Excel',
        note: `Import massal data rencana ${periodType}`
      });
      this.saveAudit();
      this.notify({ type: 'PLAN_RECORDS_IMPORTED', payload: { periodType, count: imported } });
    }
    return imported;
  }

  // Summary Komparasi Rencana vs Realisasi
  getComparisonSummary(records = null) {
    const list = (records || this.getFilteredRecords()).filter(r => r.realisasi);
    if (!list.length) {
      return {
        totalDaysRealized: 0,
        avgDeltaBP: 0,
        avgDeltaCAD: 0,
        avgDeltaOutage: 0,
        maxDeltaBP: 0,
        accuracyBP: 100,
        mape: 0
      };
    }

    let sumDeltaBP = 0;
    let sumDeltaCAD = 0;
    let sumDeltaOutage = 0;
    let maxDeltaBP = 0;
    let sumErrorPercent = 0;

    list.forEach(r => {
      const dBP = r.realisasi.deltaBP;
      const dCAD = r.realisasi.deltaCAD;
      const dOutage = r.realisasi.deltaOutage;

      sumDeltaBP += dBP;
      sumDeltaCAD += dCAD;
      sumDeltaOutage += dOutage;
      if (Math.abs(dBP) > Math.abs(maxDeltaBP)) {
        maxDeltaBP = dBP;
      }
      if (r.bp > 0) {
        sumErrorPercent += Math.abs(dBP) / r.bp;
      }
    });

    const n = list.length;
    const mape = (sumErrorPercent / n) * 100;
    const accuracy = Math.max(0, 100 - mape);

    return {
      totalDaysRealized: n,
      avgDeltaBP: sumDeltaBP / n,
      avgDeltaCAD: sumDeltaCAD / n,
      avgDeltaOutage: sumDeltaOutage / n,
      maxDeltaBP,
      accuracyBP: accuracy,
      mape
    };
  }

  // Data processing queries
  getProcessedRecords() {
    const threshold = this.params.minReserveThreshold;
    const periodType = this.planningPeriod.type || 'ROTS';
    // Ambil periodAdjust dari jenis periode aktif
    const periodAdjust = this.getPeriodConfig(periodType);
    return this.records.map(rec => CalculationService.processRecord(rec, threshold, periodAdjust, periodType));
  }

  getFilteredRecords() {
    const { sistem, dateStart, dateEnd } = this.filters;
    const all = this.getProcessedRecords();

    return all.filter(rec => {
      if (sistem && rec.sistem !== sistem) return false;
      if (dateStart && rec.tanggal < dateStart) return false;
      if (dateEnd && rec.tanggal > dateEnd) return false;
      return true;
    }).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }

  getSelectedRecord() {
    const filtered = this.getFilteredRecords();
    const found = filtered.find(r => r.tanggal === this.filters.selectedDate);
    if (found) return found;
    return filtered[0] || null;
  }

  // Ringkasan Periode & Neraca Daya Excel
  getPeriodSummary(records = null) {
    const list = records || this.getFilteredRecords();
    if (!list.length) {
      return {
        dmn: 0,
        foder: 0,
        dmpAvg: 0,
        bpMax: 0,
        bpMaxDate: '',
        cadAvg: 0,
        cadMin: 0,
        cadMinDate: '',
        normalCount: 0,
        siagaCount: 0,
        defisitCount: 0,
        totalDays: 0
      };
    }

    let dmpSum = 0;
    let bpMax = -Infinity;
    let bpMaxDate = '';
    let cadSum = 0;
    let cadMin = Infinity;
    let cadMinDate = '';
    let normalCount = 0;
    let siagaCount = 0;
    let defisitCount = 0;
    let dmn = list[0].dmn;

    list.forEach(r => {
      dmpSum += r.dmp;
      if (r.bp > bpMax) {
        bpMax = r.bp;
        bpMaxDate = r.tanggal;
      }
      cadSum += r.cad;
      if (r.cad < cadMin) {
        cadMin = r.cad;
        cadMinDate = r.tanggal;
      }

      if (r.statusKey === 'NORMAL') normalCount++;
      else if (r.statusKey === 'SIAGA') siagaCount++;
      else if (r.statusKey === 'DEFISIT') defisitCount++;
    });

    const totalDays = list.length;
    const currentSys = this.systems.find(s => s.code === this.filters.sistem);
    const foder = currentSys ? (currentSys.foder || 0.1569) : 0.1569;

    return {
      dmn,
      foder,
      dmpAvg: dmpSum / totalDays,
      bpMax: bpMax === -Infinity ? 0 : bpMax,
      bpMaxDate,
      cadAvg: cadSum / totalDays,
      cadMin: cadMin === Infinity ? 0 : cadMin,
      cadMinDate,
      normalCount,
      siagaCount,
      defisitCount,
      totalDays
    };
  }

  // Ringkasan Bulanan (Tabel Bulanan)
  getMonthlySummary(records = null) {
    const list = records || this.getFilteredRecords();
    const monthGroups = {};

    list.forEach(r => {
      // r.tanggal = "2026-07-01" -> monthKey = "2026-07"
      const monthKey = r.tanggal.substring(0, 7);
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          monthKey,
          label: CalculationService.formatMonthYear(r.tanggal),
          records: []
        };
      }
      monthGroups[monthKey].records.push(r);
    });

    const sortedMonthKeys = Object.keys(monthGroups).sort();
    const rows = sortedMonthKeys.map(key => {
      const group = monthGroups[key];
      const recs = group.records;
      const totalDays = recs.length;

      let dmpSum = 0;
      let bpMax = -Infinity;
      let cadSum = 0;
      let cadMin = Infinity;
      let normal = 0;
      let siaga = 0;
      let defisit = 0;

      let dmpRealSum = 0;
      let bpRealMax = -Infinity;
      let cadRealSum = 0;
      let cadRealMin = Infinity;
      let realDays = 0;
      let normalReal = 0;
      let siagaReal = 0;
      let defisitReal = 0;
      let deltaBpSum = 0;

      recs.forEach(r => {
        dmpSum += r.dmp;
        if (r.bp > bpMax) bpMax = r.bp;
        cadSum += r.cad;
        if (r.cad < cadMin) cadMin = r.cad;
        if (r.statusKey === 'NORMAL') normal++;
        else if (r.statusKey === 'SIAGA') siaga++;
        else if (r.statusKey === 'DEFISIT') defisit++;

        if (r.realisasi) {
          realDays++;
          dmpRealSum += r.realisasi.dmp;
          if (r.realisasi.bp > bpRealMax) bpRealMax = r.realisasi.bp;
          cadRealSum += r.realisasi.cad;
          if (r.realisasi.cad < cadRealMin) cadRealMin = r.realisasi.cad;
          deltaBpSum += r.realisasi.deltaBP;
          if (r.realisasi.statusKey === 'NORMAL') normalReal++;
          else if (r.realisasi.statusKey === 'SIAGA') siagaReal++;
          else if (r.realisasi.statusKey === 'DEFISIT') defisitReal++;
        }
      });

      return {
        monthKey: key,
        monthLabel: group.label,
        dmpAvg: dmpSum / totalDays,
        bpMax: bpMax === -Infinity ? 0 : bpMax,
        cadAvg: cadSum / totalDays,
        cadMin: cadMin === Infinity ? 0 : cadMin,
        normal,
        siaga,
        defisit,
        totalDays,
        // Realisasi & Komparasi metrics
        realDays,
        dmpAvgReal: realDays > 0 ? dmpRealSum / realDays : null,
        bpMaxReal: realDays > 0 ? bpRealMax : null,
        cadAvgReal: realDays > 0 ? cadRealSum / realDays : null,
        deltaBpAvg: realDays > 0 ? deltaBpSum / realDays : null,
        normalReal,
        siagaReal,
        defisitReal
      };
    });

    // Hitung TOTAL / RATA-RATA untuk seluruh periode
    const overall = this.getPeriodSummary(list);
    const comparison = this.getComparisonSummary(list);
    const summaryRow = {
      monthLabel: 'TOTAL / RATA-RATA',
      dmpAvg: overall.dmpAvg,
      bpMax: overall.bpMax,
      cadAvg: overall.cadAvg,
      cadMin: overall.cadMin,
      normal: overall.normalCount,
      siaga: overall.siagaCount,
      defisit: overall.defisitCount,
      totalDays: overall.totalDays,
      realDays: comparison.totalDaysRealized,
      deltaBpAvg: comparison.avgDeltaBP,
      accuracyBP: comparison.accuracyBP,
      isSummary: true
    };

    return { rows, summaryRow };
  }

  // Master Data Sistem CRUD
  addSystem(system) {
    const id = 'sys-' + Date.now();
    this.systems.push({ ...system, id, active: true });
    this.saveSystems();
    this.notify({ type: 'SYSTEMS_UPDATED' });
  }

  updateSystem(id, updated) {
    const idx = this.systems.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.systems[idx] = { ...this.systems[idx], ...updated };
      this.saveSystems();
      this.notify({ type: 'SYSTEMS_UPDATED' });
    }
  }

  toggleSystemActive(id) {
    const sys = this.systems.find(s => s.id === id);
    if (sys) {
      sys.active = !sys.active;
      this.saveSystems();
      this.notify({ type: 'SYSTEMS_UPDATED' });
    }
  }

  // Import Data Batch
  importRecords(newRecords, overwrite = false) {
    if (overwrite) {
      this.records = newRecords;
    } else {
      // Merge or update existing by id (sistem + tanggal)
      const existingMap = new Map();
      this.records.forEach(r => existingMap.set(`${r.sistem}_${r.tanggal}`, r));
      newRecords.forEach(r => existingMap.set(`${r.sistem}_${r.tanggal}`, r));
      this.records = Array.from(existingMap.values());
    }
    this.saveRecords();
    this.notify({ type: 'RECORDS_IMPORTED', count: newRecords.length });
  }

  // Reset to default seed data
  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    localStorage.removeItem(STORAGE_KEY_PARAMS);
    localStorage.removeItem(STORAGE_KEY_AUDIT);
    localStorage.removeItem(STORAGE_KEY_SYSTEMS);
    this.init();
    this.notify({ type: 'STORE_RESET' });
  }
}

export const store = new Store();
