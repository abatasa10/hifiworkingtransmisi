import React, { useState } from 'react';
import { powerSystems } from '../../data/systems';
import { PowerSystem, RiskLevel } from '../../types/system';
import { ActiveView } from '../layout/Header';
import { Breadcrumb } from '../layout/Breadcrumb';
import { ListFilter, Zap } from 'lucide-react';

interface NationalMapViewProps {
  onSelectSystem: (systemId: string) => void;
  onNavigate: (view: ActiveView) => void;
}

export const NationalMapView: React.FC<NationalMapViewProps> = ({
  onSelectSystem,
  onNavigate
}) => {
  const [hoveredSystem, setHoveredSystem] = useState<PowerSystem | null>(null);
  const [selectedSystemModal, setSelectedSystemModal] = useState<PowerSystem | null>(null);

  const getRiskBadgeColor = (level: RiskLevel) => {
    switch (level) {
      case 'Sangat Rawan':
        return 'bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]';
      case 'Rawan':
        return 'bg-[#ffedd5] text-[#ea580c] border border-[#fdba74]';
      case 'Sedang':
        return 'bg-[#fef9c3] text-[#ca8a04] border border-[#fde047]';
      case 'Aman':
        return 'bg-[#dcfce7] text-[#16a34a] border border-[#86efac]';
    }
  };

  const systemMapCoords: Record<string, { x: number; y: number }> = {
    sumatera: { x: 190, y: 220 },
    jamali: { x: 330, y: 390 },
    kalimantan: { x: 440, y: 230 },
    sulawesi: { x: 620, y: 250 },
    'nusa-tenggara': { x: 550, y: 410 },
    maluku: { x: 770, y: 260 },
    papua: { x: 890, y: 290 }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f4f7fa] text-slate-800 overflow-hidden relative select-none">
      {/* Top Banner with Breadcrumb & Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div>
          <Breadcrumb items={[{ label: 'Peta Nasional' }]} onNavigate={onNavigate} />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#0046ad] flex items-center justify-center font-bold text-xs border border-[#dbeafe]">
              1
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1e293b] tracking-tight">
                PETA NASIONAL SEBARAN SISTEM TENAGA LISTRIK
              </h1>
              <span className="text-xs text-slate-500">
                Peta Risiko & Sebaran Sistem Transmisi Tenaga Listrik Indonesia Tahun 2026
              </span>
            </div>
          </div>
        </div>

        {/* Legend Box at top right (matching MANTAPS style) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-xs space-y-1.5">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Legenda Tingkat Kerawanan
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
              <span className="text-slate-600 text-[11px]">Sangat Rawan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
              <span className="text-slate-600 text-[11px]">Rawan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f1c40f]" />
              <span className="text-slate-600 text-[11px]">Sedang</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2baf75]" />
              <span className="text-slate-600 text-[11px]">Aman</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-4 bg-gradient-to-b from-[#f8fafc] via-[#edf2f7] to-[#f1f5f9] overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
            backgroundSize: '28px 28px'
          }}
        />

        {/* Ocean & Indonesian Archipelago Map */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full max-h-[80vh] filter drop-shadow-sm"
        >
          {/* Island Geometries with MANTAPS corporate color */}
          <g fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2">
            {/* Sumatera */}
            <path d="M 120,130 L 170,120 L 220,190 L 280,310 L 260,340 L 220,330 L 180,260 L 140,200 Z" />
            {/* Jawa & Bali */}
            <path d="M 270,380 L 370,385 L 430,390 L 460,400 L 450,410 L 380,405 L 280,395 Z" />
            <path d="M 465,400 L 485,402 L 480,410 L 465,408 Z" />
            {/* Kalimantan */}
            <path d="M 390,170 L 470,160 L 510,210 L 490,290 L 410,295 L 380,240 Z" />
            {/* Sulawesi */}
            <path d="M 590,180 L 650,175 L 630,220 L 660,250 L 610,320 L 580,260 L 595,225 Z" />
            {/* Nusa Tenggara */}
            <path d="M 495,405 L 530,408 L 560,415 L 610,410 L 600,420 L 520,415 Z" />
            {/* Maluku */}
            <path d="M 720,220 L 760,210 L 750,260 L 710,250 Z" />
            <path d="M 720,290 L 760,300 L 750,330 L 710,320 Z" />
            {/* Papua */}
            <path d="M 810,240 L 870,220 L 960,250 L 970,350 L 890,360 L 820,310 Z" />
          </g>

          {/* Inter-island submarine links */}
          <g stroke="#0046ad" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5">
            <line x1="260" y1="340" x2="280" y2="385" />
            <line x1="450" y1="400" x2="470" y2="402" />
          </g>
        </svg>

        {/* Region Markers (Clean white cards with soft risk badges) */}
        {powerSystems.map((sys) => {
          const coord = systemMapCoords[sys.id] || { x: 500, y: 250 };
          const isJamali = sys.id === 'jamali';
          const badgeClass = getRiskBadgeColor(sys.riskLevel);

          return (
            <div
              key={sys.id}
              style={{
                position: 'absolute',
                left: `${(coord.x / 1000) * 100}%`,
                top: `${(coord.y / 500) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
              className="z-30 group cursor-pointer"
              onMouseEnter={() => setHoveredSystem(sys)}
              onMouseLeave={() => setHoveredSystem(null)}
              onClick={() => {
                if (isJamali) {
                  onSelectSystem(sys.id);
                } else {
                  setSelectedSystemModal(sys);
                }
              }}
            >
              {/* Highlight Ring for JAMALI */}
              {isJamali && (
                <div className="absolute -inset-1.5 rounded-2xl bg-[#0046ad]/15 animate-ping pointer-events-none" />
              )}

              {/* Pin Card */}
              <div
                className={`transition-all duration-200 rounded-xl p-2.5 border flex items-center gap-2.5 shadow-md ${
                  isJamali
                    ? 'bg-white border-[#0046ad] shadow-[0_4px_16px_rgba(0,70,173,0.2)] scale-105 ring-2 ring-[#0046ad]/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg'
                }`}
              >
                {/* Risk Level Badge */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${badgeClass}`}
                >
                  <Zap className="w-3.5 h-3.5" />
                </div>

                <div className="text-left whitespace-nowrap">
                  <div className="font-bold text-xs text-slate-800 group-hover:text-[#0046ad] transition-colors flex items-center gap-1.5">
                    <span>{sys.name}</span>
                    {isJamali && (
                      <span className="text-[9px] bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] px-1 py-0.2 rounded font-bold">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{sys.upbCount} UP2B</span>
                    <span>•</span>
                    <span>{sys.subsystemCount} Subsistem</span>
                  </div>
                </div>
              </div>

              {/* Tooltip Card on Hover */}
              {hoveredSystem?.id === sys.id && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl p-3 shadow-xl z-50 text-left pointer-events-none">
                  <div className="text-xs font-bold text-slate-800 flex justify-between items-center mb-1">
                    <span>{sys.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${badgeClass}`}>
                      {sys.riskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                    {sys.description}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[10px] border-t border-slate-100 pt-1.5 text-slate-500 font-mono">
                    <div>GI / GITET: <span className="text-slate-800 font-bold">{sys.giCount}</span></div>
                    <div>IBT: <span className="text-slate-800 font-bold">{sys.ibtCount}</span></div>
                  </div>
                  {isJamali && (
                    <div className="mt-2 text-[10px] text-[#0046ad] font-bold text-center bg-[#eff6ff] py-1 rounded border border-[#dbeafe]">
                      Klik pin untuk membuka Sistem JAMALI →
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Center Instruction Tag */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-600 shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0046ad] animate-pulse" />
          <span>Klik pada pin <strong>"Jawa, Madura dan Bali"</strong> untuk melihat detail sistem</span>
        </div>

        {/* Bottom Left Button: Lihat Daftar Sistem */}
        <button
          onClick={() => onSelectSystem('jamali')}
          className="absolute bottom-6 left-6 bg-white hover:bg-slate-50 border border-slate-200 text-[#0046ad] font-bold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-all hover:scale-105"
        >
          <ListFilter className="w-4 h-4" />
          <span>Lihat Daftar Sistem</span>
        </button>
      </div>

      {/* Modal for other systems */}
      {selectedSystemModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800">Sistem {selectedSystemModal.name}</h3>
              <button
                onClick={() => setSelectedSystemModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedSystemModal.description}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500">UP2B</div>
                <div className="text-sm font-bold text-[#0046ad]">{selectedSystemModal.upbCount}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500">Subsistem</div>
                <div className="text-sm font-bold text-[#ea580c]">{selectedSystemModal.subsystemCount}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500">GI / GITET</div>
                <div className="text-sm font-bold text-[#16a34a]">{selectedSystemModal.giCount}</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedSystemModal(null);
                  onSelectSystem('jamali');
                }}
                className="flex-1 bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs py-2 rounded-xl transition-colors"
              >
                Buka Sistem JAMALI
              </button>
              <button
                onClick={() => setSelectedSystemModal(null)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
