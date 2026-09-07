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
    this.viewMode = 'rencana'; // 'rencana' | 'realisasi' | 'komparasi'
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
