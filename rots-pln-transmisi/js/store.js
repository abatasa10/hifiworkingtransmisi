/**
 * ROTS PLN TRANSMISI - State & Data Store
 * Menyimpan data operasional, parameter ambang batas, master data sistem, dan audit trail.
 */

import { CalculationService } from './calculation.js';
import { generateSeedData } from './seedData.js';

const STORAGE_KEY_RECORDS = 'ROTS_PLN_RECORDS_V2';
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
      this.params = { minReserveThreshold: 2000 };
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
    this.filters = {
      sistem: 'Jamali',
      semester: 'Semester II 2026',
      dateStart: '2026-07-01',
      dateEnd: '2026-12-31',
      selectedDate: '2026-07-01'
    };
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

  // Data processing queries
  getProcessedRecords() {
    const threshold = this.params.minReserveThreshold;
    return this.records.map(rec => CalculationService.processRecord(rec, threshold));
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

      recs.forEach(r => {
        dmpSum += r.dmp;
        if (r.bp > bpMax) bpMax = r.bp;
        cadSum += r.cad;
        if (r.cad < cadMin) cadMin = r.cad;
        if (r.statusKey === 'NORMAL') normal++;
        else if (r.statusKey === 'SIAGA') siaga++;
        else if (r.statusKey === 'DEFISIT') defisit++;
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
        totalDays
      };
    });

    // Hitung TOTAL / RATA-RATA untuk seluruh periode
    const overall = this.getPeriodSummary(list);
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
