import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import { SLDEdgeData } from '../../types/graph';

interface NormalLineContentProps {
  line: SLDEdgeData;
}

export const NormalLineContent: React.FC<NormalLineContentProps> = ({ line }) => {
  const sourceName = String(line?.source || (line as any)?.from || (line as any)?.sourceName || 'GI Pangkal').replace(/^(GI_|GEN_|FEED_)/, '') || 'GI Pangkal';
  const targetName = String(line?.target || (line as any)?.to || (line as any)?.targetName || 'GI Ujung').replace(/^(GI_|GEN_|FEED_)/, '') || 'GI Ujung';
  const circuit1 = line?.loading?.circuit1 ?? (line as any)?.loadingPct ?? 65;
  const circuit2 = line?.loading?.circuit2;
  const isRawan = Boolean(line?.riskLevel && (line.riskLevel as any) !== 'Normal') || Boolean(line?.status && line.status !== 'normal');
  const riskLabel = line?.riskLevel ? String(line.riskLevel) : isRawan ? 'Rawan (N-1)' : 'Normal';

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Header */}
      <div className={`p-4 border-b flex items-start gap-3 ${isRawan ? 'bg-red-50/70 border-red-200' : 'bg-[#f8fafc] border-slate-200'}`}>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
          isRawan ? 'bg-red-100 text-[#dc2626] border-red-200' : 'bg-[#eff6ff] text-[#0046ad] border-[#dbeafe]'
        }`}>
          <Zap className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[11px] font-mono uppercase tracking-wider font-bold ${isRawan ? 'text-[#dc2626]' : 'text-[#0046ad]'}`}>
              INFORMASI SALURAN TRANSMISI
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
              isRawan ? 'bg-[#dc2626] text-white animate-pulse' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {riskLabel}
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-[#1e293b] mt-0.5 leading-snug">
            {line?.name || 'Penghantar Transmisi'}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {line?.voltage || '150 kV'} • Transmisi Interkoneksi Tegangan Tinggi
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
              <span className="font-semibold text-slate-800">{line?.name || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Tegangan</span>
              <span className="font-semibold text-[#0046ad]">{line?.voltage || '150 kV'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Dari GI (Pangkal)</span>
              <span className="font-semibold text-slate-700">{sourceName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Ke GI (Ujung)</span>
              <span className="font-semibold text-slate-700">{targetName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Jumlah Sirkit</span>
              <span className="font-semibold text-slate-700">{line?.circuitCount || 1} Sirkit</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Status Operasi</span>
              <span className="inline-flex items-center gap-1 text-[#16a34a] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                {line?.operatingStatus || 'Beroperasi'}
              </span>
            </div>
            {line?.lengthKm && (
              <div>
                <span className="text-slate-500 block text-[10px]">Panjang Jalur</span>
                <span className="font-mono text-slate-700">{line.lengthKm} km</span>
              </div>
            )}
          </div>

          {/* Loading Gauges */}
          <div className="border-t border-slate-200 pt-2.5 mt-2">
            <span className="text-slate-700 block text-[11px] font-bold mb-2">
              Pembebanan Saat Ini:
            </span>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600">Sirkit 1:</span>
                  <span className={`font-bold font-mono ${circuit1 > 80 ? 'text-[#dc2626]' : 'text-[#0046ad]'}`}>
                    {circuit1}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      circuit1 > 80 ? 'bg-[#dc2626]' : circuit1 > 70 ? 'bg-amber-500' : 'bg-[#0046ad]'
                    }`}
                    style={{ width: `${Math.min(100, circuit1)}%` }}
                  />
                </div>
              </div>

              {typeof circuit2 === 'number' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Sirkit 2:</span>
                    <span className={`font-bold font-mono ${circuit2 > 80 ? 'text-[#dc2626]' : 'text-[#0046ad]'}`}>
                      {circuit2}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        circuit2 > 80 ? 'bg-[#dc2626]' : circuit2 > 70 ? 'bg-amber-500' : 'bg-[#0046ad]'
                      }`}
                      style={{ width: `${Math.min(100, circuit2)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Kerawanan Card */}
        {isRawan ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-[#dc2626]">
            <span className="text-base">⚠️</span>
            <div>
              <div className="font-bold text-xs">Peringatan Kerawanan Transmisi:</div>
              <div className="text-xs text-[#dc2626] mt-0.5 font-semibold">
                Status: {riskLabel}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Penghantar ini memiliki potensi kelebihan beban atau kontinjensi N-1. Perlu pemantauan dispatching beban secara berkala.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3.5 flex items-start gap-2.5 text-[#15803d]">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs">Status Kerawanan:</div>
              <div className="text-xs text-[#15803d] mt-0.5 font-semibold">
                ✓ Beroperasi Normal & Aman
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Saluran transmisi beroperasi dalam batas termal yang andal dengan kriteria kontinuitas sistem terpenuhi.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
