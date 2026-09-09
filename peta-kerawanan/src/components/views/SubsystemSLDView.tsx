import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  useReactFlow,
  MiniMap
} from '@xyflow/react';
import { BusbarNode } from '../sld/nodes/BusbarNode';
import { GeneratorNode } from '../sld/nodes/GeneratorNode';
import { TransformerNode } from '../sld/nodes/TransformerNode';
import { TransmissionEdge } from '../sld/edges/TransmissionEdge';
import { TierGuides } from '../sld/TierGuides';
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
  X,
  UploadCloud,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { SLDNodeData, SLDEdgeData } from '../../types/graph';
import {
  getCustomSLD,
  removeCustomSLD,
  CustomSLDConfig,
  ImageHotspot
} from '../../data/customSLDStore';

import { Handle, Position } from '@xyflow/react';

const CustomExcelNode: React.FC<any> = ({ data, selected }) => {
  const isRawan = Boolean(data?.riskStatus && data?.riskStatus !== 'Normal');
  const is500 = String(data?.voltage || '').includes('500');
  const nLower = String(data?.name || '').toLowerCase();
  const isGen = nLower.includes('plt') || nLower.includes('pembangkit') || nLower.includes('evakuasi');
  const isIBT = nLower.includes('ibt') || nLower.includes('trafo');

  return (
    <div className="relative group cursor-pointer flex flex-col items-center">
      {/* Default handles without explicit IDs for seamless edge routing */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* 1. PEMBANGKIT / GENERATOR (Gambar 1 & 2 - Circular symbol with ~) */}
      {isGen ? (
        <div className="flex flex-col items-center">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border mb-1 whitespace-nowrap ${
            selected ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-900/90 text-amber-300 border-slate-700'
          }`}>
            {data?.code || data?.name}
          </span>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            selected
              ? 'bg-amber-500/30 border-2 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.9)] scale-110'
              : 'bg-slate-900/90 border-2 border-cyan-400 shadow-[0_0_10px_rgba(0,210,211,0.5)] group-hover:border-amber-400'
          }`}>
            <span className="text-cyan-300 group-hover:text-amber-300 font-serif font-black text-lg leading-none">~</span>
          </div>
          <span className="text-[9px] font-mono text-cyan-400 mt-1">{data?.voltage || '500 kV'}</span>
        </div>
      ) : isIBT ? (
        /* 2. IBT TRANSFORMER (Gambar 2 - Interlocking double circles) */
        <div className="flex flex-col items-center">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border mb-0.5 whitespace-nowrap ${
            selected ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-slate-900/90 text-emerald-300 border-slate-700'
          }`}>
            {data?.code || data?.name}
          </span>
          <div className="relative w-8 h-12 flex flex-col items-center justify-center my-0.5">
            <div className={`w-6 h-6 rounded-full border-2 absolute top-0 ${selected ? 'border-emerald-300 bg-emerald-950/40' : 'border-emerald-400 bg-slate-900/80'}`} />
            <div className={`w-6 h-6 rounded-full border-2 absolute bottom-0 ${selected ? 'border-emerald-300 bg-emerald-950/40' : 'border-emerald-400 bg-slate-900/80'}`} />
          </div>
          <span className="text-[9px] font-mono text-emerald-400">{data?.voltage || '500/150 kV'}</span>
        </div>
      ) : (
        /* 3. ELECTRICAL BUSBAR (GI / GITET - Gambar 1 & Gambar 2 authentic SLD) */
        <div className="flex flex-col items-center">
          {/* Substation Label with Starburst Risk Badge */}
          <div className="flex flex-col items-center mb-1.5 relative">
            {isRawan && (
              <div className="absolute -top-3.5 -right-4 z-30 flex items-center justify-center w-7 h-7 animate-risk-pulse">
                <svg viewBox="0 0 100 100" className="w-7 h-7 filter drop-shadow-md">
                  <polygon
                    points="50,0 63,22 88,12 85,38 100,50 85,62 88,88 63,78 50,100 37,78 12,88 15,62 0,50 15,38 12,12 37,22"
                    fill="#ff4757"
                    stroke="#ffffff"
                    strokeWidth="4"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-slate-950 font-black text-[8px]">
                  {data?.riskStatus || '!'}
                </span>
              </div>
            )}
            <span
              className={`text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded shadow-sm border whitespace-nowrap transition-all ${
                selected
                  ? 'bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-[0_0_12px_rgba(0,210,211,0.8)] scale-105'
                  : isRawan
                  ? 'bg-slate-900 text-red-300 border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'bg-slate-900/90 text-cyan-200 border-slate-700 hover:border-cyan-400'
              }`}
            >
              {data?.code || data?.name}
            </span>
            <span className={`text-[9px] font-mono scale-90 ${is500 ? 'text-cyan-400' : 'text-blue-300'}`}>
              {data?.voltage || '500 kV'}
            </span>
          </div>

          {/* Thick Horizontal Busbar with Bay Connection Points */}
          <div
            className={`w-36 h-2.5 rounded-full transition-all duration-300 relative ${
              isRawan
                ? 'bg-gradient-to-r from-red-500 via-amber-400 to-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)] ring-2 ring-red-400'
                : selected
                ? 'bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 shadow-[0_0_16px_rgba(0,210,211,0.9)] ring-2 ring-cyan-200'
                : is500
                ? 'bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(0,210,211,0.6)] group-hover:brightness-125'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_8px_rgba(59,130,246,0.6)] group-hover:brightness-125'
            }`}
          >
            {/* Bay connection points (dots) */}
            <div className="absolute left-3 top-0.5 w-1.5 h-1.5 rounded-full bg-slate-950" />
            <div className="absolute left-1/2 -translate-x-1/2 top-0.5 w-1.5 h-1.5 rounded-full bg-slate-950" />
            <div className="absolute right-3 top-0.5 w-1.5 h-1.5 rounded-full bg-slate-950" />
          </div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  default: CustomExcelNode,
  custom: CustomExcelNode,
  'excel-node': CustomExcelNode,
  busbar: BusbarNode,
  generator: GeneratorNode,
  ibt: TransformerNode,
  gitet: BusbarNode,
  gi: BusbarNode,
  bay: BusbarNode
};

const edgeTypes = {
  default: TransmissionEdge,
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

  useEffect(() => {
    setCurrentSubId(selectedSubsystemId);
  }, [selectedSubsystemId]);

  const currentSub = subsystems.find((s) => s.id === currentSubId) || subsystems[0];

  const [sldTheme, setSldTheme] = useState<'blueprint' | 'classic'>('blueprint');
  const [activeTab, setActiveTab] = useState<'500kv' | '150kv'>('500kv');
  const [viewMode, setViewMode] = useState<'sld' | 'list-kerawanan'>('sld');
  const [showSubsystemInfoOverlay, setShowSubsystemInfoOverlay] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(subsystemBogorNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(subsystemBogorEdges);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Custom Uploaded SLD Binding
  const [customConfig, setCustomConfig] = useState<CustomSLDConfig | null>(() => getCustomSLD(currentSubId));

  useEffect(() => {
    setCustomConfig(getCustomSLD(currentSubId));
  }, [currentSubId]);

  useEffect(() => {
    const handleUpdate = () => {
      setCustomConfig(getCustomSLD(currentSubId));
    };
    window.addEventListener('custom-sld-updated', handleUpdate);
    return () => window.removeEventListener('custom-sld-updated', handleUpdate);
  }, [currentSubId]);

  // Synchronize Nodes and Edges with authentic Tiered SLD Layout (Gambar 1 & Gambar 2)
  useEffect(() => {
    if (customConfig?.type === 'excel' && customConfig.excelData?.giList && customConfig.excelData.giList.length > 0) {
      // Categorize nodes into Tiers (TIER 1 Pembangkit -> TIER 2 Backbone -> TIER 3 Interkoneksi -> TIER 4 Distribusi)
      const tier1Nodes: any[] = [];
      const tier2Nodes: any[] = [];
      const tier3Nodes: any[] = [];
      const tier4Nodes: any[] = [];

      customConfig.excelData.giList.forEach((gi) => {
        const n = (gi.name + ' ' + (gi.subsystem || '')).toLowerCase();
        const v = String(gi.voltage || '');
        if (n.includes('plt') || n.includes('muara karang') || n.includes('cirata') || n.includes('saguling') || n.includes('paiton') || n.includes('suralaya')) {
          tier1Nodes.push(gi);
        } else if (v.includes('500') || n.includes('gitet') || n.includes('gandul') || n.includes('cibinong') || n.includes('bekasi')) {
          tier2Nodes.push(gi);
        } else if (n.includes('ibt') || n.includes('trafo') || n.includes('bandung') || n.includes('mandirancan') || n.includes('ungaran') || n.includes('pedan')) {
          tier3Nodes.push(gi);
        } else {
          tier4Nodes.push(gi);
        }
      });

      const newNodes: Node[] = [];
      const placeTierNodes = (nodeList: any[], yPos: number, xStart: number, spacing: number) => {
        nodeList.forEach((gi, i) => {
          const isGen = (gi.name || '').toLowerCase().includes('plt') || (gi.name || '').toLowerCase().includes('muara karang') || (gi.name || '').toLowerCase().includes('cirata');
          newNodes.push({
            id: gi.id,
            type: isGen ? 'generator' : 'custom',
            position: { x: xStart + i * spacing, y: yPos },
            data: {
              id: gi.id,
              name: gi.name,
              code: gi.name.replace(/^GITET\s+|^GI\s+/, ''),
              voltage: gi.voltage || '500 kV',
              region: gi.region,
              riskStatus: gi.riskStatus,
              subsystem: gi.subsystem || currentSub.name
            }
          });
        });
      };

      // Place along horizontal Tier lines
      placeTierNodes(tier1Nodes, 70, 100, 260);
      placeTierNodes(tier2Nodes, 240, 80, 240);
      placeTierNodes(tier3Nodes, 410, 120, 250);
      placeTierNodes(tier4Nodes, 570, 100, 240);

      const newEdges: Edge[] = (customConfig.excelData.lineList || []).map((l) => ({
        id: l.id,
        source: l.sourceId,
        target: l.targetId,
        type: 'transmission',
        animated: l.riskStatus !== 'Normal',
        style: {
          stroke: l.riskStatus !== 'Normal' ? '#ff4757' : sldTheme === 'classic' ? '#dc2626' : '#00d2d3',
          strokeWidth: l.riskStatus !== 'Normal' ? 3.5 : 2.5
        },
        label: `${l.lineName} (${l.loadingPct}%)`,
        labelStyle: { fill: l.riskStatus !== 'Normal' ? '#ff4757' : sldTheme === 'classic' ? '#dc2626' : '#94a3b8', fontSize: 10, fontWeight: 700 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: sldTheme === 'classic' ? '#ffffff' : '#0f172a', color: '#fff', fillOpacity: 0.9 },
        data: {
          id: l.id,
          source: l.sourceId,
          target: l.targetId,
          name: l.lineName,
          voltage: '150 kV',
          status: l.riskStatus !== 'Normal' ? 'critical' : 'normal',
          riskLevel: l.riskStatus,
          circuitCount: 1,
          operatingStatus: 'Beroperasi',
          loading: { circuit1: l.loadingPct }
        }
      }));

      setNodes(newNodes as any);
      setEdges(newEdges as any);

      const timer = setTimeout(() => {
        reactFlow.fitView({ padding: 0.25, duration: 400 });
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setNodes(subsystemBogorNodes);
      setEdges(subsystemBogorEdges);
      const timer = setTimeout(() => {
        reactFlow.fitView({ padding: 0.25, duration: 400 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [customConfig, currentSubId, currentSub.name, sldTheme, reactFlow, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as any;
      setHighlightedId(node.id);
      if (data?.type === 'ibt') {
        setSelectedItem({ type: 'ibt', data });
      } else {
        setSelectedItem({
          type: 'node',
          data: {
            id: node.id,
            name: data?.name || node.id,
            code: data?.code || data?.name || node.id,
            type: data?.type || 'gi',
            voltage: data?.voltage || '150 kV',
            region: data?.region || currentSub.name,
            subsystem: data?.subsystem || currentSub.name,
            riskStatus: data?.riskStatus || 'Normal'
          } as any
        });
      }
      reactFlow.setCenter(node.position.x + 100, node.position.y + 40, { duration: 500, zoom: 1.2 });
    },
    [reactFlow, currentSub]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const data = edge.data as any;
      setHighlightedId(edge.id);
      setSelectedItem({
        type: 'line',
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          name: data?.name || (edge as any).label || edge.id,
          type: 'transmission',
          voltage: data?.voltage || '150 kV',
          status: data?.status || 'normal',
          riskLevel: data?.riskLevel || 'Normal',
          circuitCount: data?.circuitCount || 1,
          operatingStatus: data?.operatingStatus || 'Beroperasi',
          loading: data?.loading || { circuit1: 65 }
        } as any
      });
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

          {/* 4. Upload SLD */}
          <button
            onClick={() => onNavigate('upload-sld')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#0046ad] hover:bg-white transition-all ml-0.5 border-l border-slate-200 pl-3"
            title="Upload atau Import Data SLD Baru"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#0046ad]" />
            <span>Upload SLD</span>
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

                {/* Theme Selector: Blueprint Dark (Gambar 1) vs Skema Klasik SLD (Gambar 2) */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setSldTheme('blueprint')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                        sldTheme === 'blueprint'
                          ? 'bg-[#0f172a] text-cyan-400 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Tampilan Blueprint Gelap (seperti Gambar 1)"
                    >
                      <span>🌙 Blueprint (Gbr 1)</span>
                    </button>
                    <button
                      onClick={() => setSldTheme('classic')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                        sldTheme === 'classic'
                          ? 'bg-white text-[#dc2626] shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Tampilan Skema Klasik SLD Teknik (seperti Gambar 2)"
                    >
                      <span>📄 Skema Klasik (Gbr 2)</span>
                    </button>
                  </div>

                  <div className="text-xs font-mono font-bold text-slate-700 mr-80 hidden xl:block">
                    SLD 500 kV — SUBSISTEM {currentSub.name.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Custom SLD Active Banner */}
              {customConfig && (
                <div
                  className={`border-b px-4 py-2 flex items-center justify-between text-xs z-20 shrink-0 shadow-sm ${
                    customConfig.type === 'excel' && (!customConfig.excelData?.giList || customConfig.excelData.giList.length === 0)
                      ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
                      : 'bg-[#0f172a] border-cyan-500/40 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        customConfig.type === 'excel' && (!customConfig.excelData?.giList || customConfig.excelData.giList.length === 0)
                          ? 'bg-amber-400'
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                    <span className="font-bold">
                      {customConfig.type === 'excel' && (!customConfig.excelData?.giList || customConfig.excelData.giList.length === 0)
                        ? `⚠️ Data SLD Kustom Kosong (0 Simpul GI). Menampilkan SLD default ${currentSub.name}.`
                        : `SLD Kustom Pengguna Aktif (${
                            customConfig.type === 'excel'
                              ? `Import Excel: ${customConfig.excelData?.giList?.length || 0} GI • ${customConfig.excelData?.lineList?.length || 0} Jalur`
                              : 'Blueprint Skema Gambar'
                          })`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      • Diperbarui: {customConfig.updatedAt}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('upload-sld')}
                      className="px-2.5 py-1 bg-[#0046ad] hover:bg-[#00368a] text-white font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Upload Ulang</span>
                    </button>
                    <button
                      onClick={() => {
                        removeCustomSLD(currentSubId);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                      title="Kembalikan ke tampilan default subsistem"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Default</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode Canvas: Image Blueprint vs ReactFlow Graph */}
              {customConfig?.type === 'image' && customConfig.imageData ? (
                <div className="flex-1 relative bg-[#060c18] overflow-auto flex items-center justify-center p-4 select-none">
                  <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl bg-white border border-slate-700" style={{ minWidth: '650px', minHeight: '400px' }}>
                    {customConfig.imageData.imageUrl ? (
                      <img
                        src={customConfig.imageData.imageUrl}
                        alt="Custom SLD Blueprint"
                        className="w-full h-auto object-contain pointer-events-none block"
                      />
                    ) : (
                      <div className="w-full h-96 bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">
                        Blueprint Skema SLD {currentSub.name}
                      </div>
                    )}

                    {/* Interactive Hotspot Pins */}
                    {customConfig.imageData.hotspots.map((spot) => {
                      const isRawan = spot.riskStatus !== 'Normal';
                      return (
                        <div
                          key={spot.id}
                          onClick={() =>
                            setSelectedItem({
                              type: 'node',
                              data: {
                                name: spot.name,
                                voltage: spot.voltage,
                                region: currentSub.name,
                                riskStatus: spot.riskStatus,
                                description: spot.description
                              } as any
                            })
                          }
                          style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                        >
                          {isRawan && (
                            <span className="absolute -inset-2 rounded-full bg-[#dc2626] opacity-75 animate-ping" />
                          )}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg transition-transform hover:scale-125 ${
                              isRawan ? 'bg-[#dc2626] text-white' : 'bg-[#16a34a] text-white'
                            }`}
                          >
                            {isRawan ? '⚠️' : '⚡'}
                          </div>
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none flex items-center gap-1.5">
                            <span>{spot.name}</span>
                            <span className={`px-1 py-0.2 rounded text-[8px] font-mono ${isRawan ? 'bg-[#dc2626]' : 'bg-[#16a34a]'}`}>
                              {spot.riskStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ReactFlow Canvas (Default or Custom Excel) */
                <div className={`flex-1 relative overflow-hidden transition-colors duration-300 ${sldTheme === 'blueprint' ? 'bg-[#060c18]' : 'bg-[#ffffff]'}`}>
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
                      color={sldTheme === 'blueprint' ? 'rgba(0, 210, 211, 0.15)' : '#cbd5e1'}
                    />

                    {/* Horizontal Tier Guide Lines (TIER 1 s/d TIER 4) - Gambar 1 & Gambar 2 */}
                    <TierGuides />

                    <Controls className={sldTheme === 'blueprint' ? 'bg-slate-900 border border-slate-700 text-slate-300' : 'bg-white border border-slate-300 text-slate-700 shadow-sm'} />
                    
                    {/* MiniMap in corner matching Gambar 1 */}
                    <MiniMap
                      nodeColor={(n: any) => n.data?.riskStatus && n.data.riskStatus !== 'Normal' ? '#ff4757' : sldTheme === 'blueprint' ? '#00d2d3' : '#1d4ed8'}
                      className={`rounded-xl border shadow-xl ${sldTheme === 'blueprint' ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-300'}`}
                    />
                  </ReactFlow>

                  {/* Status bar at bottom */}
                  <div className={`absolute bottom-2 left-4 z-10 text-[10px] font-mono px-3 py-1 rounded-lg border backdrop-blur-xs flex items-center gap-4 ${
                    sldTheme === 'blueprint'
                      ? 'text-slate-400 bg-slate-900/80 border-slate-800'
                      : 'text-slate-600 bg-white/90 border-slate-200 shadow-xs'
                  }`}>
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
              )}
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
