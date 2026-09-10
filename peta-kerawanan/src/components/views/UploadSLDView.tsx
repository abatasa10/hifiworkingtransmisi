import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  ReactFlowProvider,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  UploadCloud,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  RotateCcw,
  CheckCircle2,
  Info,
  MapPin,
  Trash2,
  Maximize2,
  Save,
  ArrowRight,
  ShieldAlert,
  Target,
  Table as TableIcon,
  Network,
  AlertCircle,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  Check,
  Database,
  RefreshCw
} from 'lucide-react';
import { ActiveView } from '../layout/Header';
import {
  ParsedGINode,
  ParsedTransmissionLine,
  ImageHotspot,
  CustomSLDConfig,
  saveCustomSLD,
  defaultTargetOptions
} from '../../data/customSLDStore';

interface UploadSLDViewProps {
  onNavigate: (view: ActiveView) => void;
  onSelectSubsystem?: (subId: string) => void;
}

// Normalize strings for resilient column matching
const cleanKey = (str: any): string => {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

const UploadCustomNode: React.FC<any> = ({ data }) => {
  return (
    <div className="relative group">
      {/* Default handles without explicit IDs for seamless edge routing */}
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      {data?.label}
    </div>
  );
};

const uploadNodeTypes = {
  default: UploadCustomNode,
  custom: UploadCustomNode
};

export interface ColumnMapping {
  gi: string;         // Kolom Nama Gardu Induk / Asset
  code: string;       // Kolom Kode Singkatan
  tier: string;       // Kolom Tier (Mulai 0)
  assetType: string;  // Kolom Tipe Asset
  ibtNumber: string;  // Kolom No IBT (1, 2, 4, dll)
  from: string;       // Kolom Dari GI
  to: string;         // Kolom Ke GI
  lineName: string;   // Kolom Nama Penghantar
  voltage: string;    // Kolom Tegangan
  risk: string;       // Kolom Status / Tingkat Kerawanan
  riskNumber: string; // Kolom No Kerawanan (#11, 1, 2, 1&2)
  load: string;       // Kolom Pembebanan Sirkit 1 / Nilai MW
  loadC2: string;     // Kolom Pembebanan Sirkit 2
  circuits: string;   // Kolom Jumlah Sirkit
  lengthKm: string;   // Kolom Panjang Saluran (km)
  corridor: string;   // Kolom Koridor / Wilayah
  uit: string;        // Kolom UIT (Unit Induk Transmisi)
  condition: string;  // Kolom Kondisi / Permasalahan
  impact: string;     // Kolom Dampak
  mitigation: string; // Kolom Mitigasi
  solution: string;   // Kolom Usulan / Solusi
}

// Initial sample data for immediate test
const initialSampleGINodes: ParsedGINode[] = [
  { id: 'GI_MURA_KARANG', name: 'GITET Muara Karang', voltage: '500 kV', region: 'DKI Jakarta & Banten', riskStatus: 'Normal', subsystem: 'Cawang - Priok' },
  { id: 'GI_GANDUL', name: 'GITET Gandul', voltage: '500 kV', region: 'DKI Jakarta & Banten', riskStatus: 'N-1', subsystem: 'Gandul' },
  { id: 'GI_BEKASI', name: 'GITET Bekasi', voltage: '500 kV', region: 'Jawa Barat', riskStatus: 'Normal', subsystem: 'Bekasi' },
  { id: 'GI_CIBINONG', name: 'GITET Cibinong', voltage: '500 kV', region: 'Jawa Barat', riskStatus: 'N-1', subsystem: 'Bogor' },
  { id: 'GI_CIRATA', name: 'GITET Cirata', voltage: '500 kV', region: 'Jawa Barat', riskStatus: 'N-2', subsystem: 'Cirata' },
  { id: 'GI_SAGULING', name: 'GITET Saguling', voltage: '500 kV', region: 'Jawa Barat', riskStatus: 'Normal', subsystem: 'Bandung Barat' },
  { id: 'GI_BANDUNG_SELATAN', name: 'GITET Bandung Selatan', voltage: '500 kV', region: 'Jawa Barat', riskStatus: 'N-1', subsystem: 'Bandung Selatan' },
  { id: 'GI_MANDIRANCAN', name: 'GITET Mandirancan', voltage: '500 kV', region: 'Jawa Tengah', riskStatus: 'Normal', subsystem: 'Cirebon' },
  { id: 'GI_UNGARAN', name: 'GITET Ungaran', voltage: '500 kV', region: 'Jawa Tengah', riskStatus: 'Normal', subsystem: 'Ungaran' },
  { id: 'GI_PEDAN', name: 'GITET Pedan', voltage: '500 kV', region: 'Jawa Tengah', riskStatus: 'N-1-2', subsystem: 'Pedan' },
  { id: 'GI_KEDIRI', name: 'GITET Kediri', voltage: '500 kV', region: 'Jawa Timur', riskStatus: 'Normal', subsystem: 'Kediri' },
  { id: 'GI_GRATI', name: 'GITET Grati', voltage: '500 kV', region: 'Jawa Timur', riskStatus: 'N-1', subsystem: 'Grati' },
  { id: 'GI_PAITON', name: 'GITET Paiton', voltage: '500 kV', region: 'Jawa Timur', riskStatus: 'Normal', subsystem: 'Paiton' }
];

const initialSampleLines: ParsedTransmissionLine[] = [
  { id: 'L_MK_GND', sourceId: 'GI_MURA_KARANG', targetId: 'GI_GANDUL', lineName: 'Muara Karang - Gandul', circuit: 'Sirkit 1', lengthKm: 28.5, loadingPct: 62, riskStatus: 'Normal' },
  { id: 'L_GND_CBN', sourceId: 'GI_GANDUL', targetId: 'GI_CIBINONG', lineName: 'Gandul - Cibinong', circuit: 'Sirkit 1', lengthKm: 34.2, loadingPct: 79, riskStatus: 'N-1' },
  { id: 'L_CBN_BKS', sourceId: 'GI_CIBINONG', targetId: 'GI_BEKASI', lineName: 'Cibinong - Bekasi', circuit: 'Sirkit 1', lengthKm: 42.1, loadingPct: 58, riskStatus: 'Normal' },
  { id: 'L_CBN_CRT', sourceId: 'GI_CIBINONG', targetId: 'GI_CIRATA', lineName: 'Cibinong - Cirata', circuit: 'Sirkit 1', lengthKm: 65.8, loadingPct: 88, riskStatus: 'N-2' },
  { id: 'L_CRT_SGL', sourceId: 'GI_CIRATA', targetId: 'GI_SAGULING', lineName: 'Cirata - Saguling', circuit: 'Sirkit 1', lengthKm: 22.0, loadingPct: 71, riskStatus: 'Normal' },
  { id: 'L_SGL_BDS', sourceId: 'GI_SAGULING', targetId: 'GI_BANDUNG_SELATAN', lineName: 'Saguling - Bandung Selatan', circuit: 'Sirkit 1', lengthKm: 31.4, loadingPct: 83, riskStatus: 'N-1' },
  { id: 'L_BDS_MND', sourceId: 'GI_BANDUNG_SELATAN', targetId: 'GI_MANDIRANCAN', lineName: 'Bandung Selatan - Mandirancan', circuit: 'Sirkit 1', lengthKm: 112.5, loadingPct: 64, riskStatus: 'Normal' },
  { id: 'L_MND_UNG', sourceId: 'GI_MANDIRANCAN', targetId: 'GI_UNGARAN', lineName: 'Mandirancan - Ungaran', circuit: 'Sirkit 1', lengthKm: 178.0, loadingPct: 55, riskStatus: 'Normal' },
  { id: 'L_UNG_PDN', sourceId: 'GI_UNGARAN', targetId: 'GI_PEDAN', lineName: 'Ungaran - Pedan', circuit: 'Sirkit 1', lengthKm: 68.2, loadingPct: 91, riskStatus: 'N-1-2' },
  { id: 'L_PDN_KDR', sourceId: 'GI_PEDAN', targetId: 'GI_KEDIRI', lineName: 'Pedan - Kediri', circuit: 'Sirkit 1', lengthKm: 145.0, loadingPct: 69, riskStatus: 'Normal' },
  { id: 'L_KDR_GRT', sourceId: 'GI_KEDIRI', targetId: 'GI_GRATI', lineName: 'Kediri - Grati', circuit: 'Sirkit 1', lengthKm: 98.4, loadingPct: 76, riskStatus: 'N-1' },
  { id: 'L_GRT_PTN', sourceId: 'GI_GRATI', targetId: 'GI_PAITON', lineName: 'Grati - Paiton', circuit: 'Sirkit 1', lengthKm: 84.7, loadingPct: 61, riskStatus: 'Normal' }
];

export const UploadSLDView: React.FC<UploadSLDViewProps> = ({
  onNavigate,
  onSelectSubsystem
}) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'image'>('excel');

  // Target Destination Selection
  const [selectedTargetId, setSelectedTargetId] = useState<string>('sub-bogor');

  // Excel mode states
  const [giList, setGiList] = useState<ParsedGINode[]>(initialSampleGINodes);
  const [lineList, setLineList] = useState<ParsedTransmissionLine[]>(initialSampleLines);
  const [fileName, setFileName] = useState<string>('sample_sld_jamali_500kv.xlsx');
  const [excelViewMode, setExcelViewMode] = useState<'graph' | 'table'>('graph');
  const [filterRisk, setFilterRisk] = useState<string>('Semua');
  const [selectedElement, setSelectedElement] = useState<any | null>(null);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Advanced Excel Workbook & Multi-sheet mapping states
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [detectedSheets, setDetectedSheets] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [showMappingPanel, setShowMappingPanel] = useState<boolean>(true);
  const [colMapping, setColMapping] = useState<ColumnMapping>({
    gi: '',
    code: '',
    tier: '',
    assetType: '',
    ibtNumber: '',
    from: '',
    to: '',
    lineName: '',
    voltage: '',
    risk: '',
    riskNumber: '',
    load: '',
    loadC2: '',
    circuits: '',
    lengthKm: '',
    corridor: '',
    uit: '',
    condition: '',
    impact: '',
    mitigation: '',
    solution: ''
  });

  // Image mode states
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [hotspots, setHotspots] = useState<ImageHotspot[]>([
    { id: 'spot-1', name: 'GITET Cibinong 500 kV', voltage: '500 kV', riskStatus: 'N-1', xPercent: 28, yPercent: 42, description: 'Beban IBT 2 mendekati 82%' },
    { id: 'spot-2', name: 'GITET Cirata 500 kV', voltage: '500 kV', riskStatus: 'N-2', xPercent: 52, yPercent: 50, description: 'Potensi N-2 pada Sirkit 1 & 2' },
    { id: 'spot-3', name: 'GITET Saguling 500 kV', voltage: '500 kV', riskStatus: 'Normal', xPercent: 46, yPercent: 68, description: 'Operasi normal bertegangan aman' },
    { id: 'spot-4', name: 'GITET Bandung Selatan', voltage: '500 kV', riskStatus: 'N-1', xPercent: 65, yPercent: 74, description: 'Jalur transfer antar subsistem' }
  ]);
  const [imageToolMode, setImageToolMode] = useState<'pan' | 'add-point'>('add-point');
  const [newPointStatus, setNewPointStatus] = useState<'Normal' | 'N-1' | 'N-2' | 'N-1-2'>('N-1');
  const [selectedHotspot, setSelectedHotspot] = useState<ImageHotspot | null>(null);

  // Success Confirmation Modal
  const [savedSuccessModal, setSavedSuccessModal] = useState<{
    isOpen: boolean;
    targetName: string;
    targetId: string;
    type: 'excel' | 'image';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const currentTargetObj = defaultTargetOptions.find((t) => t.id === selectedTargetId) || defaultTargetOptions[1];

  // Auto-layout calculation for React Flow
  const { flowNodes, flowEdges } = useMemo(() => {
    const regionOrder: Record<string, number> = {
      'DKI Jakarta & Banten': 0,
      'Jawa Barat': 1,
      'Jawa Tengah': 2,
      'Jawa Timur': 3,
      'Bali': 4
    };

    const calculatedNodes: Node[] = [];
    const xBase = 60;
    const colWidth = 270;
    const rowHeight = 150;

    // Check if nodes have regional grouping or general layout
    const hasMultipleRegions = new Set(giList.map((g) => g.region)).size > 1;

    if (hasMultipleRegions) {
      const groups: Record<string, ParsedGINode[]> = {};
      giList.forEach((gi) => {
        const reg = gi.region || 'Jawa Barat';
        if (!groups[reg]) groups[reg] = [];
        groups[reg].push(gi);
      });

      Object.entries(groups).forEach(([region, nodesInRegion]) => {
        const colIdx = regionOrder[region] ?? 1;
        nodesInRegion.forEach((node, rowIdx) => {
          const x = xBase + colIdx * colWidth + (rowIdx % 2 === 1 ? 25 : -15);
          const y = 80 + rowIdx * rowHeight;
          const isRawan = node.riskStatus !== 'Normal';
          const isMatched = filterRisk === 'Semua' || node.riskStatus === filterRisk;
          const isIBTNode =
            node.assetType === 'ibt' ||
            (node.name || '').toLowerCase().includes('ibt') ||
            (node.name || '').toLowerCase().includes('trafo') ||
            Boolean(node.ibtNumber) ||
            String(node.voltage || '').includes('/');
          const nodeIbtNum =
            node.ibtNumber ||
            (node.name || '').match(/ibt\s*([0-9&]+)/i)?.[1] ||
            '1';

          calculatedNodes.push({
            id: node.id,
            type: 'custom',
            position: { x, y },
            data: {
              label: isIBTNode ? (
                /* Tampilan Khusus IBT pada Preview Canvas (3 Lingkaran Interlocking + Badge) */
                <div
                  onClick={() => setSelectedElement({ type: 'node', data: node })}
                  className={`flex flex-col items-center cursor-pointer group p-2.5 rounded-xl border-2 transition-transform hover:scale-105 shadow-md bg-slate-950/90 min-w-[150px] ${
                    isRawan ? 'border-[#dc2626] shadow-[#dc2626]/20' : 'border-[#2563eb] shadow-blue-500/20'
                  } ${!isMatched ? 'opacity-30' : 'opacity-100'}`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-bold text-cyan-300 font-mono truncate">
                      {node.name || `IBT ${nodeIbtNum}`}
                    </span>
                    {isRawan && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-[#dc2626] text-white">
                        {node.riskStatus}
                      </span>
                    )}
                  </div>
                  {/* Simbol 3 Lingkaran IBT */}
                  <div className="relative w-16 h-14 flex items-center justify-center my-0.5">
                    <svg viewBox="0 0 74 66" className="w-16 h-14 filter drop-shadow-md">
                      <circle cx="37" cy="23" r="16.5" fill="none" stroke="#2563eb" strokeWidth="3.6" />
                      <circle cx="26" cy="42" r="16.5" fill="none" stroke="#ef4444" strokeWidth="3.6" />
                      <circle cx="48" cy="42" r="16.5" fill="none" stroke="#f59e0b" strokeWidth="3.6" />
                      <rect x="47" y="14" width="22" height="22" rx="6" fill="rgba(226, 232, 240, 0.92)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.8" />
                      <text x="58" y="26" textAnchor="middle" dominantBaseline="central" fill="#0f172a" fontWeight="900" fontSize="13" fontFamily="system-ui, sans-serif">
                        {nodeIbtNum}
                      </text>
                    </svg>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">{node.voltage || '500/150 kV'}</span>
                </div>
              ) : (
                /* Tampilan Standar GI Simpul */
                <div
                  onClick={() => setSelectedElement({ type: 'node', data: node })}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer shadow-md min-w-[190px] ${
                    node.voltage?.includes('500') ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-800'
                  } ${
                    isRawan ? 'border-[#dc2626] shadow-[#dc2626]/20' : 'border-[#0046ad] shadow-slate-200'
                  } ${!isMatched ? 'opacity-30' : 'opacity-100'}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${node.voltage?.includes('500') ? 'bg-[#38bdf8]' : 'bg-[#16a34a]'}`} />
                      <span className="text-[10px] font-mono font-bold text-slate-300">{node.voltage}</span>
                    </div>
                    {isRawan ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#dc2626] text-white">
                        {node.riskStatus}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#16a34a]/20 text-[#16a34a]">
                        Normal
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs truncate">{node.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{node.region || node.subsystem || 'Unit Transmisi'}</div>
                </div>
              )
            }
          });
        });
      });
    } else {
      // Single grid layout (e.g. Subsistem layout 3-4 columns)
      const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(giList.length))));
      giList.forEach((node, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = xBase + col * 280;
        const y = 80 + row * 150;
        const isRawan = node.riskStatus !== 'Normal';
        const isMatched = filterRisk === 'Semua' || node.riskStatus === filterRisk;
        const isIBTNode =
          node.assetType === 'ibt' ||
          (node.name || '').toLowerCase().includes('ibt') ||
          (node.name || '').toLowerCase().includes('trafo') ||
          Boolean(node.ibtNumber) ||
          String(node.voltage || '').includes('/');
        const nodeIbtNum =
          node.ibtNumber ||
          (node.name || '').match(/ibt\s*([0-9&]+)/i)?.[1] ||
          '1';

        calculatedNodes.push({
          id: node.id,
          type: 'custom',
          position: { x, y },
          data: {
            label: isIBTNode ? (
              /* Tampilan Khusus IBT pada Preview Canvas (3 Lingkaran Interlocking + Badge) */
              <div
                onClick={() => setSelectedElement({ type: 'node', data: node })}
                className={`flex flex-col items-center cursor-pointer group p-2.5 rounded-xl border-2 transition-transform hover:scale-105 shadow-md bg-slate-950/90 min-w-[150px] ${
                  isRawan ? 'border-[#dc2626] shadow-[#dc2626]/20' : 'border-[#2563eb] shadow-blue-500/20'
                } ${!isMatched ? 'opacity-30' : 'opacity-100'}`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-bold text-cyan-300 font-mono truncate">
                    {node.name || `IBT ${nodeIbtNum}`}
                  </span>
                  {isRawan && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-[#dc2626] text-white">
                      {node.riskStatus}
                    </span>
                  )}
                </div>
                {/* Simbol 3 Lingkaran IBT */}
                <div className="relative w-16 h-14 flex items-center justify-center my-0.5">
                  <svg viewBox="0 0 74 66" className="w-16 h-14 filter drop-shadow-md">
                    <circle cx="37" cy="23" r="16.5" fill="none" stroke="#2563eb" strokeWidth="3.6" />
                    <circle cx="26" cy="42" r="16.5" fill="none" stroke="#ef4444" strokeWidth="3.6" />
                    <circle cx="48" cy="42" r="16.5" fill="none" stroke="#f59e0b" strokeWidth="3.6" />
                    <rect x="47" y="14" width="22" height="22" rx="6" fill="rgba(226, 232, 240, 0.92)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.8" />
                    <text x="58" y="26" textAnchor="middle" dominantBaseline="central" fill="#0f172a" fontWeight="900" fontSize="13" fontFamily="system-ui, sans-serif">
                      {nodeIbtNum}
                    </text>
                  </svg>
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">{node.voltage || '500/150 kV'}</span>
              </div>
            ) : (
              /* Tampilan Standar GI Simpul */
              <div
                onClick={() => setSelectedElement({ type: 'node', data: node })}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer shadow-md min-w-[190px] ${
                  node.voltage?.includes('500') ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-800'
                } ${
                  isRawan ? 'border-[#dc2626] shadow-[#dc2626]/20' : 'border-[#0046ad] shadow-slate-200'
                } ${!isMatched ? 'opacity-30' : 'opacity-100'}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${node.voltage?.includes('500') ? 'bg-[#38bdf8]' : 'bg-[#16a34a]'}`} />
                    <span className="text-[10px] font-mono font-bold text-slate-400">{node.voltage}</span>
                  </div>
                  {isRawan ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#dc2626] text-white">
                      {node.riskStatus}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#16a34a]/20 text-[#16a34a]">
                      Normal
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs truncate">{node.name}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{node.subsystem || node.region || 'Subsistem'}</div>
              </div>
            )
          }
        });
      });
    }

    const calculatedEdges: Edge[] = lineList.map((line) => {
      const isRawan = line.riskStatus !== 'Normal';
      const isMatched = filterRisk === 'Semua' || line.riskStatus === filterRisk;

      return {
        id: line.id,
        source: line.sourceId,
        target: line.targetId,
        animated: isRawan,
        style: {
          stroke: isRawan ? '#dc2626' : '#0046ad',
          strokeWidth: isRawan ? 3 : 2,
          opacity: isMatched ? 1 : 0.2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isRawan ? '#dc2626' : '#0046ad',
          width: 14,
          height: 14
        },
        label: `${line.lineName} (${line.loadingPct}%)`,
        labelStyle: { fill: isRawan ? '#dc2626' : '#475569', fontSize: 10, fontWeight: 700 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#ffffff', color: '#fff', fillOpacity: 0.9 }
      };
    });

    return { flowNodes: calculatedNodes, flowEdges: calculatedEdges };
  }, [giList, lineList, filterRisk]);

  // SMART COLUMN AUTO-DETECTOR
  const autoDetectMapping = (headers: string[]): ColumnMapping => {
    const colMap: Record<string, string> = {};
    headers.forEach((h) => {
      colMap[cleanKey(h)] = h;
    });

    const findHeader = (patterns: string[]): string => {
      for (const p of patterns) {
        for (const [k, originalHeader] of Object.entries(colMap)) {
          if (k.includes(p)) return originalHeader;
        }
      }
      return '';
    };

    const fromCol = findHeader(['darigi', 'dari', 'from', 'asal', 'bus1', 'source', 'pangkal']);
    const toCol = findHeader(['kegi', 'ke', 'to', 'tujuan', 'bus2', 'target', 'ujung']);
    const lineNameCol = findHeader(['namapenghantar', 'penghantar', 'namaline', 'line', 'jalur', 'transmisi', 'bay']);
    const giCol = findHeader(['namagi', 'garduinduk', 'namagardu', 'functlocgarduinduk', 'substation', 'functloc', 'namaasset', 'gi', 'nama', 'gardu']);
    const codeCol = findHeader(['kodesingkatan', 'kodesingkat', 'kode', 'code', 'singkatan']);
    const tierCol = findHeader(['tiermulai0', 'tier', 'leveltier', 'hirarki', 'hierarchy', 'level']);
    const assetTypeCol = findHeader(['tipeasset', 'tipe', 'jenisasi', 'jenis', 'type']);
    const ibtNumCol = findHeader(['noibt', 'nomoribt', 'nomeribt', 'ibt', 'unitibt']);
    const voltageCol = findHeader(['tegangan', 'kv', 'voltage', 'level']);
    const riskCol = findHeader(['tingkatkerawanan', 'statuskerawanan', 'kerawanan', 'statusasset', 'status', 'kategori', 'risk']);
    const riskNumCol = findHeader(['nokerawanan', 'nomorkerawanan', 'nomerkerawanan', 'idkerawanan', 'norisk']);
    const loadCol = findHeader(['pembebanansirkit1', 'pembebanan', 'loading', 'bebanmw', 'load', 'beban', 'mw', 'mva', 'arus', 'ampere']);
    const loadC2Col = findHeader(['pembebanansirkit2', 'beban2', 'load2', 'loading2']);
    const circuitsCol = findHeader(['jumlahsirkit', 'sirkit', 'circuits', 'jmlsirkit']);
    const lengthKmCol = findHeader(['panjangsaluran', 'panjangkm', 'panjang', 'length', 'km']);
    const corridorCol = findHeader(['koridor', 'wilayah', 'region', 'lokasi', 'provinsi']);
    const uitCol = findHeader(['uit', 'unitinduktransmisi', 'unitinduk', 'unit']);
    const conditionCol = findHeader(['kondisipermasalahan', 'permasalahan', 'kondisi', 'kendala', 'isu']);
    const impactCol = findHeader(['dampak', 'impact', 'akibat', 'risiko']);
    const mitigationCol = findHeader(['mitigasi', 'mitigation', 'pencegahan', 'penanganan']);
    const solutionCol = findHeader(['usulansolusi', 'usulan', 'solusi', 'solution', 'rekomendasi', 'jangkapendek']);

    return {
      gi: giCol,
      code: codeCol,
      tier: tierCol,
      assetType: assetTypeCol,
      ibtNumber: ibtNumCol,
      from: fromCol,
      to: toCol,
      lineName: lineNameCol,
      voltage: voltageCol,
      risk: riskCol,
      riskNumber: riskNumCol,
      load: loadCol,
      loadC2: loadC2Col,
      circuits: circuitsCol,
      lengthKm: lengthKmCol,
      corridor: corridorCol,
      uit: uitCol,
      condition: conditionCol,
      impact: impactCol,
      mitigation: mitigationCol,
      solution: solutionCol
    };
  };

  // EXECUTE PARSING FROM RAW SHEET WITH SPECIFIED COLUMN MAPPING
  const executeParsingWithMapping = (
    sheet: XLSX.WorkSheet,
    mapping: ColumnMapping,
    currentTargetName: string
  ) => {
    const rawGrid: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rawGrid || rawGrid.length === 0) {
      setGiList([]);
      setLineList([]);
      setUploadStatusMsg({ type: 'error', text: 'Lembar kerja (sheet) ini kosong.' });
      return;
    }

    // Auto-find header row index (scanning first 15 rows)
    let headerRowIndex = 0;
    for (let r = 0; r < Math.min(15, rawGrid.length); r++) {
      const row = rawGrid[r];
      if (Array.isArray(row) && row.length > 0) {
        const hasKey = row.some((cell) => {
          const k = cleanKey(cell);
          return (
            k.includes('gi') ||
            k.includes('gardu') ||
            k.includes('nama') ||
            k.includes('penghantar') ||
            k.includes('line') ||
            k.includes('dari') ||
            k.includes('ke') ||
            k.includes('tier') ||
            k.includes('ibt') ||
            k.includes('functloc') ||
            k.includes('bay') ||
            k.includes('trafo') ||
            k.includes('tegangan') ||
            k.includes('beban')
          );
        });
        if (hasKey) {
          headerRowIndex = r;
          break;
        }
      }
    }

    const headers: string[] = (rawGrid[headerRowIndex] || []).map((h) => String(h || '').trim()).filter(Boolean);
    setRawHeaders(headers);

    const dataRows = rawGrid
      .slice(headerRowIndex + 1)
      .filter((r) => Array.isArray(r) && r.some((c) => c !== undefined && c !== null && String(c).trim() !== ''));

    setPreviewRows(dataRows.slice(0, 5));

    const colIdx = (headerName: string) => (headerName ? headers.indexOf(headerName) : -1);

    const colFromIdx = colIdx(mapping.from);
    const colToIdx = colIdx(mapping.to);
    const colLineNameIdx = colIdx(mapping.lineName);
    const colGiIdx = colIdx(mapping.gi);
    const colCodeIdx = colIdx(mapping.code);
    const colTierIdx = colIdx(mapping.tier);
    const colAssetTypeIdx = colIdx(mapping.assetType);
    const colIbtNumIdx = colIdx(mapping.ibtNumber);
    const colVoltageIdx = colIdx(mapping.voltage);
    const colRiskIdx = colIdx(mapping.risk);
    const colRiskNumIdx = colIdx(mapping.riskNumber);
    const colLoadIdx = colIdx(mapping.load);
    const colLoadC2Idx = colIdx(mapping.loadC2);
    const colCircuitsIdx = colIdx(mapping.circuits);
    const colLengthKmIdx = colIdx(mapping.lengthKm);
    const colCorridorIdx = colIdx(mapping.corridor);
    const colUitIdx = colIdx(mapping.uit);
    const colConditionIdx = colIdx(mapping.condition);
    const colImpactIdx = colIdx(mapping.impact);
    const colMitigationIdx = colIdx(mapping.mitigation);
    const colSolutionIdx = colIdx(mapping.solution);

    const parsedNodes: ParsedGINode[] = [];
    const parsedLines: ParsedTransmissionLine[] = [];

    // 1. Process Transmission Lines if From and To columns are specified
    if (colFromIdx !== -1 && colToIdx !== -1) {
      dataRows.forEach((row, rIdx) => {
        const dariVal = String(row[colFromIdx] || '').trim();
        const keVal = String(row[colToIdx] || '').trim();
        if (!dariVal || !keVal) return;

        const lineNameVal = colLineNameIdx !== -1 && row[colLineNameIdx] ? String(row[colLineNameIdx]).trim() : `${dariVal} - ${keVal}`;
        const riskVal = colRiskIdx !== -1 && row[colRiskIdx] ? String(row[colRiskIdx]).trim() : 'Normal';
        const riskNumVal = colRiskNumIdx !== -1 && row[colRiskNumIdx] ? String(row[colRiskNumIdx]).trim() : '';
        const loadVal = colLoadIdx !== -1 && !isNaN(Number(row[colLoadIdx])) ? Number(row[colLoadIdx]) : Math.floor(50 + Math.random() * 40);
        const c2LoadVal = colLoadC2Idx !== -1 && !isNaN(Number(row[colLoadC2Idx])) ? Number(row[colLoadC2Idx]) : Math.round(loadVal * 0.9);
        const circuitsVal = colCircuitsIdx !== -1 && !isNaN(Number(row[colCircuitsIdx])) ? Number(row[colCircuitsIdx]) : 2;
        const lengthKmVal = colLengthKmIdx !== -1 && !isNaN(Number(row[colLengthKmIdx])) ? Number(row[colLengthKmIdx]) : 21.4;
        const corridorVal = colCorridorIdx !== -1 && row[colCorridorIdx] ? String(row[colCorridorIdx]).trim() : '';
        const uitVal = colUitIdx !== -1 && row[colUitIdx] ? String(row[colUitIdx]).trim() : undefined;
        const conditionVal = colConditionIdx !== -1 && row[colConditionIdx] ? String(row[colConditionIdx]).trim() : undefined;
        const impactVal = colImpactIdx !== -1 && row[colImpactIdx] ? String(row[colImpactIdx]).trim() : undefined;
        const mitigationVal = colMitigationIdx !== -1 && row[colMitigationIdx] ? String(row[colMitigationIdx]).trim() : undefined;
        const solutionVal = colSolutionIdx !== -1 && row[colSolutionIdx] ? String(row[colSolutionIdx]).trim() : undefined;

        let normalizedRisk: 'Normal' | 'N-1' | 'N-2' | 'N-1-2' | 'Sedang' | 'Sangat Rawan' = 'Normal';
        const rUpper = riskVal.toUpperCase();
        if (rUpper.includes('N-1-2') || rUpper.includes('N12')) normalizedRisk = 'N-1-2';
        else if (rUpper.includes('N-2') || rUpper.includes('N2')) normalizedRisk = 'N-2';
        else if (rUpper.includes('SANGAT RAWAN') || rUpper.includes('KRITIS')) normalizedRisk = 'Sangat Rawan';
        else if (rUpper.includes('SEDANG')) normalizedRisk = 'Sedang';
        else if (rUpper.includes('N-1') || rUpper.includes('N1') || rUpper.includes('RAWAN')) normalizedRisk = 'N-1';

        const sourceNodeId = `GI_${cleanKey(dariVal)}`;
        const targetNodeId = `GI_${cleanKey(keVal)}`;

        parsedLines.push({
          id: `LINE_${rIdx + 1}_${cleanKey(lineNameVal)}`,
          sourceId: sourceNodeId,
          targetId: targetNodeId,
          lineName: lineNameVal,
          circuit: `${circuitsVal} Sirkit`,
          circuitCount: circuitsVal,
          lengthKm: lengthKmVal,
          loadingPct: loadVal,
          loadingCircuit1: loadVal,
          loadingCircuit2: c2LoadVal,
          voltage: colVoltageIdx !== -1 && row[colVoltageIdx] ? String(row[colVoltageIdx]) : '500 kV',
          operatingStatus: 'Beroperasi',
          riskStatus: normalizedRisk,
          riskNumber: riskNumVal || (normalizedRisk !== 'Normal' ? 11 : undefined),
          region: corridorVal || currentTargetName,
          corridor: corridorVal || `Koridor ${dariVal} - ${keVal}`,
          uit: uitVal,
          condition: conditionVal,
          impact: impactVal,
          mitigation: mitigationVal,
          solution: solutionVal
        });

        const voltageVal = colVoltageIdx !== -1 && row[colVoltageIdx] ? String(row[colVoltageIdx]) : '500 kV';

        if (!parsedNodes.some((n) => n.id === sourceNodeId)) {
          const isIBT =
            dariVal.toLowerCase().includes('ibt') ||
            dariVal.toLowerCase().includes('trafo') ||
            voltageVal.includes('/');
          const num = dariVal.match(/ibt\s*([0-9&]+)/i)?.[1] || (isIBT ? '1' : undefined);
          parsedNodes.push({
            id: sourceNodeId,
            name: dariVal,
            voltage: voltageVal,
            region: currentTargetName,
            riskStatus: normalizedRisk !== 'Normal' ? normalizedRisk : 'Normal',
            subsystem: currentTargetName,
            assetType: isIBT ? 'ibt' : undefined,
            ibtNumber: num,
            tier: isIBT ? 1 : undefined
          });
        }

        if (!parsedNodes.some((n) => n.id === targetNodeId)) {
          const isIBT =
            keVal.toLowerCase().includes('ibt') ||
            keVal.toLowerCase().includes('trafo') ||
            voltageVal.includes('/');
          const num = keVal.match(/ibt\s*([0-9&]+)/i)?.[1] || (isIBT ? '1' : undefined);
          parsedNodes.push({
            id: targetNodeId,
            name: keVal,
            voltage: voltageVal,
            region: currentTargetName,
            riskStatus: 'Normal',
            subsystem: currentTargetName,
            assetType: isIBT ? 'ibt' : undefined,
            ibtNumber: num,
            tier: isIBT ? 1 : undefined
          });
        }
      });
    }

    // 2. Process / Merge Gardu Induk (GI) Simpul Nodes if GI column is specified
    if (colGiIdx !== -1) {
      dataRows.forEach((row, rIdx) => {
        const giVal = String(row[colGiIdx] || '').trim();
        if (!giVal) return;

        const voltageVal = colVoltageIdx !== -1 && row[colVoltageIdx] ? String(row[colVoltageIdx]) : '150 kV';
        const riskVal = colRiskIdx !== -1 && row[colRiskIdx] ? String(row[colRiskIdx]).trim() : 'Normal';
        const riskNumVal = colRiskNumIdx !== -1 && row[colRiskNumIdx] ? String(row[colRiskNumIdx]).trim() : '';
        const tierVal = colTierIdx !== -1 && !isNaN(Number(row[colTierIdx])) ? Number(row[colTierIdx]) : undefined;
        const ibtNumVal = colIbtNumIdx !== -1 && row[colIbtNumIdx] ? String(row[colIbtNumIdx]).trim() : undefined;
        const assetTypeVal = colAssetTypeIdx !== -1 && row[colAssetTypeIdx] ? String(row[colAssetTypeIdx]).trim() : undefined;
        const codeVal = colCodeIdx !== -1 && row[colCodeIdx] ? String(row[colCodeIdx]).trim() : undefined;
        const corridorVal = colCorridorIdx !== -1 && row[colCorridorIdx] ? String(row[colCorridorIdx]).trim() : '';
        const uitVal = colUitIdx !== -1 && row[colUitIdx] ? String(row[colUitIdx]).trim() : undefined;
        const conditionVal = colConditionIdx !== -1 && row[colConditionIdx] ? String(row[colConditionIdx]).trim() : undefined;
        const impactVal = colImpactIdx !== -1 && row[colImpactIdx] ? String(row[colImpactIdx]).trim() : undefined;
        const mitigationVal = colMitigationIdx !== -1 && row[colMitigationIdx] ? String(row[colMitigationIdx]).trim() : undefined;
        const solutionVal = colSolutionIdx !== -1 && row[colSolutionIdx] ? String(row[colSolutionIdx]).trim() : undefined;

        let normalizedRisk: 'Normal' | 'N-1' | 'N-2' | 'N-1-2' | 'Sedang' | 'Sangat Rawan' = 'Normal';
        const rUpper = riskVal.toUpperCase();
        if (rUpper.includes('N-1-2') || rUpper.includes('N12')) normalizedRisk = 'N-1-2';
        else if (rUpper.includes('N-2') || rUpper.includes('N2')) normalizedRisk = 'N-2';
        else if (rUpper.includes('SANGAT RAWAN') || rUpper.includes('KRITIS')) normalizedRisk = 'Sangat Rawan';
        else if (rUpper.includes('SEDANG')) normalizedRisk = 'Sedang';
        else if (rUpper.includes('N-1') || rUpper.includes('N1') || rUpper.includes('RAWAN')) normalizedRisk = 'N-1';

        const isIBT =
          (assetTypeVal && assetTypeVal.toLowerCase().includes('ibt')) ||
          giVal.toLowerCase().includes('ibt') ||
          giVal.toLowerCase().includes('trafo') ||
          Boolean(ibtNumVal) ||
          voltageVal.includes('/');
        const resolvedIbtNum =
          ibtNumVal ||
          giVal.match(/ibt\s*([0-9&]+)/i)?.[1] ||
          (isIBT ? '1' : undefined);

        const nodeId = `GI_${cleanKey(giVal)}`;
        const existing = parsedNodes.find((n) => n.id === nodeId);
        if (existing) {
          if (voltageVal) existing.voltage = voltageVal;
          if (tierVal !== undefined) existing.tier = tierVal;
          if (resolvedIbtNum) existing.ibtNumber = resolvedIbtNum;
          if (codeVal) existing.code = codeVal;
          if (riskNumVal) existing.riskNumber = riskNumVal;
          if (isIBT) existing.assetType = 'ibt';
          else if (assetTypeVal) existing.assetType = assetTypeVal as any;
          if (uitVal) existing.uit = uitVal;
          if (conditionVal) existing.condition = conditionVal;
          if (impactVal) existing.impact = impactVal;
          if (mitigationVal) existing.mitigation = mitigationVal;
          if (solutionVal) existing.solution = solutionVal;
          if (normalizedRisk !== 'Normal') existing.riskStatus = normalizedRisk;
        } else {
          parsedNodes.push({
            id: nodeId,
            name: giVal,
            code: codeVal,
            tier: tierVal !== undefined ? tierVal : isIBT ? 1 : undefined,
            ibtNumber: resolvedIbtNum,
            assetType: isIBT ? 'ibt' : (assetTypeVal as any),
            voltage: voltageVal,
            region: corridorVal || currentTargetName,
            riskStatus: normalizedRisk,
            riskNumber: riskNumVal,
            subsystem: currentTargetName,
            uit: uitVal,
            condition: conditionVal,
            impact: impactVal,
            mitigation: mitigationVal,
            solution: solutionVal
          });
        }
      });
    }

    setGiList(parsedNodes);
    setLineList(parsedLines);

    if (parsedNodes.length > 0) {
      setUploadStatusMsg({
        type: 'success',
        text: `Berhasil mengekstrak ${parsedNodes.length} Gardu Induk dan ${parsedLines.length} Jalur Transmisi.`
      });
    } else {
      setUploadStatusMsg({
        type: 'error',
        text: 'Belum ada Gardu Induk terdeteksi. Silakan pilih kolom Nama GI pada panel Pemetaan Kolom di bawah.'
      });
    }
  };

  // SMART UNIVERSAL EXCEL PARSER (FILE LOAD ENTRY)
  const processExcelBuffer = (buffer: ArrayBuffer, name: string) => {
    try {
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setUploadStatusMsg({ type: 'error', text: 'File Excel kosong atau tidak memiliki lembar kerja (sheet).' });
        return;
      }

      setRawWorkbook(workbook);
      setDetectedSheets(workbook.SheetNames);

      // Choose best initial sheet (prefer sheet with gi, gardu, line, sheet1)
      let initialSheet = workbook.SheetNames[0];
      for (const s of workbook.SheetNames) {
        const sk = cleanKey(s);
        if (sk.includes('gardu') || sk.includes('line') || sk.includes('penghantar') || sk.includes('transmisi') || sk.includes('sheet1')) {
          initialSheet = s;
          break;
        }
      }

      setActiveSheetName(initialSheet);
      setFileName(name);

      const worksheet = workbook.Sheets[initialSheet];
      const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      let headerRowIndex = 0;
      for (let r = 0; r < Math.min(15, rawGrid.length); r++) {
        const row = rawGrid[r];
        if (Array.isArray(row) && row.length > 0) {
          const hasKey = row.some((cell) => {
            const k = cleanKey(cell);
            return (
              k.includes('gi') ||
              k.includes('gardu') ||
              k.includes('nama') ||
              k.includes('penghantar') ||
              k.includes('line') ||
              k.includes('dari') ||
              k.includes('ke') ||
              k.includes('functloc') ||
              k.includes('bay') ||
              k.includes('trafo') ||
              k.includes('tegangan') ||
              k.includes('beban')
            );
          });
          if (hasKey) {
            headerRowIndex = r;
            break;
          }
        }
      }

      const headers: string[] = (rawGrid[headerRowIndex] || []).map((h) => String(h || '').trim()).filter(Boolean);
      const initialMapping = autoDetectMapping(headers);
      setColMapping(initialMapping);

      executeParsingWithMapping(worksheet, initialMapping, currentTargetObj.name);
    } catch (err: any) {
      console.error(err);
      setUploadStatusMsg({
        type: 'error',
        text: `Gagal membaca file Excel: ${err.message || 'Format tidak didukung'}`
      });
    }
  };

  // Handler when user switches active sheet
  const handleSwitchSheet = (sheetName: string) => {
    if (!rawWorkbook) return;
    setActiveSheetName(sheetName);
    const worksheet = rawWorkbook.Sheets[sheetName];
    if (!worksheet) return;

    const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    let headerRowIndex = 0;
    for (let r = 0; r < Math.min(15, rawGrid.length); r++) {
      const row = rawGrid[r];
      if (Array.isArray(row) && row.length > 0) {
        const hasKey = row.some((cell) => {
          const k = cleanKey(cell);
          return (
            k.includes('gi') ||
            k.includes('gardu') ||
            k.includes('nama') ||
            k.includes('penghantar') ||
            k.includes('line') ||
            k.includes('dari') ||
            k.includes('ke') ||
            k.includes('functloc') ||
            k.includes('bay') ||
            k.includes('trafo') ||
            k.includes('tegangan') ||
            k.includes('beban')
          );
        });
        if (hasKey) {
          headerRowIndex = r;
          break;
        }
      }
    }

    const headers: string[] = (rawGrid[headerRowIndex] || []).map((h) => String(h || '').trim()).filter(Boolean);
    const newMapping = autoDetectMapping(headers);
    setColMapping(newMapping);
    executeParsingWithMapping(worksheet, newMapping, currentTargetObj.name);
  };

  // Handler when user customizes column mapping dropdowns
  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const updatedMapping = { ...colMapping, [field]: value };
    setColMapping(updatedMapping);
    if (rawWorkbook && activeSheetName) {
      const worksheet = rawWorkbook.Sheets[activeSheetName];
      if (worksheet) {
        executeParsingWithMapping(worksheet, updatedMapping, currentTargetObj.name);
      }
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        processExcelBuffer(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input so same file can be reselected
  };

  // Handle drag and drop files
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadStatusMsg({ type: 'error', text: 'Mohon unggah file dengan format .xlsx, .xls, atau .csv' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        processExcelBuffer(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download Sample Excel Template (Mendukung Gambar 1 & Gambar 2: Konsep Tier Mulai 0, IBT, Spesifikasi Line, Tab Kerawanan)
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Jalur Transmisi (Penghantar) - Sesuai Gambar 1 & Tab Kerawanan Gambar 2
    const wsEdgesData = [
      {
        'No': 1,
        'No Kerawanan': 11,
        'Nama Penghantar': 'SUTET Tambun - Cawang',
        'Dari GI': 'TMBUN',
        'Ke GI': 'CWANG',
        'Tegangan': '500 kV',
        'Panjang Saluran (km)': 21.4,
        'Jumlah Sirkit': 2,
        'Status Operasi': 'Beroperasi',
        'Tingkat Kerawanan': 'Sedang',
        'Pembebanan Sirkit 1 (%)': 58,
        'Pembebanan Sirkit 2 (%)': 52,
        'Koridor / Wilayah': 'Jawa Barat - DKI Jakarta',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': 'SUTET Gandul-Durkos-Kembangan memasok 2 IBT Durkosambi dan 2 IBT Muarakarang secara radial, dengan pembebanan SUTET Gandul-Durkos mencapai 55%, sedangkan SUTET Kembangan-Durkos mencapai 43%.',
        'Dampak': '1. Jika terjadi kondisi N-2 SUTET Gandul-Durkos-Kembangan, terjadi pembebanan Konsumen dikarenakan padam IBT Muarakarang dan Durikosambi sebesar 1.700 MW.\n2. Potensi gangguan kestabilan sistem kelistrikan DKI Jakarta.',
        'Mitigasi': '1. Terpasang Defense Scheme N-2 pada SUTET Gandul-Durkos-Kembangan.\n2. Uji periodik teleproteksi dan transfer trip antar GI.',
        'Usulan / Solusi': 'Jangka Pendek :\n1. Percepatan pembangunan SUTET Muaratawar - Priok. RUPTL 2025-2034, COD Tahun 2025.'
      },
      {
        'No': 2,
        'No Kerawanan': 1,
        'Nama Penghantar': 'SUTET Suralaya Baru - SRLYA 1',
        'Dari GI': 'Suralaya Baru',
        'Ke GI': 'SRLYA',
        'Tegangan': '500 kV',
        'Panjang Saluran (km)': 12.5,
        'Jumlah Sirkit': 2,
        'Status Operasi': 'Beroperasi',
        'Tingkat Kerawanan': 'Sangat Rawan',
        'Pembebanan Sirkit 1 (%)': 86,
        'Pembebanan Sirkit 2 (%)': 82,
        'Koridor / Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': 'Pembebanan sirkit evakuasi PLTU Suralaya Baru mendekati batas termal n-1 saat beban puncak.',
        'Dampak': '1. Pembatasan evakuasi pembangkit PLTU Suralaya.\n2. Risiko pelepasan beban otomatis OLS.',
        'Mitigasi': '1. Optimalisasi pola operasi PLTU Suralaya.\n2. Dispatching beban antar GI 500 kV Banten.',
        'Usulan / Solusi': 'Jangka Pendek :\nRekonfigurasi bay penghantar dan pemeliharaan rutin konduktor.'
      },
      {
        'No': 3,
        'No Kerawanan': '',
        'Nama Penghantar': 'SUTT SRLYA - PENDO 1',
        'Dari GI': 'SRLYA',
        'Ke GI': 'PENDO',
        'Tegangan': '150 kV',
        'Panjang Saluran (km)': 18.2,
        'Jumlah Sirkit': 2,
        'Status Operasi': 'Beroperasi',
        'Tingkat Kerawanan': 'Normal',
        'Pembebanan Sirkit 1 (%)': 55,
        'Pembebanan Sirkit 2 (%)': 51,
        'Koridor / Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 4,
        'No Kerawanan': 3,
        'Nama Penghantar': 'SUTT PENI - MTSUI',
        'Dari GI': 'PENI',
        'Ke GI': 'MTSUI',
        'Tegangan': '150 kV',
        'Panjang Saluran (km)': 14.8,
        'Jumlah Sirkit': 2,
        'Status Operasi': 'Beroperasi',
        'Tingkat Kerawanan': 'Sedang',
        'Pembebanan Sirkit 1 (%)': 74,
        'Pembebanan Sirkit 2 (%)': 69,
        'Koridor / Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': 'Penyaluran pasokan industri KTT berfluktuasi tinggi pada jam sibuk operasi.',
        'Dampak': '1. Penurunan tegangan busbar lokal jika terjadi gangguan kontinjensi.',
        'Mitigasi': '1. Pengaturan tap trafo otomatis OLTC dan kompensasi kapasitor bank.',
        'Usulan / Solusi': 'Jangka Pendek :\nPemasangan PMT kopel cadangan dan pemantauan realtime SCADA.'
      }
    ];
    const wsEdges = XLSX.utils.json_to_sheet(wsEdgesData);
    XLSX.utils.book_append_sheet(wb, wsEdges, 'Jalur_Transmisi');

    // Sheet 2: Gardu Induk & Aset - Sesuai Konsep Tier (Mulai 0) & IBT & Tab Kerawanan (Gambar 1 & Gambar 2)
    const wsNodesData = [
      {
        'No': 1,
        'Nama Asset / GI': 'Suralaya Baru',
        'Kode Singkatan': 'SRL-BARU',
        'Tipe Asset': 'Pembangkit',
        'Tier (Mulai 0)': 0,
        'Tegangan': '500 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 2,
        'Nama Asset / GI': 'Suralaya',
        'Kode Singkatan': 'SURLYA',
        'Tipe Asset': 'Pembangkit',
        'Tier (Mulai 0)': 0,
        'Tegangan': '500 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 3,
        'Nama Asset / GI': 'Cilegon Baru',
        'Kode Singkatan': 'CLG-BARU',
        'Tipe Asset': 'Busbar GITET',
        'Tier (Mulai 0)': 0,
        'Tegangan': '500 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 4,
        'Nama Asset / GI': 'IBT 2 Suralaya Baru',
        'Kode Singkatan': 'IBT 2 SRL-BARU',
        'Tipe Asset': 'IBT 3-Winding',
        'Tier (Mulai 0)': 1,
        'Tegangan': '500/150 kV',
        'No IBT': '2',
        'Status Kerawanan': 'N-1-2',
        'No Kerawanan': '1&2',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': 'Pembebanan IBT–1,2 Suralaya tidak memenuhi kriteria N–1 saat PLTU Suralaya unit–3 tidak beroperasi dan IBT–4 Cilegon masuk sub sistem Cilegon.',
        'Dampak': '1. Pemeliharaan IBT sulit dilakukan.\n2. Pertumbuhan beban menjadi terhambat.\n3. Terjadi pemadaman apabila trip salah satu IBT di Suralaya.',
        'Mitigasi': '1. Sudah terpasang DS OLS IBT 1,2 Suralaya dengan target total sebesar 102 MW (Berdasarkan buku DS Tahun 2025).\n2. Rencana penambahan target DS OLS SS Suralaya 1,2 dengan total target sebesar 137 MW (Berdasarkan buku DS Tahun 2025).\n3. Pemeliharaan IBT saat beban rendah dan pada saat PLTU Suralaya Unit–3 beroperasi.',
        'Usulan / Solusi': 'Jangka Pendek :\nUprating IBT–1 & 2 Suralaya dari 250 MVA menjadi 500 MVA. Berdasarkan RUPTL 2025 – 2034, COD di Tahun 2025.'
      },
      {
        'No': 5,
        'Nama Asset / GI': 'IBT 1 Suralaya',
        'Kode Singkatan': 'IBT 1 SURLYA',
        'Tipe Asset': 'IBT 3-Winding',
        'Tier (Mulai 0)': 1,
        'Tegangan': '500/150 kV',
        'No IBT': '1',
        'Status Kerawanan': 'N-1-2',
        'No Kerawanan': '1&2',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': 'Pembebanan IBT–1,2 Suralaya tidak memenuhi kriteria N–1 saat PLTU Suralaya unit–3 tidak beroperasi dan IBT–4 Cilegon masuk sub sistem Cilegon.',
        'Dampak': '1. Pemeliharaan IBT sulit dilakukan.\n2. Pertumbuhan beban menjadi terhambat.\n3. Terjadi pemadaman apabila trip salah satu IBT di Suralaya.',
        'Mitigasi': '1. Sudah terpasang DS OLS IBT 1,2 Suralaya dengan target total sebesar 102 MW (Berdasarkan buku DS Tahun 2025).\n2. Rencana penambahan target DS OLS SS Suralaya 1,2 dengan total target sebesar 137 MW (Berdasarkan buku DS Tahun 2025).\n3. Pemeliharaan IBT saat beban rendah dan pada saat PLTU Suralaya Unit–3 beroperasi.',
        'Usulan / Solusi': 'Jangka Pendek :\nUprating IBT–1 & 2 Suralaya dari 250 MVA menjadi 500 MVA. Berdasarkan RUPTL 2025 – 2034, COD di Tahun 2025.'
      },
      {
        'No': 6,
        'Nama Asset / GI': 'SRLYA',
        'Kode Singkatan': 'SRLYA',
        'Tipe Asset': 'Busbar GI',
        'Tier (Mulai 0)': 1,
        'Tegangan': '150 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 7,
        'Nama Asset / GI': 'CLBRU',
        'Kode Singkatan': 'CLBRU',
        'Tipe Asset': 'Busbar GI',
        'Tier (Mulai 0)': 1,
        'Tegangan': '150 kV',
        'No IBT': '',
        'Status Kerawanan': 'N-2',
        'No Kerawanan': '2',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 8,
        'Nama Asset / GI': 'SLRDA',
        'Kode Singkatan': 'SLRDA',
        'Tipe Asset': 'Busbar GI',
        'Tier (Mulai 0)': 2,
        'Tegangan': '150 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 9,
        'Nama Asset / GI': 'PENDO',
        'Kode Singkatan': 'PENDO',
        'Tipe Asset': 'Busbar GI',
        'Tier (Mulai 0)': 2,
        'Tegangan': '150 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 10,
        'Nama Asset / GI': 'PENI',
        'Kode Singkatan': 'PENI',
        'Tipe Asset': 'Busbar GI',
        'Tier (Mulai 0)': 2,
        'Tegangan': '150 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 11,
        'Nama Asset / GI': 'MCCI5',
        'Kode Singkatan': 'MCCI5',
        'Tipe Asset': 'Busbar GI',
        'Tier (Mulai 0)': 2,
        'Tegangan': '150 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 12,
        'Nama Asset / GI': 'CLGON',
        'Kode Singkatan': 'CLGON',
        'Tipe Asset': 'Busbar GI',
        'Tier (Mulai 0)': 2,
        'Tegangan': '150 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      },
      {
        'No': 13,
        'Nama Asset / GI': 'MTSUI',
        'Kode Singkatan': 'MTSUI',
        'Tipe Asset': 'Busbar GI',
        'Tier (Mulai 0)': 3,
        'Tegangan': '150 kV',
        'No IBT': '',
        'Status Kerawanan': 'Normal',
        'No Kerawanan': '',
        'Wilayah': 'Banten',
        'UIT': 'JBB',
        'Kondisi / Permasalahan': '',
        'Dampak': '',
        'Mitigasi': '',
        'Usulan / Solusi': ''
      }
    ];
    const wsNodes = XLSX.utils.json_to_sheet(wsNodesData);
    XLSX.utils.book_append_sheet(wb, wsNodes, 'Gardu_Induk_dan_Aset');

    // Sheet 3: Data Kerawanan Detail - Persis Tabel Gambar 1 dari Pengguna
    const wsRiskData = [
      {
        'No': 1,
        'UIT': 'JBB',
        'Kondisi / Permasalahan': 'Pembebanan IBT–1,2 Suralaya tidak memenuhi kriteria N–1 saat PLTU Suralaya unit–3 tidak beroperasi dan IBT–4 Cilegon masuk sub sistem Cilegon.',
        'Dampak': '1. Pemeliharaan IBT sulit dilakukan.\n2. Pertumbuhan beban menjadi terhambat.\n3. Terjadi pemadaman apabila trip salah satu IBT di Suralaya.',
        'Mitigasi': '1. Sudah terpasang DS OLS IBT 1,2 Suralaya dengan target total sebesar 102 MW (Berdasarkan buku DS Tahun 2025).\n2. Rencana penambahan target DS OLS SS Suralaya 1,2 dengan total target sebesar 137 MW (Berdasarkan buku DS Tahun 2025).\n3. Pemeliharaan IBT saat beban rendah dan pada saat PLTU Suralaya Unit–3 beroperasi.',
        'Usulan / Solusi': 'Jangka Pendek :\nUprating IBT–1 & 2 Suralaya dari 250 MVA menjadi 500 MVA. Berdasarkan RUPTL 2025 – 2034, COD di Tahun 2025.'
      },
      {
        'No': 2,
        'UIT': 'JBB',
        'Kondisi / Permasalahan': 'Daya Mampu Pasok dan pembebanan SUTET Gandul - Durkos - Kembangan memasok 2 IBT Durkosambi dan 2 IBT Muarakarang secara radial, dengan pembebanan SUTET Gandul-Durkos mencapai 55%, sedangkan SUTET Kembangan-Durkos mencapai 43%.',
        'Dampak': '1. Ketidakseimbangan pembebanan dan jika terjadi kondisi N-2 SUTET Gandul-Durkos-Kembangan, terjadi pembebanan Konsumen dikarenakan padam IBT Muarakarang dan Durikosambi sebesar 1.700 MW.\n2. Potensi gangguan kestabilan sistem kelistrikan DKI Jakarta.',
        'Mitigasi': '1. Terpasang Defense Scheme N-2 pada SUTET Gandul-Durkos-Kembangan.\n2. Uji periodik teleproteksi dan transfer trip antar GI.',
        'Usulan / Solusi': 'Jangka Pendek :\n1. Percepatan pembangunan SUTET Muaratawar - Priok. RUPTL 2025-2034, COD Tahun 2025. COD timeline.'
      },
      {
        'No': 3,
        'UIT': 'JBB',
        'Kondisi / Permasalahan': 'SUTET Tambun - Cawang memasok beban sentral DKI Jakarta dengan pembebanan sirkit 1 mencapai 58% dan sirkit 2 mencapai 52%. Memerlukan kontinuitas sistem interkoneksi.',
        'Dampak': '1. Jika terjadi gangguan kriteria N-1 pada salah satu sirkit, beban sirkit lainnya akan melonjak mendekati kapasitas termal konduktor.\n2. Berpotensi menurunkan keandalan subsistem Cawang.',
        'Mitigasi': '1. Terpasang Defense Scheme OLS pada koridor Tambun - Cawang.\n2. Uji periodik teleproteksi diferensial dan relai jarak digital.\n3. Monitoring realtime dispatching beban UP2B Jawa Barat.',
        'Usulan / Solusi': 'Jangka Pendek :\nUprating kapasitas konduktor dan rekonfigurasi sistem proteksi bay penghantar GI Cawang.'
      }
    ];
    const wsRisk = XLSX.utils.json_to_sheet(wsRiskData);
    XLSX.utils.book_append_sheet(wb, wsRisk, 'Data_Kerawanan_Detail');

    XLSX.writeFile(wb, 'template_sld_subsistem_pln.xlsx');
  };

  // Image Upload Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Image Click Handler (Place Hotspot)
  const handleImageCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (imageToolMode !== 'add-point' || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newSpotName = prompt('Masukkan Nama Gardu Induk / Simpul SLD:', `GI Titik Baru #${hotspots.length + 1}`);
    if (!newSpotName) return;

    const newSpot: ImageHotspot = {
      id: `spot-${Date.now()}`,
      name: newSpotName,
      voltage: selectedTargetId === 'sld-500kv' ? '500 kV' : '150 kV',
      riskStatus: newPointStatus,
      xPercent: Math.round(x * 10) / 10,
      yPercent: Math.round(y * 10) / 10,
      description: 'Simpul interaktif baru ditambahkan pada kanvas blueprint'
    };

    setHotspots((prev) => [...prev, newSpot]);
    setSelectedHotspot(newSpot);
  };

  const removeHotspot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHotspots((prev) => prev.filter((s) => s.id !== id));
    if (selectedHotspot?.id === id) setSelectedHotspot(null);
  };

  // SAVE & BIND TO TARGET SUBSYSTEM / SYSTEM!
  const handleSaveToTarget = () => {
    const targetObj = defaultTargetOptions.find((t) => t.id === selectedTargetId) || defaultTargetOptions[1];

    if (activeTab === 'excel') {
      if (giList.length === 0) {
        alert('Gagal menyimpan: Belum ada data Gardu Induk yang terdeteksi dari file Excel. Silakan pilih kolom Nama GI yang sesuai pada panel Pemetaan Kolom.');
        return;
      }
      const config: CustomSLDConfig = {
        targetId: selectedTargetId,
        targetName: targetObj.name,
        type: 'excel',
        updatedAt: new Date().toLocaleString('id-ID'),
        excelData: {
          giList,
          lineList
        }
      };
      saveCustomSLD(config);
    } else {
      const config: CustomSLDConfig = {
        targetId: selectedTargetId,
        targetName: targetObj.name,
        type: 'image',
        updatedAt: new Date().toLocaleString('id-ID'),
        imageData: {
          imageUrl: uploadedImageUrl || '',
          imageFileName: imageFileName || 'blueprint_skema_sld.png',
          hotspots
        }
      };
      saveCustomSLD(config);
    }

    setSavedSuccessModal({
      isOpen: true,
      targetName: targetObj.name,
      targetId: selectedTargetId,
      type: activeTab
    });
  };

  // Navigate to Target SLD View directly
  const handleOpenTargetSLD = (targetId: string) => {
    setSavedSuccessModal(null);
    if (targetId === 'sld-500kv') {
      onNavigate('sld-500kv');
    } else {
      if (onSelectSubsystem) {
        onSelectSubsystem(targetId);
      }
      onNavigate('subsystem-sld');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f4f7fa] overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs z-20">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mb-0.5">
            <span
              onClick={() => onNavigate('national')}
              className="hover:text-[#0046ad] cursor-pointer"
            >
              Beranda
            </span>
            <span>/</span>
            <span
              onClick={() => onNavigate('sld-500kv')}
              className="hover:text-[#0046ad] cursor-pointer"
            >
              SLD Jaringan
            </span>
            <span>/</span>
            <span className="text-[#0046ad] font-bold">Upload & Binding SLD</span>
          </div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#0046ad]" />
            <span>Upload & Konfigurasi SLD Interaktif</span>
          </h1>
        </div>

        {/* Tab Selector: Mode Excel vs Mode Gambar */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'excel'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1. Import Data Excel (Auto-Graph)</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'image'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Unggah Gambar / Blueprint SLD</span>
          </button>
        </div>
      </div>

      {/* Target Destination Bar */}
      <div className="bg-[#eff6ff]/80 border-b border-[#bfdbfe] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-[#0046ad]">
            <Target className="w-4 h-4 text-[#0046ad]" />
            <span>Pilih Target Sistem / Subsistem Tujuan:</span>
          </div>
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="bg-white border border-[#93c5fd] font-bold text-slate-800 rounded-lg px-3 py-1.5 text-xs shadow-2xs focus:ring-2 focus:ring-[#0046ad] focus:outline-none cursor-pointer"
          >
            {defaultTargetOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name} ({opt.parent})
              </option>
            ))}
          </select>
        </div>

        {/* Big Apply / Save Button */}
        <button
          onClick={handleSaveToTarget}
          className="bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Simpan & Terapkan ke {currentTargetObj.name}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* MODE 1: EXCEL AUTO-GRAPH GENERATOR                       */}
        {/* ========================================================= */}
        {activeTab === 'excel' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Control & Data Sidebar */}
            <div className="w-full md:w-80 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto z-10 shadow-xs">
              <div className="space-y-4">
                {/* Upload Box with Drag & Drop */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Upload File Excel / CSV:
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all group ${
                      isDragging
                        ? 'border-[#0046ad] bg-[#dbeafe]'
                        : 'border-[#0046ad]/40 hover:border-[#0046ad] bg-[#eff6ff]/40 hover:bg-[#eff6ff]'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-[#0046ad] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-800">
                      Klik atau Drag & Drop File Excel
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      Format: .xlsx, .xls, atau .csv
                    </div>
                    {fileName && (
                      <div className="mt-2.5 px-2.5 py-1 bg-white border border-[#bfdbfe] rounded-lg text-[11px] font-mono text-[#0046ad] font-bold truncate">
                        📄 {fileName}
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>

                {/* Upload Status / Diagnostic Alert */}
                {uploadStatusMsg && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      uploadStatusMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : uploadStatusMsg.type === 'error'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {uploadStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="leading-tight text-[11px]">{uploadStatusMsg.text}</div>
                  </div>
                )}

                {/* Sheet Selector (if file has multiple sheets) */}
                {detectedSheets.length > 1 && (
                  <div className="bg-[#eff6ff] p-3 rounded-xl border border-[#bfdbfe] space-y-1.5">
                    <label className="text-xs font-bold text-[#0046ad] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Lembar Kerja (Sheet):</span>
                    </label>
                    <select
                      value={activeSheetName}
                      onChange={(e) => handleSwitchSheet(e.target.value)}
                      className="w-full bg-white border border-[#93c5fd] font-bold text-slate-800 text-xs rounded-lg px-2.5 py-1.5 shadow-2xs focus:ring-2 focus:ring-[#0046ad] cursor-pointer"
                    >
                      {detectedSheets.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Column Mapping Selector (Auto & Manual) */}
                {rawHeaders.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
                    <button
                      onClick={() => setShowMappingPanel(!showMappingPanel)}
                      className="w-full bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-[#0046ad]">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Pemetaan Kolom Excel ({rawHeaders.length} Kolom)</span>
                      </span>
                      {showMappingPanel ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {showMappingPanel && (
                      <div className="p-3 space-y-2.5 text-xs bg-white">
                        <div className="text-[10px] text-slate-500 leading-tight">
                          Sistem otomatis mengenali kolom berikut. Ubah jika kolom tabel Anda berbeda:
                        </div>

                        {/* GI Node Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Nama GI / Simpul (Wajib):
                          </label>
                          <select
                            value={colMapping.gi}
                            onChange={(e) => handleMappingChange('gi', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Pilih Kolom Nama GI] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Dari GI Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Dari GI (Jalur Transmisi):
                          </label>
                          <select
                            value={colMapping.from}
                            onChange={(e) => handleMappingChange('from', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Tidak ada / Auto] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Ke GI Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Ke GI (Jalur Transmisi):
                          </label>
                          <select
                            value={colMapping.to}
                            onChange={(e) => handleMappingChange('to', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Tidak ada / Auto] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Line Name Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Nama Penghantar (Opsional):
                          </label>
                          <select
                            value={colMapping.lineName}
                            onChange={(e) => handleMappingChange('lineName', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Auto: Dari - Ke] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Tegangan Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Tegangan (kV):
                          </label>
                          <select
                            value={colMapping.voltage}
                            onChange={(e) => handleMappingChange('voltage', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Auto: 150 kV / 500 kV] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Status Kerawanan Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Status Kerawanan / Tingkat Risiko:
                          </label>
                          <select
                            value={colMapping.risk}
                            onChange={(e) => handleMappingChange('risk', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Auto: Normal / N-1 / N-2] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* UIT Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom UIT (Unit Induk Transmisi):
                          </label>
                          <select
                            value={colMapping.uit}
                            onChange={(e) => handleMappingChange('uit', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Opsional / Auto: JBB] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Kondisi / Permasalahan Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Kondisi / Permasalahan:
                          </label>
                          <select
                            value={colMapping.condition}
                            onChange={(e) => handleMappingChange('condition', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Auto: Kondisi / Permasalahan] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Dampak Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Dampak Kerawanan:
                          </label>
                          <select
                            value={colMapping.impact}
                            onChange={(e) => handleMappingChange('impact', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Auto: Dampak] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Mitigasi Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Mitigasi Kerawanan:
                          </label>
                          <select
                            value={colMapping.mitigation}
                            onChange={(e) => handleMappingChange('mitigation', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Auto: Mitigasi] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Usulan / Solusi Column */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Kolom Usulan / Solusi:
                          </label>
                          <select
                            value={colMapping.solution}
                            onChange={(e) => handleMappingChange('solution', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0046ad]"
                          >
                            <option value="">-- [Auto: Usulan / Solusi] --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw Preview Rows */}
                {previewRows.length > 0 && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] space-y-1 overflow-hidden">
                    <div className="font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3 text-[#0046ad]" />
                        <span>Pratinjau Data Terbaca ({previewRows.length} baris):</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-28 border border-slate-200 rounded bg-white">
                      <table className="w-full text-left font-mono text-[9px]">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            {rawHeaders.slice(0, 4).map((h, i) => (
                              <th key={i} className="p-1 border-b border-slate-200 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {previewRows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              {rawHeaders.slice(0, 4).map((h, cIdx) => (
                                <td key={cIdx} className="p-1 whitespace-nowrap text-slate-700 truncate max-w-[90px]">
                                  {String(row[cIdx] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Download Template Action */}
                <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-[#0046ad]" />
                    <span>Template Standar Excel PLN</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Unduh format Excel resmi berisi Gardu Induk & Penghantar agar dikenali otomatis.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template (.xlsx)</span>
                  </button>
                </div>

                {/* Filter Kerawanan Graph */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Filter Kerawanan Graf:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Semua', 'Normal', 'N-1', 'N-2', 'N-1-2'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterRisk(st)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                          filterRisk === st
                            ? 'bg-[#0046ad] text-white border-[#0046ad] shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Overview Counts */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gardu Induk (Nodes):</span>
                    <span className="font-bold font-mono text-[#0046ad]">{giList.length} GI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jalur Transmisi (Edges):</span>
                    <span className="font-bold font-mono text-[#16a34a]">{lineList.length} Line</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jalur Rawan N-1/N-2:</span>
                    <span className="font-bold font-mono text-[#dc2626]">
                      {lineList.filter((l) => l.riskStatus !== 'Normal').length} Jalur
                    </span>
                  </div>
                </div>
              </div>

              {/* Action: Use Demo / Reset */}
              <div className="space-y-2 mt-4">
                <button
                  onClick={() => {
                    setGiList(initialSampleGINodes);
                    setLineList(initialSampleLines);
                    setFileName('sample_sld_jamali_500kv.xlsx');
                    setUploadStatusMsg({ type: 'info', text: 'Memuat kembali data contoh 13 GI & 12 Jalur Transmisi.' });
                  }}
                  className="w-full py-2 px-3 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#0046ad] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-[#bfdbfe]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset / Muat Data Contoh</span>
                </button>
              </div>
            </div>

            {/* Right: Interactive Canvas OR Data Preview Table */}
            <div className="flex-1 relative flex flex-col h-full bg-[#f8fafc] overflow-hidden">
              <div className="p-2.5 bg-white border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600 shrink-0">
                {/* View Switcher: Graph vs Raw Table */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setExcelViewMode('graph')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold text-xs transition-all ${
                      excelViewMode === 'graph'
                        ? 'bg-white text-[#0046ad] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Diagram Graf Interaktif</span>
                  </button>
                  <button
                    onClick={() => setExcelViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold text-xs transition-all ${
                      excelViewMode === 'table'
                        ? 'bg-white text-[#0046ad] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Tabel Data Terbaca ({giList.length} GI • {lineList.length} Line)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-[#0046ad] font-bold">Target: {currentTargetObj.name}</span>
                </div>
              </div>

              {/* SUB-VIEW 1: GRAPH VIEW */}
              {excelViewMode === 'graph' && (
                <div className="flex-1 relative w-full h-full">
                  <ReactFlowProvider>
                    <ReactFlow
                      nodes={flowNodes}
                      edges={flowEdges}
                      nodeTypes={uploadNodeTypes}
                      fitView
                      attributionPosition="bottom-left"
                      className="h-full w-full"
                    >
                      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
                      <Controls />
                      <MiniMap
                        nodeColor={(n) => {
                          return n.data?.label ? '#0046ad' : '#94a3b8';
                        }}
                        className="rounded-xl border border-slate-200 shadow-md bg-white/90"
                      />
                    </ReactFlow>
                  </ReactFlowProvider>
                </div>
              )}

              {/* SUB-VIEW 2: RAW PARSED TABLE PREVIEW */}
              {excelViewMode === 'table' && (
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {/* Table 1: Gardu Induk */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#0046ad]" />
                        Daftar Gardu Induk / Simpul Terdeteksi ({giList.length})
                      </span>
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 text-slate-600 font-mono text-[11px]">
                        <tr>
                          <th className="p-2.5 border-b border-slate-200">ID</th>
                          <th className="p-2.5 border-b border-slate-200">Nama Gardu Induk</th>
                          <th className="p-2.5 border-b border-slate-200">Tegangan</th>
                          <th className="p-2.5 border-b border-slate-200">Wilayah / Subsistem</th>
                          <th className="p-2.5 border-b border-slate-200">Status Kerawanan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {giList.map((gi, idx) => (
                          <tr key={gi.id || idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono text-slate-500">{gi.id}</td>
                            <td className="p-2.5 font-bold text-slate-800">{gi.name}</td>
                            <td className="p-2.5 font-mono text-[#0046ad]">{gi.voltage}</td>
                            <td className="p-2.5 text-slate-600">{gi.region || gi.subsystem || '-'}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  gi.riskStatus !== 'Normal' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-emerald-50 text-emerald-600'
                                }`}
                              >
                                {gi.riskStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table 2: Jalur Transmisi (Penghantar) */}
                  {lineList.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <Network className="w-3.5 h-3.5 text-[#16a34a]" />
                          Daftar Jalur Penghantar Terdeteksi ({lineList.length})
                        </span>
                      </div>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100/80 text-slate-600 font-mono text-[11px]">
                          <tr>
                            <th className="p-2.5 border-b border-slate-200">ID</th>
                            <th className="p-2.5 border-b border-slate-200">Nama Penghantar</th>
                            <th className="p-2.5 border-b border-slate-200">Dari GI</th>
                            <th className="p-2.5 border-b border-slate-200">Ke GI</th>
                            <th className="p-2.5 border-b border-slate-200">Pembebanan</th>
                            <th className="p-2.5 border-b border-slate-200">Status Kerawanan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lineList.map((line, idx) => (
                            <tr key={line.id || idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono text-slate-500">{line.id}</td>
                              <td className="p-2.5 font-bold text-slate-800">{line.lineName}</td>
                              <td className="p-2.5 font-mono text-slate-700">{line.sourceId}</td>
                              <td className="p-2.5 font-mono text-slate-700">{line.targetId}</td>
                              <td className="p-2.5 font-mono font-bold text-[#0046ad]">{line.loadingPct}%</td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    line.riskStatus !== 'Normal' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-emerald-50 text-emerald-600'
                                  }`}
                                >
                                  {line.riskStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Element Detail Drawer */}
              {selectedElement && (
                <div className="absolute bottom-4 right-4 z-30 w-80 bg-white/95 backdrop-blur-md border border-slate-300 rounded-2xl p-4 shadow-xl text-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-[#0046ad]" />
                      Detail Simpul Terpilih
                    </span>
                    <button
                      onClick={() => setSelectedElement(null)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama:</span>
                      <span className="font-bold text-slate-800">{selectedElement.data.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tegangan:</span>
                      <span className="font-bold text-[#0046ad]">{selectedElement.data.voltage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wilayah:</span>
                      <span className="text-slate-700">{selectedElement.data.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status Kerawanan:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          selectedElement.data.riskStatus === 'Normal'
                            ? 'bg-[#16a34a]/20 text-[#16a34a]'
                            : 'bg-[#dc2626] text-white'
                        }`}
                      >
                        {selectedElement.data.riskStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: UNGGAH GAMBAR & SMART BLUEPRINT CANVAS           */}
        {/* ========================================================= */}
        {activeTab === 'image' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Blueprint Controls */}
            <div className="w-full md:w-80 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto z-10 shadow-xs">
              <div className="space-y-4">
                {/* Upload Image Box */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Unggah Gambar Skema SLD Asli:
                  </label>
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-[#0046ad]/40 hover:border-[#0046ad] bg-[#eff6ff]/40 hover:bg-[#eff6ff] rounded-xl p-4 text-center cursor-pointer transition-all group"
                  >
                    <ImageIcon className="w-8 h-8 text-[#0046ad] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-800">
                      Klik untuk Unggah Gambar SLD
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      PNG, JPG, WebP, SVG (Blueprint CAD)
                    </div>
                    {imageFileName && (
                      <div className="mt-2.5 px-2.5 py-1 bg-white border border-[#bfdbfe] rounded-lg text-[11px] font-mono text-[#0046ad] font-bold truncate">
                        🖼️ {imageFileName}
                      </div>
                    )}
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Tool Selection: Pinning / Pan */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Mode Interaktivitas Kanvas:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setImageToolMode('add-point')}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                        imageToolMode === 'add-point'
                          ? 'bg-[#0046ad] text-white border-[#0046ad] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>+ Pin Titik GI</span>
                    </button>
                    <button
                      onClick={() => setImageToolMode('pan')}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                        imageToolMode === 'pan'
                          ? 'bg-[#0046ad] text-white border-[#0046ad] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span>Mode Navigasi</span>
                    </button>
                  </div>
                </div>

                {/* Status Color for Newly Placed Points */}
                {imageToolMode === 'add-point' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Status Kerawanan Titik Baru:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {(['Normal', 'N-1', 'N-2', 'N-1-2'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setNewPointStatus(st)}
                          className={`py-1 px-2 rounded-lg font-bold border transition-all text-[11px] ${
                            newPointStatus === st
                              ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-500 italic mt-1">
                      💡 Klik di atas gambar untuk menaruh titik hotspot GI.
                    </div>
                  </div>
                )}

                {/* Hotspots List */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Titik Simpul ({hotspots.length})
                    </span>
                    {hotspots.length > 0 && (
                      <button
                        onClick={() => setHotspots([])}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Hapus Semua
                      </button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {hotspots.map((spot) => (
                      <div
                        key={spot.id}
                        onClick={() => setSelectedHotspot(spot)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          selectedHotspot?.id === spot.id
                            ? 'bg-[#eff6ff] border-[#0046ad] text-[#0046ad] font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              spot.riskStatus === 'Normal' ? 'bg-[#16a34a]' : 'bg-[#dc2626]'
                            }`}
                          />
                          <span className="truncate">{spot.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                            {spot.riskStatus}
                          </span>
                          <button
                            onClick={(e) => removeHotspot(spot.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action: Save Interactive Blueprint */}
              <div className="space-y-2 mt-4">
                <button
                  onClick={handleSaveToTarget}
                  className="w-full py-2.5 px-3 bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan ke {currentTargetObj.name}</span>
                </button>
              </div>
            </div>

            {/* Right: Interactive Blueprint Canvas */}
            <div className="flex-1 relative flex flex-col h-full bg-[#e2e8f0] overflow-hidden">
              <div className="p-2.5 bg-white border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0046ad]" />
                  <span className="font-semibold text-slate-800">
                    Kanvas Skema SLD Asli + Interactive Overlay
                  </span>
                  {imageToolMode === 'add-point' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Mode Klik Aktif: Klik pada gambar untuk menaruh GI
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {hotspots.length} Titik Interaktif Terpasang
                </div>
              </div>

              {/* Blueprint Viewing Area */}
              <div className="flex-1 relative overflow-auto flex items-center justify-center p-6 select-none">
                <div
                  ref={imageContainerRef}
                  onClick={handleImageCanvasClick}
                  className={`relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl bg-white border border-slate-300 transition-all ${
                    imageToolMode === 'add-point' ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                  style={{ minWidth: '700px', minHeight: '440px' }}
                >
                  {uploadedImageUrl ? (
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded SLD"
                      className="w-full h-auto object-contain pointer-events-none block"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 900 500"
                      className="w-full h-auto bg-[#0b132b] block select-none pointer-events-none"
                    >
                      <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path
                            d="M 30 0 L 0 0 0 30"
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="0.8"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      <g stroke="#334155" strokeWidth="2.5" fill="none">
                        <line x1="250" y1="210" x2="470" y2="250" />
                        <line x1="470" y1="250" x2="410" y2="340" />
                        <line x1="410" y1="340" x2="585" y2="370" />
                        <line x1="470" y1="250" x2="700" y2="180" />
                        <line x1="700" y1="180" x2="800" y2="280" />
                      </g>

                      <rect x="230" y="200" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="450" y="240" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="390" y="330" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="565" y="360" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="680" y="170" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="780" y="270" width="40" height="8" rx="2" fill="#38bdf8" />

                      <text x="250" y="190" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                        BUSBAR 150 kV
                      </text>
                      <text x="470" y="230" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                        IBT 150/20 kV
                      </text>
                      <text x="585" y="400" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                        PENYULANG UTAMA
                      </text>

                      <text
                        x="450"
                        y="80"
                        fill="#38bdf8"
                        fontSize="14"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        [SKEMA BLUEPRINT SLD ASLI SISTEM TRANSMISI]
                      </text>
                      <text x="450" y="105" fill="#64748b" fontSize="11" textAnchor="middle">
                        Unggah gambar diagram SLD Anda melalui panel kiri atau klik di mana saja untuk menaruh titik interaktif.
                      </text>
                    </svg>
                  )}

                  {/* Interactive Hotspot Pins Overlay */}
                  {hotspots.map((spot) => {
                    const isRawan = spot.riskStatus !== 'Normal';
                    const isSelected = selectedHotspot?.id === spot.id;

                    return (
                      <div
                        key={spot.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHotspot(spot);
                        }}
                        style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                      >
                        {isRawan && (
                          <span className="absolute -inset-2 rounded-full bg-[#dc2626] opacity-75 animate-ping" />
                        )}

                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg transition-transform ${
                            isSelected ? 'scale-125 ring-4 ring-[#0046ad]' : 'hover:scale-115'
                          } ${
                            isRawan
                              ? 'bg-[#dc2626] text-white'
                              : 'bg-[#16a34a] text-white'
                          }`}
                        >
                          {isRawan ? '⚠️' : '⚡'}
                        </div>

                        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none group-hover:scale-105 transition-transform flex items-center gap-1.5">
                          <span>{spot.name}</span>
                          <span
                            className={`px-1 py-0.2 rounded text-[8px] font-mono ${
                              isRawan ? 'bg-[#dc2626]' : 'bg-[#16a34a]'
                            }`}
                          >
                            {spot.riskStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hotspot Detail Floating Card */}
              {selectedHotspot && (
                <div className="absolute bottom-6 right-6 z-30 w-84 bg-white/95 backdrop-blur-md border border-slate-300 rounded-2xl p-4 shadow-2xl text-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-[#dc2626]" />
                      Detail Simpul SLD
                    </span>
                    <button
                      onClick={() => setSelectedHotspot(null)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Simpul:</span>
                      <span className="font-bold text-slate-800">{selectedHotspot.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Posisi Kanvas:</span>
                      <span className="text-slate-600">
                        {selectedHotspot.xPercent}% , {selectedHotspot.yPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status Kerawanan:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          selectedHotspot.riskStatus === 'Normal'
                            ? 'bg-[#16a34a]/20 text-[#16a34a]'
                            : 'bg-[#dc2626] text-white'
                        }`}
                      >
                        {selectedHotspot.riskStatus}
                      </span>
                    </div>
                    {selectedHotspot.description && (
                      <div className="pt-2 text-[11px] text-slate-600 font-sans border-t border-slate-100">
                        {selectedHotspot.description}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SUCCESS CONFIRMATION MODAL WITH DIRECT NAVIGATION BUTTON */}
      {savedSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16a34a] flex items-center justify-center border border-emerald-200 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-800">
                SLD Berhasil Disimpan & Diterapkan!
              </h3>
              <p className="text-xs text-slate-500">
                Konfigurasi SLD ({savedSuccessModal.type === 'excel' ? 'Data Excel Graf' : 'Blueprint Skema Gambar'}) telah aktif ditautkan ke:
              </p>
              <div className="inline-block px-3 py-1 bg-[#eff6ff] text-[#0046ad] border border-[#bfdbfe] rounded-xl font-bold text-xs mt-1">
                ⚡ {savedSuccessModal.targetName}
              </div>
            </div>

            <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              Kini ketika Anda membuka menu SLD pada unit tersebut, diagram interaktif hasil konfigurasi Anda akan langsung dimuat secara otomatis.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSavedSuccessModal(null)}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Tetap di Halaman Ini
              </button>
              <button
                onClick={() => handleOpenTargetSLD(savedSuccessModal.targetId)}
                className="flex-1 py-2.5 px-3 bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span>Buka Menu SLD Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
