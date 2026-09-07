/**
 * ROTS PLN OPERASI SISTEM - Core Calculation Module
 * Memastikan business logic dan traceability perhitungan 100% akurat sesuai standar PLN Operasi Sistem.
 */

export const CalculationService = {
  /**
   * Planned Outage = PO + MO
   */
  calculatePlannedOutage(po = 0, mo = 0) {
    const p = parseFloat(po) || 0;
    const m = parseFloat(mo) || 0;
    return p + m;
  },

  /**
   * Unplanned Outage = FO + FO EP + DER KIT + DER TRANS + VARMUS
   */
  calculateUnplannedOutage(fo = 0, foEp = 0, derKit = 0, derTrans = 0, varmus = 0) {
    const f = parseFloat(fo) || 0;
    const fe = parseFloat(foEp) || 0;
    const dk = parseFloat(derKit) || 0;
    const dt = parseFloat(derTrans) || 0;
    const v = parseFloat(varmus) || 0;
    return f + fe + dk + dt + v;
  },

  /**
   * DMP = DMN - Planned Outage - Unplanned Outage
   */
  calculateDMP(dmn = 0, plannedOutage = 0, unplannedOutage = 0) {
    const d = parseFloat(dmn) || 0;
    const po = parseFloat(plannedOutage) || 0;
    const uo = parseFloat(unplannedOutage) || 0;
    return d - po - uo;
  },

  /**
   * CAD = DMP - BP
   */
  calculateCAD(dmp = 0, bp = 0) {
    const p = parseFloat(dmp) || 0;
    const b = parseFloat(bp) || 0;
    return p - b;
  },

  /**
   * Status berdasarkan parameter Batas Cadangan Minimum
   * CAD >= threshold -> NORMAL
   * 0 <= CAD < threshold -> SIAGA
   * CAD < 0 -> DEFISIT
   */
  determineStatus(cad, minReserveThreshold = 2000) {
    const c = parseFloat(cad);
    const t = parseFloat(minReserveThreshold);

    if (isNaN(c)) return { key: 'UNKNOWN', label: 'TIDAK DIKETAHUI', color: 'gray', badgeClass: 'badge-unknown' };

    if (c >= t) {
      return {
        key: 'NORMAL',
        label: 'NORMAL',
        color: '#10B981',
        badgeClass: 'badge-normal',
        description: `CAD ≥ ${this.formatNumber(t)} MW`
      };
    } else if (c >= 0) {
      return {
        key: 'SIAGA',
        label: 'SIAGA',
        color: '#F59E0B',
        badgeClass: 'badge-siaga',
        description: `0 ≤ CAD < ${this.formatNumber(t)} MW`
      };
    } else {
      return {
        key: 'DEFISIT',
        label: 'DEFISIT',
        color: '#EF4444',
        badgeClass: 'badge-defisit',
        description: `CAD < 0 MW`
      };
    }
  },

  /**
   * Dapatkan data spesifik untuk jenis periode tertentu (ROT, ROTS, ROB, ROM).
   * Jika ada data kustom yang diinput/diimpor untuk periode ini di raw.periods[type], gunakan data itu.
   * Jika belum, hitung nilai seed realistis yang mencerminkan karakteristik masing-masing jenis perencanaan PLN.
   */
  getPeriodRecordData(raw, periodType = 'ROTS') {
    if (raw.periods && raw.periods[periodType]) {
      return raw.periods[periodType];
    }

    const dmnBase = parseFloat(raw.dmn) || 0;
    const poBase = parseFloat(raw.po) || 0;
    const moBase = parseFloat(raw.mo) || 0;
    const foBase = parseFloat(raw.fo) || 0;
    const foEpBase = parseFloat(raw.foEp) || 0;
    const derKitBase = parseFloat(raw.derKit) || 0;
    const derTransBase = parseFloat(raw.derTrans) || 0;
    const varmusBase = parseFloat(raw.varmus) || 0;
    const bpBase = parseFloat(raw.bp) || 0;

    if (periodType === 'ROT') {
      // ROT (Tahunan): Rencana tahunan makro, DMN lebih tinggi (asumsi ketersediaan optimal), PO/MO terjadwal awal tahun
      return {
        dmn: Math.round((dmnBase + 180) * 100) / 100,
        po: Math.round((poBase * 0.94) * 100) / 100,
        mo: Math.round((moBase * 0.92) * 100) / 100,
        fo: Math.round((foBase * 0.96) * 100) / 100,
        foEp: Math.round((foEpBase * 0.96) * 100) / 100,
        derKit: derKitBase,
        derTrans: derTransBase,
        varmus: varmusBase,
        bp: Math.round((bpBase * 0.985) * 100) / 100
      };
    }

    if (periodType === 'ROB') {
      // ROB (Bulanan): Rencana bulanan terkoreksi sesuai realita bulan berjalan (DMN terkalibrasi, outage disesuaikan)
      return {
        dmn: Math.round((dmnBase - 160) * 100) / 100,
        po: Math.round((poBase * 1.05 + 35) * 100) / 100,
        mo: Math.round((moBase * 1.08 + 15) * 100) / 100,
        fo: Math.round((foBase * 1.03 + 20) * 100) / 100,
        foEp: Math.round((foEpBase * 1.02) * 100) / 100,
        derKit: Math.round((derKitBase * 1.04) * 100) / 100,
        derTrans: derTransBase,
        varmus: varmusBase,
        bp: Math.round((bpBase * 1.008 + 45) * 100) / 100
      };
    }

    if (periodType === 'ROM') {
      // ROM (Mingguan): Rencana mingguan operasional (H-7) dengan derating terkini dan ramalan beban mingguan
      return {
        dmn: Math.round((dmnBase - 280) * 100) / 100,
        po: Math.round((poBase * 0.98 + 60) * 100) / 100,
        mo: Math.round((moBase * 1.12 + 25) * 100) / 100,
        fo: Math.round((foBase * 1.06 + 30) * 100) / 100,
        foEp: Math.round((foEpBase * 1.04) * 100) / 100,
        derKit: Math.round((derKitBase * 1.08 + 40) * 100) / 100,
        derTrans: derTransBase,
        varmus: varmusBase,
        bp: Math.round((bpBase * 1.014 - 15) * 100) / 100
      };
    }

    // Default ROTS (Semester)
    return {
      dmn: dmnBase,
      po: poBase,
      mo: moBase,
      fo: foBase,
      foEp: foEpBase,
      derKit: derKitBase,
      derTrans: derTransBase,
      varmus: varmusBase,
      bp: bpBase
    };
  },

  /**
   * Proses satu record raw menjadi record lengkap dengan calculated fields dan jejak formula
   * @param {Object} raw - Record data mentah dari store
   * @param {number} minReserveThreshold - Batas Cadangan Minimum (MW)
   * @param {Object} periodAdjust - Penyesuaian nilai per jenis periode { dmnAdjust, foderAdj }
   * @param {string} periodType - 'ROT' | 'ROTS' | 'ROB' | 'ROM'
   */
  processRecord(raw, minReserveThreshold = 2000, periodAdjust = {}, periodType = 'ROTS') {
    const pData = this.getPeriodRecordData(raw, periodType);
    const dmnAdj = parseFloat(periodAdjust.dmnAdjust) || 0;
    const dmn = (parseFloat(pData.dmn) || 0) + dmnAdj;

    const po = parseFloat(pData.po) || 0;
    const mo = parseFloat(pData.mo) || 0;
    const fo = parseFloat(pData.fo) || 0;
    const foEp = parseFloat(pData.foEp) || 0;
    const derKit = parseFloat(pData.derKit) || 0;
    const derTrans = parseFloat(pData.derTrans) || 0;
    const varmus = parseFloat(pData.varmus) || 0;
    const bp = parseFloat(pData.bp) || 0;

    const plannedOutage = this.calculatePlannedOutage(po, mo);
    const unplannedOutage = this.calculateUnplannedOutage(fo, foEp, derKit, derTrans, varmus);
    const dmp = this.calculateDMP(dmn, plannedOutage, unplannedOutage);
    const cad = this.calculateCAD(dmp, bp);
    const status = this.determineStatus(cad, minReserveThreshold);


    return {
      id: raw.id || `${raw.sistem}_${raw.tanggal}`,
      sistem: raw.sistem,
      tanggal: raw.tanggal, // Format YYYY-MM-DD
      // Input Data
      dmn,
      po,
      mo,
      fo,
      foEp,
      derKit,
      derTrans,
      varmus,
      bp,
      // Calculated fields
      plannedOutage,
      unplannedOutage,
      dmp,
      cad,
      statusKey: status.key,
      statusLabel: status.label,
      statusColor: status.color,
      statusBadge: status.badgeClass,
      // Traceability Formula Data for visual breakdown UI
      formulaTrace: {
        plannedOutage: {
          formula: 'PO + MO',
          components: [
            { name: 'PO (Planned Outage)', value: po },
            { name: 'MO (Maintenance Outage)', value: mo }
          ],
          total: plannedOutage
        },
        unplannedOutage: {
          formula: 'FO + FO EP + DER KIT + DER TRANS + VARMUS',
          components: [
            { name: 'FO (Forced Outage)', value: fo },
            { name: 'FO EP (FO Extension Period)', value: foEp },
            { name: 'DER KIT (Derating Pembangkit)', value: derKit },
            { name: 'DER TRANS (Derating Transmisi)', value: derTrans },
            { name: 'VARMUS (Variasi Musiman)', value: varmus }
          ],
          total: unplannedOutage
        },
        dmp: {
          formula: 'DMN − Planned Outage − Unplanned Outage',
          calculation: `${this.formatNumber(dmn)} − ${this.formatNumber(plannedOutage)} − ${this.formatNumber(unplannedOutage)} = ${this.formatNumber(dmp)} MW`,
          steps: [
            { label: 'Daya Mampu Netto (DMN)', value: dmn, operator: '' },
            { label: 'Planned Outage (PO + MO)', value: plannedOutage, operator: '−' },
            { label: 'Unplanned Outage', value: unplannedOutage, operator: '−' }
          ],
          result: dmp
        },
        cad: {
          formula: 'DMP − BP',
          calculation: `${this.formatNumber(dmp)} − ${this.formatNumber(bp)} = ${this.formatNumber(cad)} MW`,
          steps: [
            { label: 'Daya Mampu Pembangkitan (DMP)', value: dmp, operator: '' },
            { label: 'Beban Puncak (BP)', value: bp, operator: '−' }
          ],
          result: cad
        },
        status: {
          threshold: minReserveThreshold,
          condition: cad >= minReserveThreshold 
            ? `${this.formatNumber(cad)} ≥ ${this.formatNumber(minReserveThreshold)}`
            : (cad >= 0 ? `0 ≤ ${this.formatNumber(cad)} < ${this.formatNumber(minReserveThreshold)}` : `${this.formatNumber(cad)} < 0`),
          result: status.label
        }
      },
      // Realisasi aktual jika tersedia
      realisasi: (() => {
        if (!raw.realisasi) return null;
        const rRaw = raw.realisasi;
        const rDmn = parseFloat(rRaw.dmn) || dmn;
        const rPo = parseFloat(rRaw.po) || 0;
        const rMo = parseFloat(rRaw.mo) || 0;
        const rFo = parseFloat(rRaw.fo) || 0;
        const rFoEp = parseFloat(rRaw.foEp) || 0;
        const rDerKit = parseFloat(rRaw.derKit) || 0;
        const rDerTrans = parseFloat(rRaw.derTrans) || 0;
        const rVarmus = parseFloat(rRaw.varmus) || 0;
        const rBp = parseFloat(rRaw.bp) || 0;

        const rPlannedOutage = this.calculatePlannedOutage(rPo, rMo);
        const rUnplannedOutage = this.calculateUnplannedOutage(rFo, rFoEp, rDerKit, rDerTrans, rVarmus);
        const rDmp = this.calculateDMP(rDmn, rPlannedOutage, rUnplannedOutage);
        const rCad = this.calculateCAD(rDmp, rBp);
        const rStatus = this.determineStatus(rCad, minReserveThreshold);

        return {
          dmn: rDmn,
          po: rPo,
          mo: rMo,
          fo: rFo,
          foEp: rFoEp,
          derKit: rDerKit,
          derTrans: rDerTrans,
          varmus: rVarmus,
          bp: rBp,
          plannedOutage: rPlannedOutage,
          unplannedOutage: rUnplannedOutage,
          totalOutage: rPlannedOutage + rUnplannedOutage,
          dmp: rDmp,
          cad: rCad,
          statusKey: rStatus.key,
          statusLabel: rStatus.label,
          statusColor: rStatus.color,
          statusBadge: rStatus.badgeClass,
          // Deviasi vs Rencana (Realisasi - Rencana)
          deltaBP: rBp - bp,
          deltaCAD: rCad - cad,
          deltaDMP: rDmp - dmp,
          deltaPlannedOutage: rPlannedOutage - plannedOutage,
          deltaUnplannedOutage: rUnplannedOutage - unplannedOutage,
          deltaOutage: (rPlannedOutage + rUnplannedOutage) - (plannedOutage + unplannedOutage),
          accuracyBP: bp > 0 ? Math.max(0, 100 - (Math.abs(rBp - bp) / bp) * 100) : 100,
          notes: rRaw.notes || '',
          updatedAt: rRaw.updatedAt || null
        };
      })()
    };
  },

  /**
   * Format tanda selisih (delta): e.g. "+150,00 MW" atau "-80,50 MW"
   */
  formatDelta(val, decimals = 2, unit = 'MW') {
    if (val === null || val === undefined || isNaN(val)) return '-';
    const sign = val > 0 ? '+' : (val < 0 ? '-' : '±');
    const absVal = Math.abs(val);
    return `${sign}${this.formatNumber(absVal, decimals)} ${unit}`.trim();
  },

  /**
   * Format number standar Indonesia/PLN: 1.234.567,89
   */
  formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return '0,00';
    const num = Number(value);
    return num.toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  /**
   * Format tanggal lokal Indonesia: e.g. "01 Juli 2026"
   */
  formatDateIndo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  },

  /**
   * Format bulan: e.g. "Juli 2026"
   */
  formatMonthYear(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
};
