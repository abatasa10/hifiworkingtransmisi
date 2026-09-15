import { defineStore } from 'pinia';
import { ref } from 'vue';
import { risksData } from '../data/risks';
import { jamaliUPBs } from '../data/upbs';
import { subsystems } from '../data/subsystems';
import type { RiskItem } from '../types/risk';

export type ActiveView =
  | 'national'
  | 'jamali-system'
  | 'sld-500kv'
  | 'upb-view'
  | 'subsystem-view'
  | 'subsystem-sld'
  | 'ibt-view'
  | 'report-view'
  | 'upload-sld';

export const useKerawananStore = defineStore('kerawanan', () => {
  const currentView = ref<ActiveView>('national');
  const selectedUpbId = ref<string>('upb-jabar');
  const selectedSubsystemId = ref<string>('sub-bogor');
  const selectedRiskId = ref<number | undefined>(7);
  const isRiskModalOpen = ref<boolean>(false);
  const jamaliMode = ref<'maps' | 'list-kerawanan'>('maps');

  const risks = ref<RiskItem[]>(risksData);
  const upbs = ref(jamaliUPBs);
  const allSubsystems = ref(subsystems);

  function setView(view: ActiveView) {
    currentView.value = view;
  }

  function selectRisk(riskId: number) {
    selectedRiskId.value = riskId;
    currentView.value = 'sld-500kv';
  }

  function selectUpb(upbId: string) {
    selectedUpbId.value = upbId;
    currentView.value = 'upb-view';
  }

  function selectSubsystem(subId: string) {
    selectedSubsystemId.value = subId;
    currentView.value = 'subsystem-sld';
  }

  function openRiskModal() {
    isRiskModalOpen.value = true;
  }

  function closeRiskModal() {
    isRiskModalOpen.value = false;
  }

  return {
    currentView,
    selectedUpbId,
    selectedSubsystemId,
    selectedRiskId,
    isRiskModalOpen,
    jamaliMode,
    risks,
    upbs,
    subsystems: allSubsystems,
    setView,
    selectRisk,
    selectUpb,
    selectSubsystem,
    openRiskModal,
    closeRiskModal
  };
});
