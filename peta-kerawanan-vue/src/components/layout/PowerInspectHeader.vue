<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  Server,
  ShieldAlert,
  ChevronRight,
  Mail,
  ShieldCheck
} from 'lucide-vue-next';
import { useKerawananStore } from '../../stores/kerawananStore';

const store = useKerawananStore();
const timeStr = ref('');
let timer: number | null = null;

const updateTime = () => {
  const now = new Date();
  timeStr.value = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).format(now) + ' WIB';
};

onMounted(() => {
  updateTime();
  timer = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const meta = computed(() => {
  switch (store.currentView) {
    case 'national':
      return {
        title: 'Dashboard Peta Kerawanan Nasional',
        crumbs: ['Dashboard', 'Transmisi', 'Peta Kerawanan Nasional']
      };
    case 'jamali-system':
      return {
        title: 'Sistem Kelistrikan Jawa-Madura-Bali (JAMALI)',
        crumbs: ['Dashboard', 'Sistem JAMALI', 'Peta Kerawanan']
      };
    case 'sld-500kv':
      return {
        title: 'Single Line Diagram (SLD) 500 kV',
        crumbs: ['Dashboard', 'SLD Transmisi', 'Grid 500 kV & Interkoneksi']
      };
    case 'upb-view':
      return {
        title: 'Unit Pengatur Beban (UP2B / P2B)',
        crumbs: ['Dashboard', 'Hierarki Wilayah', 'Unit Pengatur Beban']
      };
    case 'subsystem-view':
    case 'subsystem-sld':
      return {
        title: 'Subsistem & Gardu Induk',
        crumbs: ['Dashboard', 'Sistem Transmisi', 'Subsistem & Bay Aset']
      };
    case 'ibt-view':
      return {
        title: 'Daftar Interbus Transformer (IBT)',
        crumbs: ['Dashboard', 'Aset Kritis', 'Trafo & IBT']
      };
    case 'upload-sld':
      return {
        title: 'Kelola & Konfigurasi SLD',
        crumbs: ['Pengaturan', 'Manajemen Aset', 'Upload SLD']
      };
    case 'report-view':
      return {
        title: 'Laporan & Analisis Kerawanan',
        crumbs: ['Laporan', 'Rekapitulasi Kerawanan Sistem']
      };
    default:
      return {
        title: 'Power Inspect - Peta Kerawanan',
        crumbs: ['Dashboard', 'Peta Kerawanan']
      };
  }
});
</script>

<template>
  <header class="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between text-xs text-slate-700 select-none z-30 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
    <!-- Left: Server Badge + Page Title & Breadcrumbs -->
    <div class="flex items-center gap-3">
      <!-- Environment Badge -->
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px] shadow-2xs">
        <Server class="w-3.5 h-3.5 text-emerald-600" />
        <span>Server Training</span>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div class="h-5 w-px bg-slate-200" />

      <!-- Title & Breadcrumbs -->
      <div class="flex flex-col justify-center">
        <h1 class="text-sm font-bold text-slate-800 tracking-tight leading-tight">
          {{ meta.title }}
        </h1>
        <nav class="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5" aria-label="Breadcrumb">
          <template v-for="(crumb, idx) in meta.crumbs" :key="idx">
            <ChevronRight v-if="idx > 0" class="w-3 h-3 text-slate-300 shrink-0" />
            <span :class="idx === meta.crumbs.length - 1 ? 'font-semibold text-[#00529C]' : 'hover:text-slate-700'">
              {{ crumb }}
            </span>
          </template>
        </nav>
      </div>
    </div>

    <!-- Right: Helpdesk Info + Timestamp + Risk Action Button -->
    <div class="flex items-center gap-4">
      <!-- Official Helpdesk Contact -->
      <div class="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 font-medium">
        <Mail class="w-3.5 h-3.5 text-slate-400" />
        <span>
          Contact us : <strong class="text-[#00529C] font-semibold">helpdesk.pi@iconpln.co.id</strong>
        </span>
        <span class="text-slate-300">|</span>
        <ShieldCheck class="w-3.5 h-3.5 text-emerald-500" />
        <span>
          Security Issue : <strong class="text-slate-700 font-semibold">soc@pln.co.id</strong>
        </span>
      </div>

      <!-- Live Timestamp -->
      <div class="hidden sm:flex flex-col text-right">
        <div class="text-[11px] font-medium text-slate-600">{{ timeStr }}</div>
        <div class="text-[9px] font-bold text-emerald-600 flex items-center justify-end gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          LIVE TELEMETRI AKTIF
        </div>
      </div>

      <!-- Matriks Kerawanan Action Button -->
      <button
        @click="store.openRiskModal()"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
        title="Buka Ringkasan Kerawanan Sistem & Subsistem"
      >
        <ShieldAlert class="w-4 h-4 text-red-600" />
        <span class="hidden md:inline">Matriks Kerawanan</span>
        <span class="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
          7
        </span>
      </button>
    </div>
  </header>
</template>
