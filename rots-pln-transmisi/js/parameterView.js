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
