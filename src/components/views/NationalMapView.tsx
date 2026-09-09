import React, { useState } from 'react';
import { powerSystems } from '../../data/systems';
import { PowerSystem } from '../../types/system';
import { ActiveView } from '../layout/Header';
import { Breadcrumb } from '../layout/Breadcrumb';
import { ListFilter, MapPin } from 'lucide-react';

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

  const systemMapCoords: Record<string, { x: number; y: number }> = {
    sumatera: { x: 195, y: 220 },
    jamali: { x: 330, y: 395 },
    kalimantan: { x: 445, y: 220 },
    sulawesi: { x: 630, y: 240 },
    'nusa-tenggara': { x: 550, y: 415 },
    maluku: { x: 765, y: 245 },
    papua: { x: 890, y: 285 }
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

        {/* Legend Box at top right (Merah N-1, Kuning N-2, Abu-Abu N-1-2) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs text-xs space-y-1.5">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Legenda Tingkat Kerawanan
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#dc2626] shrink-0 shadow-xs" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-800 font-bold text-xs">Merah (N-1)</span>
                <span className="text-slate-500 text-[10px]">— Kerawanan Tunggal</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#eab308] shrink-0 shadow-xs" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-800 font-bold text-xs">Kuning (N-2)</span>
                <span className="text-slate-500 text-[10px]">— Kerawanan Ganda</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#64748b] shrink-0 shadow-xs" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-800 font-bold text-xs">Abu-Abu (N-1-2)</span>
                <span className="text-slate-500 text-[10px]">— Kerawanan Kombinasi</span>
              </div>
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

        {/* Region Markers with Pin Point icon, UPB, Subsistem, and Merah/Kuning/Abu-Abu counts */}
        {powerSystems.map((sys) => {
          const coord = systemMapCoords[sys.id] || { x: 500, y: 250 };
          const isJamali = sys.id === 'jamali';

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

              {/* Pin Card Box */}
              <div
                className={`transition-all duration-200 rounded-xl p-2.5 border flex flex-col shadow-md bg-white ${
                  isJamali
                    ? 'border-[#0046ad] shadow-[0_4px_16px_rgba(0,70,173,0.2)] scale-105 ring-2 ring-[#0046ad]/30'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                }`}
              >
                {/* Header: Pin Point Icon + System Name + Active Tag */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isJamali
                        ? 'bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe]'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 fill-current" />
                  </div>

                  <div className="text-left whitespace-nowrap">
                    <div className="font-bold text-xs text-slate-800 group-hover:text-[#0046ad] transition-colors flex items-center gap-1.5">
                      <span>{sys.name}</span>
                      {isJamali && (
                        <span className="text-[9px] bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] px-1.5 py-0.2 rounded font-bold">
                          AKTIF
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                      <span>{sys.upbCount} UP2B</span>
                      <span>•</span>
                      <span>{sys.subsystemCount} Subsistem</span>
                    </div>
                  </div>
                </div>

                {/* Risk Breakdown: Merah (N-1), Kuning (N-2), Abu-Abu (N-1-2) */}
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px]">
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#fee2e2] text-[#dc2626] font-bold border border-[#fecaca]"
                    title="Merah (N-1): Kerawanan Tunggal"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                    <span>N-1: {sys.risksN1}</span>
                  </div>
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#fef9c3] text-[#a16207] font-bold border border-[#fef08a]"
                    title="Kuning (N-2): Kerawanan Ganda"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                    <span>N-2: {sys.risksN2}</span>
                  </div>
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#475569] font-bold border border-[#cbd5e1]"
                    title="Abu-Abu (N-1-2): Kerawanan Kombinasi"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
                    <span>N-1-2: {sys.risksN12}</span>
                  </div>
                </div>
              </div>

              {/* Tooltip Card on Hover */}
              {hoveredSystem?.id === sys.id && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl p-3 shadow-xl z-50 text-left pointer-events-none">
                  <div className="text-xs font-bold text-slate-800 flex justify-between items-center mb-1">
                    <span>{sys.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe]">
                      {sys.upbCount} UP2B • {sys.subsystemCount} Sub
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                    {sys.description}
                  </p>

                  <div className="grid grid-cols-3 gap-1 text-[10px] text-center border-t border-slate-100 pt-1.5 mb-2 font-mono">
                    <div className="bg-[#fee2e2]/60 p-1 rounded border border-[#fecaca]">
                      <div className="text-[9px] text-[#dc2626] font-bold">Merah (N-1)</div>
                      <div className="font-extrabold text-xs text-[#991b1b]">{sys.risksN1}</div>
                    </div>
                    <div className="bg-[#fef9c3]/60 p-1 rounded border border-[#fef08a]">
                      <div className="text-[9px] text-[#a16207] font-bold">Kuning (N-2)</div>
                      <div className="font-extrabold text-xs text-[#854d0e]">{sys.risksN2}</div>
                    </div>
                    <div className="bg-[#f1f5f9] p-1 rounded border border-[#cbd5e1]">
                      <div className="text-[9px] text-[#475569] font-bold">Abu-Abu</div>
                      <div className="font-extrabold text-xs text-[#334155]">{sys.risksN12}</div>
                    </div>
                  </div>

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
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0046ad]" />
                <h3 className="font-bold text-base text-slate-800">Sistem {selectedSystemModal.name}</h3>
              </div>
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
                <div className="text-sm font-bold text-slate-800">{selectedSystemModal.subsystemCount}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500">GI / GITET</div>
                <div className="text-sm font-bold text-[#16a34a]">{selectedSystemModal.giCount}</div>
              </div>
            </div>

            {/* Kerawanan Summary in Modal */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Ringkasan Kerawanan Sistem:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#fee2e2] p-2 rounded-lg border border-[#fecaca]">
                  <div className="text-[10px] text-[#dc2626] font-bold">Merah (N-1)</div>
                  <div className="text-sm font-black text-[#991b1b]">{selectedSystemModal.risksN1}</div>
                </div>
                <div className="bg-[#fef9c3] p-2 rounded-lg border border-[#fef08a]">
                  <div className="text-[10px] text-[#a16207] font-bold">Kuning (N-2)</div>
                  <div className="text-sm font-black text-[#854d0e]">{selectedSystemModal.risksN2}</div>
                </div>
                <div className="bg-[#f1f5f9] p-2 rounded-lg border border-[#cbd5e1]">
                  <div className="text-[10px] text-[#475569] font-bold">Abu-Abu (N-1-2)</div>
                  <div className="text-sm font-black text-[#334155]">{selectedSystemModal.risksN12}</div>
                </div>
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
