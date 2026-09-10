import React, { useState } from 'react';
import { Layers, CheckCircle2, ShieldAlert, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { SLDNodeData } from '../../types/graph';
import { risksData } from '../../data/risks';

interface IBTContentProps {
  node: SLDNodeData;
  onOpenRisk?: (riskId: number) => void;
}

export const IBTContent: React.FC<IBTContentProps> = ({ node, onOpenRisk }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'risk'>((node.condition || node.riskStatus !== 'Normal') ? 'risk' : 'info');
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
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#16a34a] font-bold">
              INFORMASI IBT (INTERBUS TRANSFORMER)
            </span>
            {node.uit && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                UIT {node.uit}
              </span>
            )}
          </div>
          <h3 className="font-extrabold text-base text-[#1e293b] mt-0.5 leading-snug">
            {node.name}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Transformator Daya Interbus Penurun Tegangan 500 kV ke 150 kV
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-colors ${
            activeTab === 'info'
              ? 'border-[#0046ad] text-[#0046ad]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Informasi
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-colors ${
            activeTab === 'risk'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Kerawanan
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'info' && (
          <>
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
                    {node.status || 'Beroperasi'}
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
                      associatedRisk || node.riskStatus !== 'Normal' ? 'text-[#ea580c]' : 'text-[#16a34a]'
                    }`}
                  >
                    {String(associatedRisk ? associatedRisk.riskLevel : (node.riskStatus || 'Aman'))}
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

            {/* Associated Risk Link */}
            {associatedRisk && (
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
            )}
          </>
        )}

        {/* Tab 2: KERAWANAN (Persis Gambar 2 Pengguna) */}
        {activeTab === 'risk' && (
          <div className="space-y-3.5 text-xs">
            {/* Card 1: KONDISI / PERMASALAHAN */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl shadow-xs">
              <div className="font-extrabold text-amber-800 text-[11px] flex items-center gap-1.5 uppercase tracking-wider mb-1.5">
                <span className="text-amber-600 text-sm">⚠️</span>
                KONDISI / PERMASALAHAN
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px] whitespace-pre-line font-medium">
                {String(
                  node.condition ||
                    `Pembebanan ${node.name} mendekati batas kriteria N-1. Memerlukan penyesuaian kontinjensi sistem transmisi dan dispatching beban.`
                )}
              </p>
            </div>

            {/* Card 2: DAMPAK */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl shadow-xs">
              <div className="font-extrabold text-rose-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                DAMPAK
              </div>
              <div className="text-slate-700 leading-relaxed text-[11px] whitespace-pre-line font-medium">
                {String(
                  node.impact ||
                    `1. Pemeliharaan IBT sulit dilakukan jika kontinuitas beban tinggi.\n2. Terjadi pemadaman atau pelepasan beban apabila salah satu IBT trip.`
                )}
              </div>
            </div>

            {/* Card 3: MITIGASI */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl shadow-xs">
              <div className="font-extrabold text-blue-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider mb-1.5">
                <span className="text-blue-600 font-bold text-sm">✓</span>
                MITIGASI
              </div>
              <div className="text-slate-700 leading-relaxed text-[11px] whitespace-pre-line font-medium">
                {String(
                  node.mitigation ||
                    `1. Terpasang DS OLS dengan target pelepasan beban terukur.\n2. Pemeliharaan IBT saat beban rendah dan saat unit pembangkit utama beroperasi.`
                )}
              </div>
            </div>

            {/* Card 4: USULAN / SOLUSI (JANGKA PENDEK) */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-300 rounded-xl shadow-xs">
              <div className="font-extrabold text-emerald-800 text-[11px] uppercase tracking-wider mb-1.5">
                USULAN / SOLUSI (JANGKA PENDEK)
              </div>
              <div className="bg-white/90 border border-emerald-200/80 rounded-lg p-2.5 text-slate-700 leading-relaxed text-[11px] whitespace-pre-line font-medium shadow-2xs">
                {String(
                  node.solution ||
                    `Jangka Pendek :\nUprating IBT dan optimalisasi sistem proteksi sesuai RUPTL.`
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
