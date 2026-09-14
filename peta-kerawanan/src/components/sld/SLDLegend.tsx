import React, { useState } from 'react';
import { SLDLegendModal } from './SLDLegendModal';

export const SLDLegend: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="h-11 bg-slate-900/90 border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 z-20 select-none overflow-x-auto shadow-xs backdrop-blur-xs">
        {/* Legend Items */}
        <div className="flex items-center gap-5 shrink-0">
          {/* Saluran Normal */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-[#00d2d3] rounded-full shadow-[0_0_4px_rgba(0,210,211,0.8)]" />
            <span className="text-[11px] text-slate-300 font-medium">500 kV</span>
          </div>

          {/* Saluran 150 kV */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-blue-500 rounded-full shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
            <span className="text-[11px] text-slate-300 font-medium">150 kV</span>
          </div>

          {/* Saluran Bermasalah / Rawan */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-[#ef4444] rounded-full shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
            <span className="text-[11px] text-red-400 font-medium">Kondisi Rawan</span>
          </div>

          {/* Busbar */}
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-1.5 bg-cyan-400 rounded-full" />
            <span className="text-[11px] text-slate-300 font-medium">Busbar</span>
          </div>

          {/* Pembangkit */}
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full border border-emerald-400 flex items-center justify-center text-[8px] text-emerald-400 font-bold leading-none">
              ~
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Generator</span>
          </div>

          {/* IBT */}
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              <div className="w-2.5 h-2.5 rounded-full border border-blue-500" />
              <div className="w-2.5 h-2.5 rounded-full border border-red-500" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">IBT</span>
          </div>

          {/* Beban (Segitiga Terbalik) */}
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3 h-3">
              <polygon points="2,4 22,4 12,20" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            </svg>
            <span className="text-[11px] text-slate-300 font-medium">Beban</span>
          </div>

          {/* Titik Kerawanan */}
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 100 100" className="w-3 h-3">
              <polygon
                points="50,0 63,22 88,12 85,38 100,50 85,62 88,88 63,78 50,100 37,78 12,88 15,62 0,50 15,38 12,12 37,22"
                fill="#facc15"
                stroke="#ef4444"
                strokeWidth="4"
              />
            </svg>
            <span className="text-[11px] text-amber-400 font-bold">Kerawanan</span>
          </div>
        </div>

        {/* Right Side: Trigger Button for Full Legend Modal */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-xs"
          >
            <span>📖</span>
            <span>Legend Simbol SLD</span>
          </button>
          <div className="text-[10px] text-slate-500 font-mono hidden xl:block">
            MANTAPS PLN • Standar SLD
          </div>
        </div>
      </div>

      <SLDLegendModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
