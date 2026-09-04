/**
 * ROTS PLN TRANSMISI - Outage View Module
 * Menganalisis komponen Planned Outage (PO, MO) dan Unplanned Outage (FO, FO EP, DER KIT, DER TRANS, VARMUS)
 */

import { CalculationService } from './calculation.js';
import { store } from './store.js';
import { chartService } from './charts.js';

export class OutageView {
  constructor() {
    this.activeTab = 'planned'; // 'planned' or 'unplanned'
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const tabButtons = document.querySelectorAll('.outage-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.getAttribute('data-tab');
        this.render();
      });
    });
  }

  render() {
    const records = store.getFilteredRecords();
    if (!records.length) return;

    this.renderMetrics(records);
    this.renderMonthlyTable(records);
    chartService.renderOutageChart('outageTrendCanvas', records);
  }

  renderMetrics(records) {
    const count = records.length;
    let sumPO = 0, sumMO = 0, sumFO = 0, sumFOEP = 0, sumDERKIT = 0, sumDERTRANS = 0, sumVARMUS = 0;
    let sumPlanned = 0, sumUnplanned = 0;

    records.forEach(r => {
      sumPO += r.po;
      sumMO += r.mo;
      sumFO += r.fo;
      sumFOEP += r.foEp;
      sumDERKIT += r.derKit;
      sumDERTRANS += r.derTrans;
      sumVARMUS += r.varmus;
      sumPlanned += r.plannedOutage;
      sumUnplanned += r.unplannedOutage;
    });

    const plannedContainer = document.getElementById('outageTabPlannedContent');
    const unplannedContainer = document.getElementById('outageTabUnplannedContent');

    if (this.activeTab === 'planned') {
      if (plannedContainer) plannedContainer.style.display = 'block';
      if (unplannedContainer) unplannedContainer.style.display = 'none';

      const elAvgPlanned = document.getElementById('metricAvgPlanned');
      const elAvgPO = document.getElementById('metricAvgPO');
      const elAvgMO = document.getElementById('metricAvgMO');

      if (elAvgPlanned) elAvgPlanned.textContent = `${CalculationService.formatNumber(sumPlanned / count)} MW`;
      if (elAvgPO) elAvgPO.textContent = `${CalculationService.formatNumber(sumPO / count)} MW`;
      if (elAvgMO) elAvgMO.textContent = `${CalculationService.formatNumber(sumMO / count)} MW`;

    } else {
      if (plannedContainer) plannedContainer.style.display = 'none';
      if (unplannedContainer) unplannedContainer.style.display = 'block';

      const elAvgUnplanned = document.getElementById('metricAvgUnplanned');
      const elAvgFO = document.getElementById('metricAvgFO');
      const elAvgFOEP = document.getElementById('metricAvgFOEP');
      const elAvgDERKIT = document.getElementById('metricAvgDERKIT');
      const elAvgVARMUS = document.getElementById('metricAvgVARMUS');

      if (elAvgUnplanned) elAvgUnplanned.textContent = `${CalculationService.formatNumber(sumUnplanned / count)} MW`;
      if (elAvgFO) elAvgFO.textContent = `${CalculationService.formatNumber(sumFO / count)} MW`;
      if (elAvgFOEP) elAvgFOEP.textContent = `${CalculationService.formatNumber(sumFOEP / count)} MW`;
      if (elAvgDERKIT) elAvgDERKIT.textContent = `${CalculationService.formatNumber(sumDERKIT / count)} MW`;
      if (elAvgVARMUS) elAvgVARMUS.textContent = `${CalculationService.formatNumber(sumVARMUS / count)} MW`;
    }
  }

  renderMonthlyTable(records) {
    const tbody = document.getElementById('outageMonthlyTableBody');
    if (!tbody) return;

    // Group by month
    const groups = {};
    records.forEach(r => {
      const monthKey = r.tanggal.substring(0, 7);
      if (!groups[monthKey]) {
        groups[monthKey] = {
          label: CalculationService.formatMonthYear(r.tanggal),
          records: []
        };
      }
      groups[monthKey].records.push(r);
    });

    const monthKeys = Object.keys(groups).sort();
    let totalPO = 0, totalMO = 0, totalPlanned = 0, totalFO = 0, totalFOEP = 0, totalDER = 0, totalVARMUS = 0, totalUnplanned = 0;
    let totalDays = 0;

    tbody.innerHTML = monthKeys.map(key => {
      const g = groups[key];
      const recs = g.records;
      const n = recs.length;
      totalDays += n;

      let po = 0, mo = 0, fo = 0, foEp = 0, der = 0, varmus = 0;
      recs.forEach(r => {
        po += r.po;
        mo += r.mo;
        fo += r.fo;
        foEp += r.foEp;
        der += (r.derKit + r.derTrans);
        varmus += r.varmus;
      });

      totalPO += po;
      totalMO += mo;
      totalFO += fo;
      totalFOEP += foEp;
      totalDER += der;
      totalVARMUS += varmus;

      const planned = po + mo;
      const unplanned = fo + foEp + der + varmus;
      totalPlanned += planned;
      totalUnplanned += unplanned;

      return `
        <tr>
          <td style="font-weight: 700;">${g.label}</td>
          <td class="text-right" style="color: #D97706;">${CalculationService.formatNumber(po / n)}</td>
          <td class="text-right" style="color: #D97706;">${CalculationService.formatNumber(mo / n)}</td>
          <td class="text-right" style="font-weight: 700; color: #D97706; background: rgba(245, 158, 11, 0.05);">${CalculationService.formatNumber(planned / n)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(fo / n)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(foEp / n)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(der / n)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(varmus / n)}</td>
          <td class="text-right" style="font-weight: 700; color: #DC2626; background: rgba(239, 68, 68, 0.05);">${CalculationService.formatNumber(unplanned / n)}</td>
          <td class="text-center" style="font-weight: 600;">${n} Hari</td>
        </tr>
      `;
    }).join('');

    const tfoot = document.getElementById('outageMonthlyTableFoot');
    if (tfoot && totalDays > 0) {
      tfoot.innerHTML = `
        <tr>
          <td>RATA-RATA HARIAN</td>
          <td class="text-right">${CalculationService.formatNumber(totalPO / totalDays)}</td>
          <td class="text-right">${CalculationService.formatNumber(totalMO / totalDays)}</td>
          <td class="text-right" style="color: #D97706;">${CalculationService.formatNumber(totalPlanned / totalDays)}</td>
          <td class="text-right">${CalculationService.formatNumber(totalFO / totalDays)}</td>
          <td class="text-right">${CalculationService.formatNumber(totalFOEP / totalDays)}</td>
          <td class="text-right">${CalculationService.formatNumber(totalDER / totalDays)}</td>
          <td class="text-right">${CalculationService.formatNumber(totalVARMUS / totalDays)}</td>
          <td class="text-right" style="color: #DC2626;">${CalculationService.formatNumber(totalUnplanned / totalDays)}</td>
          <td class="text-center">${totalDays} Hari</td>
        </tr>
      `;
    }
  }
}

export const outageView = new OutageView();
