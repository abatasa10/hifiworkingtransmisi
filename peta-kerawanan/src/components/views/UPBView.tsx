import React, { useState } from 'react';
import { jamaliUPBs } from '../../data/upbs';
import { subsystems } from '../../data/subsystems';
import { ActiveView } from '../layout/Header';
import { Breadcrumb } from '../layout/Breadcrumb';
import { ArrowLeft, ArrowRight, ListFilter } from 'lucide-react';

interface UPBViewProps {
  selectedUpbId?: string;
  onSelectSubsystem: (subsystemId: string) => void;
  onNavigate: (view: ActiveView) => void;
}

export const UPBView: React.FC<UPBViewProps> = ({
  selectedUpbId = 'upb-jabar',
  onSelectSubsystem,
  onNavigate
}) => {
  const [currentUpbId, setCurrentUpbId] = useState<string>(selectedUpbId);
  const currentUPB = jamaliUPBs.find((u) => u.id === currentUpbId) || jamaliUPBs[2];

  const jabarSubstations = [
    { name: 'GI Cibinong', x: 260, y: 120, status: 'red', voltage: '500 kV' },
    { name: 'GI Bekasi', x: 400, y: 130, status: 'red', voltage: '500 kV' },
    { name: 'GI Cikarang', x: 530, y: 150, status: 'normal', voltage: '150 kV' },
    { name: 'GI Cirata', x: 440, y: 220, status: 'orange', voltage: '500 kV' },
    { name: 'GI Saguling', x: 380, y: 270, status: 'green', voltage: '500 kV' },
    { name: 'GI Bandung', x: 480, y: 290, status: 'yellow', voltage: '150 kV' },
    { name: 'GI Tasikmalaya', x: 560, y: 350, status: 'red', voltage: '500 kV' }
  ];

  const upbSubsystems = subsystems.filter((s) => s.upbId === currentUpbId);

  return (
    <div className="flex-1 flex flex-col bg-[#f4f7fa] text-slate-800 overflow-hidden relative select-none">
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

      {/* Main Grid: Left Selector, Center Map, Right Summary */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Pilih UPB / P2B */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto shadow-xs">
          <div>
            <div className="text-[11px] font-mono text-[#0046ad] font-bold uppercase tracking-wider mb-2.5">
              Pilih UPB / P2B
            </div>
            <div className="space-y-1">
              {jamaliUPBs.map((u) => {
                const active = u.id === currentUpbId;
                return (
                  <button
                    key={u.id}
                    onClick={() => setCurrentUpbId(u.id)}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between ${
                      active
                        ? 'bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-[#0046ad] hover:bg-[#f8fafc] border border-transparent'
                    }`}
                  >
                    <span>{u.name}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#0046ad]" />}
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

        {/* Center: Regional Power Grid Map Canvas */}
        <div className="flex-1 relative flex items-center justify-center p-6 bg-gradient-to-b from-[#f8fafc] via-[#edf2f7] to-[#f1f5f9] overflow-hidden">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Region boundary shape */}
          <svg viewBox="0 0 800 500" className="w-full h-full max-h-[75vh] filter drop-shadow-sm">
            <path
              d="M 180,80 Q 350,50 560,90 Q 690,180 670,330 Q 560,420 380,410 Q 200,380 140,260 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* Interconnecting Transmission Lines */}
            <g stroke="#0046ad" strokeWidth="2.5" opacity="0.8">
              <line x1="260" y1="120" x2="400" y2="130" />
              <line x1="400" y1="130" x2="530" y2="150" />
              <line x1="400" y1="130" x2="440" y2="220" stroke="#f1c40f" strokeWidth="3" />
              <line x1="260" y1="120" x2="440" y2="220" stroke="#dc2626" strokeWidth="3" />
              <line x1="440" y1="220" x2="380" y2="270" />
              <line x1="440" y1="220" x2="480" y2="290" />
              <line x1="380" y1="270" x2="480" y2="290" />
              <line x1="480" y1="290" x2="560" y2="350" stroke="#dc2626" strokeWidth="3" />
            </g>
          </svg>

          {/* Substation Nodes */}
          {jabarSubstations.map((gi) => {
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

          {/* Legend Overlay at top right */}
          <div className="absolute top-4 right-6 bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
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
              Tingkat Kerawanan
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
              <span className="text-slate-600">Sangat Rawan</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#f1c40f]" />
              <span className="text-slate-600">Sedang</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span className="text-slate-600">Aman</span>
            </div>
          </div>
        </div>

        {/* Right Info Panel: Informasi UPB/P2B */}
        <div className="w-80 md:w-88 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20 shadow-sm">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-mono text-[#0046ad] font-bold uppercase tracking-wider">
                Informasi UPB/P2B
              </span>
              <h2 className="text-lg font-black text-[#1e293b] mt-1">
                {currentUPB.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Wilayah kerja mencakup {currentUPB.region} dengan {currentUPB.keySubstations.length} GITET simpul utama.
              </p>
            </div>

            {/* Metrics */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Nama UPB/P2B:</span>
                <span className="font-bold text-slate-800">{currentUPB.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Jumlah GI:</span>
                <span className="font-bold text-[#0046ad] font-mono text-sm">{currentUPB.giCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Jumlah Subsistem:</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{currentUPB.subsystemCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Tingkat Kerawanan:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-[#ca8a04] bg-[#fef9c3] border border-[#fde047] px-2 py-0.5 rounded-full text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#f1c40f]" />
                  {currentUPB.riskLevel}
                </span>
              </div>
            </div>

            {/* Subsystems */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Daftar Subsistem:
              </span>
              <div className="space-y-1.5">
                {upbSubsystems.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      onSelectSubsystem(sub.id);
                      onNavigate('subsystem-sld');
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-slate-200 hover:border-[#0046ad] hover:bg-[#eff6ff] flex items-center justify-between text-left transition-colors group shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-[#0046ad]">
                        {sub.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {sub.giCount} GI • Beban: {sub.peakLoadMW} MW
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0046ad] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('subsystem-sld')}
            className="w-full bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all mt-4"
          >
            <span>Buka SLD Subsistem Bogor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
