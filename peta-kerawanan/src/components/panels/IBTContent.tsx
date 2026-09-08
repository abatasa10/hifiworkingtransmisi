import React from 'react';
import { Layers, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SLDNodeData } from '../../types/graph';
import { risksData } from '../../data/risks';

interface IBTContentProps {
  node: SLDNodeData;
  onOpenRisk?: (riskId: number) => void;
}

export const IBTContent: React.FC<IBTContentProps> = ({ node, onOpenRisk }) => {
  const loading = node.loading ?? 55;
  const circuits = node.circuits ?? 2;
  const associatedRisk = risksData.find(
    (r) => r.relatedAssetIds?.includes(node.id) || r.id === node.riskId
  );

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-[#f8fafc] flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#dcfce7] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a] shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#16a34a] font-bold">
            INFORMASI IBT (INTERBUS TRANSFORMER)
          </span>
          <h3 className="font-extrabold text-base text-[#1e293b] mt-0.5 leading-snug">
            {node.name}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Transformator Daya Interbus Penurun Tegangan 500 kV ke 150 kV
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Technical Data Card */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
            <div>
              <span className="text-slate-500 block text-[10px]">Nama Peralatan</span>
              <span className="font-semibold text-slate-800">{node.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Tegangan Transformasi</span>
              <span className="font-mono font-bold text-[#0046ad]">
                {node.voltage || '500/150 kV'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Status Operasi</span>
              <span className="inline-flex items-center gap-1 text-[#16a34a] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                {node.status}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Jumlah Unit / Sirkit</span>
              <span className="font-semibold text-slate-700">{circuits} Unit Trafo</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Kapasitas Total</span>
              <span className="font-mono text-slate-700">{node.capacityMVA || 1000} MVA</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Tingkat Kerawanan</span>
              <span
                className={`font-bold ${
                  associatedRisk ? 'text-[#ea580c]' : 'text-[#16a34a]'
                }`}
              >
                {associatedRisk ? associatedRisk.riskLevel : 'Aman'}
              </span>
            </div>
          </div>

          {/* Loading Meter */}
          <div className="border-t border-slate-200 pt-2.5 mt-2">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600 font-medium">Loading Saat Ini:</span>
              <span className="font-bold text-[#0046ad]">{loading}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  loading > 80 ? 'bg-[#dc2626]' : loading > 60 ? 'bg-[#f1c40f]' : 'bg-[#16a34a]'
                }`}
                style={{ width: `${loading}%` }}
              />
            </div>
          </div>
        </div>

        {/* Associated Risk or Normal Status */}
        {associatedRisk ? (
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[#b45309] font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-[#ea580c]" />
              Kerawanan Terkait: Kerawanan #{associatedRisk.number}
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              IBT ini dipasok secara radial oleh saluran berisiko tinggi:{' '}
              <span className="text-[#b45309] font-bold">{associatedRisk.name}</span>.
            </p>
            <button
              onClick={() => onOpenRisk?.(associatedRisk.number)}
              className="w-full py-2 px-3 rounded-lg bg-[#ffedd5] hover:bg-[#fed7aa] border border-[#fdba74] text-[#ea580c] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              Lihat Rincian Kerawanan #{associatedRisk.number}
            </button>
          </div>
        ) : (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3.5 flex items-start gap-2.5 text-[#15803d]">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs">Status Kerawanan:</div>
              <div className="text-xs text-[#15803d] mt-0.5 font-semibold">
                ✓ Tidak terdapat kerawanan.
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Kondisi transformator dan cadangan N-1 beroperasi dalam batas aman.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
