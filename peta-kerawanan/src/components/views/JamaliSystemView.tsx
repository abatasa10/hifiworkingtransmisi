import React, { useState } from 'react';
import { jamaliUPBs } from '../../data/upbs';
import { UPB } from '../../types/system';
import { ActiveView } from '../layout/Header';
import { Breadcrumb } from '../layout/Breadcrumb';
import {
  ArrowLeft,
  ArrowRight,
  Network,
  Layers,
  ShieldAlert
} from 'lucide-react';

interface JamaliSystemViewProps {
  onSelectUPB: (upbId: string) => void;
  onNavigate: (view: ActiveView) => void;
}

export const JamaliSystemView: React.FC<JamaliSystemViewProps> = ({
  onSelectUPB,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<
    'peta' | 'sld' | 'ibt' | 'daftar-upb' | 'ringkasan'
  >('peta');
  const [hoveredUPB, setHoveredUPB] = useState<UPB | null>(null);

  const upbMapCoords: Record<string, { x: number; y: number }> = {
    'upb-banten': { x: 130, y: 190 },
    'upb-jakarta': { x: 230, y: 170 },
    'upb-jabar': { x: 330, y: 240 },
    'upb-jateng': { x: 530, y: 230 },
    'upb-jatim': { x: 740, y: 230 },
    'upb-bali': { x: 910, y: 260 }
  };

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

      {/* Secondary Navigation Tabs (matching MANTAPS style) */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('peta')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'peta'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-[#f8fafc]'
            }`}
          >
            Peta Wilayah
          </button>
          <button
            onClick={() => onNavigate('sld-500kv')}
            className="px-3.5 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-[#0046ad] hover:bg-[#eff6ff] flex items-center gap-1.5 transition-all"
          >
            <Network className="w-3.5 h-3.5 text-[#0046ad]" />
            <span>SLD 500 kV</span>
          </button>
          <button
            onClick={() => onNavigate('ibt-view')}
            className="px-3.5 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-[#0046ad] hover:bg-[#eff6ff] flex items-center gap-1.5 transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>IBT</span>
          </button>
          <button
            onClick={() => onNavigate('upb-view')}
            className="px-3.5 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-[#0046ad] hover:bg-[#eff6ff] flex items-center gap-1.5 transition-all"
          >
            <span>Daftar UPB/P2B</span>
          </button>
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'ringkasan'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-[#f8fafc]'
            }`}
          >
            Ringkasan Kerawanan
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden md:flex items-center gap-2 font-mono">
          <span>Tegangan Backbone: 500 kV</span>
          <span>•</span>
          <span>Interkoneksi: 150 kV</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left / Center: Interactive Map of Java-Bali */}
        <div className="flex-1 relative flex items-center justify-center p-6 bg-gradient-to-b from-[#f8fafc] via-[#edf2f7] to-[#f1f5f9] overflow-hidden">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Java, Madura & Bali Vector Map */}
          <svg
            viewBox="0 0 1000 400"
            className="w-full h-full max-h-[75vh] filter drop-shadow-sm"
          >
            {/* Java Silhouette */}
            <path
              d="M 80,180 Q 150,150 240,160 Q 320,180 420,190 Q 520,200 620,190 Q 720,170 820,190 L 840,240 Q 760,250 680,260 Q 580,270 480,260 Q 380,270 280,270 Q 180,260 100,240 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            {/* Madura */}
            <path
              d="M 720,140 Q 780,130 830,145 Q 810,170 740,165 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            {/* Bali */}
            <path
              d="M 880,220 Q 940,210 960,240 Q 930,270 890,260 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* Submarine Cable */}
            <line x1="760" y1="190" x2="760" y2="165" stroke="#0046ad" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="835" y1="230" x2="880" y2="235" stroke="#0046ad" strokeWidth="2" strokeDasharray="4 4" />

            {/* Backbone 500 kV Transmission Lines */}
            <path
              d="M 120,190 L 220,180 L 330,220 L 520,220 L 730,210 L 820,210"
              fill="none"
              stroke="#0046ad"
              strokeWidth="3"
              strokeOpacity="0.8"
            />
          </svg>

          {/* UP2B Region Markers */}
          {jamaliUPBs.map((upb) => {
            const coord = upbMapCoords[upb.id] || { x: 500, y: 200 };
            const isHovered = hoveredUPB?.id === upb.id;

            return (
              <div
                key={upb.id}
                style={{
                  position: 'absolute',
                  left: `${(coord.x / 1000) * 100}%`,
                  top: `${(coord.y / 400) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="z-30 cursor-pointer group"
                onMouseEnter={() => setHoveredUPB(upb)}
                onMouseLeave={() => setHoveredUPB(null)}
                onClick={() => onSelectUPB(upb.id)}
              >
                {/* Pin Card in MANTAPS style */}
                <div
                  className={`transition-all duration-200 rounded-xl p-2.5 border flex items-center gap-2 shadow-md ${
                    isHovered
                      ? 'bg-white border-[#0046ad] shadow-[0_4px_16px_rgba(0,70,173,0.25)] scale-105 ring-2 ring-[#0046ad]/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      upb.riskLevel === 'Sangat Rawan'
                        ? 'bg-[#dc2626] animate-pulse'
                        : upb.riskLevel === 'Rawan'
                        ? 'bg-[#ea580c]'
                        : 'bg-[#f1c40f]'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-800 group-hover:text-[#0046ad] transition-colors block">
                      {upb.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {upb.giCount} GI • {upb.subsystemCount} Subsistem
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Info Panel: Informasi Sistem (MANTAPS white card style) */}
        <div className="w-80 md:w-96 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20 shadow-sm">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-mono text-[#0046ad] font-bold uppercase tracking-wider">
                Informasi Sistem
              </span>
              <h2 className="text-lg font-black text-[#1e293b] mt-1">
                Jawa, Madura, dan Bali
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Jaringan kelistrikan terpadu dengan transmisi backbone 500 kV dan penyaluran 150 kV melayani 8 pulau utama.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Jumlah UPB/P2B:</span>
                <span className="font-bold text-slate-800 font-mono text-sm">6 Unit</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Jumlah GI / GITET:</span>
                <span className="font-bold text-[#0046ad] font-mono text-sm">263 Lokasi</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Jumlah Subsistem:</span>
                <span className="font-bold text-slate-800 font-mono text-sm">12 Subsistem</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Jumlah IBT 500/150 kV:</span>
                <span className="font-bold text-[#16a34a] font-mono text-sm">58 Unit</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Tingkat Kerawanan:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-[#ea580c] bg-[#ffedd5] border border-[#fed7aa] px-2 py-0.5 rounded-full text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                  Rawan
                </span>
              </div>
            </div>

            {/* Kerawanan #7 Highlight Card */}
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-[#b45309] font-bold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>Titik Kritis Utama: Kerawanan #7</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                SUTET Gandul-Durkos-Kembangan memasok radial 2 IBT Durikosambi & 2 IBT Muarakarang dengan risiko pemadaman 1.700 MW pada kondisi N-2.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-200 mt-4">
            <button
              onClick={() => onNavigate('sld-500kv')}
              className="w-full bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Network className="w-4 h-4" />
              <span>Lihat SLD 500 kV Interaktif</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('ibt-view')}
              className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4 text-[#16a34a]" />
              <span>Lihat Daftar IBT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
