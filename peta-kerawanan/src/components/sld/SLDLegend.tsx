import React from 'react';

export const SLDLegend: React.FC = () => {
  return (
    <div className="h-11 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-xs text-slate-700 z-20 select-none overflow-x-auto shadow-xs">
      {/* Legend Items */}
      <div className="flex items-center gap-5 shrink-0">
        {/* Saluran Normal */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-[#00d2d3] rounded-full shadow-[0_0_4px_rgba(0,210,211,0.8)]" />
          <span className="text-[11px] text-slate-600 font-medium">Saluran 500 kV (Normal)</span>
        </div>

        {/* Saluran Bermasalah */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-[#dc2626] rounded-full shadow-[0_0_4px_rgba(220,38,38,0.8)]" />
          <span className="text-[11px] text-slate-600 font-medium">Saluran 500 kV (Bermasalah)</span>
        </div>

        {/* Saluran Planned */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t border-dashed border-slate-400" />
          <span className="text-[11px] text-slate-500 font-medium">Saluran 500 kV (Planned)</span>
        </div>

        {/* Gardu Induk (GI/GITET) */}
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-1.5 bg-[#0081c9] rounded-full" />
          <span className="text-[11px] text-slate-600 font-medium">Gardu Induk (GI/GITET)</span>
        </div>

        {/* Pembangkit (1. Pembangkit, 2. Trafo, 3. CB) */}
        <div className="flex items-center gap-1.5" title="Bay Pembangkit: 1. Pembangkit, 2. Trafo Step-Up, 3. CB / PMT">
          <div className="flex flex-col items-center justify-center -space-y-0.5">
            <div className="w-2.5 h-2.5 rounded-full border border-[#22c55e] flex items-center justify-center text-[7px] font-serif leading-none text-[#22c55e]">
              ~
            </div>
            <div className="w-0.5 h-1 bg-[#2563eb]" />
            <div className="flex flex-col -space-y-1">
              <div className="w-2 h-2 rounded-full border border-[#22c55e]" />
              <div className="w-2 h-2 rounded-full border border-[#ef4444]" />
            </div>
            <div className="w-0.5 h-1 bg-[#ef4444]" />
            <div className="w-1.5 h-2 bg-[#ef4444] rounded-[1px]" />
          </div>
          <span className="text-[11px] text-slate-600 font-medium">Bay Pembangkit (Gen - Trafo - CB)</span>
        </div>

        {/* IBT */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col -space-y-1">
            <div className="w-2.5 h-2.5 rounded-full border border-[#16a34a]" />
            <div className="w-2.5 h-2.5 rounded-full border border-[#16a34a]" />
          </div>
          <span className="text-[11px] text-slate-600 font-medium">IBT (Interbus Transformer)</span>
        </div>

        {/* Titik Kerawanan */}
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 100 100" className="w-3.5 h-3.5">
            <polygon
              points="50,0 63,22 88,12 85,38 100,50 85,62 88,88 63,78 50,100 37,78 12,88 15,62 0,50 15,38 12,12 37,22"
              fill="#f1c40f"
              stroke="#b45309"
              strokeWidth="5"
            />
          </svg>
          <span className="text-[11px] text-[#b45309] font-bold">Titik Kerawanan</span>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 font-mono hidden xl:block">
        MANTAPS PLN • UIP2B JAMALI • Buku Kerawanan 2026
      </div>
    </div>
  );
};
