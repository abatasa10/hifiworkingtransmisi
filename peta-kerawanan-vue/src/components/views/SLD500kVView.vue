<script setup lang="ts">
import { ref } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Layers,
  ArrowLeft,
  ShieldAlert,
  Search,
  Zap
} from 'lucide-vue-next';
import { useKerawananStore } from '../../stores/kerawananStore';
import { initialNodes500kV } from '../../data/nodes500kv';
import { initialEdges500kV } from '../../data/edges500kv';

const store = useKerawananStore();

const nodes = ref(initialNodes500kV);
const edges = ref(initialEdges500kV);

const searchQuery = ref('');
const selectedVoltage = ref('Semua');

const { fitView, zoomIn, zoomOut } = useVueFlow();

const onFitView = () => {
  fitView({ padding: 0.2 });
};
</script>

<template>
  <div class="flex-1 flex flex-col bg-[#0b1329] text-white relative overflow-hidden select-none">
    <!-- Subheader Bar (Power Inspect Style) -->
    <div class="h-12 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 flex items-center justify-between z-20 shrink-0 text-slate-800 shadow-xs">
      <div class="flex items-center gap-3">
        <button
          @click="store.setView('jamali-system')"
          class="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Kembali ke Sistem JAMALI</span>
        </button>
        <span class="text-slate-300">|</span>
        <div class="flex items-center gap-2">
          <Zap class="w-4 h-4 text-amber-500" />
          <h2 class="text-xs font-extrabold uppercase tracking-tight">
            Single Line Diagram (SLD) 500 kV Interkoneksi Jawa-Madura-Bali
          </h2>
        </div>
      </div>

      <!-- Controls & Filter Toolbar -->
      <div class="flex items-center gap-3 text-xs">
        <div class="relative w-52">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari GI, Bay, atau SUTET..."
            class="w-full bg-slate-100 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00529C]"
          />
        </div>

        <button
          @click="onFitView"
          class="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-semibold shadow-2xs cursor-pointer transition-colors"
          title="Sesuaikan Tampilan Layar Penuh"
        >
          <Maximize2 class="w-3.5 h-3.5 text-[#00529C]" />
          <span>Fit View</span>
        </button>

        <button
          @click="store.openRiskModal()"
          class="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg font-bold shadow-2xs cursor-pointer transition-colors"
        >
          <ShieldAlert class="w-3.5 h-3.5 text-red-600" />
          <span>7 Kerawanan Terdeteksi</span>
        </button>
      </div>
    </div>

    <!-- Vue Flow Interactive Canvas -->
    <div class="flex-1 w-full h-full relative bg-[#091122]">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ zoom: 0.65, x: 100, y: 100 }"
        :min-zoom="0.1"
        :max-zoom="2.5"
        class="w-full h-full"
      >
        <Controls position="bottom-right" />
      </VueFlow>

      <!-- Bottom Floating Legend Bar (Standard Power Inspect) -->
      <div class="absolute bottom-4 left-6 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-5 text-[11px] text-slate-300 shadow-xl">
        <span class="font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Legenda Transmisi:</span>
        <div class="flex items-center gap-1.5">
          <span class="w-4 h-1 bg-red-500 rounded-full" />
          <span>Backbone 500 kV</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-4 h-1 bg-emerald-400 rounded-full" />
          <span>Tegangan 150 kV</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full border-2 border-amber-400 bg-amber-400/30" />
          <span>Gardu Induk (GI)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-400/30" />
          <span>Pembangkit</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full border-2 border-red-500 bg-red-500 animate-ping" />
          <span class="text-red-400 font-bold">Kerawanan Kritis</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.vue-flow__pane {
  background-color: #070d1e !important;
}
.vue-flow__edge-path {
  stroke-width: 2.5;
}
</style>
