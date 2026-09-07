/**
 * ROTS PLN TRANSMISI - Chart Visualizations
 * Semi-circular Gauge Meter, CAD Trend Line Chart (with reference lines),
 * DMP vs BP Bar Chart, and Status Donut Chart.
 */

import { CalculationService } from './calculation.js';

export class ChartService {
  constructor() {
    this.gaugeCanvas = null;
    this.trendChartInstance = null;
    this.dmpBpChartInstance = null;
    this.donutChartInstance = null;
    this.outageChartInstance = null;
    this.fullscreenTrendChartInstance = null;
    this.neracaChartInstance = null;
    this.fullscreenNeracaChartInstance = null;
  }

  /**
   * Menggambar Stacked Area Chart "Neraca Daya ROTS Sistem" (Modern Grid Dispatch Aesthetics)
   * Lapisan Area (stack: 'balanceStack'):
   *   1. DMP (Sky Cyan) dari 0 MW sampai daya mampu pembangkitan
   *   2. PLANNED OUTAGE (Luminous Amber) ditumpuk di atas DMP
   *   3. UNPLANNED OUTAGE (Rose Red) ditumpuk di atas PO hingga DMN
   * Serta kurva independen:
   *   4. Garis DMN (Sapphire) sebagai plafon kapasitas total
   *   5. Garis Beban Puncak BP (Dark Carbon) di dalam zona pasokan DMP
   */
  renderNeracaDayaChart(canvasId, records, viewMode = 'rencana') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Pastikan canvas memiliki dimensi render valid
    if (canvas.offsetParent === null && canvas.width === 0) return;

    const ctx = canvas.getContext('2d');
    const isFullscreen = canvasId === 'neracaDayaCanvasFullscreen';

    // Kelola instance chart secara terpisah agar modal fullscreen tidak merusak chart utama dashboard
    if (isFullscreen) {
      if (this.fullscreenNeracaChartInstance) {
        this.fullscreenNeracaChartInstance.destroy();
      }
    } else {
      if (this.neracaChartInstance) {
        this.neracaChartInstance.destroy();
      }
    }

    const labels = records.map(r => {
      const p = r.tanggal.split('-');
      return `${p[2]}/${p[1]}`;
    });

    const isRealisasiOnly = viewMode === 'realisasi';
    const isKomparasi = viewMode === 'komparasi';

    const dmpData = records.map(r => (isRealisasiOnly && r.realisasi) ? r.realisasi.dmp : r.dmp);
    const poData = records.map(r => (isRealisasiOnly && r.realisasi) ? r.realisasi.plannedOutage : r.plannedOutage);
    const uoData = records.map(r => (isRealisasiOnly && r.realisasi) ? r.realisasi.unplannedOutage : r.unplannedOutage);
    const dmnData = records.map(r => (isRealisasiOnly && r.realisasi) ? r.realisasi.dmn : r.dmn);
    const bpPlanData = records.map(r => r.bp);
    const bpRealData = records.map(r => r.realisasi ? r.realisasi.bp : null);

    // Dynamic Gradients untuk tampilan mewah dan berdimensi
    const chartHeight = canvas.clientHeight || 320;
    
    // 1. DMP Gradient (Electric Sky to Cyan)
    const dmpGrad = ctx.createLinearGradient(0, 0, 0, chartHeight);
    dmpGrad.addColorStop(0, 'rgba(14, 165, 233, 0.85)');
    dmpGrad.addColorStop(1, 'rgba(2, 132, 199, 0.55)');

    // 2. Planned Outage Gradient (Warm Amber Gold)
    const poGrad = ctx.createLinearGradient(0, 0, 0, chartHeight);
    poGrad.addColorStop(0, 'rgba(245, 158, 11, 0.80)');
    poGrad.addColorStop(1, 'rgba(217, 119, 6, 0.50)');

    // 3. Unplanned Outage Gradient (Vibrant Rose Red)
    const uoGrad = ctx.createLinearGradient(0, 0, 0, chartHeight);
    uoGrad.addColorStop(0, 'rgba(244, 63, 94, 0.85)');
    uoGrad.addColorStop(1, 'rgba(225, 29, 72, 0.55)');

    const datasets = [
      // 1. DMP - Sky Cyan Area Stack
      {
        label: isRealisasiOnly ? 'DMP Realisasi' : 'DMP (Daya Mampu Pembangkitan)',
        data: dmpData,
        backgroundColor: dmpGrad,
        borderColor: '#0284C7',
        borderWidth: 1.5,
        tension: 0.08,
        fill: true,
        stack: 'balanceStack',
        pointRadius: 0,
        order: 4
      },
      // 2. PLANNED OUTAGE - Golden Amber Area Stack
      {
        label: isRealisasiOnly ? 'Planned Outage Realisasi' : 'Planned Outage (PO + MO)',
        data: poData,
        backgroundColor: poGrad,
        borderColor: '#D97706',
        borderWidth: 1.2,
        tension: 0.08,
        fill: true,
        stack: 'balanceStack',
        pointRadius: 0,
        order: 5
      },
      // 3. UNPLANNED OUTAGE - Rose/Crimson Area Stack
      {
        label: isRealisasiOnly ? 'Unplanned Outage Realisasi' : 'Unplanned Outage (FO + Derating)',
        data: uoData,
        backgroundColor: uoGrad,
        borderColor: '#E11D48',
        borderWidth: 1.2,
        tension: 0.08,
        fill: true,
        stack: 'balanceStack',
        pointRadius: 0,
        order: 6
      },
      // 4. Garis DMN
      {
        label: 'DMN (Kapasitas Netto)',
        data: dmnData,
        borderColor: '#1D4ED8',
        borderWidth: 2.2,
        borderDash: [6, 4],
        tension: 0.02,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        order: 3
      }
    ];

    if (isKomparasi) {
      // Tampilkan BP Rencana (garis putus-putus abu-abu) dan BP Realisasi (garis solid tegas)
      datasets.push({
        label: 'BP Rencana (ROTS)',
        data: bpPlanData,
        borderColor: '#64748B',
        borderWidth: 2,
        borderDash: [5, 4],
        tension: 0.15,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        order: 2
      });

      datasets.push({
        label: 'BP Realisasi (Aktual)',
        data: bpRealData,
        borderColor: '#10B981',
        borderWidth: 2.8,
        tension: 0.15,
        pointRadius: 1,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#10B981',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2,
        spanGaps: true,
        fill: false,
        order: 1
      });
    } else if (isRealisasiOnly) {
      datasets.push({
        label: 'BP Realisasi',
        data: bpRealData,
        borderColor: '#10B981',
        borderWidth: 2.5,
        tension: 0.15,
        pointRadius: 1,
        pointHoverRadius: 5,
        spanGaps: true,
        fill: false,
        order: 1
      });
    } else {
      datasets.push({
        label: 'Beban Puncak (BP)',
        data: bpPlanData,
        borderColor: '#0F172A',
        borderWidth: 2.5,
        tension: 0.18,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#0F172A',
        pointHoverBorderWidth: 2.5,
        fill: false,
        order: 1
      });
    }

    const newInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: isFullscreen,
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              padding: 12,
              font: { size: 11.5, family: 'Inter', weight: '600' },
              color: '#334155'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
            padding: 14,
            cornerRadius: 10,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                return CalculationService.formatDateIndo(records[idx].tanggal);
              },
              label: (item) => {
                const val = CalculationService.formatNumber(item.parsed.y);
                return ` ${item.dataset.label.split(' (')[0]}: ${val} MW`;
              },
              footer: (items) => {
                const idx = items[0].dataIndex;
                const rec = records[idx];
                const cad = CalculationService.formatNumber(rec.cad);
                const status = rec.cad >= 2000 ? '🟢 NORMAL' : (rec.cad >= 0 ? '🟡 SIAGA' : '🔴 DEFISIT');
                return `\nCadangan Daya (CAD): ${cad} MW\nStatus Sistem: ${status}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 10,
              font: { size: 11, family: 'Inter' },
              color: '#64748B'
            }
          },
          y: {
            max: 56000,
            min: 0,
            grid: {
              color: '#F1F5F9',
              drawBorder: false
            },
            ticks: {
              stepSize: 10000,
              callback: (v) => `${CalculationService.formatNumber(v, 0)} MW`,
              font: { size: 11, family: 'Inter' },
              color: '#64748B'
            }
          }
        }
      }
    });

    if (isFullscreen) {
      this.fullscreenNeracaChartInstance = newInstance;
    } else {
      this.neracaChartInstance = newInstance;
    }

    return newInstance;
  }

  /**
   * Menggambar Semi-circular Radial Gauge Canvas untuk CAD Saat Ini
   */
  renderGauge(canvasId, currentCad, threshold = 2000) {
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      if (canvas.offsetParent === null) return;

      const rect = canvas.getBoundingClientRect();
      if (!rect || rect.width <= 30 || rect.height <= 20) return;

      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height - 8;
      const radius = Math.min(centerX - 14, height - 14);
      if (isNaN(radius) || radius <= 10) return;
      const lineWidth = Math.max(10, Math.min(15, Math.round(radius * 0.22)));

      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Rentang gauge: Min = -1000 MW, Max = 6000 MW
    const minVal = -1000;
    const maxVal = 6000;

    // Angle mapping: Semi-circle dari Math.PI (kiri) ke 2 * Math.PI (kanan)
    const valToAngle = (v) => {
      const clamped = Math.max(minVal, Math.min(maxVal, v));
      const pct = (clamped - minVal) / (maxVal - minVal);
      return Math.PI + pct * Math.PI;
    };

    const angleZero = valToAngle(0);
    const angleThreshold = valToAngle(threshold);

    // 1. Arc DEFISIT (< 0 MW) -> Merah
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, angleZero, false);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // 2. Arc SIAGA (0 s.d. Batas Minimum) -> Oranye / Kuning
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angleZero, angleThreshold, false);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // 3. Arc NORMAL (> Batas Minimum) -> Hijau
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angleThreshold, 2 * Math.PI, false);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Subtle divider ticks
    [angleZero, angleThreshold].forEach(angle => {
      ctx.beginPath();
      const x1 = centerX + (radius - lineWidth / 2) * Math.cos(angle);
      const y1 = centerY + (radius - lineWidth / 2) * Math.sin(angle);
      const x2 = centerX + (radius + lineWidth / 2) * Math.cos(angle);
      const y2 = centerY + (radius + lineWidth / 2) * Math.sin(angle);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    // 4. Pointer Needle
    const needleAngle = valToAngle(currentCad);
    const needleLen = radius - 8;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(needleAngle);

    // Needle body
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(needleLen, 0);
    ctx.lineTo(0, 4);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fillStyle = '#0A2540';
    ctx.fill();

    // Center pivot knob
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    ctx.restore();
    } catch (err) {
      console.warn('renderGauge safe skip:', err);
    }
  }

  /**
   * Line Chart Trend Cadangan Daya dengan 2 Reference Lines (Threshold & 0 MW)
   */
  renderTrendChart(canvasId, records, threshold = 2000, viewMode = 'rencana') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
    }

    const labels = records.map(r => {
      const parts = r.tanggal.split('-');
      return `${parts[2]}/${parts[1]}`;
    });
    const cadPlanValues = records.map(r => r.cad);
    const cadRealValues = records.map(r => r.realisasi ? r.realisasi.cad : null);

    // Gradient background for CAD line
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(0, 163, 224, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 163, 224, 0.01)');

    const isKomparasi = viewMode === 'komparasi';
    const isRealisasiOnly = viewMode === 'realisasi';

    const datasets = [];

    if (isKomparasi) {
      datasets.push({
        label: 'CAD Rencana (MW)',
        data: cadPlanValues,
        borderColor: '#0284C7',
        borderWidth: 1.8,
        borderDash: [5, 4],
        tension: 0.25,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4
      });

      datasets.push({
        label: 'CAD Realisasi (MW)',
        data: cadRealValues,
        borderColor: '#10B981',
        borderWidth: 2.5,
        tension: 0.25,
        fill: false,
        pointRadius: 1,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#10B981',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2,
        spanGaps: true
      });
    } else if (isRealisasiOnly) {
      datasets.push({
        label: 'CAD Realisasi (MW)',
        data: cadRealValues,
        borderColor: '#10B981',
        borderWidth: 2.2,
        tension: 0.25,
        fill: false,
        pointRadius: 1,
        pointHoverRadius: 5,
        spanGaps: true
      });
    } else {
      datasets.push({
        label: 'CAD (MW)',
        data: cadPlanValues,
        borderColor: '#00A3E0',
        backgroundColor: gradient,
        borderWidth: 2,
        tension: 0.25,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#00A3E0',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2
      });
    }

    datasets.push({
      label: `Batas Minimum (${CalculationService.formatNumber(threshold, 0)} MW)`,
      data: records.map(() => threshold),
      borderColor: '#F59E0B',
      borderWidth: 1.8,
      borderDash: [5, 4],
      pointRadius: 0,
      fill: false
    });

    datasets.push({
      label: '0 MW (Defisit)',
      data: records.map(() => 0),
      borderColor: '#EF4444',
      borderWidth: 1.8,
      borderDash: [4, 4],
      pointRadius: 0,
      fill: false
    });

    this.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'line',
              font: { size: 11, family: 'Inter' }
            }
          },
          tooltip: {
            backgroundColor: '#0A2540',
            titleFont: { family: 'Inter', size: 12, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                return CalculationService.formatDateIndo(records[idx].tanggal);
              },
              label: (item) => {
                if (item.datasetIndex === 0) {
                  const val = item.parsed.y;
                  const idx = item.dataIndex;
                  const status = records[idx].statusLabel;
                  return `CAD: ${CalculationService.formatNumber(val)} MW [${status}]`;
                }
                return `${item.dataset.label}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 8,
              font: { size: 11, family: 'Inter' },
              color: '#64748B'
            }
          },
          y: {
            grid: { color: '#EDF2F7' },
            ticks: {
              callback: (v) => CalculationService.formatNumber(v, 0),
              font: { size: 10.5, family: 'Inter' },
              color: '#64748B'
            }
          }
        }
      }
    });
  }

  /**
   * Render Trend Cadangan Daya di Layar Penuh (High Resolution + Detail Dots)
   */
  renderFullscreenTrendChart(canvasId, records, threshold = 2000) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (this.fullscreenTrendChartInstance) {
      this.fullscreenTrendChartInstance.destroy();
    }

    const labels = records.map(r => CalculationService.formatDateIndo(r.tanggal));
    const cadValues = records.map(r => r.cad);

    const gradient = ctx.createLinearGradient(0, 0, 0, 450);
    gradient.addColorStop(0, 'rgba(0, 163, 224, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 163, 224, 0.02)');

    // Warna point berdasarkan status
    const pointColors = records.map(r => {
      if (r.statusKey === 'DEFISIT') return '#EF4444';
      if (r.statusKey === 'SIAGA') return '#F59E0B';
      return '#10B981';
    });

    this.fullscreenTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Cadangan Daya (CAD)',
            data: cadValues,
            borderColor: '#00A3E0',
            backgroundColor: gradient,
            borderWidth: 2.5,
            tension: 0.2,
            fill: true,
            pointRadius: 3.5,
            pointBackgroundColor: pointColors,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 1.5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: pointColors,
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 2.5
          },
          {
            label: `Batas Minimum (${CalculationService.formatNumber(threshold, 0)} MW)`,
            data: records.map(() => threshold),
            borderColor: '#F59E0B',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false
          },
          {
            label: '0 MW (Batas Defisit)',
            data: records.map(() => 0),
            borderColor: '#EF4444',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 14,
              usePointStyle: true,
              font: { size: 12, family: 'Inter', weight: '600' }
            }
          },
          tooltip: {
            backgroundColor: '#0A2540',
            titleFont: { family: 'Inter', size: 13, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 12.5 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: (items) => items[0].label,
              label: (item) => {
                if (item.datasetIndex === 0) {
                  const idx = item.dataIndex;
                  const rec = records[idx];
                  return [
                    `CAD: ${CalculationService.formatNumber(rec.cad)} MW [${rec.statusLabel}]`,
                    `DMP: ${CalculationService.formatNumber(rec.dmp)} MW | BP: ${CalculationService.formatNumber(rec.bp)} MW`,
                    `Planned Outage: ${CalculationService.formatNumber(rec.plannedOutage)} MW | Unplanned: ${CalculationService.formatNumber(rec.unplannedOutage)} MW`
                  ];
                }
                return item.dataset.label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#F1F5F9' },
            ticks: {
              maxTicksLimit: 14,
              font: { size: 11, family: 'Inter' },
              color: '#64748B'
            }
          },
          y: {
            grid: { color: '#E2E8F0' },
            ticks: {
              callback: (v) => `${CalculationService.formatNumber(v, 0)} MW`,
              font: { size: 11, family: 'Inter' },
              color: '#64748B'
            }
          }
        }
      }
    });
  }

  /**
   * Unduh chart canvas sebagai file gambar PNG
   */
  exportChartImage(canvasId, filename = 'Trend_Cadangan_Daya_PLN.png') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
  }

  /**
   * Bar Chart: DMP Average vs BP Max per Bulan
   */
  renderDmpBpChart(canvasId, monthlyData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (this.dmpBpChartInstance) {
      this.dmpBpChartInstance.destroy();
    }

    const labels = monthlyData.rows.map(r => {
      // e.g. "Juli 2026" -> "Jul"
      const parts = r.monthLabel.split(' ');
      return parts[0].substring(0, 3);
    });

    const dmpAverages = monthlyData.rows.map(r => r.dmpAvg);
    const bpMaxs = monthlyData.rows.map(r => r.bpMax);

    this.dmpBpChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'DMP (MW)',
            data: dmpAverages,
            backgroundColor: '#10B981',
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            label: 'BP (MW)',
            data: bpMaxs,
            backgroundColor: '#7C3AED',
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              font: { size: 11, family: 'Inter' }
            }
          },
          tooltip: {
            backgroundColor: '#0A2540',
            callbacks: {
              label: (item) => `${item.dataset.label}: ${CalculationService.formatNumber(item.parsed.y)} MW`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, family: 'Inter' }, color: '#64748B' }
          },
          y: {
            grid: { color: '#EDF2F7' },
            ticks: {
              callback: (v) => CalculationService.formatNumber(v, 0),
              font: { size: 10.5, family: 'Inter' },
              color: '#64748B'
            }
          }
        }
      }
    });
  }

  /**
   * Donut Chart: Ringkasan Status (Normal, Siaga, Defisit)
   */
  renderStatusDonut(canvasId, statusCounts) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (this.donutChartInstance) {
      this.donutChartInstance.destroy();
    }

    const total = statusCounts.normal + statusCounts.siaga + statusCounts.defisit;

    this.donutChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Normal', 'Siaga', 'Defisit'],
        datasets: [
          {
            data: [statusCounts.normal, statusCounts.siaga, statusCounts.defisit],
            backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
            borderWidth: 2,
            borderColor: '#FFFFFF',
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0A2540',
            callbacks: {
              label: (item) => {
                const count = item.parsed;
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                return `${item.label}: ${count} hari (${pct}%)`;
              }
            }
          }
        }
      }
    });

    // Update center overlay text
    const overlay = document.getElementById('donutCenterOverlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="center-val">${total}</div>
        <div class="center-label">Total Hari</div>
      `;
    }
  }

  /**
   * Stacked Bar Chart for Outage Breakdown Tab with Dynamic Garis Trend Overlay
   */
  renderOutageChart(canvasId, records, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (this.outageChartInstance) {
      this.outageChartInstance.destroy();
    }

    const showTrendLine = options.showTrendLine !== false;
    const tab = options.tab || 'all'; // 'all' | 'planned' | 'unplanned'

    // Ambil sampel data tiap 2 hari agar chart tidak terlalu padat jika data panjang
    const sampled = records.length > 60 ? records.filter((_, idx) => idx % 2 === 0) : records;
    const labels = sampled.map(r => {
      const p = r.tanggal.split('-');
      return `${p[2]}/${p[1]}`;
    });

    const datasets = [];

    // 1. GARIS TREND OVERLAY (Direncanakan di atas bar)
    if (showTrendLine) {
      if (tab === 'planned') {
        datasets.push({
          type: 'line',
          label: '📈 Garis Trend Planned Outage (PO + MO)',
          data: sampled.map(r => r.plannedOutage),
          borderColor: '#D97706',
          backgroundColor: 'rgba(217, 119, 6, 0.08)',
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#D97706',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 1.5,
          tension: 0.35,
          order: 0,
          yAxisID: 'y'
        });
      } else if (tab === 'unplanned') {
        datasets.push({
          type: 'line',
          label: '📈 Garis Trend Unplanned Outage (FO + Derating)',
          data: sampled.map(r => r.unplannedOutage),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#DC2626',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 1.5,
          tension: 0.35,
          order: 0,
          yAxisID: 'y'
        });
      } else {
        // Mode All: Garis Trend Total Outage
        datasets.push({
          type: 'line',
          label: '📈 Garis Trend Total Outage (MW)',
          data: sampled.map(r => r.plannedOutage + r.unplannedOutage),
          borderColor: '#4F46E5', // Electric Indigo
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#4F46E5',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 1.5,
          tension: 0.35,
          order: 0,
          yAxisID: 'y'
        });
      }
    }

    // 2. STACKED BAR DATASETS
    if (tab === 'all' || tab === 'planned') {
      datasets.push(
        { type: 'bar', label: 'PO (Planned Outage)', data: sampled.map(r => r.po), backgroundColor: '#F59E0B', stack: 'planned', order: 1 },
        { type: 'bar', label: 'MO (Maintenance)', data: sampled.map(r => r.mo), backgroundColor: '#D97706', stack: 'planned', order: 1 }
      );
    }

    if (tab === 'all' || tab === 'unplanned') {
      datasets.push(
        { type: 'bar', label: 'FO (Forced Outage)', data: sampled.map(r => r.fo), backgroundColor: '#EF4444', stack: 'unplanned', order: 1 },
        { type: 'bar', label: 'FO EP (FO Extension)', data: sampled.map(r => r.foEp), backgroundColor: '#DC2626', stack: 'unplanned', order: 1 },
        { type: 'bar', label: 'DER KIT (Derating Kit)', data: sampled.map(r => r.derKit), backgroundColor: '#F87171', stack: 'unplanned', order: 1 },
        { type: 'bar', label: 'VARMUS (Variasi Musim)', data: sampled.map(r => r.varmus), backgroundColor: '#FB923C', stack: 'unplanned', order: 1 }
      );
    }

    this.outageChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 13,
              usePointStyle: true,
              font: { size: 11, family: 'Inter', weight: 600 }
            }
          },
          tooltip: {
            backgroundColor: '#0A2540',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${CalculationService.formatNumber(item.parsed.y)} MW`
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { maxTicksLimit: 12, font: { size: 11, family: 'Inter' } }
          },
          y: {
            stacked: true,
            grid: { color: '#EDF2F7' },
            ticks: { callback: (v) => CalculationService.formatNumber(v, 0) }
          }
        }
      }
    });
  }
}

export const chartService = new ChartService();
