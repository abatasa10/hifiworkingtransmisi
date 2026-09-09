import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import { BusbarNode } from '../sld/nodes/BusbarNode';
import { GeneratorNode } from '../sld/nodes/GeneratorNode';
import { TransformerNode } from '../sld/nodes/TransformerNode';
import { TransmissionEdge } from '../sld/edges/TransmissionEdge';
import { RightDetailPanel, SelectedItem } from '../panels/RightDetailPanel';
import { Breadcrumb } from '../layout/Breadcrumb';
import { subsystemBogorNodes, subsystemBogorEdges } from '../../data/subsystemSLD';
import { subsystems } from '../../data/subsystems';
import { ActiveView } from '../layout/Header';
import { RiskTableView } from './RiskTableView';
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  ShieldAlert,
  Zap,
  Map,
  Network,
  ListFilter,
  Info,
  X
} from 'lucide-react';
import { SLDNodeData, SLDEdgeData } from '../../types/graph';

const nodeTypes = {
  busbar: BusbarNode,
  generator: GeneratorNode,
  ibt: TransformerNode,
  gitet: BusbarNode,
  gi: BusbarNode,
  bay: BusbarNode
};

const edgeTypes = {
  transmission: TransmissionEdge,
  transformer_link: TransmissionEdge
};

interface SubsystemSLDCanvasProps {
  selectedSubsystemId?: string;
  onNavigate: (view: ActiveView) => void;
}

const SubsystemSLDCanvas: React.FC<SubsystemSLDCanvasProps> = ({
  selectedSubsystemId = 'sub-bogor',
  onNavigate
}) => {
  const reactFlow = useReactFlow();
  const [currentSubId, setCurrentSubId] = useState<string>(selectedSubsystemId);
  const currentSub = subsystems.find((s) => s.id === currentSubId) || subsystems[0];

  const [activeTab, setActiveTab] = useState<'500kv' | '150kv'>('500kv');
  const [viewMode, setViewMode] = useState<'sld' | 'list-kerawanan'>('sld');
  const [showSubsystemInfoOverlay, setShowSubsystemInfoOverlay] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(subsystemBogorNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(subsystemBogorEdges);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as SLDNodeData;
      setHighlightedId(node.id);
      if (data.type === 'ibt') {
        setSelectedItem({ type: 'ibt', data });
      } else {
        setSelectedItem({ type: 'node', data });
      }
      reactFlow.setCenter(node.position.x + 50, node.position.y, { duration: 500, zoom: 1.2 });
    },
    [reactFlow]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const data = edge.data as unknown as SLDEdgeData | undefined;
      setHighlightedId(edge.id);
      if (data) {
        setSelectedItem({ type: 'line', data });
      }
    },
    []
  );

  const renderSubsystemInfoContent = (isOverlay: boolean) => (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-mono text-[#0046ad] font-bold uppercase tracking-wider">
              Informasi Subsistem
            </span>
            <h2 className="text-lg font-black text-[#1e293b] mt-1">
              {currentSub.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {currentSub.description}
            </p>
          </div>
          {isOverlay && (
            <button
              onClick={() => setShowSubsystemInfoOverlay(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 ml-2"
              title="Tutup (Klik di luar untuk menutup)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Metrics */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Nama Subsistem:</span>
            <span className="font-bold text-slate-800">{currentSub.name.replace('Subsistem ', '')}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">UPB/P2B:</span>
            <span className="font-bold text-slate-800">Jawa Barat</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Jumlah GI:</span>
            <span className="font-bold text-[#0046ad] font-mono text-sm">{currentSub.giCount} Lokasi</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Beban Puncak:</span>
            <span className="font-bold text-slate-800 font-mono text-sm">{currentSub.peakLoadMW} MW</span>
          </div>
        </div>

        {/* Key IBTs in this subsystem */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <span className="font-bold text-slate-700 text-xs block">
            IBT Utama Terpasang:
          </span>
          <div className="space-y-1.5">
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-2xs">
              <span className="text-slate-700 font-medium">IBT 1 Bogor (500 MVA)</span>
              <span className="font-mono font-bold text-[#0046ad]">68%</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-2xs">
              <span className="text-slate-700 font-medium">IBT 2 Bogor (500 MVA)</span>
              <span className="font-mono font-bold text-[#0046ad]">62%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-200 mt-4">
        <button
          onClick={() => {
            if (isOverlay) setShowSubsystemInfoOverlay(false);
            onNavigate('sld-500kv');
          }}
          className="w-full bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          <span>Lihat Detail GI & SLD 500 kV</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-[#f4f7fa] text-slate-800 overflow-hidden relative select-none">
      {/* Top Banner with Breadcrumb & Back */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div>
          <Breadcrumb
            items={[
              { label: 'Jawa, Madura & Bali', view: 'jamali-system' },
              { label: 'UP2B Jawa Barat', view: 'upb-view' },
              { label: currentSub.name }
            ]}
            onNavigate={onNavigate}
          />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#0046ad] flex items-center justify-center font-bold text-xs border border-[#dbeafe]">
              4
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1e293b] tracking-tight">
                SUBSISTEM — {currentSub.name.toUpperCase()}
              </h1>
              <span className="text-xs text-slate-500">
                Single Line Diagram (SLD) Subsistem Interkoneksi Tegangan Tinggi
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('upb-view')}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke UPB/P2B</span>
        </button>
      </div>

      {/* Top View Mode Bar (Maps | SLD | List Kerawanan) */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          {/* 1. Maps */}
          <button
            onClick={() => onNavigate('upb-view')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#0046ad] hover:bg-white transition-all"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Maps</span>
          </button>

          {/* 2. SLD */}
          <button
            onClick={() => setViewMode('sld')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'sld'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>SLD</span>
          </button>

          {/* 3. List Kerawanan */}
          <button
            onClick={() => setViewMode('list-kerawanan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list-kerawanan'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>List Kerawanan</span>
          </button>

          {/* 4. Info Subsistem Trigger (Only when on list-kerawanan) */}
          {viewMode === 'list-kerawanan' && (
            <button
              onClick={() => setShowSubsystemInfoOverlay(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showSubsystemInfoOverlay
                  ? 'bg-[#0046ad] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-[#0046ad]" />
              <span>Info Subsistem</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-500 hidden md:flex items-center gap-2 font-mono">
            <span>Subsistem: {currentSub.name}</span>
            <span>•</span>
            <span>Beban: {currentSub.peakLoadMW} MW</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Selector, Center SLD Graph / Table, Right Detail */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* Left Sidebar: Pilih Subsistem (Visible only in SLD mode) */}
        {viewMode === 'sld' && (
          <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto z-10 shadow-xs">
            <div>
              <div className="text-[11px] font-mono text-[#0046ad] font-bold uppercase tracking-wider mb-2.5">
                Pilih Subsistem
              </div>
              <div className="space-y-1">
                {[
                  { id: 'sub-bogor', name: 'Subsistem Bogor' },
                  { id: 'sub-depok', name: 'Subsistem Depok' },
                  { id: 'sub-cileungsi', name: 'Subsistem Cileungsi' },
                  { id: 'sub-krian-gresik', name: 'Subsistem Krian - Gresik' }
                ].map((sub) => {
                  const active = sub.id === currentSubId;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setCurrentSubId(sub.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between ${
                        active
                          ? 'bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] font-bold shadow-xs'
                          : 'text-slate-600 hover:text-[#0046ad] hover:bg-[#f8fafc] border border-transparent'
                      }`}
                    >
                      <span>{sub.name}</span>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-[#0046ad]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-[#f8fafc] rounded-xl border border-slate-200 text-[11px] text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">Status Saluran:</span>
              Penyulang Bogor - Cibinong mengalami pembebanan 72% pada saat jam beban puncak.
            </div>
          </div>
        )}

        {/* Center: Interactive SLD Canvas OR List Kerawanan */}
        <div className="flex-1 flex flex-col relative h-full min-w-0">

          {/* Floating Tab Button on Right Edge for Instant Access (Only when list-kerawanan) */}
          {viewMode === 'list-kerawanan' && (
            <button
              onClick={() => setShowSubsystemInfoOverlay(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-[#eff6ff] text-[#0046ad] border-y border-l border-slate-300 shadow-md py-3 px-2 rounded-l-xl flex flex-col items-center gap-1 font-bold text-[10px] hover:pr-2.5 transition-all group"
              title="Buka Informasi Subsistem"
            >
              <Info className="w-4 h-4 text-[#0046ad] group-hover:scale-110 transition-transform" />
              <span style={{ writingMode: 'vertical-rl' }} className="tracking-widest rotate-180 text-slate-700 font-extrabold">
                INFO SUBSISTEM
              </span>
            </button>
          )}

          {/* MODE 1: SLD GRAPH VIEW */}
          {viewMode === 'sld' && (
            <div className="flex-1 flex flex-col relative h-full min-w-0">
              {/* Top SLD Tabs: [SLD 500 kV] [SLD 150/70 kV] */}
              <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between z-10 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('500kv')}
                    className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTab === '500kv'
                        ? 'bg-[#0046ad] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#0046ad] hover:bg-[#eff6ff]'
                    }`}
                  >
                    SLD 500 kV
                  </button>
                  <button
                    onClick={() => setActiveTab('150kv')}
                    className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTab === '150kv'
                        ? 'bg-[#0046ad] text-white'
                        : 'text-slate-600 hover:text-[#0046ad] hover:bg-[#eff6ff]'
                    }`}
                  >
                    SLD 150/70 kV
                  </button>
                </div>
                <div className="text-xs font-mono font-bold text-slate-700 mr-80 hidden lg:block">
                  SLD 500 kV — SUBSISTEM {currentSub.name.toUpperCase()}
                </div>
              </div>

              {/* ReactFlow Canvas */}
              <div className="flex-1 relative bg-[#060c18] overflow-hidden">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  className="h-full w-full"
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1.5}
                    color="rgba(0, 210, 211, 0.15)"
                  />
                  <Controls className="bg-slate-900 border border-slate-700 text-slate-300" />
                </ReactFlow>

                {/* Status bar at bottom */}
                <div className="absolute bottom-2 left-4 z-10 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800 backdrop-blur-xs flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    STATUS: REAL-TIME TELEMETRY CONNECTED
                  </span>
                  <span>•</span>
                  <span>FREKUENSI: 50.02 Hz</span>
                  <span>•</span>
                  <span>TEGANGAN BUS: 502.4 kV</span>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: LIST KERAWANAN (Full Width) */}
          {viewMode === 'list-kerawanan' && (
            <div className="absolute inset-0 z-30 bg-white flex flex-col overflow-hidden">
              <RiskTableView
                onNavigateToSLD={(riskNum) => onNavigate('sld-500kv')}
                onClose={() => setViewMode('sld')}
              />
            </div>
          )}
        </div>

        {/* Right Info Panel: Informasi Subsistem (Static when in SLD mode, "kaya awal aja") */}
        {viewMode === 'sld' && (
          <div className="w-80 md:w-88 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20 shadow-sm">
            {renderSubsystemInfoContent(false)}
          </div>
        )}

        {/* Selected item slide-over if clicked inside graph */}
        {viewMode === 'sld' && selectedItem && (
          <div className="absolute right-0 top-0 bottom-0 z-50">
            <RightDetailPanel
              selectedItem={selectedItem}
              onClose={() => setSelectedItem(null)}
              onSelectConnection={() => {}}
              onSelectNode={() => {}}
              onOpenRisk={() => {}}
            />
          </div>
        )}
      </div>

      {/* Pop-up Overlay: Informasi Subsistem ONLY when in List Kerawanan mode and opened! */}
      {viewMode === 'list-kerawanan' && showSubsystemInfoOverlay && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with click outside to close */}
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowSubsystemInfoOverlay(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div
            className="relative w-96 md:w-[440px] h-full bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSubsystemInfoContent(true)}
          </div>
        </div>
      )}
    </div>
  );
};

export const SubsystemSLDView: React.FC<SubsystemSLDCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <SubsystemSLDCanvas {...props} />
    </ReactFlowProvider>
  );
};
