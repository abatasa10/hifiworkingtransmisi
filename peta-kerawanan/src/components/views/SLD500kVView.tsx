import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import { BusbarNode } from '../sld/nodes/BusbarNode';
import { GeneratorNode } from '../sld/nodes/GeneratorNode';
import { TransformerNode } from '../sld/nodes/TransformerNode';
import { TransmissionEdge } from '../sld/edges/TransmissionEdge';
import { TierGuides } from '../sld/TierGuides';
import { SLDFilterBar } from '../sld/SLDFilterBar';
import { SLDSearchBar } from '../sld/SLDSearchBar';
import { SLDLegend } from '../sld/SLDLegend';
import { RightDetailPanel, SelectedItem } from '../panels/RightDetailPanel';
import { Breadcrumb } from '../layout/Breadcrumb';
import { initialNodes500kV } from '../../data/nodes500kv';
import { initialEdges500kV } from '../../data/edges500kv';
import { risksData } from '../../data/risks';
import { SLDFilterOptions, SLDNodeData, SLDEdgeData } from '../../types/graph';
import { ActiveView } from '../layout/Header';
import { getCustomSLD, removeCustomSLD, CustomSLDConfig } from '../../data/customSLDStore';
import {
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Network,
  Layers,
  Map,
  ListFilter,
  ShieldAlert,
  X,
  Search,
  UploadCloud
} from 'lucide-react';

import { Handle, Position } from '@xyflow/react';

const CustomExcelNode: React.FC<any> = ({ data, selected }) => {
  const isRawan = data?.riskStatus && data?.riskStatus !== 'Normal';
  const is500 = String(data?.voltage || '').includes('500');

  return (
    <div className="relative group cursor-pointer">
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

      <div
        className={`p-3 rounded-xl border-2 transition-all shadow-lg min-w-[200px] max-w-[240px] bg-slate-900 text-white ${
          isRawan
            ? 'border-[#dc2626] shadow-[#dc2626]/30'
            : 'border-[#0046ad] shadow-cyan-950/40 hover:border-cyan-400'
        } ${selected ? 'ring-2 ring-cyan-400 scale-105' : ''}`}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${is500 ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-[10px] font-mono font-bold text-cyan-300">{data?.voltage || '500 kV'}</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wide ${
              isRawan ? 'bg-[#dc2626] text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {data?.riskStatus || 'Normal'}
          </span>
        </div>

        <div className="font-bold text-xs text-white truncate tracking-tight">{data?.name || 'Gardu Induk'}</div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center justify-between">
          <span>{data?.region || 'Jamali'}</span>
          <span className="text-[9px] font-mono text-slate-500">ID: {data?.id}</span>
        </div>
      </div>
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

interface SLD500kVCanvasProps {
  onNavigate: (view: ActiveView) => void;
  initialSelectedRiskId?: number;
  onNavigateToMaps?: () => void;
  onNavigateToListKerawanan?: () => void;
}

const SLD500kVCanvas: React.FC<SLD500kVCanvasProps> = ({
  onNavigate,
  initialSelectedRiskId,
  onNavigateToMaps,
  onNavigateToListKerawanan
}) => {
  const reactFlow = useReactFlow();

  const [filters, setFilters] = useState<SLDFilterOptions>({
    status: 'Semua',
    riskLevel: 'Semua',
    voltage: 'Semua',
    assetType: 'Semua',
    searchQuery: ''
  });

  const [selectedItem, setSelectedItem] = useState<SelectedItem>(() => {
    if (initialSelectedRiskId) {
      const risk = risksData.find((r) => r.number === initialSelectedRiskId);
      if (risk) return { type: 'risk', data: risk };
    }
    // Default to Risk #7 as requested in prompt!
    const risk7 = risksData.find((r) => r.number === 7);
    return risk7 ? { type: 'risk', data: risk7 } : null;
  });

  const [highlightedAssetId, setHighlightedAssetId] = useState<string | null>(() => {
    return initialSelectedRiskId ? `LINE_GNDUL_DKSBI` : 'LINE_GNDUL_DKSBI';
  });

  // Custom Uploaded SLD Binding for 500 kV System
  const [customConfig, setCustomConfig] = useState<CustomSLDConfig | null>(() => getCustomSLD('sld-500kv'));

  useEffect(() => {
    const handleUpdate = () => {
      setCustomConfig(getCustomSLD('sld-500kv'));
    };
    window.addEventListener('custom-sld-updated', handleUpdate);
    return () => window.removeEventListener('custom-sld-updated', handleUpdate);
  }, []);

  // Highlight logic for nodes & edges
  const computedNodes = useMemo(() => {
    return initialNodes500kV.map((node) => {
      // If a line is selected, highlight its source and target!
      let isHighlighted = false;
      let isDimmed = false;

      if (highlightedAssetId) {
        if (highlightedAssetId.startsWith('LINE_') || highlightedAssetId.startsWith('GEN_')) {
          const edge = initialEdges500kV.find((e) => e.id === highlightedAssetId);
          if (edge) {
            isHighlighted = node.id === edge.source || node.id === edge.target;
            isDimmed = !isHighlighted;
          }
        } else if (highlightedAssetId.startsWith('GI_') || highlightedAssetId.startsWith('IBT_')) {
          // A substation is selected: highlight it and connected neighbors
          if (node.id === highlightedAssetId) {
            isHighlighted = true;
          } else {
            const isConnected = initialEdges500kV.some(
              (e) =>
                (e.source === highlightedAssetId && e.target === node.id) ||
                (e.target === highlightedAssetId && e.source === node.id)
            );
            isHighlighted = isConnected;
            isDimmed = !isConnected;
          }
        }
      }

      // Filter check
      if (filters.assetType !== 'Semua') {
        const matchesType =
          (filters.assetType === 'GITET' && node.data.type === 'gitet') ||
          (filters.assetType === 'GI' && node.data.type === 'gi') ||
          (filters.assetType === 'IBT' && node.data.type === 'ibt') ||
          (filters.assetType === 'Pembangkit' && node.data.type === 'generator');
        if (!matchesType) isDimmed = true;
      }

      return {
        ...node,
        data: {
          ...node.data,
          highlighted: isHighlighted,
          dimmed: isDimmed
        }
      };
    });
  }, [highlightedAssetId, filters]);

  const computedEdges = useMemo(() => {
    return initialEdges500kV.map((edge) => {
      let isHighlighted = false;
      let isDimmed = false;

      if (highlightedAssetId) {
        if (highlightedAssetId === edge.id) {
          isHighlighted = true;
        } else if (highlightedAssetId.startsWith('GI_') || highlightedAssetId.startsWith('IBT_')) {
          if (edge.source === highlightedAssetId || edge.target === highlightedAssetId) {
            isHighlighted = true;
          } else {
            isDimmed = true;
          }
        } else {
          isDimmed = true;
        }
      }

      // Filter check
      if (filters.status !== 'Semua') {
        if (filters.status === 'Normal' && edge.data?.status !== 'normal') isDimmed = true;
        if (filters.status === 'Kerawanan' && !edge.data?.riskId) isDimmed = true;
        if (filters.status === 'Planned' && edge.data?.status !== 'planned') isDimmed = true;
      }

      if (filters.riskLevel !== 'Semua') {
        if (edge.data?.riskLevel !== filters.riskLevel) isDimmed = true;
      }

      return {
        ...edge,
        data: {
          ...edge.data,
          highlighted: isHighlighted,
          dimmed: isDimmed
        }
      };
    });
  }, [highlightedAssetId, filters]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  const isCustomExcelValid = Boolean(
    customConfig?.type === 'excel' &&
    customConfig.excelData?.giList &&
    customConfig.excelData.giList.length > 0
  );

  // Synchronize state when custom config or computed nodes/edges change
  React.useEffect(() => {
    if (isCustomExcelValid && customConfig?.excelData?.giList && customConfig.excelData.giList.length > 0) {
      const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(customConfig.excelData.giList.length))));
      const newNodes: Node[] = customConfig.excelData.giList.map((gi, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        return {
          id: gi.id,
          type: 'custom',
          position: { x: 80 + col * 280, y: 80 + row * 160 },
          data: {
            id: gi.id,
            name: gi.name,
            code: gi.name,
            voltage: gi.voltage,
            region: gi.region || 'Jamali',
            riskStatus: gi.riskStatus
          }
        };
      });

      const newEdges: Edge[] = (customConfig.excelData.lineList || []).map((l) => ({
        id: l.id,
        source: l.sourceId,
        target: l.targetId,
        type: 'default',
        animated: l.riskStatus !== 'Normal',
        style: {
          stroke: l.riskStatus !== 'Normal' ? '#dc2626' : '#00d2d3',
          strokeWidth: l.riskStatus !== 'Normal' ? 3 : 2
        },
        label: `${l.lineName} (${l.loadingPct}%)`,
        labelStyle: { fill: l.riskStatus !== 'Normal' ? '#dc2626' : '#94a3b8', fontSize: 10, fontWeight: 700 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#0f172a', color: '#fff', fillOpacity: 0.9 },
        data: {
          id: l.id,
          name: l.lineName,
          voltage: '500 kV',
          status: l.riskStatus !== 'Normal' ? 'critical' : 'normal',
          riskLevel: l.riskStatus,
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
      setNodes(computedNodes);
      setEdges(computedEdges);
    }
  }, [isCustomExcelValid, customConfig, computedNodes, computedEdges, reactFlow, setNodes, setEdges]);

  // Click on Node (GI, GITET, IBT, Generator, or Custom Excel Node)
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeData = node.data as any;
      setHighlightedAssetId(node.id);

      if (nodeData?.type === 'ibt') {
        setSelectedItem({ type: 'ibt', data: nodeData });
      } else {
        setSelectedItem({
          type: 'node',
          data: {
            id: node.id,
            name: nodeData?.name || node.id,
            code: nodeData?.code || nodeData?.name || node.id,
            type: nodeData?.type || 'gi',
            voltage: nodeData?.voltage || '500 kV',
            region: nodeData?.region || 'Jamali',
            riskStatus: nodeData?.riskStatus || 'Normal'
          } as any
        });
      }

      // Auto center to node
      reactFlow.setCenter(node.position.x + 50, node.position.y, {
        duration: 600,
        zoom: 1.1
      });
    },
    [reactFlow]
  );

  // Click on Edge (Transmission Line)
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const edgeData = edge.data as any;
      setHighlightedAssetId(edge.id);

      if (edgeData?.riskId) {
        const risk = risksData.find((r) => r.number === edgeData.riskId);
        if (risk) {
          setSelectedItem({ type: 'risk', data: risk });
        } else {
          setSelectedItem({ type: 'line', data: edgeData });
        }
      } else {
        setSelectedItem({
          type: 'line',
          data: {
            id: edge.id,
            name: edgeData?.name || (edge as any).label || edge.id,
            type: 'transmission',
            voltage: edgeData?.voltage || '500 kV',
            status: edgeData?.status || 'normal',
            riskLevel: edgeData?.riskLevel || 'Normal',
            loading: edgeData?.loading || { circuit1: 60 }
          } as any
        });
      }

      // Find midpoint of edge
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        const midX = (sourceNode.position.x + targetNode.position.x) / 2;
        const midY = (sourceNode.position.y + targetNode.position.y) / 2;
        reactFlow.setCenter(midX, midY, { duration: 600, zoom: 1.15 });
      }
    },
    [nodes, reactFlow]
  );

  // Quick search selection handler
  const handleSearchSelect = useCallback(
    (item: { id: string; category: string; riskId?: number }) => {
      if (item.category === 'risk' && item.riskId) {
        const risk = risksData.find((r) => r.number === item.riskId);
        if (risk) {
          setSelectedItem({ type: 'risk', data: risk });
          if (risk.edgeId) setHighlightedAssetId(risk.edgeId);
          // Pan to GI Gandul for Risk #7
          const node = initialNodes500kV.find((n) => n.id === 'GI_GNDUL');
          if (node) reactFlow.setCenter(node.position.x + 50, node.position.y, { duration: 800, zoom: 1.2 });
        }
      } else if (item.category === 'edge') {
        const edge = initialEdges500kV.find((e) => e.id === item.id);
        if (edge && edge.data) {
          setHighlightedAssetId(edge.id);
          if (edge.data.riskId) {
            const risk = risksData.find((r) => r.number === edge.data?.riskId);
            if (risk) setSelectedItem({ type: 'risk', data: risk });
          } else {
            setSelectedItem({ type: 'line', data: edge.data });
          }
          const sNode = initialNodes500kV.find((n) => n.id === edge.source);
          if (sNode) reactFlow.setCenter(sNode.position.x, sNode.position.y, { duration: 800, zoom: 1.1 });
        }
      } else {
        const node = initialNodes500kV.find((n) => n.id === item.id);
        if (node) {
          setHighlightedAssetId(node.id);
          if (node.data.type === 'ibt') {
            setSelectedItem({ type: 'ibt', data: node.data });
          } else {
            setSelectedItem({ type: 'node', data: node.data });
          }
          reactFlow.setCenter(node.position.x + 50, node.position.y, { duration: 800, zoom: 1.2 });
        }
      }
    },
    [reactFlow]
  );

  // Connection selection from inside Right Panel
  const handleSelectConnection = useCallback(
    (edgeId: string) => {
      const edge = initialEdges500kV.find((e) => e.id === edgeId);
      if (edge) {
        setHighlightedAssetId(edge.id);
        if (edge.data?.riskId) {
          const risk = risksData.find((r) => r.number === edge.data?.riskId);
          if (risk) setSelectedItem({ type: 'risk', data: risk });
        } else if (edge.data) {
          setSelectedItem({ type: 'line', data: edge.data });
        }
      }
    },
    []
  );

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      const node = initialNodes500kV.find((n) => n.id === nodeId);
      if (node) {
        setHighlightedAssetId(node.id);
        if (node.data.type === 'ibt') {
          setSelectedItem({ type: 'ibt', data: node.data });
        } else {
          setSelectedItem({ type: 'node', data: node.data });
        }
        reactFlow.setCenter(node.position.x + 50, node.position.y, { duration: 600, zoom: 1.15 });
      }
    },
    [reactFlow]
  );

  const handleOpenRisk = useCallback((riskId: number) => {
    const risk = risksData.find((r) => r.number === riskId);
    if (risk) {
      setSelectedItem({ type: 'risk', data: risk });
      if (risk.edgeId) setHighlightedAssetId(risk.edgeId);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-[#f4f7fa] text-slate-800 overflow-hidden">
      {/* Sub-Header with Breadcrumb, Title, Filters, and Search (Matching MANTAPS style) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 shadow-xs">
        <div className="flex flex-col gap-0.5">
          <Breadcrumb
            items={[
              { label: 'Jawa, Madura & Bali', view: 'jamali-system' },
              { label: 'SLD 500 kV' }
            ]}
            onNavigate={onNavigate}
          />
          <div className="flex items-baseline gap-2 mt-0.5">
            <h1 className="text-base font-extrabold text-[#1e293b] tracking-tight">
              SLD 500 kV
            </h1>
            <span className="text-xs text-slate-500 hidden sm:inline font-normal">
              Single Line Diagram Sistem 500 kV Jawa, Madura dan Bali
            </span>
          </div>
        </div>

        {/* Filters and Search controls */}
        <div className="flex flex-wrap items-center gap-3">
          <SLDFilterBar
            filters={filters}
            onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
          />
          <SLDSearchBar onSelectItem={handleSearchSelect} />
        </div>
      </div>

      {/* Top View Mode Bar (Maps | SLD | List Kerawanan) */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          {/* 1. Maps */}
          <button
            onClick={() => {
              if (onNavigateToMaps) {
                onNavigateToMaps();
              } else {
                onNavigate('jamali-system');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#0046ad] hover:bg-white transition-all"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Maps</span>
          </button>

          {/* 2. SLD (Active) */}
          <button
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0046ad] text-white shadow-xs transition-all"
          >
            <Network className="w-3.5 h-3.5" />
            <span>SLD</span>
          </button>

          {/* 3. List Kerawanan */}
          <button
            onClick={() => {
              if (onNavigateToListKerawanan) {
                onNavigateToListKerawanan();
              } else {
                onNavigate('jamali-system');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#0046ad] hover:bg-white transition-all"
          >
            <ListFilter className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>List Kerawanan</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-[#fee2e2] text-[#dc2626]">
              {risksData.length}
            </span>
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
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-500 hidden md:flex items-center gap-2 font-mono">
            <span>Tegangan Backbone: 500 kV</span>
            <span>•</span>
            <span>Interkoneksi: 150 kV</span>
          </div>
        </div>
      </div>

      {/* Main Canvas + Right Detail Panel */}
      <div className="flex-1 flex flex-col w-full relative overflow-hidden">
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
                  ? '⚠️ Data SLD Kustom Kosong (0 Simpul GI). Menampilkan SLD default 500 kV.'
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
                  removeCustomSLD('sld-500kv');
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex w-full relative overflow-hidden">
          {/* Custom Image Blueprint View */}
          {customConfig?.type === 'image' && customConfig.imageData ? (
            <div className="flex-1 relative bg-[#060c18] overflow-auto flex items-center justify-center p-4 select-none">
              <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl bg-white border border-slate-700" style={{ minWidth: '650px', minHeight: '400px' }}>
                {customConfig.imageData.imageUrl ? (
                  <img
                    src={customConfig.imageData.imageUrl}
                    alt="Custom SLD Blueprint 500 kV"
                    className="w-full h-auto object-contain pointer-events-none block"
                  />
                ) : (
                  <div className="w-full h-96 bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">
                    Blueprint Skema SLD 500 kV
                  </div>
                )}
                {customConfig.imageData.hotspots.map((spot) => {
                  const isRawan = spot.riskStatus !== 'Normal';
                  return (
                    <div
                      key={spot.id}
                      onClick={() => setSelectedItem({ type: 'node', data: { name: spot.name, voltage: spot.voltage, region: 'Jamali', riskStatus: spot.riskStatus } as any })}
                      style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                    >
                      <div className="relative">
                        <span className={`absolute -inset-1 rounded-full animate-ping opacity-60 ${isRawan ? 'bg-[#dc2626]' : 'bg-[#00d2d3]'}`} />
                        <div className={`relative w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-lg ${isRawan ? 'bg-[#dc2626]' : 'bg-[#0046ad]'}`}>
                          •
                        </div>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-5 hidden group-hover:flex flex-col items-center bg-slate-950/95 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap shadow-xl border border-slate-700 z-30 pointer-events-none">
                        <span className="font-bold">{spot.name}</span>
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
            /* Interactive Graph Canvas */
            <div className="flex-1 relative h-full min-w-0">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultViewport={{ x: 100, y: 30, zoom: 0.85 }}
                minZoom={0.3}
                maxZoom={2.0}
                fitViewOptions={{ padding: 0.2 }}
                attributionPosition="bottom-left"
                className="h-full w-full"
              >
            {/* Background grid dots */}
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.5}
              color="rgba(0, 210, 211, 0.12)"
            />

            {/* Horizontal Tier Guide Lines (TIER 1 s/d TIER 6) */}
            <TierGuides />

            {/* Interactive Control buttons (Zoom in, Zoom out, Fit view, Reset) */}
            <div className="absolute right-4 bottom-16 z-30 flex flex-col gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-2xl backdrop-blur-md">
              <button
                onClick={() => reactFlow.zoomIn({ duration: 300 })}
                title="Perbesar (Zoom In)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => reactFlow.zoomOut({ duration: 300 })}
                title="Perkecil (Zoom Out)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => reactFlow.fitView({ duration: 600, padding: 0.15 })}
                title="Tampilan Penuh (Fit View)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setHighlightedAssetId(null);
                  reactFlow.setViewport({ x: 100, y: 30, zoom: 0.85 }, { duration: 600 });
                }}
                title="Reset Sorotan"
                className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Minimap (bottom right corner) */}
            <MiniMap
              nodeColor={(node) => {
                if (node.data?.type === 'generator') return '#f59e0b';
                if (node.data?.type === 'ibt') return '#10b981';
                return '#00d2d3';
              }}
              nodeStrokeWidth={2}
              maskColor="rgba(4, 8, 20, 0.75)"
              className="!bottom-16 !right-18 !w-44 !h-28"
            />
          </ReactFlow>
        </div>
      )}

        {/* Right Detail Panel */}
        <RightDetailPanel
          selectedItem={selectedItem}
          onClose={() => {
            setSelectedItem(null);
            setHighlightedAssetId(null);
          }}
          onSelectConnection={handleSelectConnection}
          onSelectNode={handleSelectNode}
          onOpenRisk={handleOpenRisk}
        />
      </div>
    </div>

      {/* Control Room Legend Footer (Matching Image 2) */}
      <SLDLegend />
    </div>
  );
};

export const SLD500kVView: React.FC<SLD500kVCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <SLD500kVCanvas {...props} />
    </ReactFlowProvider>
  );
};
