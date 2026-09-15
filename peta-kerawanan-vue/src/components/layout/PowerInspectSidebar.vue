<script setup lang="ts">
import {
  Map,
  Zap,
  Network,
  Layers,
  Activity,
  Server,
  UploadCloud,
  FileText,
  Bell,
  LogOut,
  HelpCircle
} from 'lucide-vue-next';
import { useKerawananStore, ActiveView } from '../../stores/kerawananStore';

const store = useKerawananStore();

const menuItems = [
  { id: 'national' as ActiveView, title: 'Peta Kerawanan Nasional', icon: Map },
  { id: 'jamali-system' as ActiveView, title: 'Peta Sistem JAMALI', icon: Zap },
  { id: 'sld-500kv' as ActiveView, title: 'Single Line Diagram (SLD) 500 kV', icon: Network },
  { id: 'upb-view' as ActiveView, title: 'Unit Pengatur Beban (UP2B / P2B)', icon: Layers },
  { id: 'subsystem-view' as ActiveView, title: 'Subsistem & Gardu Induk', icon: Activity },
  { id: 'ibt-view' as ActiveView, title: 'Daftar Interbus Transformer (IBT)', icon: Server },
  { id: 'upload-sld' as ActiveView, title: 'Upload & Kelola SLD', icon: UploadCloud },
  { id: 'report-view' as ActiveView, title: 'Laporan & Rekapitulasi', icon: FileText }
];

const openHelp = () => {
  window.open('http://10.1.48.26:7759/', '_blank');
};
</script>

<template>
  <aside class="w-16 h-screen bg-white border-r border-slate-200 flex flex-col items-center justify-between py-3 select-none z-40 shrink-0 shadow-[1px_0_4px_rgba(0,0,0,0.04)]">
    <!-- Top Section: Official PLN Logo -->
    <div class="flex flex-col items-center gap-4 w-full">
      <button
        @click="store.setView('national')"
        class="group relative flex flex-col items-center p-1.5 focus:outline-none cursor-pointer"
        title="Power Inspect - PT PLN (Persero)"
      >
        <div class="w-10 h-10 rounded-xl bg-[#FCD303] border border-[#EAB308] p-1 shadow-sm flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
          <svg viewBox="0 0 100 120" class="w-full h-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
            <polygon
              points="56,6 18,65 52,65 42,114 84,52 52,52"
              fill="#EF4444"
              stroke="#DC2626"
              stroke-width="2"
            />
            <path d="M16,92 Q34,84 52,92 T88,92" fill="none" stroke="#00529C" stroke-width="4" stroke-linecap="round" />
            <path d="M16,102 Q34,94 52,102 T88,102" fill="none" stroke="#00529C" stroke-width="4" stroke-linecap="round" />
            <path d="M16,112 Q34,104 52,112 T88,112" fill="none" stroke="#00529C" stroke-width="4" stroke-linecap="round" />
          </svg>
        </div>
        <span class="text-[9px] font-extrabold text-[#00529C] tracking-tighter mt-1">PLN</span>
      </button>

      <div class="w-8 h-px bg-slate-200" />

      <!-- Navigation Menu -->
      <nav class="flex flex-col items-center gap-1.5 w-full px-2">
        <div
          v-for="item in menuItems"
          :key="item.id"
          class="relative group flex items-center justify-center w-full"
        >
          <button
            @click="store.setView(item.id)"
            class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 relative cursor-pointer"
            :class="[
              store.currentView === item.id || (item.id === 'subsystem-view' && store.currentView === 'subsystem-sld')
                ? 'bg-[#E3F2FD] text-[#00529C] shadow-xs font-semibold'
                : 'text-slate-500 hover:text-[#00529C] hover:bg-slate-100'
            ]"
            :aria-label="item.title"
          >
            <component :is="item.icon" class="w-5 h-5 stroke-[1.8]" />
            <span
              v-if="store.currentView === item.id || (item.id === 'subsystem-view' && store.currentView === 'subsystem-sld')"
              class="absolute -left-2 top-2 bottom-2 w-1 bg-[#00529C] rounded-r-md"
            />
          </button>

          <!-- Hover Tooltip -->
          <div class="absolute left-14 ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5">
            <span>{{ item.title }}</span>
            <div class="w-1.5 h-1.5 bg-slate-800 absolute -left-0.5 top-1/2 -translate-y-1/2 rotate-45" />
          </div>
        </div>
      </nav>
    </div>

    <!-- Bottom Section: Utility Buttons -->
    <div class="flex flex-col items-center gap-2 w-full px-2">
      <!-- Help Center -->
      <div class="relative group flex items-center justify-center w-full">
        <button
          @click="openHelp"
          class="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Pusat Bantuan"
        >
          <HelpCircle class="w-4.5 h-4.5 stroke-[1.8]" />
        </button>
        <div class="absolute left-14 ml-2 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded shadow opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Portal Power Inspect
        </div>
      </div>

      <!-- Notification Bell -->
      <div class="relative group flex items-center justify-center w-full">
        <button
          @click="store.openRiskModal()"
          class="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors relative cursor-pointer"
          title="Notifikasi Kerawanan"
        >
          <Bell class="w-4.5 h-4.5 stroke-[1.8]" />
          <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
        </button>
        <div class="absolute left-14 ml-2 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded shadow opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Notifikasi Kerawanan (3 Kritis)
        </div>
      </div>

      <div class="w-8 h-px bg-slate-200 my-0.5" />

      <!-- User Profile -->
      <div class="relative group flex items-center justify-center w-full">
        <div class="w-9 h-9 rounded-full bg-[#00529C] text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-100 cursor-pointer shadow-xs">
          SR
        </div>
        <div class="absolute left-14 ml-2 px-2.5 py-1.5 bg-white text-slate-800 border border-slate-200 text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity whitespace-nowrap z-50 flex flex-col">
          <span class="font-bold text-slate-900">super_admin_ridwan</span>
          <span class="text-[10px] text-slate-500">Super Administrator (FASOP)</span>
          <span class="text-[10px] text-blue-600 mt-1 font-semibold">Unit Pusat & Transmisi</span>
        </div>
      </div>

      <!-- Logout -->
      <div class="relative group flex items-center justify-center w-full">
        <button
          class="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          title="Keluar"
        >
          <LogOut class="w-4 h-4 stroke-[1.8]" />
        </button>
      </div>
    </div>
  </aside>
</template>
