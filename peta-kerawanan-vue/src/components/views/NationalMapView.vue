<script setup lang="ts">
import { Zap, ShieldAlert, ArrowRight, Activity, MapPin } from 'lucide-vue-next';
import { useKerawananStore } from '../../stores/kerawananStore';
import { powerSystems } from '../../data/systems';

const store = useKerawananStore();

const onSelectSystem = (systemId: string) => {
  if (systemId === 'jamali') {
    store.setView('jamali-system');
  }
};
</script>

<template>
  <div class="flex-1 flex flex-col bg-[#f4f7fa] overflow-y-auto p-6 select-none">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <div class="text-[11px] text-slate-500 font-medium">Total Sistem Interkoneksi</div>
          <div class="text-2xl font-black text-slate-800 mt-1">6 Sistem</div>
          <div class="text-[10px] text-emerald-600 font-semibold mt-0.5">Seluruh Wilayah NKRI</div>
        </div>
        <div class="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#00529C]">
          <Zap class="w-6 h-6" />
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <div class="text-[11px] text-slate-500 font-medium">Titik Kerawanan Kritis (N-1/N-2)</div>
          <div class="text-2xl font-black text-red-600 mt-1">7 Titik</div>
          <div class="text-[10px] text-red-500 font-semibold mt-0.5">Prioritas Operasi 2026</div>
        </div>
        <div class="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
          <ShieldAlert class="w-6 h-6" />
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <div class="text-[11px] text-slate-500 font-medium">Total Subsistem Dipantau</div>
          <div class="text-2xl font-black text-slate-800 mt-1">29 Subsistem</div>
          <div class="text-[10px] text-blue-600 font-semibold mt-0.5">Jawa, Madura & Bali</div>
        </div>
        <div class="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
          <Activity class="w-6 h-6" />
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <div class="text-[11px] text-slate-500 font-medium">Interbus Transformer (IBT 500/150)</div>
          <div class="text-2xl font-black text-slate-800 mt-1">68 Unit</div>
          <div class="text-[10px] text-amber-600 font-semibold mt-0.5">Backbone 500 kV</div>
        </div>
        <div class="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <MapPin class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Section Title -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-base font-bold text-slate-800">Peta Sistem Ketenagalistrikan Nasional</h2>
        <p class="text-xs text-slate-500">Pilih sistem kelistrikan untuk melihat peta spasial, SLD 500 kV, dan daftar kerawanan operasional</p>
      </div>
    </div>

    <!-- Systems Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="system in powerSystems"
        :key="system.id"
        @click="onSelectSystem(system.id)"
        class="bg-white rounded-2xl border border-slate-200 hover:border-[#00529C] p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
        :class="{'ring-2 ring-blue-500/20': system.id === 'jamali'}"
      >
        <div>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                :class="[
                  system.id === 'jamali'
                    ? 'bg-[#E3F2FD] text-[#00529C] border border-[#BBDEFB]'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                ]"
              >
                {{ system.name.slice(0, 2).toUpperCase() }}
              </div>
              <div>
                <h3 class="font-extrabold text-sm text-slate-800 group-hover:text-[#00529C] transition-colors">
                  {{ system.name }}
                </h3>
                <span class="text-[11px] text-slate-500">{{ system.subsystemCount }} Subsistem Terdaftar</span>
              </div>
            </div>

            <span
              v-if="system.id === 'jamali'"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              Aktif Penuh
            </span>
          </div>

          <p class="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-2">
            {{ system.description }}
          </p>

          <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px]">
            <div>
              <span class="text-slate-400">Gardu Induk:</span>
              <span class="font-mono font-bold text-slate-700 ml-1">{{ system.giCount }} GI</span>
            </div>
            <div>
              <span class="text-slate-400">Kerawanan:</span>
              <span class="font-mono font-extrabold text-red-600 ml-1">{{ system.risksN1 + system.risksN2 + system.risksN12 }} Titik</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#00529C]">
          <span>Buka Peta & SLD Sistem</span>
          <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  </div>
</template>
