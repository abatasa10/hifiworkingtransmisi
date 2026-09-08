import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Layers, History, ArrowRight } from 'lucide-react';
import { RiskItem } from '../../types/risk';
import { RouteMiniMap } from './RouteMiniMap';

interface RiskDetailContentProps {
  risk: RiskItem;
  onSelectAsset?: (assetId: string) => void;
}

export const RiskDetailContent: React.FC<RiskDetailContentProps> = ({ risk, onSelectAsset }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'risk' | 'assets' | 'history'>('info');

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Risk Header (MANTAPS style) */}
      <div className="p-4 border-b border-slate-200 bg-[#f8fafc] flex items-start gap-3">
        {/* Starburst badge icon */}
        <div className="relative shrink-0 flex items-center justify-center w-10 h-10 mt-0.5">
          <svg viewBox="0 0 100 100" className="w-10 h-10 filter drop-shadow-sm">
            <polygon
              points="50,0 63,22 88,12 85,38 100,50 85,62 88,88 63,78 50,100 37,78 12,88 15,62 0,50 15,38 12,12 37,22"
              fill={
                risk.riskLevel === 'Sangat Rawan'
                  ? '#dc2626'
                  : risk.riskLevel === 'Sedang'
                  ? '#f1c40f'
                  : '#ea580c'
              }
              stroke="#ffffff"
              strokeWidth="4"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-slate-900 font-black text-sm">
            {risk.number}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#b45309] font-bold">
              KERAWANAN #{risk.number}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                risk.riskLevel === 'Sangat Rawan'
                  ? 'bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]'
                  : risk.riskLevel === 'Sedang'
                  ? 'bg-[#fef9c3] text-[#ca8a04] border border-[#fde047]'
                  : 'bg-[#ffedd5] text-[#ea580c] border border-[#fdba74]'
              }`}
            >
              ● {risk.riskLevel}
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-[#1e293b] mt-0.5 leading-snug">
            {risk.name}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {risk.assetType} • {risk.voltage} • {risk.location}
          </div>
        </div>
      </div>

      {/* Segmented Tabs (matching MANTAPS navbar style) */}
      <div className="flex border-b border-slate-200 bg-white px-2 text-xs">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-1.5 px-3 py-2.5 font-semibold border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-[#0046ad] text-[#0046ad] font-bold bg-[#eff6ff]/60'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          Informasi
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`flex items-center gap-1.5 px-3 py-2.5 font-semibold border-b-2 transition-colors ${
            activeTab === 'risk'
              ? 'border-[#ea580c] text-[#ea580c] font-bold bg-[#ffedd5]/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Kerawanan
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-1.5 px-3 py-2.5 font-semibold border-b-2 transition-colors ${
            activeTab === 'assets'
              ? 'border-[#0046ad] text-[#0046ad] font-bold bg-[#eff6ff]/60'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Aset Terkait
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 py-2.5 font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-[#7c3aed] text-[#7c3aed] font-bold bg-[#f5f3ff]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Riwayat
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: INFORMASI */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Technical Specifications Table */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">No. Kerawanan</span>
                  <span className="font-extrabold text-[#ea580c] text-sm">#{risk.number}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tegangan Operasi</span>
                  <span className="font-semibold text-[#0046ad]">{risk.voltage}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Dari GI</span>
                  <span className="font-semibold text-slate-700">{risk.sourceGiId?.replace('GI_', '') || 'Gandul'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Ke GI</span>
                  <span className="font-semibold text-slate-700">{risk.targetGiId?.replace('GI_', '') || 'Kembangan'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Panjang Saluran</span>
                  <span className="font-mono text-slate-700">{risk.lengthKm || '72,5'} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Jumlah Sirkit</span>
                  <span className="font-semibold text-slate-700">{risk.circuits || 2} Sirkit</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Status Operasi</span>
                  <span className="inline-flex items-center gap-1 text-[#16a34a] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                    {risk.operatingStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tingkat Kerawanan</span>
                  <span className="font-bold text-[#ca8a04]">{risk.riskLevel}</span>
                </div>
              </div>

              {/* Current Loading Meters */}
              <div className="border-t border-slate-200 pt-2.5 mt-2">
                <span className="text-slate-700 block text-[11px] font-bold mb-2">
                  Pembebanan Saat Ini:
                </span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">Sirkit 1:</span>
                      <span className="font-bold text-[#0046ad]">{risk.loadingCircuit1 ?? 55}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#ea580c]"
                        style={{ width: `${risk.loadingCircuit1 ?? 55}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">Sirkit 2:</span>
                      <span className="font-bold text-[#0046ad]">{risk.loadingCircuit2 ?? 43}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0046ad]"
                        style={{ width: `${risk.loadingCircuit2 ?? 43}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peta Lokasi / Route Map */}
            <div>
              <span className="text-slate-700 text-[11px] font-bold block mb-1.5">
                Peta Lokasi & Jalur Transmisi:
              </span>
              <RouteMiniMap
                sourceName="GI Gandul"
                targetName="GI Kembangan"
                middleName="GI Duri Kosambi"
              />
            </div>
          </div>
        )}

        {/* TAB 2: KERAWANAN */}
        {activeTab === 'risk' && (
          <div className="space-y-3 text-xs">
            {/* KONDISI / PERMASALAHAN */}
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3.5 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-[#b45309] font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Kondisi / Permasalahan
              </div>
              <p className="text-slate-800 leading-relaxed text-xs">
                {risk.condition}
              </p>
            </div>

            {/* DAMPAK */}
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3.5 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-[#dc2626] font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                Dampak
              </div>
              <p className="text-slate-800 leading-relaxed text-xs">
                {risk.impact}
              </p>
            </div>

            {/* MITIGASI */}
            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-3.5 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-[#0046ad] font-bold text-xs uppercase tracking-wider">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Mitigasi
              </div>
              <p className="text-slate-800 leading-relaxed text-xs">
                {risk.mitigation}
              </p>
            </div>

            {/* USULAN / SOLUSI */}
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3.5 space-y-2 shadow-xs">
              <div className="text-[#15803d] font-bold text-xs uppercase tracking-wider">
                Usulan / Solusi (Jangka Pendek)
              </div>
              <div className="space-y-2">
                {risk.solution.shortTerm.map((sol, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white border border-[#dcfce7] text-slate-800 leading-relaxed text-xs"
                  >
                    {sol}
                  </div>
                ))}
              </div>

              {risk.solution.mediumTerm && risk.solution.mediumTerm.length > 0 && (
                <div className="pt-2 border-t border-[#dcfce7]">
                  <div className="text-slate-600 font-bold text-[11px] mb-1">
                    Jangka Menengah / Panjang:
                  </div>
                  <div className="space-y-1">
                    {risk.solution.mediumTerm.map((sol, i) => (
                      <div key={i} className="text-slate-700 text-[11px] flex items-start gap-1.5">
                        <span className="text-[#16a34a] mt-0.5">•</span>
                        <span>{sol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ASET TERKAIT */}
        {activeTab === 'assets' && (
          <div className="space-y-2 text-xs">
            <div className="text-slate-500 text-[11px] mb-2">
              Aset sistem tenaga listrik yang terdampak pada jalur kerawanan ini:
            </div>
            {[
              { id: 'GI_GNDUL', name: 'GITET Gandul 500 kV', role: 'Gardu Induk Pangkal (Source)', type: 'GITET' },
              { id: 'GI_DKSBI', name: 'GITET Duri Kosambi 500 kV', role: 'Gardu Induk Antara / Pasokan Radial', type: 'GITET' },
              { id: 'GI_KMBNG', name: 'GITET Kembangan 500 kV', role: 'Gardu Induk Ujung (Target)', type: 'GITET' },
              { id: 'GI_MKRNG', name: 'GITET Muara Karang 500 kV', role: 'Gardu Induk Radial Terpasok', type: 'GITET' },
              { id: 'IBT_DKSBI', name: 'IBT 1 & 2 Duri Kosambi (500/150 kV)', role: 'Transformator Penurun Tegangan', type: 'IBT' },
              { id: 'IBT_MKRNG', name: 'IBT 1 & 2 Muara Karang (500/150 kV)', role: 'Transformator Penurun Tegangan', type: 'IBT' }
            ].map((asset) => (
              <button
                key={asset.id}
                onClick={() => onSelectAsset?.(asset.id)}
                className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-slate-200 hover:border-[#0046ad] hover:bg-[#eff6ff] flex items-center justify-between text-left transition-colors group shadow-2xs"
              >
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-[#0046ad] flex items-center gap-1.5">
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                      {asset.type}
                    </span>
                    {asset.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{asset.role}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0046ad] transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        )}

        {/* TAB 4: RIWAYAT */}
        {activeTab === 'history' && (
          <div className="space-y-3 text-xs">
            <div className="text-slate-500 text-[11px]">Catatan evaluasi operasi dan kerawanan sistem:</div>
            <div className="border-l-2 border-slate-200 ml-2 pl-3 space-y-3">
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#0046ad]" />
                <div className="font-bold text-slate-800">Kajian Buku Kerawanan Tahun 2026</div>
                <div className="text-[10px] text-slate-400">30 Juni 2026 • Tim Operasi Sistem UIP2B JAMALI</div>
                <p className="text-slate-600 text-[11px] mt-1">
                  Evaluasi pembebanan Gandul-Durkos 55% dan Kembangan-Durkos 43%. Status kerawanan ditetapkan Sedang dengan mitigasi Defense Scheme N-2.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400" />
                <div className="font-bold text-slate-800">Uji Defense Scheme N-2</div>
                <div className="text-[10px] text-slate-400">14 Maret 2026 • Bidang Proteksi & Metering</div>
                <p className="text-slate-600 text-[11px] mt-1">
                  Simulasi pelepasan beban otomatis berhasil terverifikasi pada teleproteksi GI Gandul & Durkosambi.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
