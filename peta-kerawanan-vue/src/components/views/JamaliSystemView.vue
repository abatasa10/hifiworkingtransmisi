<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Map,
  Network,
  ListFilter,
  ShieldAlert,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Info,
  ChevronRight
} from 'lucide-vue-next';
import { useKerawananStore } from '../../stores/kerawananStore';

const store = useKerawananStore();
const activeMode = ref<'maps' | 'list-kerawanan'>('maps');
const selectedRiskFilter = ref('Semua');

const regionalUPBs = computed(() => {
  return store.upbs.filter((u: any) => u.id !== 'p2b-sistem');
});

const onSelectUPB = (upbId: string) => {
  store.selectUpb(upbId);
};
</script>

<template>
  <div class="flex-1 flex flex-col bg-[#f4f7fa] overflow-hidden select-none">
    <!-- Subheader Navigation Bar (Power Inspect Style) -->
    <div class="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
      <div class="flex items-center gap-3">
        <button
          @click="store.setView('national')"
          class="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Kembali ke Nasional</span>
        </button>
        <span class="text-slate-300">|</span>
        <span class="text-xs font-bold text-slate-800">SISTEM JAWA, MADURA, DAN BALI (JAMALI)</span>
      </div>

      <!-- Action Mode Buttons -->
      <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
        <button
          @click="activeMode = 'maps'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer"
          :class="[
            activeMode === 'maps'
              ? 'bg-white text-[#00529C] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <Map class="w-3.5 h-3.5" />
          <span>Peta Geografis Sistem</span>
        </button>

        <button
          @click="store.setView('sld-500kv')"
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
        >
          <Network class="w-3.5 h-3.5" />
          <span>SLD 500 kV Interkoneksi</span>
        </button>

        <button
          @click="activeMode = 'list-kerawanan'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer"
          :class="[
            activeMode === 'list-kerawanan'
              ? 'bg-white text-red-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <ListFilter class="w-3.5 h-3.5 text-red-600" />
          <span>Daftar Kerawanan Subsistem</span>
        </button>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="flex-1 flex overflow-hidden p-6 gap-6">
      <!-- Left: Regional UP2B Cards -->
      <div class="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Unit Pengatur Beban (UP2B / P2B)</h3>
            <p class="text-[11px] text-slate-500">Pilih unit pelaksana untuk melihat rincian subsistem dan single line diagram</p>
          </div>
          <span class="text-xs font-bold text-[#00529C] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            5 Wilayah Operasi
          </span>
        </div>

        <div class="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="upb in regionalUPBs"
            :key="upb.id"
            @click="onSelectUPB(upb.id)"
            class="p-4 rounded-xl border border-slate-200 hover:border-[#00529C] hover:bg-[#eff6ff]/30 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-[#00529C] flex items-center justify-center font-bold text-xs">
                    {{ upb.name.slice(0, 3) }}
                  </div>
                  <div>
                    <h4 class="font-bold text-xs text-slate-800 group-hover:text-[#00529C] transition-colors">
                      {{ upb.name }}
                    </h4>
                    <span class="text-[10px] text-slate-500">{{ upb.region }}</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-red-50 text-red-700 border border-red-200">
                  {{ upb.riskCount }} Kerawanan
                </span>
              </div>

              <div class="mt-3 text-[11px] text-slate-600 flex items-center gap-3">
                <span class="bg-slate-100 px-2 py-0.5 rounded font-mono">{{ upb.subsystemCount }} Subsistem</span>
                <span class="bg-slate-100 px-2 py-0.5 rounded font-mono">{{ upb.giCount }} Gardu Induk</span>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#00529C]">
              <span>Buka Detail Wilayah</span>
              <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right: System Risk Highlight (Titik Kritis Utama) -->
      <div class="w-96 flex flex-col gap-4">
        <!-- Highlight Card: Kerawanan #7 -->
        <div
          @click="store.selectRisk(7)"
          class="bg-white rounded-2xl border border-amber-300 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
                TITIK KRITIS UTAMA #7
              </span>
              <ShieldAlert class="w-4 h-4 text-amber-600" />
            </div>

            <h4 class="font-bold text-xs text-slate-800 mt-2.5 group-hover:text-[#00529C] transition-colors leading-snug">
              SUTET 500 kV Gandul - Duri Kosambi - Kembangan
            </h4>

            <p class="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
              Memasok beban radial DKI Jakarta (2 IBT Durikosambi & 2 IBT Muarakarang) dengan risiko padam sistem hingga 1.700 MW pada skenario N-2.
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
            <span>Buka di SLD 500 kV</span>
            <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <!-- System Summary Info Box -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Info class="w-4 h-4 text-[#00529C]" />
              <h4 class="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Spesifikasi Grid JAMALI</h4>
            </div>

            <div class="mt-3 space-y-2.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-500">Tegangan Backbone:</span>
                <span class="font-bold text-slate-800">500 kV & 150 kV</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500">Beban Puncak Sistem:</span>
                <span class="font-bold text-slate-800">31.250 MW</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500">Kondisi Operasi:</span>
                <span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">Normal Siaga</span>
              </div>
            </div>
          </div>

          <button
            @click="store.setView('sld-500kv')"
            class="w-full bg-[#00529C] hover:bg-[#003e75] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
          >
            <Network class="w-4 h-4" />
            <span>Tampilkan SLD 500 kV</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
