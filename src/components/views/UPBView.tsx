import React, { useState } from 'react';
import { jamaliUPBs } from '../../data/upbs';
import { subsystems } from '../../data/subsystems';
import { ActiveView } from '../layout/Header';
import { Breadcrumb } from '../layout/Breadcrumb';
import { RiskTableView } from './RiskTableView';
import {
  ArrowLeft,
  ArrowRight,
  ListFilter,
  MapPin,
  Zap,
  Map,
  Network,
  Layers,
  Info,
  X
} from 'lucide-react';

interface UPBViewProps {
  selectedUpbId?: string;
  onSelectSubsystem: (subsystemId: string) => void;
  onNavigate: (view: ActiveView) => void;
}

export const UPBView: React.FC<UPBViewProps> = ({
  selectedUpbId = 'upb-jakarta',
  onSelectSubsystem,
  onNavigate
}) => {
  const [currentUpbId, setCurrentUpbId] = useState<string>(selectedUpbId);
  const [upbCanvasMode, setUpbCanvasMode] = useState<'maps' | 'list-kerawanan'>('maps');
  const [showUpbInfoOverlay, setShowUpbInfoOverlay] = useState(false);
  const currentUPB = jamaliUPBs.find((u) => u.id === currentUpbId) || jamaliUPBs[0];

  const substationsByUPB: Record<
    string,
    Array<{ name: string; x: number; y: number; status: 'red' | 'yellow' | 'orange' | 'green'; voltage: string }>
  > = {
    'upb-jakarta': [
      { name: 'GITET Gandul 500 kV', x: 380, y: 260, status: 'red', voltage: '500 kV' },
      { name: 'GITET Duri Kosambi 500 kV', x: 280, y: 160, status: 'red', voltage: '500 kV' },
      { name: 'GITET Kembangan 500 kV', x: 330, y: 200, status: 'red', voltage: '500 kV' },
      { name: 'GITET Muara Karang 500 kV', x: 380, y: 120, status: 'yellow', voltage: '500 kV' },
      { name: 'GITET Cawang 500 kV', x: 480, y: 230, status: 'green', voltage: '500 kV' },
      { name: 'GITET Balaraja 500 kV', x: 200, y: 220, status: 'orange', voltage: '500 kV' },
      { name: 'GITET Suralaya 500 kV', x: 120, y: 150, status: 'green', voltage: '500 kV' }
    ],
    'upb-jabar': [
      { name: 'GI Cibinong', x: 260, y: 120, status: 'red', voltage: '500 kV' },
      { name: 'GI Bekasi', x: 400, y: 130, status: 'red', voltage: '500 kV' },
      { name: 'GI Cikarang', x: 530, y: 150, status: 'green', voltage: '150 kV' },
      { name: 'GI Cirata', x: 440, y: 220, status: 'orange', voltage: '500 kV' },
      { name: 'GI Saguling', x: 380, y: 270, status: 'green', voltage: '500 kV' },
      { name: 'GI Bandung', x: 480, y: 290, status: 'yellow', voltage: '150 kV' },
      { name: 'GI Tasikmalaya', x: 560, y: 350, status: 'red', voltage: '500 kV' }
    ],
    'upb-jateng': [
      { name: 'GITET Ungaran', x: 420, y: 180, status: 'red', voltage: '500 kV' },
      { name: 'GITET Pedan', x: 450, y: 280, status: 'yellow', voltage: '500 kV' },
      { name: 'GITET Kesugihan', x: 240, y: 300, status: 'green', voltage: '500 kV' },
      { name: 'GITET Pemalang', x: 280, y: 170, status: 'orange', voltage: '500 kV' },
      { name: 'GITET Tanjung Jati', x: 490, y: 120, status: 'green', voltage: '500 kV' }
    ],
    'upb-jatim': [
      { name: 'GITET Krian', x: 380, y: 220, status: 'red', voltage: '500 kV' },
      { name: 'GITET Gresik', x: 400, y: 150, status: 'orange', voltage: '500 kV' },
      { name: 'GITET Ngimbang', x: 280, y: 200, status: 'yellow', voltage: '500 kV' },
      { name: 'GITET Grati', x: 500, y: 240, status: 'green', voltage: '500 kV' },
      { name: 'GITET Paiton', x: 620, y: 230, status: 'red', voltage: '500 kV' }
    ],
    'upb-bali': [
      { name: 'GIS Kapal', x: 400, y: 200, status: 'yellow', voltage: '150 kV' },
      { name: 'GI Pesanggaran', x: 430, y: 270, status: 'orange', voltage: '150 kV' },
      { name: 'GI Gilimanuk', x: 220, y: 170, status: 'red', voltage: '150 kV' },
      { name: 'GI Antosari', x: 330, y: 230, status: 'green', voltage: '150 kV' }
    ],
    'p2b-sistem': [
      { name: 'P2B Gandul 500 kV', x: 280, y: 220, status: 'red', voltage: '500 kV' },
      { name: 'GITET Ungaran 500 kV', x: 450, y: 230, status: 'yellow', voltage: '500 kV' },
      { name: 'GITET Krian 500 kV', x: 620, y: 220, status: 'orange', voltage: '500 kV' }
    ]
  };

  const currentSubstations = substationsByUPB[currentUpbId] || substationsByUPB['upb-jakarta'];
  const upbSubsystems = subsystems.filter((s) => s.upbId === currentUpbId);

  const renderUpbInfoContent = (isOverlay: boolean) => (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="space-y-4">
        {/* Header with Close Button */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-mono text-[#0046ad] font-bold uppercase tracking-wider">
              Informasi UPB / P2B
            </span>
            <h2 className="text-lg font-black text-[#1e293b] mt-1">
              {currentUPB.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Wilayah kerja mencakup {currentUPB.region} dengan {currentUPB.keySubstations.length} GITET simpul utama.
            </p>
          </div>
          {isOverlay && (
            <button
              onClick={() => setShowUpbInfoOverlay(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 ml-2"
              title="Tutup (Klik di luar untuk menutup)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Metrics */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Nama Unit:</span>
            <span className="font-bold text-slate-800">{currentUPB.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Jumlah GI / GITET:</span>
            <span className="font-bold text-[#0046ad] font-mono text-sm">{currentUPB.giCount} Lokasi</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Jumlah IBT:</span>
            <span className="font-bold text-[#16a34a] font-mono text-sm">{currentUPB.ibtCount} Unit</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Jumlah Subsistem:</span>
            <span className="font-bold text-slate-800 font-mono text-sm">{currentUPB.subsystemCount}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Tingkat Kerawanan:</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#dc2626] bg-[#fee2e2] border border-[#fca5a5] px-2 py-0.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
              {currentUPB.riskLevel}
            </span>
          </div>
        </div>

        {/* Total Kerawanan Unit */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Total Kerawanan {currentUPB.shortName}:
          </span>
          <div className="bg-[#fee2e2]/70 p-3 rounded-xl border border-[#fecaca] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#dc2626] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                🔥
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Total Kerawanan</div>
                <div className="text-[10px] text-slate-500">Wilayah {currentUPB.shortName}</div>
              </div>
            </div>
            <div className="text-xl font-black text-[#dc2626] font-mono">
              {currentUPB.riskCount} <span className="text-xs font-semibold text-[#991b1b]">Kerawanan</span>
            </div>
          </div>
        </div>

        {/* Subsystems List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Daftar Subsistem & Kerawanan:
          </span>
          <div className="space-y-2">
            {upbSubsystems.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  if (isOverlay) setShowUpbInfoOverlay(false);
                  onSelectSubsystem(sub.id);
                  onNavigate('subsystem-sld');
                }}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-slate-200 hover:border-[#0046ad] hover:bg-[#eff6ff] flex flex-col gap-1.5 text-left transition-colors group shadow-2xs"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="font-bold text-xs text-slate-800 group-hover:text-[#0046ad]">
                    {sub.name}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0046ad] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  {sub.giCount} GI • {sub.ibtCount ?? 2} IBT • Beban: {sub.peakLoadMW} MW
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Total Kerawanan:</span>
                  <span className="font-bold text-[#dc2626] font-mono bg-[#fee2e2] px-2 py-0.5 rounded border border-[#fecaca] text-[10px]">
                    {sub.riskCount} Kerawanan
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          if (isOverlay) setShowUpbInfoOverlay(false);
          onNavigate('subsystem-sld');
        }}
        className="w-full bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all mt-4"
      >
        <span>Buka SLD Subsistem Interaktif</span>
        <ArrowRight className="w-4 h-4" />
      </button>
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
              { label: currentUPB.name }
            ]}
            onNavigate={onNavigate}
          />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#0046ad] flex items-center justify-center font-bold text-xs border border-[#dbeafe]">
              3
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1e293b] tracking-tight">
                UPB / P2B — {currentUPB.name.toUpperCase()}
              </h1>
              <span className="text-xs text-slate-500">
                Peta wilayah kerja dan sebaran subsistem transmisi tenaga listrik
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('jamali-system')}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke Sistem</span>
        </button>
      </div>

      {/* Top View Mode Bar (Maps | SLD | List Kerawanan) */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          {/* 1. Maps */}
          <button
            onClick={() => setUpbCanvasMode('maps')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              upbCanvasMode === 'maps'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Maps</span>
          </button>

          {/* 2. SLD */}
          <button
            onClick={() => onNavigate('subsystem-sld')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#0046ad] hover:bg-white transition-all"
          >
            <Network className="w-3.5 h-3.5 text-[#0046ad]" />
            <span>SLD</span>
          </button>

          {/* 3. List Kerawanan */}
          <button
            onClick={() => setUpbCanvasMode('list-kerawanan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              upbCanvasMode === 'list-kerawanan'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>List Kerawanan</span>
            <span
              className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                upbCanvasMode === 'list-kerawanan'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#fee2e2] text-[#dc2626]'
              }`}
            >
              {currentUPB.riskCount}
            </span>
          </button>

          {/* 4. Info UPB Trigger (Only when on list-kerawanan) */}
          {upbCanvasMode === 'list-kerawanan' && (
            <button
              onClick={() => setShowUpbInfoOverlay(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showUpbInfoOverlay
                  ? 'bg-[#0046ad] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0046ad] hover:bg-white'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-[#0046ad]" />
              <span>Info UPB</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-500 hidden md:flex items-center gap-2 font-mono">
            <span>Wilayah: {currentUPB.region}</span>
            <span>•</span>
            <span>{currentUPB.subsystemCount} Subsistem</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Selector, Center Canvas/Table, Right Summary */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* Left Sidebar: Pilih UPB / P2B (Visible only in maps mode) */}
        {upbCanvasMode === 'maps' && (
          <div className="w-60 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto shadow-xs">
            <div>
              <div className="text-[11px] font-mono text-[#0046ad] font-bold uppercase tracking-wider mb-2.5">
                Pilih UPB / P2B (6 Unit)
              </div>
              <div className="space-y-1.5">
                {jamaliUPBs.map((u) => {
                  const active = u.id === currentUpbId;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setCurrentUpbId(u.id)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold transition-all flex flex-col gap-1 ${
                        active
                          ? 'bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] font-bold shadow-xs'
                          : 'text-slate-600 hover:text-[#0046ad] hover:bg-[#f8fafc] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#0046ad] shrink-0" />
                          <span className="text-xs truncate">{u.name}</span>
                        </div>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-[#0046ad] shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pl-4">
                        <span>{u.giCount} GI</span>
                        <span>•</span>
                        <span>{u.ibtCount} IBT</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => onNavigate('subsystem-view')}
              className="w-full bg-[#f8fafc] hover:bg-[#eff6ff] border border-slate-200 text-[#0046ad] font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Lihat Daftar Subsistem</span>
            </button>
          </div>
        )}

        {/* Center: Regional Power Grid Map Canvas OR List Kerawanan */}
        <div className="flex-1 relative flex items-center justify-center bg-gradient-to-b from-[#f8fafc] via-[#edf2f7] to-[#f1f5f9] overflow-hidden min-w-0">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />


          {/* Floating Tab Button on Right Edge for Instant Access (Only when list-kerawanan) */}
          {upbCanvasMode === 'list-kerawanan' && (
            <button
              onClick={() => setShowUpbInfoOverlay(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-[#eff6ff] text-[#0046ad] border-y border-l border-slate-300 shadow-md py-3 px-2 rounded-l-xl flex flex-col items-center gap-1 font-bold text-[10px] hover:pr-2.5 transition-all group"
              title="Buka Informasi UPB"
            >
              <Info className="w-4 h-4 text-[#0046ad] group-hover:scale-110 transition-transform" />
              <span style={{ writingMode: 'vertical-rl' }} className="tracking-widest rotate-180 text-slate-700 font-extrabold">
                INFO UPB
              </span>
            </button>
          )}

          {/* MODE 1: MAPS VIEW */}
          {upbCanvasMode === 'maps' && (
            <div className="w-full h-full relative flex items-center justify-center p-6">
              {/* Region boundary shape */}
              <svg viewBox="0 0 800 500" className="w-full h-full max-h-[75vh] filter drop-shadow-sm">
                <path
                  d="M 160,90 Q 350,50 580,90 Q 710,180 670,350 Q 560,430 380,410 Q 180,390 120,260 Z"
                  fill="#cbd5e1"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />

                {/* Interconnecting Transmission Lines */}
                <g stroke="#0046ad" strokeWidth="2.5" opacity="0.8">
                  {currentSubstations.map((gi, idx) => {
                    const next = currentSubstations[(idx + 1) % currentSubstations.length];
                    const isCritical = gi.status === 'red' && next.status === 'red';
                    const isWarning = gi.status === 'yellow' || next.status === 'yellow';

                    return (
                      <line
                        key={`${gi.name}-${next.name}`}
                        x1={gi.x}
                        y1={gi.y}
                        x2={next.x}
                        y2={next.y}
                        stroke={isCritical ? '#dc2626' : isWarning ? '#f1c40f' : '#0046ad'}
                        strokeWidth={isCritical ? 3.5 : 2.5}
                        strokeDasharray={isCritical ? '4 2' : undefined}
                      />
                    );
                  })}
                </g>
              </svg>

              {/* Substation Nodes */}
              {currentSubstations.map((gi) => {
                const isCritical = gi.status === 'red';
                const isWarning = gi.status === 'orange' || gi.status === 'yellow';

                return (
                  <div
                    key={gi.name}
                    style={{
                      position: 'absolute',
                      left: `${(gi.x / 800) * 100}%`,
                      top: `${(gi.y / 500) * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className="z-30 flex flex-col items-center cursor-pointer group"
                    onClick={() => onNavigate('subsystem-sld')}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-125 ${
                        isCritical
                          ? 'bg-[#dc2626] animate-pulse'
                          : isWarning
                          ? 'bg-[#f1c40f]'
                          : 'bg-[#16a34a]'
                      }`}
                    />
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-[#0046ad] bg-white px-2 py-0.5 rounded-md border border-slate-200 mt-1 whitespace-nowrap shadow-xs">
                      {gi.name}
                    </span>
                  </div>
                );
              })}

              {/* Top Title Overlay */}
              <div className="absolute top-4 left-6">
                <h2 className="text-xl font-black text-[#1e293b] tracking-tight">
                  {currentUPB.name.toUpperCase()}
                </h2>
                <div className="text-xs text-slate-500">Jaringan Interkoneksi Gardu Induk & Transmisi</div>
              </div>

              {/* Legend Overlay at bottom right */}
              <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
                <div className="font-bold text-slate-700 text-[11px]">Legenda</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-slate-200" />
                  <span>Gardu Induk (GI)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-4 h-0.5 bg-[#0046ad]" />
                  <span>Saluran Transmisi</span>
                </div>
                <div className="border-t border-slate-100 pt-1 text-[11px] font-bold text-slate-700">
                  Status Gardu
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                  <span className="text-slate-600">GI / GITET Rawan</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                  <span className="text-slate-600">GI / GITET Normal</span>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: LIST KERAWANAN (Full Width) */}
          {upbCanvasMode === 'list-kerawanan' && (
            <div className="absolute inset-0 z-30 bg-white flex flex-col overflow-hidden">
              <RiskTableView
                onNavigateToSLD={(riskNum) => onNavigate('sld-500kv')}
                onClose={() => setUpbCanvasMode('maps')}
              />
            </div>
          )}
        </div>

        {/* Right Info Panel: Informasi UPB/P2B (Static when in maps mode, "kaya awal aja") */}
        {upbCanvasMode === 'maps' && (
          <div className="w-88 md:w-96 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20 shadow-sm">
            {renderUpbInfoContent(false)}
          </div>
        )}
      </div>

      {/* Pop-up Overlay: Informasi UPB ONLY when in List Kerawanan mode and opened! */}
      {upbCanvasMode === 'list-kerawanan' && showUpbInfoOverlay && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with click outside to close */}
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowUpbInfoOverlay(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div
            className="relative w-96 md:w-[440px] h-full bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {renderUpbInfoContent(true)}
          </div>
        </div>
      )}
    </div>
  );
};
