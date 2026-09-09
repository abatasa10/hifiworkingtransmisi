import React, { useState, useRef, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
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
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  UploadCloud,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Layers,
  MapPin,
  Trash2,
  Eye,
  Sliders,
  Maximize2,
  Zap,
  ArrowRight,
  ShieldAlert,
  Save,
  HelpCircle
} from 'lucide-react';
import { ActiveView } from '../layout/Header';

interface UploadSLDViewProps {
  onNavigate: (view: ActiveView) => void;
}

interface ParsedGINode {
  id: string;
  name: string;
  voltage: string; // '500 kV' | '150 kV'
  region: string; // 'DKI Jakarta & Banten' | 'Jawa Barat' | 'Jawa Tengah' | 'Jawa Timur' | 'Bali'
  riskStatus: 'Normal' | 'N-1' | 'N-2' | 'N-1-2';
  subsystem?: string;
  x?: number;
  y?: number;
}

interface ParsedTransmissionLine {
  id: string;
  sourceId: string;
  targetId: string;
  lineName: string;
  circuit: string; // 'Sirkit 1' | 'Sirkit 2'
  lengthKm: number;
  loadingPct: number;
  riskStatus: 'Normal' | 'N-1' | 'N-2' | 'N-1-2';
}

interface ImageHotspot {
  id: string;
  name: string;
  voltage: string;
  riskStatus: 'Normal' | 'N-1' | 'N-2' | 'N-1-2';
  xPercent: number; // 0 - 100%
  yPercent: number; // 0 - 100%
  description?: string;
}

interface ImageLineConnection {
  id: string;
  fromHotspotId: string;
  toHotspotId: string;
  name: string;
  riskStatus: 'Normal' | 'N-1' | 'N-2' | 'N-1-2';
}

// Sample initial data for immediate demo
const sampleGINodes: ParsedGINode[] = [
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
  { id: 'GI_PAITON', name: 'GITET Paiton', voltage: '500 kV', region: 'Jawa Timur', riskStatus: 'Normal', subsystem: 'Paiton' },
  { id: 'GI_KAPAL', name: 'GITET Kapal (Bali)', voltage: '150 kV', region: 'Bali', riskStatus: 'Normal', subsystem: 'Bali' }
];

const sampleLines: ParsedTransmissionLine[] = [
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

export const UploadSLDView: React.FC<UploadSLDViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'image'>('excel');

  // Excel mode states
  const [giList, setGiList] = useState<ParsedGINode[]>(sampleGINodes);
  const [lineList, setLineList] = useState<ParsedTransmissionLine[]>(sampleLines);
  const [fileName, setFileName] = useState<string>('sample_sld_jamali_500kv.xlsx');
  const [isGenerated, setIsGenerated] = useState<boolean>(true);
  const [filterRisk, setFilterRisk] = useState<string>('Semua');
  const [selectedElement, setSelectedElement] = useState<any | null>(null);

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Auto-layout calculation for React Flow
  const { flowNodes, flowEdges } = useMemo(() => {
    // Determine positions horizontally across West to East Java
    const regionOrder: Record<string, number> = {
      'DKI Jakarta & Banten': 0,
      'Jawa Barat': 1,
      'Jawa Tengah': 2,
      'Jawa Timur': 3,
      'Bali': 4
    };

    // Group nodes by region
    const groups: Record<string, ParsedGINode[]> = {};
    giList.forEach((gi) => {
      const reg = gi.region || 'Jawa Barat';
      if (!groups[reg]) groups[reg] = [];
      groups[reg].push(gi);
    });

    const calculatedNodes: Node[] = [];
    const xBase = 80;
    const colWidth = 280;

    Object.entries(groups).forEach(([region, nodesInRegion]) => {
      const colIdx = regionOrder[region] ?? 1;
      nodesInRegion.forEach((node, rowIdx) => {
        const x = xBase + colIdx * colWidth + (rowIdx % 2 === 1 ? 30 : -20);
        const y = 80 + rowIdx * 140;

        const isRawan = node.riskStatus !== 'Normal';
        const isMatched = filterRisk === 'Semua' || node.riskStatus === filterRisk;

        calculatedNodes.push({
          id: node.id,
          position: { x, y },
          data: {
            label: (
              <div
                onClick={() => setSelectedElement({ type: 'node', data: node })}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer shadow-md min-w-[190px] ${
                  node.voltage === '500 kV' ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-800'
                } ${
                  isRawan
                    ? 'border-[#dc2626] shadow-[#dc2626]/20'
                    : 'border-[#0046ad] shadow-slate-200'
                } ${!isMatched ? 'opacity-30' : 'opacity-100'}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        node.voltage === '500 kV' ? 'bg-[#38bdf8]' : 'bg-[#16a34a]'
                      }`}
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-300">
                      {node.voltage}
                    </span>
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
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{node.region}</div>
              </div>
            )
          }
        });
      });
    });

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

  // Handle Excel Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Check if there are sheets for Nodes and Edges
        const firstSheetName = workbook.SheetNames[0];
        const secondSheetName = workbook.SheetNames[1] || workbook.SheetNames[0];

        const nodesSheet = workbook.Sheets[firstSheetName];
        const rawNodes = XLSX.utils.sheet_to_json<any>(nodesSheet);

        if (rawNodes.length > 0) {
          const parsedNodes: ParsedGINode[] = rawNodes.map((row, idx) => ({
            id: row['ID'] || row['id'] || `GI_${idx + 1}`,
            name: row['Nama GI'] || row['Nama'] || row['name'] || `GI ${idx + 1}`,
            voltage: row['Tegangan'] || row['voltage'] || '500 kV',
            region: row['Wilayah'] || row['UP2B'] || row['region'] || 'Jawa Barat',
            riskStatus: (row['Status Kerawanan'] || row['Kerawanan'] || row['riskStatus'] || 'Normal') as any,
            subsystem: row['Subsistem'] || row['subsystem'] || ''
          }));
          setGiList(parsedNodes);
        }

        // Parse lines if second sheet exists or check line columns
        if (workbook.SheetNames.length > 1) {
          const linesSheet = workbook.Sheets[secondSheetName];
          const rawLines = XLSX.utils.sheet_to_json<any>(linesSheet);
          if (rawLines.length > 0) {
            const parsedLines: ParsedTransmissionLine[] = rawLines.map((row, idx) => ({
              id: row['ID'] || row['id'] || `LINE_${idx + 1}`,
              sourceId: row['Dari GI'] || row['sourceId'] || '',
              targetId: row['Ke GI'] || row['targetId'] || '',
              lineName: row['Nama Penghantar'] || row['lineName'] || `Line ${idx + 1}`,
              circuit: row['Sirkit'] || 'Sirkit 1',
              lengthKm: Number(row['Panjang km'] || row['lengthKm'] || 25),
              loadingPct: Number(row['Pembebanan %'] || row['loadingPct'] || 65),
              riskStatus: (row['Status Kerawanan'] || row['riskStatus'] || 'Normal') as any
            }));
            setLineList(parsedLines);
          }
        }

        setIsGenerated(true);
      } catch (err) {
        alert('Gagal memproses file Excel. Pastikan format kolom sesuai dengan template.');
        console.error(err);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Gardu Induk
    const wsNodesData = [
      { ID: 'GI_GANDUL', 'Nama GI': 'GITET Gandul', Tegangan: '500 kV', Wilayah: 'DKI Jakarta & Banten', Subsistem: 'Gandul', 'Status Kerawanan': 'N-1' },
      { ID: 'GI_CIBINONG', 'Nama GI': 'GITET Cibinong', Tegangan: '500 kV', Wilayah: 'Jawa Barat', Subsistem: 'Bogor', 'Status Kerawanan': 'N-1' },
      { ID: 'GI_CIRATA', 'Nama GI': 'GITET Cirata', Tegangan: '500 kV', Wilayah: 'Jawa Barat', Subsistem: 'Cirata', 'Status Kerawanan': 'N-2' },
      { ID: 'GI_SAGULING', 'Nama GI': 'GITET Saguling', Tegangan: '500 kV', Wilayah: 'Jawa Barat', Subsistem: 'Bandung Barat', 'Status Kerawanan': 'Normal' },
      { ID: 'GI_UNGARAN', 'Nama GI': 'GITET Ungaran', Tegangan: '500 kV', Wilayah: 'Jawa Tengah', Subsistem: 'Ungaran', 'Status Kerawanan': 'Normal' },
      { ID: 'GI_PEDAN', 'Nama GI': 'GITET Pedan', Tegangan: '500 kV', Wilayah: 'Jawa Tengah', Subsistem: 'Pedan', 'Status Kerawanan': 'N-1-2' },
      { ID: 'GI_GRATI', 'Nama GI': 'GITET Grati', Tegangan: '500 kV', Wilayah: 'Jawa Timur', Subsistem: 'Grati', 'Status Kerawanan': 'N-1' }
    ];
    const wsNodes = XLSX.utils.json_to_sheet(wsNodesData);
    XLSX.utils.book_append_sheet(wb, wsNodes, 'Gardu_Induk');

    // Sheet 2: Jalur Transmisi
    const wsEdgesData = [
      { ID: 'L_GND_CBN', 'Dari GI': 'GI_GANDUL', 'Ke GI': 'GI_CIBINONG', 'Nama Penghantar': 'Gandul - Cibinong', Sirkit: 'Sirkit 1', 'Panjang km': 34.2, 'Pembebanan %': 79, 'Status Kerawanan': 'N-1' },
      { ID: 'L_CBN_CRT', 'Dari GI': 'GI_CIBINONG', 'Ke GI': 'GI_CIRATA', 'Nama Penghantar': 'Cibinong - Cirata', Sirkit: 'Sirkit 1', 'Panjang km': 65.8, 'Pembebanan %': 88, 'Status Kerawanan': 'N-2' },
      { ID: 'L_CRT_SGL', 'Dari GI': 'GI_CIRATA', 'Ke GI': 'GI_SAGULING', 'Nama Penghantar': 'Cirata - Saguling', Sirkit: 'Sirkit 1', 'Panjang km': 22.0, 'Pembebanan %': 71, 'Status Kerawanan': 'Normal' },
      { ID: 'L_SGL_UNG', 'Dari GI': 'GI_SAGULING', 'Ke GI': 'GI_UNGARAN', 'Nama Penghantar': 'Saguling - Ungaran', Sirkit: 'Sirkit 1', 'Panjang km': 185.0, 'Pembebanan %': 62, 'Status Kerawanan': 'Normal' },
      { ID: 'L_UNG_PDN', 'Dari GI': 'GI_UNGARAN', 'Ke GI': 'GI_PEDAN', 'Nama Penghantar': 'Ungaran - Pedan', Sirkit: 'Sirkit 1', 'Panjang km': 68.2, 'Pembebanan %': 91, 'Status Kerawanan': 'N-1-2' },
      { ID: 'L_PDN_GRT', 'Dari GI': 'GI_PEDAN', 'Ke GI': 'GI_GRATI', 'Nama Penghantar': 'Pedan - Grati', Sirkit: 'Sirkit 1', 'Panjang km': 210.5, 'Pembebanan %': 75, 'Status Kerawanan': 'N-1' }
    ];
    const wsEdges = XLSX.utils.json_to_sheet(wsEdgesData);
    XLSX.utils.book_append_sheet(wb, wsEdges, 'Jalur_Transmisi');

    XLSX.writeFile(wb, 'template_data_sld_pln.xlsx');
  };

  // Image Upload Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
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
      voltage: '500 kV',
      riskStatus: newPointStatus,
      xPercent: Math.round(x * 10) / 10,
      yPercent: Math.round(y * 10) / 10,
      description: 'Simpul interaktif baru ditambahkan dari blueprint gambar'
    };

    setHotspots((prev) => [...prev, newSpot]);
    setSelectedHotspot(newSpot);
  };

  const removeHotspot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHotspots((prev) => prev.filter((s) => s.id !== id));
    if (selectedHotspot?.id === id) setSelectedHotspot(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f4f7fa] overflow-hidden">
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
              SLD 500 kV
            </span>
            <span>/</span>
            <span className="text-[#0046ad] font-bold">Upload & Builder SLD</span>
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
                {/* Upload Box */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Upload File Excel / CSV:
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#0046ad]/40 hover:border-[#0046ad] bg-[#eff6ff]/40 hover:bg-[#eff6ff] rounded-xl p-4 text-center cursor-pointer transition-all group"
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
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Download Template Action */}
                <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-[#0046ad]" />
                    <span>Template Standar Excel PLN</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Unduh format Excel berisi kolom Gardu Induk (Sheet 1) dan Penghantar (Sheet 2)
                    agar langsung dikenali sistem.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs"
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
                    setGiList(sampleGINodes);
                    setLineList(sampleLines);
                    setFileName('sample_sld_jamali_500kv.xlsx');
                    setIsGenerated(true);
                  }}
                  className="w-full py-2 px-3 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#0046ad] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-[#bfdbfe]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset / Gunakan Data Contoh</span>
                </button>
              </div>
            </div>

            {/* Right: Interactive Graph Canvas */}
            <div className="flex-1 relative flex flex-col h-full bg-[#f8fafc] overflow-hidden">
              <div className="p-2.5 bg-white border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
                  <span className="font-semibold text-slate-800">
                    SLD Interaktif Hasil Generate Otomatis dari Excel
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Dapat di-zoom, geser, & diklik)
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-500">Grid: 500 kV Backbone Jawa-Bali</span>
                </div>
              </div>

              <div className="flex-1 relative w-full h-full">
                <ReactFlowProvider>
                  <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
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
                  onClick={() => {
                    const dataStr =
                      'data:text/json;charset=utf-8,' +
                      encodeURIComponent(JSON.stringify({ image: imageFileName, hotspots }, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', 'konfigurasi_sld_interaktif.json');
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="w-full py-2.5 px-3 bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Konfigurasi SLD (.json)</span>
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
                  {/* Actual Uploaded Image OR Vector Blueprint Mockup */}
                  {uploadedImageUrl ? (
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded SLD"
                      className="w-full h-auto object-contain pointer-events-none block"
                    />
                  ) : (
                    // Default Schematic Blueprint Vector SVG representation of high voltage network
                    <svg
                      viewBox="0 0 900 500"
                      className="w-full h-auto bg-[#0b132b] block select-none pointer-events-none"
                    >
                      {/* Grid background */}
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

                      {/* Schematic Transmission Lines Blueprint */}
                      <g stroke="#334155" strokeWidth="2.5" fill="none">
                        <line x1="250" y1="210" x2="470" y2="250" />
                        <line x1="470" y1="250" x2="410" y2="340" />
                        <line x1="410" y1="340" x2="585" y2="370" />
                        <line x1="470" y1="250" x2="700" y2="180" />
                        <line x1="700" y1="180" x2="800" y2="280" />
                      </g>

                      {/* Schematic Busbars */}
                      <rect x="230" y="200" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="450" y="240" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="390" y="330" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="565" y="360" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="680" y="170" width="40" height="8" rx="2" fill="#38bdf8" />
                      <rect x="780" y="270" width="40" height="8" rx="2" fill="#38bdf8" />

                      {/* Schematic Labels */}
                      <text x="250" y="190" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                        BUSBAR 500 kV
                      </text>
                      <text x="470" y="230" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                        INTERBUS 500/150 kV
                      </text>
                      <text x="585" y="400" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                        GITET CIRATA - SAGULING
                      </text>

                      {/* Helper overlay instruction if no custom image */}
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
                        Unggah gambar diagram SLD Anda melalui panel kiri atau klik di mana saja untuk menambah titik interaktif.
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
                        {/* Radar Pulse animation if Rawan */}
                        {isRawan && (
                          <span className="absolute -inset-2 rounded-full bg-[#dc2626] opacity-75 animate-ping" />
                        )}

                        {/* Pin Head */}
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

                        {/* Label Tooltip */}
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
    </div>
  );
};
