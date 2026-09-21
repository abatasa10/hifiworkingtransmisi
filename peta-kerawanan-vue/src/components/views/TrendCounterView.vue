<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
  Info,
  Layers,
  ArrowLeft,
  Search
} from 'lucide-vue-next';
import { useKerawananStore } from '../../stores/kerawananStore';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

const store = useKerawananStore();

// Configuration States
const selectedMode = ref<'RST_SPLIT' | 'RST_COMBINED'>('RST_SPLIT'); // R/S/T vs RST
const showFasaR = ref(true);
const showFasaS = ref(true);
const showFasaT = ref(true);
const selectedPeriod = ref<'6m' | '1y' | 'all'>('6m');

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// Mock Inspection History for "Kondisi Counter" & "Pencatatan Counter"
// Notice on 15 Aug 2026, Fasa S condition was 'Pecah' (broken glass), so counter was not incremented!
const inspectionData = [
  {
    date: '15 Mei 2026',
    inspNo: 'INS2026051501',
    petugas: 'Ahmad Fauzi (UPT Cawang)',
    r: { counter: 14, condition: 'Normal', statusColor: 'emerald' },
    s: { counter: 11, condition: 'Normal', statusColor: 'emerald' },
    t: { counter: 10, condition: 'Normal', statusColor: 'emerald' },
    combined: { counter: 35, condition: 'Normal' }
  },
  {
    date: '01 Jun 2026',
    inspNo: 'INS2026060104',
    petugas: 'Ismail Hasan (UPT Cawang)',
    r: { counter: 16, condition: 'Normal', statusColor: 'emerald' },
    s: { counter: 12, condition: 'Normal', statusColor: 'emerald' },
    t: { counter: 11, condition: 'Normal', statusColor: 'emerald' },
    combined: { counter: 39, condition: 'Normal' }
  },
  {
    date: '18 Jun 2026',
    inspNo: 'INS2026061809',
    petugas: 'Ahmad Fauzi (UPT Cawang)',
    r: { counter: 19, condition: 'Normal', statusColor: 'emerald' },
    s: { counter: 15, condition: 'Normal', statusColor: 'emerald' },
    t: { counter: 13, condition: 'Normal', statusColor: 'emerald' },
    combined: { counter: 47, condition: 'Normal' }
  },
  {
    date: '05 Jul 2026',
    inspNo: 'INS2026070503',
    petugas: 'Doni Pratama (ULTG Mampang)',
    r: { counter: 22, condition: 'Normal', statusColor: 'emerald' },
    s: { counter: 18, condition: 'Normal', statusColor: 'emerald' },
    t: { counter: 15, condition: 'Normal', statusColor: 'emerald' },
    combined: { counter: 55, condition: 'Normal' }
  },
  {
    date: '24 Jul 2026',
    inspNo: 'INS2026072411',
    petugas: 'Ismail Hasan (UPT Cawang)',
    r: { counter: 25, condition: 'Normal', statusColor: 'emerald' },
    s: { counter: 20, condition: 'Normal', statusColor: 'emerald' },
    t: { counter: 16, condition: 'Normal', statusColor: 'emerald' },
    combined: { counter: 61, condition: 'Normal' }
  },
  {
    date: '15 Agu 2026',
    inspNo: 'INS2026081502',
    petugas: 'Doni Pratama (ULTG Mampang)',
    // NOTE: Fasa S mengalami kaca PECAH, angka counter dicatat tetap atau null, diberi alert anomali!
    r: { counter: 27, condition: 'Normal', statusColor: 'emerald' },
    s: { counter: 20, condition: 'Pecah (Anomali)', statusColor: 'red', alert: true },
    t: { counter: 18, condition: 'Normal', statusColor: 'emerald' },
    combined: { counter: 65, condition: 'Anomali Fisik Fasa S' }
  },
  {
    date: '02 Sep 2026',
    inspNo: 'INS2026090208',
    petugas: 'Ahmad Fauzi (UPT Cawang)',
    // NOTE: Fasa S selesai diganti/perbaikan pada 28 Agu, counter kembali Normal!
    r: { counter: 28, condition: 'Normal', statusColor: 'emerald' },
    s: { counter: 22, condition: 'Normal (Pasca Perbaikan)', statusColor: 'emerald' },
    t: { counter: 19, condition: 'Normal', statusColor: 'emerald' },
    combined: { counter: 69, condition: 'Normal' }
  }
];

const renderChart = () => {
  if (!chartCanvas.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = inspectionData.map((d) => d.date);

  // Datasets preparation
  let datasets: any[] = [];

  if (selectedMode.value === 'RST_SPLIT') {
    if (showFasaR.value) {
      datasets.push({
        label: 'Pencatatan Counter - Fasa R',
        data: inspectionData.map((d) => d.r.counter),
        borderColor: '#EF4444',
        backgroundColor: '#EF4444',
        borderWidth: 2.5,
        tension: 0.25,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: inspectionData.map((d) => (d.r.statusColor === 'red' ? '#DC2626' : '#EF4444')),
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        extraData: inspectionData.map((d) => ({
          condition: d.r.condition,
          inspNo: d.inspNo,
          petugas: d.petugas
        }))
      });
    }

    if (showFasaS.value) {
      datasets.push({
        label: 'Pencatatan Counter - Fasa S',
        data: inspectionData.map((d) => d.s.counter),
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B',
        borderWidth: 2.5,
        tension: 0.25,
        // When Fasa S is 'Pecah', render a prominent warning point!
        pointRadius: inspectionData.map((d) => (d.s.statusColor === 'red' ? 9 : 6)),
        pointHoverRadius: 11,
        pointBackgroundColor: inspectionData.map((d) => (d.s.statusColor === 'red' ? '#DC2626' : '#F59E0B')),
        pointBorderColor: inspectionData.map((d) => (d.s.statusColor === 'red' ? '#FEF2F2' : '#FFFFFF')),
        pointBorderWidth: inspectionData.map((d) => (d.s.statusColor === 'red' ? 3 : 2)),
        extraData: inspectionData.map((d) => ({
          condition: d.s.condition,
          inspNo: d.inspNo,
          petugas: d.petugas,
          isAlert: d.s.statusColor === 'red'
        }))
      });
    }

    if (showFasaT.value) {
      datasets.push({
        label: 'Pencatatan Counter - Fasa T',
        data: inspectionData.map((d) => d.t.counter),
        borderColor: '#00529C',
        backgroundColor: '#00529C',
        borderWidth: 2.5,
        tension: 0.25,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#00529C',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        extraData: inspectionData.map((d) => ({
          condition: d.t.condition,
          inspNo: d.inspNo,
          petugas: d.petugas
        }))
      });
    }
  } else {
    // Mode RST (Gabungan)
    datasets.push({
      label: 'Pencatatan Counter Gabungan (RST)',
      data: inspectionData.map((d) => d.combined.counter),
      borderColor: '#059669',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      borderWidth: 3,
      tension: 0.25,
      pointRadius: 7,
      pointHoverRadius: 10,
      pointBackgroundColor: '#059669',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2.5,
      extraData: inspectionData.map((d) => ({
        condition: d.combined.condition,
        inspNo: d.inspNo,
        petugas: d.petugas
      }))
    });
  }

  chartInstance = new Chart(chartCanvas.value, {
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
          display: true,
          position: 'top',
          labels: {
            font: { family: "'Inter', sans-serif", size: 12 },
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { family: "'Inter', sans-serif", size: 13, weight: 'bold' },
          bodyFont: { family: "'Inter', sans-serif", size: 12 },
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              const dataset = context.dataset as any;
              const value = context.parsed.y;
              return ` ${dataset.label}: ${value} Sambaran`;
            },
            afterBody: function (contexts) {
              const idx = contexts[0].dataIndex;
              const item = inspectionData[idx];
              let lines = [
                `-----------------------------`,
                `• No. Inspeksi : ${item.inspNo}`,
                `• Petugas      : ${item.petugas}`,
                `• Kondisi Fisik:`
              ];

              if (selectedMode.value === 'RST_SPLIT') {
                if (showFasaR.value) lines.push(`   - Fasa R: ${item.r.condition}`);
                if (showFasaS.value) lines.push(`   - Fasa S: ${item.s.condition} ${item.s.alert ? '⚠️ (ANOMALI)' : ''}`);
                if (showFasaT.value) lines.push(`   - Fasa T: ${item.t.condition}`);
              } else {
                lines.push(`   - Kondisi: ${item.combined.condition}`);
              }

              return lines;
            }
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Akumulasi Pencatatan Counter (Kali Sambaran)',
            font: { family: "'Inter', sans-serif", size: 11, weight: 'bold' },
            color: '#64748b'
          },
          grid: {
            color: '#f1f5f9'
          },
          ticks: {
            stepSize: 5
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
};

onMounted(() => {
  renderChart();
});

watch([selectedMode, showFasaR, showFasaS, showFasaT], () => {
  renderChart();
});
</script>

<template>
  <div class="flex-1 flex flex-col bg-[#f4f7fa] overflow-y-auto p-6 select-none">
    <!-- Top Breadcrumb & Actions Bar -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
      <div class="flex items-center gap-3">
        <button
          @click="store.setView('national')"
          class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>
        <div>
          <h1 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <span>Tren Parameter Kombinasi: Kondisi & Pencatatan Counter</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-[#00529C] border border-blue-200">
              2 Tipe Input (Kualitatif + Kuantitatif)
            </span>
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Studi Kasus Peralatan: <strong>Lightning Arrester (LA 150 kV) Bay TRF#1 — GI Mampang (UIT JBB)</strong>
          </p>
        </div>
      </div>

      <!-- Action Button -->
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
      >
        <Download class="w-3.5 h-3.5 text-slate-500" />
        <span>Unduh Data (.CSV)</span>
      </button>
    </div>

    <!-- Parameter Architecture Explanation Card (Gambaran Konsep) -->
    <div class="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3.5 text-xs shadow-2xs">
      <div class="w-9 h-9 rounded-xl bg-[#00529C] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
        <Info class="w-5 h-5" />
      </div>
      <div class="flex-1 text-slate-700 leading-relaxed">
        <strong class="text-[#00529C] font-bold block mb-1">
          Penjelasan Solusi Desain UI/UX untuk Parameter 2 Input Berbeda:
        </strong>
        <p>
          Pada parameter ini terdapat <strong>2 jenis data</strong>:
          <span class="font-semibold text-slate-900"> (1) Kondisi Fisik</span> berupa radio button pilihan kualitatif (<em>Normal, Pecah, Rusak, dsb</em>), dan
          <span class="font-semibold text-slate-900"> (2) Pencatatan Counter</span> berupa input textbox numerik (angka akumulatif sambaran).
          <br />
          <strong>Solusi Visualisasi:</strong> Grafik garis (Line Chart) memplot pertambahan <em>angka counter kumulatif</em>, sedangkan <em>kondisi fisik</em> direpresentasikan secara langsung pada <strong>titik (point marker)</strong>. Bila terjadi anomali fisik (contoh: kaca <strong>Pecah</strong> pada 15 Agu 2026), titik di-highlight dengan tanda peringatan merah ⚠️ dan tercatat pada matriks status di bawah grafik.
        </p>
      </div>
    </div>

    <!-- KPI Summary Row -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div class="text-[11px] text-slate-500 font-medium">Pencatatan Counter Terkini</div>
        <div class="flex items-center gap-3 mt-1.5 font-mono">
          <span class="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">R: 28</span>
          <span class="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">S: 22</span>
          <span class="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">T: 19</span>
        </div>
        <div class="text-[10px] text-slate-400 mt-1.5">Inspeksi Terakhir: 02 Sep 2026</div>
      </div>

      <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div class="text-[11px] text-slate-500 font-medium">Total Aktivitas Sambaran (Δ)</div>
        <div class="text-2xl font-black text-slate-800 mt-1">+14 Kali</div>
        <div class="text-[10px] text-emerald-600 font-semibold mt-0.5">Akumulasi 6 bulan terakhir</div>
      </div>

      <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div class="text-[11px] text-slate-500 font-medium">Status Kondisi Fisik Terkini</div>
        <div class="flex items-center gap-1.5 mt-1 text-emerald-700 font-bold text-sm">
          <CheckCircle2 class="w-4 h-4 text-emerald-600" />
          <span>Semua Fasa Normal</span>
        </div>
        <div class="text-[10px] text-slate-400 mt-1">Fasa S pulih setelah perbaikan</div>
      </div>

      <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div class="text-[11px] text-slate-500 font-medium">Riwayat Anomali Fisik</div>
        <div class="flex items-center gap-1.5 mt-1 text-red-600 font-bold text-sm">
          <AlertTriangle class="w-4 h-4 text-red-500" />
          <span>1 Anomali Terdeteksi</span>
        </div>
        <div class="text-[10px] text-slate-400 mt-1">Kaca Counter Fasa S Pecah (15 Agu)</div>
      </div>
    </div>

    <!-- Chart Card with Controls -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 mb-6">
      <!-- Toolbar Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
        <div>
          <h3 class="font-extrabold text-sm text-slate-800">
            Grafik Kenaikan Counter & Peringatan Kondisi Fisik
          </h3>
          <p class="text-xs text-slate-500">
            Arahkan kursor (*hover*) ke titik grafik untuk melihat rincian angka counter dan status kondisi fisik inspeksi
          </p>
        </div>

        <!-- Filter Controls (R/S/T Mode, Checklist, Period) -->
        <div class="flex flex-wrap items-center gap-3 text-xs">
          <!-- Mode Toggle (R/S/T vs RST) -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              @click="selectedMode = 'RST_SPLIT'"
              class="px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer"
              :class="[selectedMode === 'RST_SPLIT' ? 'bg-white text-[#00529C] shadow-xs' : 'text-slate-600 hover:text-slate-900']"
            >
              Mode: R / S / T (3 Fasa)
            </button>
            <button
              @click="selectedMode = 'RST_COMBINED'"
              class="px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer"
              :class="[selectedMode === 'RST_COMBINED' ? 'bg-white text-[#00529C] shadow-xs' : 'text-slate-600 hover:text-slate-900']"
            >
              Mode: RST (Gabungan)
            </button>
          </div>

          <!-- Fasa Checkboxes (only shown in R/S/T mode) -->
          <div v-if="selectedMode === 'RST_SPLIT'" class="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg">
            <label class="flex items-center gap-1 text-red-700 font-semibold cursor-pointer">
              <input type="checkbox" v-model="showFasaR" class="rounded text-red-600" />
              <span>Fasa R</span>
            </label>
            <span class="text-slate-300">|</span>
            <label class="flex items-center gap-1 text-amber-700 font-semibold cursor-pointer">
              <input type="checkbox" v-model="showFasaS" class="rounded text-amber-500" />
              <span>Fasa S</span>
            </label>
            <span class="text-slate-300">|</span>
            <label class="flex items-center gap-1 text-[#00529C] font-semibold cursor-pointer">
              <input type="checkbox" v-model="showFasaT" class="rounded text-blue-600" />
              <span>Fasa T</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Canvas Area -->
      <div class="h-80 w-full relative">
        <canvas ref="chartCanvas"></canvas>
      </div>

      <!-- Bottom Timeline Status Strip (Pendekatan Split Matrix) -->
      <div class="mt-4 pt-4 border-t border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Activity class="w-3.5 h-3.5 text-slate-500" />
            <span>Matriks Riwayat Kondisi Fisik per Tanggal Inspeksi:</span>
          </span>
          <span class="text-[10px] text-slate-400">Sinkron dengan sumbu X grafik di atas</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-center text-[11px] border-collapse">
            <thead>
              <tr class="bg-slate-50 text-slate-500 border border-slate-200 font-medium">
                <th class="p-2 text-left w-24">Fasa</th>
                <th v-for="d in inspectionData" :key="d.date" class="p-2 border-l border-slate-200 font-mono">
                  {{ d.date.split(' ').slice(0, 2).join(' ') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Row Fasa R -->
              <tr v-if="selectedMode === 'RST_SPLIT' && showFasaR" class="border border-slate-200">
                <td class="p-2 text-left font-bold text-red-600 bg-red-50/50">Fasa R</td>
                <td v-for="d in inspectionData" :key="d.date" class="p-2 border-l border-slate-100">
                  <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ d.r.condition }}
                  </span>
                </td>
              </tr>

              <!-- Row Fasa S -->
              <tr v-if="selectedMode === 'RST_SPLIT' && showFasaS" class="border border-slate-200">
                <td class="p-2 text-left font-bold text-amber-600 bg-amber-50/50">Fasa S</td>
                <td v-for="d in inspectionData" :key="d.date" class="p-2 border-l border-slate-100">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold border"
                    :class="[
                      d.s.statusColor === 'red'
                        ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    ]"
                  >
                    {{ d.s.condition }}
                  </span>
                </td>
              </tr>

              <!-- Row Fasa T -->
              <tr v-if="selectedMode === 'RST_SPLIT' && showFasaT" class="border border-slate-200">
                <td class="p-2 text-left font-bold text-[#00529C] bg-blue-50/50">Fasa T</td>
                <td v-for="d in inspectionData" :key="d.date" class="p-2 border-l border-slate-100">
                  <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ d.t.condition }}
                  </span>
                </td>
              </tr>

              <!-- Row Combined RST -->
              <tr v-if="selectedMode === 'RST_COMBINED'" class="border border-slate-200">
                <td class="p-2 text-left font-bold text-emerald-700 bg-emerald-50/50">Gabungan RST</td>
                <td v-for="d in inspectionData" :key="d.date" class="p-2 border-l border-slate-100">
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ d.combined.condition }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Detailed Inspection Log Table (Format Power Inspect Resmi) -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h3 class="font-extrabold text-sm text-slate-800">Tabel Rekapitulasi Data Inspeksi Parameter</h3>
          <p class="text-xs text-slate-500">Mencatat data numerik pencatatan counter beserta status fisik kualitatif</p>
        </div>
        <div class="text-xs font-mono font-bold text-slate-500">
          Total 7 Catatan Inspeksi
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <th class="py-2.5 px-3">Tanggal</th>
              <th class="py-2.5 px-3">No. Inspeksi</th>
              <th class="py-2.5 px-3">Fasa R (Counter / Fisik)</th>
              <th class="py-2.5 px-3">Fasa S (Counter / Fisik)</th>
              <th class="py-2.5 px-3">Fasa T (Counter / Fisik)</th>
              <th class="py-2.5 px-3">Status Anomali</th>
              <th class="py-2.5 px-3">Petugas Pelaksana</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in inspectionData" :key="item.inspNo" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">{{ item.date }}</td>
              <td class="py-2.5 px-3 font-mono text-[#00529C] font-semibold">{{ item.inspNo }}</td>
              <td class="py-2.5 px-3">
                <span class="font-mono font-bold text-red-600">{{ item.r.counter }}</span>
                <span class="text-slate-400 mx-1">|</span>
                <span class="text-[11px] text-slate-600">{{ item.r.condition }}</span>
              </td>
              <td class="py-2.5 px-3">
                <span class="font-mono font-bold" :class="item.s.statusColor === 'red' ? 'text-red-600 font-extrabold' : 'text-amber-600'">
                  {{ item.s.counter }}
                </span>
                <span class="text-slate-400 mx-1">|</span>
                <span
                  class="text-[11px] font-semibold"
                  :class="item.s.statusColor === 'red' ? 'text-red-700 bg-red-100 px-1.5 py-0.5 rounded' : 'text-slate-600'"
                >
                  {{ item.s.condition }}
                </span>
              </td>
              <td class="py-2.5 px-3">
                <span class="font-mono font-bold text-blue-600">{{ item.t.counter }}</span>
                <span class="text-slate-400 mx-1">|</span>
                <span class="text-[11px] text-slate-600">{{ item.t.condition }}</span>
              </td>
              <td class="py-2.5 px-3">
                <span
                  v-if="item.s.alert"
                  class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200"
                >
                  Anomali Mayor (Pecah)
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  Normal
                </span>
              </td>
              <td class="py-2.5 px-3 text-slate-600">{{ item.petugas }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
