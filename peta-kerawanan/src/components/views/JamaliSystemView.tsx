import React, { useEffect, useMemo, useState } from 'react';
import { jamaliUPBs } from '../../data/upbs';
import { UPB } from '../../types/system';
import { ActiveView } from '../layout/Header';
import { Breadcrumb } from '../layout/Breadcrumb';
import { risksData } from '../../data/risks';
import { RiskItem } from '../../types/risk';
import { RiskDetailContent } from '../panels/RiskDetailContent';
import { RiskTableView } from './RiskTableView';
import {
  ArrowLeft,
  ArrowRight,
  Network,
  Layers,
  ShieldAlert,
  MapPin,
  Map,
  ListFilter,
  Search,
  X,
  Zap,
  ExternalLink,
  Info,
  UploadCloud
} from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Real coordinates for regional UP2B/APB pins over Java-Bali
const UPB_COORDS: Record<string, [number, number]> = {
  'upb-jakarta': [-6.2, 106.8],
  'upb-jabar': [-6.9, 107.6],
  'upb-jateng': [-6.98, 110.42],
  'upb-jatim': [-7.24, 112.75],
  'upb-bali': [-8.65, 115.22]
};

const JAVA_BALI_BOUNDS: L.LatLngBoundsLiteral = [
  [-9.0, 105.0],
  [-5.5, 115.9]
];

/** Fit the map to the Java-Bali system area once on mount */
const JavaBaliExtent: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(JAVA_BALI_BOUNDS, { padding: [24, 24] });
    map.setMaxBounds(L.latLngBounds(JAVA_BALI_BOUNDS).pad(0.5));
  }, [map]);
  return null;
};

/** Repositions the HTML UP2B pin cards following the Leaflet map pan/zoom */
const PositionedUpbMarkers: React.FC<{
  upbs: UPB[];
  coords: Record<string, [number, number]>;
  hoveredUPB: UPB | null;
  onHover: (upb: UPB | null) => void;
  onSelect: (upbId: string) => void;
}> = ({ upbs, coords, hoveredUPB, onHover, onSelect }) => {
  const map = useMap();
  const [points, setPoints] = useState<Record<string, L.Point>>(() => {
    const next: Record<string, L.Point> = {};
    for (const [id, ll] of Object.entries(coords)) next[id] = map.latLngToContainerPoint(L.latLng(ll));
    return next;
  });

  useEffect(() => {
    const update = () => {
      const next: Record<string, L.Point> = {};
      for (const [id, ll] of Object.entries(coords)) next[id] = map.latLngToContainerPoint(L.latLng(ll));
      setPoints(next);
    };
    update();
    map.on('move zoom', update);
    return () => {
      map.off('move zoom', update);
    };
  }, [map, coords]);

  return (
    <>
      {upbs.map((upb) => {
        const pt = points[upb.id];
        if (!pt) return null;
        const isHovered = hoveredUPB?.id === upb.id;

        return (
          <div
            key={upb.id}
            style={{ left: pt.x, top: pt.y, transform: 'translate(-50%, -50%)' }}
            className="absolute z-[900] cursor-pointer group"
            onMouseEnter={() => onHover(upb)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(upb.id)}
          >
            {/* Pin Card in MANTAPS style with Pin Point & Total Kerawanan */}
            <div
              className={`transition-all duration-200 rounded-xl p-2.5 border flex flex-col shadow-md bg-white ${
                isHovered
                  ? 'border-[#0046ad] shadow-[0_4px_16px_rgba(0,70,173,0.25)] scale-105 ring-2 ring-[#0046ad]/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] shrink-0">
                  <MapPin className="w-3.5 h-3.5 fill-current" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-[#0046ad] transition-colors block whitespace-nowrap">
                    {upb.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                    <span>{upb.subsystemCount} Subsistem</span>
                  </span>
                </div>
              </div>

              {/* Total Kerawanan (Warna seragam semua) */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs gap-3">
                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Total Kerawanan:</span>
                <span className="px-2 py-0.5 rounded-md font-extrabold text-xs font-mono whitespace-nowrap bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]">
                  {upb.riskCount} Kerawanan
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

interface JamaliSystemViewProps {
  onSelectUPB: (upbId: string) => void;
  onNavigate: (view: ActiveView) => void;
  canvasMode?: 'maps' | 'list-kerawanan';
  onCanvasModeChange?: (mode: 'maps' | 'list-kerawanan') => void;
  onSelectRisk?: (riskId: number) => void;
}

export const JamaliSystemView: React.FC<JamaliSystemViewProps> = ({
  onSelectUPB,
  onNavigate,
  canvasMode: controlledMode,
  onCanvasModeChange,
  onSelectRisk
}) => {
  const [activeTab, setActiveTab] = useState<
    'peta' | 'sld' | 'ibt' | 'daftar-upb' | 'ringkasan'
  >('peta');
  const [hoveredUPB, setHoveredUPB] = useState<UPB | null>(null);
  const [internalMode, setInternalMode] = useState<'maps' | 'list-kerawanan'>('maps');
  const canvasMode = controlledMode !== undefined ? controlledMode : internalMode;

  const setCanvasMode = (mode: 'maps' | 'list-kerawanan') => {
    setInternalMode(mode);
    onCanvasModeChange?.(mode);
  };
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskItem>(
    () => risksData.find((r) => r.number === 7) || risksData[0]
  );
  const [riskSearchQuery, setRiskSearchQuery] = useState('');

  const filteredRisks = useMemo(() => {
    return risksData.filter((r) => {
      const q = riskSearchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.number.toString().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.assetType.toLowerCase().includes(q)
      );
    });
  }, [riskSearchQuery]);

  // Filter regional UPBs to display on map pins
  const regionalUPBs = jamaliUPBs.filter((u) => u.id !== 'p2b-sistem');

  const renderSystemInfoContent = (isOverlay: boolean) => (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="space-y-4">
        {/* Header with Close Button */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-mono text-[#0046ad] font-bold uppercase tracking-wider">
              Informasi Sistem
            </span>
            <h2 className="text-xl font-black text-[#1e293b] mt-0.5">
              Jawa, Madura, dan Bali
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Jaringan kelistrikan interkoneksi backbone 500 kV & penyaluran 150 kV melayani 8 pulau dengan 6 unit pengatur operasi.
            </p>
          </div>
          {isOverlay && (
            <button
              onClick={() => setShowSystemInfo(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 ml-2"
              title="Tutup (Klik di luar untuk menutup)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Total System Metrics */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-slate-500">Jumlah UPB / P2B:</span>
            <span className="font-bold text-slate-800 font-mono text-sm">6 Unit</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">Jumlah Subsistem:</span>
            <span className="font-bold text-slate-800 font-mono text-sm">12 Subsistem</span>
          </div>
        </div>

        {/* Total Kerawanan 500 kV dan IBT 500/150 kV dengan klasifikasi N-1 s/d N-1-2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
            Total Kerawanan 500 kV & IBT 500/150:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Kerawanan 500 kV */}
            <div className="bg-gradient-to-b from-[#fef2f2] to-[#fee2e2]/60 p-2.5 rounded-xl border border-[#fecaca] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="text-[11px] text-[#dc2626] font-bold">Kerawanan 500 kV</div>
                  <div className="text-[9px] text-slate-500">Jalur Transmisi</div>
                </div>
                <div className="text-xl font-black text-[#991b1b] font-mono">14</div>
              </div>
              {/* Klasifikasi N-1, N-2, N-1-2 */}
              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-[#fecaca]/80 text-center font-mono">
                <div className="bg-white/90 py-1 px-0.5 rounded border border-[#fca5a5]/70 shadow-3xs">
                  <div className="text-[8px] text-[#dc2626] font-bold">N-1</div>
                  <div className="text-[11px] font-black text-[#b91c1c]">5</div>
                </div>
                <div className="bg-white/90 py-1 px-0.5 rounded border border-[#fde047]/80 shadow-3xs">
                  <div className="text-[8px] text-[#b45309] font-bold">N-2</div>
                  <div className="text-[11px] font-black text-[#b45309]">6</div>
                </div>
                <div className="bg-white/90 py-1 px-0.5 rounded border border-slate-200 shadow-3xs">
                  <div className="text-[8px] text-slate-600 font-bold">N-1-2</div>
                  <div className="text-[11px] font-black text-slate-700">3</div>
                </div>
              </div>
            </div>

            {/* Kerawanan IBT 500/150 */}
            <div className="bg-gradient-to-b from-[#fff7ed] to-[#ffedd5]/60 p-2.5 rounded-xl border border-[#fed7aa] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="text-[11px] text-[#ea580c] font-bold">Kerawanan IBT 500/150</div>
                  <div className="text-[9px] text-slate-500">Trafo Interbus</div>
                </div>
                <div className="text-xl font-black text-[#c2410c] font-mono">11</div>
              </div>
              {/* Klasifikasi N-1, N-2, N-1-2 */}
              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-[#fed7aa]/80 text-center font-mono">
                <div className="bg-white/90 py-1 px-0.5 rounded border border-[#fca5a5]/70 shadow-3xs">
                  <div className="text-[8px] text-[#dc2626] font-bold">N-1</div>
                  <div className="text-[11px] font-black text-[#b91c1c]">4</div>
                </div>
                <div className="bg-white/90 py-1 px-0.5 rounded border border-[#fde047]/80 shadow-3xs">
                  <div className="text-[8px] text-[#b45309] font-bold">N-2</div>
                  <div className="text-[11px] font-black text-[#b45309]">5</div>
                </div>
                <div className="bg-white/90 py-1 px-0.5 rounded border border-slate-200 shadow-3xs">
                  <div className="text-[8px] text-slate-600 font-bold">N-1-2</div>
                  <div className="text-[11px] font-black text-slate-700">2</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rincian Kerawanan Per APB / P2B */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rincian Kerawanan Per APB / P2B:
            </span>
            <span className="text-[10px] text-slate-400">6 Unit</span>
          </div>

          <div className="space-y-2">
            {jamaliUPBs.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  if (isOverlay) setShowSystemInfo(false);
                  if (u.id !== 'p2b-sistem') {
                    onSelectUPB(u.id);
                  } else {
                    onNavigate('sld-500kv');
                  }
                }}
                className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200 hover:border-[#0046ad] hover:bg-[#eff6ff] transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0046ad] shrink-0" />
                  <span className="font-bold text-xs text-slate-800 group-hover:text-[#0046ad] transition-colors">
                    {u.name}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 flex items-center gap-2 mb-2 font-mono">
                  <span>{u.subsystemCount} Subsistem</span>
                  <span>•</span>
                  <span>{u.region}</span>
                </div>

                {/* Total Kerawanan */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium">Total Kerawanan:</span>
                  <span className="px-2 py-0.5 rounded-md font-extrabold text-xs font-mono bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]">
                    {u.riskCount} Kerawanan
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kerawanan #7 Highlight Card */}
        <div
          onClick={() => {
            if (isOverlay) setShowSystemInfo(false);
            setCanvasMode('list-kerawanan');
          }}
          className="bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fde68a] hover:border-[#f59e0b] rounded-xl p-3.5 space-y-1.5 cursor-pointer transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#b45309] font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-[#d97706]" />
              <span>Titik Kritis Utama: Kerawanan #7</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#d97706] group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            SUTET Gandul-Durkos-Kembangan (P2B Jakban) memasok radial 2 IBT Durikosambi & 2 IBT Muarakarang dengan risiko pemadaman 1.700 MW pada kondisi N-2.
          </p>
          <div className="text-[10px] font-bold text-[#b45309] flex items-center gap-1 pt-0.5">
            <span>Buka detail lengkap di Tabel</span>
            <span>→</span>
          </div>
        </div>
      </div>

      {/* Action Buttons at bottom */}
      <div className="space-y-2 pt-4 border-t border-slate-200 mt-4">
        <button
          onClick={() => {
            if (isOverlay) setShowSystemInfo(false);
            onNavigate('sld-500kv');
          }}
          className="w-full bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          <Network className="w-4 h-4" />
          <span>Lihat SLD 500 kV Interaktif</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (isOverlay) setShowSystemInfo(false);
            onNavigate('ibt-view');
          }}
          className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Layers className="w-4 h-4 text-[#16a34a]" />
          <span>Lihat Daftar IBT</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-[#f4f7fa] text-slate-800 overflow-hidden relative select-none">
      {/* Top Banner with Breadcrumb & Back */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div>
          <Breadcrumb
            items={[{ label: 'Jawa, Madura & Bali' }]}
            onNavigate={onNavigate}
          />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#0046ad] flex items-center justify-center font-bold text-xs border border-[#dbeafe]">
              2
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1e293b] tracking-tight">
                SISTEM JAWA, MADURA, DAN BALI
              </h1>
              <span className="text-xs text-slate-500">
                Unit Induk Pusat Pengatur Beban (UIP2B) Jawa, Madura dan Bali
              </span>
            </div>
          </div>
        </div>

        {/* Back Button to National Map */}
        <button
          onClick={() => onNavigate('national')}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke Peta Nasional</span>
        </button>
      </div>

      {/* Top View Mode Bar (Maps | SLD | List Kerawanan) */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          {/* 1. Maps */}
          <button
            onClick={() => setCanvasMode('maps')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              canvasMode === 'maps'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Maps</span>
          </button>

          {/* 2. SLD */}
          <button
            onClick={() => onNavigate('sld-500kv')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#0046ad] hover:bg-white transition-all"
          >
            <Network className="w-3.5 h-3.5 text-[#0046ad]" />
            <span>SLD</span>
          </button>

          {/* 3. List Kerawanan */}
          <button
            onClick={() => setCanvasMode('list-kerawanan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              canvasMode === 'list-kerawanan'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>List Kerawanan</span>
            <span
              className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                canvasMode === 'list-kerawanan'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#fee2e2] text-[#dc2626]'
              }`}
            >
              {risksData.length}
            </span>
          </button>

          {/* 4. Info Sistem Trigger (Only when on list-kerawanan) */}
          {canvasMode === 'list-kerawanan' && (
            <button
              onClick={() => setShowSystemInfo(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showSystemInfo
                  ? 'bg-[#0046ad] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-[#0046ad]" />
              <span>Info Sistem</span>
            </button>
          )}

          {/* 5. Upload SLD */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left / Center: Interactive Map of Java-Bali OR List Kerawanan SLD 500 kV */}
        <div className="flex-1 relative flex items-center justify-center bg-gradient-to-b from-[#f8fafc] via-[#edf2f7] to-[#f1f5f9] overflow-hidden min-w-0">

          {/* Floating Tab Button on Right Edge for Instant Access (Only when list-kerawanan) */}
          {canvasMode === 'list-kerawanan' && (
            <button
              onClick={() => setShowSystemInfo(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-[#eff6ff] text-[#0046ad] border-y border-l border-slate-300 shadow-md py-3 px-2 rounded-l-xl flex flex-col items-center gap-1 font-bold text-[10px] hover:pr-2.5 transition-all group"
              title="Buka Informasi Sistem"
            >
              <Info className="w-4 h-4 text-[#0046ad] group-hover:scale-110 transition-transform" />
              <span style={{ writingMode: 'vertical-rl' }} className="tracking-widest rotate-180 text-slate-700 font-extrabold">
                INFO SISTEM
              </span>
            </button>
          )}

          {/* MODE 1: MAPS VIEW (Leaflet + OpenStreetMap of Java-Bali) */}
          {canvasMode === 'maps' && (
            <div className="absolute inset-0 overflow-hidden">
              <MapContainer
                className="w-full h-full z-0"
                center={[-7, 110]}
                zoom={6}
                minZoom={5}
                maxZoom={12}
                scrollWheelZoom
                attributionControl
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <JavaBaliExtent />
                <PositionedUpbMarkers
                  upbs={regionalUPBs}
                  coords={UPB_COORDS}
                  hoveredUPB={hoveredUPB}
                  onHover={setHoveredUPB}
                  onSelect={onSelectUPB}
                />
              </MapContainer>
            </div>
          )}

          {/* MODE 2: LIST KERAWANAN SLD 500 KV (Official Table Format matching user reference) */}
          {canvasMode === 'list-kerawanan' && (
            <div className="absolute inset-0 z-30 bg-white flex flex-col overflow-hidden">
              <RiskTableView
                onNavigateToSLD={(riskNum) => {
                  if (onSelectRisk && riskNum) {
                    onSelectRisk(riskNum);
                  } else {
                    onNavigate('sld-500kv');
                  }
                }}
                onClose={() => setCanvasMode('maps')}
              />
            </div>
          )}
        </div>

        {/* Static Right Sidebar: When in Maps view ("kaya awal aja") */}
        {canvasMode === 'maps' && (
          <div className="w-96 md:w-[420px] bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20 shadow-sm">
            {renderSystemInfoContent(false)}
          </div>
        )}
      </div>

      {/* Pop-up Overlay: Informasi Sistem ONLY when in List Kerawanan mode and triggered! */}
      {canvasMode === 'list-kerawanan' && showSystemInfo && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with click outside to close */}
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowSystemInfo(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div
            className="relative w-96 md:w-[440px] h-full bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSystemInfoContent(true)}
          </div>
        </div>
      )}
    </div>
  );
};
