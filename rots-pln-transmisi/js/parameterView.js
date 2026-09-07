/**
 * ROTS PLN TRANSMISI - Parameter & Master Data View
 * Mengelola Batas Cadangan Minimum dengan Audit Trail, serta Master Data Sistem.
 */

import { CalculationService } from './calculation.js';
import { store } from './store.js';

export class ParameterView {
  constructor() {}

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Form update parameter Batas Cadangan Minimum
    const formParam = document.getElementById('formUpdateThreshold');
    if (formParam) {
      formParam.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputVal = document.getElementById('inputThresholdVal').value;
        const inputUser = document.getElementById('inputThresholdUser').value || 'Administrator ROTS';
        const inputNote = document.getElementById('inputThresholdNote').value || 'Penyesuaian batas operasi cadangan daya';

        const success = store.updateMinReserveThreshold(inputVal, inputUser, inputNote);
        if (success) {
          alert(`Batas Cadangan Minimum berhasil diperbarui menjadi ${CalculationService.formatNumber(inputVal)} MW.`);
          this.render();
        } else {
          alert('Mohon masukkan angka nilai batas cadangan yang valid!');
        }
      });
    }

    // Form Tambah Sistem Baru
    const formAddSystem = document.getElementById('formAddSystem');
    if (formAddSystem) {
      formAddSystem.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('inputSysCode').value.trim();
        const name = document.getElementById('inputSysName').value.trim();
        const region = document.getElementById('inputSysRegion').value.trim();

        if (!code || !name) {
          alert('Kode dan Nama Sistem wajib diisi!');
          return;
        }

        store.addSystem({ code, name, region });
        document.getElementById('inputSysCode').value = '';
        document.getElementById('inputSysName').value = '';
        document.getElementById('inputSysRegion').value = '';
        alert(`Sistem ${name} (${code}) berhasil ditambahkan ke master data!`);
        this.renderSystems();
      });
    }

    // Tombol Reset Seed Data
    const btnReset = document.getElementById('btnResetData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin mengembalikan seluruh data dan parameter ke kondisi awal (default)?')) {
          store.resetToDefaults();
          alert('Data berhasil di-reset ke nilai default.');
          window.location.reload();
        }
      });
    }
  }

  render() {
    this.renderParameters();
    this.renderPeriodParams();
    this.renderAuditLogs();
    this.renderSystems();
  }

  renderParameters() {
    const inputVal = document.getElementById('inputThresholdVal');
    const badgeVal = document.getElementById('currentThresholdDisplay');
    const curVal = store.params.minReserveThreshold;

    if (inputVal) inputVal.value = curVal;
    if (badgeVal) badgeVal.textContent = `${CalculationService.formatNumber(curVal)} MW`;
  }

  renderPeriodParams() {
    const tbody = document.getElementById('periodParamsTableBody');
    if (!tbody) return;

    const PERIOD_META = {
      ROT:  { label: 'ROT – Tahunan',           color: '#2563EB', badgeClass: 'period-badge-ROT'  },
      ROTS: { label: 'ROTS – Semester',          color: '#7C3AED', badgeClass: 'period-badge-ROTS' },
      ROB:  { label: 'ROB – Bulanan',            color: '#059669', badgeClass: 'period-badge-ROB'  },
      ROM:  { label: 'ROM – Mingguan',           color: '#D97706', badgeClass: 'period-badge-ROM'  },
    };

    const periodParams = store.params.periodParams;
    const activePeriod = store.planningPeriod.type;

    tbody.innerHTML = Object.entries(PERIOD_META).map(([type, meta]) => {
      const cfg = periodParams[type] || { dmnAdjust: 0, foderAdj: 0, cadMin: 2000 };
      const isActive = type === activePeriod;
      const rowBg = isActive ? '#F0F9FF' : '';

      return `
        <tr style="background: ${rowBg};" data-period-type="${type}">
          <td>
            <span class="period-type-badge ${meta.badgeClass}" style="font-size: 11px;">${type}</span>
            <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${meta.label}</div>
            ${isActive ? '<span style="font-size: 9.5px; color: #0284C7; font-weight: 700;">● Aktif</span>' : ''}
          </td>
          <td class="text-right">
            <input type="number" class="period-param-input" data-type="${type}" data-key="dmnAdjust"
              value="${cfg.dmnAdjust}" step="50"
              style="width: 90px; text-align: right; font-family: monospace; font-weight: 600;
                     padding: 4px 6px; border: 1px solid #E2E8F0; border-radius: 4px; font-size: 12.5px;">
            <span style="font-size: 11px; color: #64748B;"> MW</span>
          </td>
          <td class="text-right">
            <input type="number" class="period-param-input" data-type="${type}" data-key="foderAdj"
              value="${(cfg.foderAdj * 100).toFixed(2)}" step="0.01" min="0" max="10"
              style="width: 70px; text-align: right; font-family: monospace; font-weight: 600;
                     padding: 4px 6px; border: 1px solid #E2E8F0; border-radius: 4px; font-size: 12.5px;">
            <span style="font-size: 11px; color: #64748B;"> %</span>
          </td>
          <td class="text-right">
            <input type="number" class="period-param-input" data-type="${type}" data-key="cadMin"
              value="${cfg.cadMin}" step="100" min="0"
              style="width: 90px; text-align: right; font-family: monospace; font-weight: 600;
                     padding: 4px 6px; border: 1px solid #E2E8F0; border-radius: 4px; font-size: 12.5px;">
            <span style="font-size: 11px; color: #64748B;"> MW</span>
          </td>
          <td class="text-center">
            <button class="btn-page btn-save-period-param" data-type="${type}"
              style="font-size: 11px; padding: 3px 10px; background: #7C3AED; color: #fff; border-color: #7C3AED;">
              <i class="fa fa-save"></i> Simpan
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind save button per row
    tbody.querySelectorAll('.btn-save-period-param').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const row  = tbody.querySelector(`tr[data-period-type="${type}"]`);
        if (!row) return;

        const inputs = row.querySelectorAll('.period-param-input');
        let allOk = true;
        inputs.forEach(inp => {
          const key = inp.getAttribute('data-key');
          let val = parseFloat(inp.value);
          if (isNaN(val)) { allOk = false; return; }
          // foderAdj disimpan sebagai desimal (0.005), input sebagai %
          if (key === 'foderAdj') val = val / 100;
          const ok = store.updatePeriodParam(type, key, val, 'Administrator ROTS');
          if (!ok) allOk = false;
        });

        if (allOk) {
          btn.textContent = '✓ Tersimpan';
          btn.style.background = '#10B981';
          btn.style.borderColor = '#10B981';
          setTimeout(() => {
            btn.innerHTML = '<i class="fa fa-save"></i> Simpan';
            btn.style.background = '#7C3AED';
            btn.style.borderColor = '#7C3AED';
          }, 1800);
          this.renderPeriodParams(); // re-render untuk update "Aktif" badge
          this.renderAuditLogs();
        } else {
          alert('Mohon periksa nilai yang dimasukkan!');
        }
      });
    });
  }

  renderAuditLogs() {
    const tbody = document.getElementById('auditLogTableBody');
    if (!tbody) return;

    const logs = store.auditLogs || [];
    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 20px;">Belum ada riwayat perubahan parameter.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(log => {
      const dateFormatted = new Date(log.timestamp).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      return `
        <tr>
          <td><span style="font-family: monospace; font-size: 11.5px;">${dateFormatted}</span></td>
          <td style="font-weight: 600;">${log.user}</td>
          <td><span class="badge-status badge-siaga">${log.action}</span></td>
          <td class="text-right" style="color: var(--text-muted);">${log.oldValue}</td>
          <td class="text-right" style="font-weight: 700; color: #0284C7;">${log.newValue}</td>
          <td style="color: var(--text-main); font-style: italic;">${log.note}</td>
        </tr>
      `;
    }).join('');
  }

  renderSystems() {
    const tbody = document.getElementById('masterSystemsTableBody');
    if (!tbody) return;

    const systems = store.systems || [];
    tbody.innerHTML = systems.map(sys => {
      return `
        <tr>
          <td><strong>${sys.code}</strong></td>
          <td>${sys.name}</td>
          <td>${sys.region || '-'}</td>
          <td class="text-center">
            <span class="badge-status ${sys.active ? 'badge-normal' : 'badge-defisit'}">
              ${sys.active ? 'AKTIF' : 'NON-AKTIF'}
            </span>
          </td>
          <td class="text-center">
            <button class="btn-page btn-toggle-sys" data-id="${sys.id}" style="font-size: 11px; padding: 3px 8px;">
              ${sys.active ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-toggle-sys').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.toggleSystemActive(id);
        this.renderSystems();
      });
    });
  }
}

export const parameterView = new ParameterView();
