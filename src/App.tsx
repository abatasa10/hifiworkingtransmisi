import React, { useState } from 'react';
import { Header, ActiveView } from './components/layout/Header';
import { NationalMapView } from './components/views/NationalMapView';
import { JamaliSystemView } from './components/views/JamaliSystemView';
import { SLD500kVView } from './components/views/SLD500kVView';
import { UPBView } from './components/views/UPBView';
import { SubsystemView } from './components/views/SubsystemView';
import { SubsystemSLDView } from './components/views/SubsystemSLDView';
import { IBTListView } from './components/views/IBTListView';
import { ReportView } from './components/views/ReportView';
import { SystemRiskModal } from './components/views/SystemRiskModal';

export const App: React.FC = () => {
  // Navigation State (starts at 'national' or 'sld-500kv')
  const [currentView, setCurrentView] = useState<ActiveView>('national');
  const [selectedUpbId, setSelectedUpbId] = useState<string>('upb-jabar');
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string>('sub-bogor');
  const [selectedRiskId, setSelectedRiskId] = useState<number | undefined>(7); // Default to Risk #7
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  const [jamaliMode, setJamaliMode] = useState<'maps' | 'list-kerawanan'>('maps');

  // Drill-down Handlers
  const handleSelectSystem = (systemId: string) => {
    if (systemId === 'jamali') {
      setJamaliMode('maps');
      setCurrentView('jamali-system');
    }
  };

  const handleSelectUPB = (upbId: string) => {
    setSelectedUpbId(upbId);
    setCurrentView('upb-view');
  };

  const handleSelectSubsystem = (subId: string) => {
    setSelectedSubsystemId(subId);
    setCurrentView('subsystem-sld');
  };

  const handleSelectIBT = (ibtId: string) => {
    // Navigate to SLD 500 kV
    setCurrentView('sld-500kv');
  };

  const handleSelectRiskFromModal = (riskId: number) => {
    setSelectedRiskId(riskId);
    setCurrentView('sld-500kv');
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#f4f7fa] text-slate-800 overflow-hidden font-sans antialiased select-none">
      {/* Universal Enterprise Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenSystemRiskSummary={() => setIsRiskModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 flex flex-col w-full h-full overflow-hidden relative bg-[#f4f7fa]">
        {currentView === 'national' && (
          <NationalMapView
            onSelectSystem={handleSelectSystem}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'jamali-system' && (
          <JamaliSystemView
            onSelectUPB={handleSelectUPB}
            onNavigate={setCurrentView}
            canvasMode={jamaliMode}
            onCanvasModeChange={setJamaliMode}
            onSelectRisk={handleSelectRiskFromModal}
          />
        )}

        {currentView === 'sld-500kv' && (
          <SLD500kVView
            onNavigate={setCurrentView}
            initialSelectedRiskId={selectedRiskId}
            onNavigateToMaps={() => {
              setJamaliMode('maps');
              setCurrentView('jamali-system');
            }}
            onNavigateToListKerawanan={() => {
              setJamaliMode('list-kerawanan');
              setCurrentView('jamali-system');
            }}
          />
        )}

        {currentView === 'upb-view' && (
          <UPBView
            selectedUpbId={selectedUpbId}
            onSelectSubsystem={handleSelectSubsystem}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'subsystem-view' && (
          <SubsystemView
            onNavigate={setCurrentView}
            onSelectSubsystem={handleSelectSubsystem}
          />
        )}

        {currentView === 'subsystem-sld' && (
          <SubsystemSLDView
            selectedSubsystemId={selectedSubsystemId}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'ibt-view' && (
          <IBTListView
            onNavigate={setCurrentView}
            onSelectIBT={handleSelectIBT}
          />
        )}

        {currentView === 'report-view' && (
          <ReportView onNavigate={setCurrentView} />
        )}
      </main>

      {/* Global System Risk Summary Modal */}
      <SystemRiskModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        onSelectRisk={handleSelectRiskFromModal}
      />
    </div>
  );
};

export default App;
