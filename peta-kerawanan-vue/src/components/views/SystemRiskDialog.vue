<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, ShieldAlert, ArrowRight, Search } from 'lucide-vue-next';
import { useKerawananStore } from '../../stores/kerawananStore';

const store = useKerawananStore();
const search = ref('');
const levelFilter = ref('Semua');

const filteredRisks = computed(() => {
  return store.risks.filter((risk: any) => {
    const q = search.value.toLowerCase();
    const matchesSearch =
      risk.name.toLowerCase().includes(q) ||
      risk.number.toString() === search.value ||
      risk.condition.toLowerCase().includes(q) ||
      risk.location.toLowerCase().includes(q);
    const matchesLevel = levelFilter.value === 'Semua' || risk.riskLevel === levelFilter.value;
    return matchesSearch && matchesLevel;
  });
});

const onSelect = (riskNumber: number) => {
  store.selectRisk(riskNumber);
  store.closeRiskModal();
};
</script>

<template>
  <div
    v-if="store.isRiskModalOpen"
    class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none"
  >
    <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="p-4 bg-[#f8fafc] border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-[#fee2e2] border border-[#fca5a5] flex items-center justify-center text-[#dc2626]">
            <ShieldAlert class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-extrabold text-base text-slate-800">
              Daftar Peta Kerawanan Sistem Tenaga Listrik 2026
            </h2>
            <div class="text-xs text-slate-500">
              Buku Kerawanan Sistem & Subsistem Transmisi — Power Inspect PT PLN (Persero)
            </div>
          </div>
        </div>

        <button
          @click="store.closeRiskModal()"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Search & Filter Bar -->
      <div class="p-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="relative w-72">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            v-model="search"
            placeholder="Cari nomor atau nama kerawanan..."
            class="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00529C]"
          />
        </div>

        <div class="flex items-center gap-1.5">
          <span class="text-slate-500 font-medium">Tingkat:</span>
          <button
            v-for="lvl in ['Semua', 'Sangat Rawan', 'Rawan', 'Sedang', 'Aman']"
            :key="lvl"
            @click="levelFilter = lvl"
            class="px-2.5 py-1 rounded-lg transition-colors font-semibold text-xs cursor-pointer"
            :class="[
              levelFilter === lvl
                ? 'bg-[#00529C] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ lvl }}
          </button>
        </div>
      </div>

      <!-- Risk Items List -->
      <div class="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 space-y-2">
        <div
          v-for="risk in filteredRisks"
          :key="risk.id"
          @click="onSelect(risk.number)"
          class="pt-2 pb-3 hover:bg-[#eff6ff]/50 rounded-xl p-3 transition-colors cursor-pointer group"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3">
              <span
                class="px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0 border"
                :class="[
                  risk.riskLevel === 'Sangat Rawan'
                    ? 'bg-[#fee2e2] text-[#dc2626] border-[#fca5a5]'
                    : 'bg-[#fef9c3] text-[#ca8a04] border-[#fde047]'
                ]"
              >
                #{{ risk.number }}
              </span>
              <div>
                <h3 class="font-bold text-xs text-slate-800 group-hover:text-[#00529C] transition-colors">
                  {{ risk.name }}
                </h3>
                <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{{ risk.location }}</span>
                  <span>•</span>
                  <span>Tegangan: {{ risk.voltage }}</span>
                  <span>•</span>
                  <span class="font-medium text-amber-700 font-mono">{{ risk.condition }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[11px] font-bold text-[#00529C] flex items-center gap-1 group-hover:underline">
                Lihat SLD <ArrowRight class="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
