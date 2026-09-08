import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import { SLDEdgeData } from '../../types/graph';

interface NormalLineContentProps {
  line: SLDEdgeData;
}

export const NormalLineContent: React.FC<NormalLineContentProps> = ({ line }) => {
  const sourceName = line.source.replace(/^(GI_|GEN_)/, '');
  const targetName = line.target.replace(/^(GI_|GEN_)/, '');

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-[#f8fafc] flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#eff6ff] border border-[#dbeafe] flex items-center justify-center text-[#0046ad] shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#0046ad] font-bold">
            INFORMASI SALURAN
          </span>
          <h3 className="font-extrabold text-sm text-[#1e293b] mt-0.5 leading-snug">
            {line.name}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {line.voltage} • Transmisi Daya Tegangan Ekstra Tinggi
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Technical Data Card */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
            <div>
              <span className="text-slate-500 block text-[10px]">Nama Saluran</span>
              <span className="font-semibold text-slate-800">{line.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Tegangan</span>
              <span className="font-semibold text-[#0046ad]">{line.voltage}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Dari GI</span>
              <span className="font-semibold text-slate-700">{sourceName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Ke GI</span>
              <span className="font-semibold text-slate-700">{targetName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Jumlah Sirkit</span>
              <span className="font-semibold text-slate-700">{line.circuitCount} Sirkit</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Status Operasi</span>
              <span className="inline-flex items-center gap-1 text-[#16a34a] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                {line.operatingStatus}
              </span>
            </div>
            {line.lengthKm && (
              <div>
                <span className="text-slate-500 block text-[10px]">Panjang Jalur</span>
                <span className="font-mono text-slate-700">{line.lengthKm} km</span>
              </div>
            )}
          </div>

          {/* Loading Gauges */}
          <div className="border-t border-slate-200 pt-2.5 mt-2">
            <span className="text-slate-700 block text-[11px] font-bold mb-2">
              Loading Saat Ini:
            </span>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600">Sirkit 1:</span>
                  <span className="font-bold text-[#0046ad]">{line.loading.circuit1}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0046ad] transition-all duration-500"
                    style={{ width: `${line.loading.circuit1}%` }}
                  />
                </div>
              </div>

              {typeof line.loading.circuit2 === 'number' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Sirkit 2:</span>
                    <span className="font-bold text-[#0046ad]">{line.loading.circuit2}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0046ad] transition-all duration-500"
                      style={{ width: `${line.loading.circuit2}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Kerawanan: Aman / Normal Card */}
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3.5 flex items-start gap-2.5 text-[#15803d]">
          <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-xs">Status Kerawanan:</div>
            <div className="text-xs text-[#15803d] mt-0.5 font-semibold">
              ✓ Tidak terdapat kerawanan
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Saluran transmisi beroperasi dalam parameter termal andal dengan margin stabilitas N-1 terpenuhi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
