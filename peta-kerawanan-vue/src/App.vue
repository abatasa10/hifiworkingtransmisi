<script setup lang="ts">
import PowerInspectSidebar from './components/layout/PowerInspectSidebar.vue';
import PowerInspectHeader from './components/layout/PowerInspectHeader.vue';
import NationalMapView from './components/views/NationalMapView.vue';
import JamaliSystemView from './components/views/JamaliSystemView.vue';
import SLD500kVView from './components/views/SLD500kVView.vue';
import SystemRiskDialog from './components/views/SystemRiskDialog.vue';
import { useKerawananStore } from './stores/kerawananStore';

const store = useKerawananStore();
</script>

<template>
  <div class="w-full h-screen flex bg-[#f4f7fa] text-slate-800 overflow-hidden font-sans antialiased select-none">
    <!-- Left Slim Sidebar (Power Inspect 64px) -->
    <PowerInspectSidebar />

    <!-- Main Workspace Column -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
      <!-- Top Enterprise Header -->
      <PowerInspectHeader />

      <!-- View Router Container -->
      <main class="flex-1 flex flex-col w-full h-full overflow-hidden relative bg-[#f4f7fa]">
        <NationalMapView v-if="store.currentView === 'national'" />
        <JamaliSystemView v-else-if="store.currentView === 'jamali-system' || store.currentView === 'upb-view'" />
        <SLD500kVView v-else-if="store.currentView === 'sld-500kv' || store.currentView === 'subsystem-sld'" />
        <!-- Fallback to National -->
        <NationalMapView v-else />
      </main>
    </div>

    <!-- Global System Risk Dialog -->
    <SystemRiskDialog />
  </div>
</template>
