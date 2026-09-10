import React, { useState } from 'react';
import { Info, ShieldAlert, Layers, History, CheckCircle2, Zap } from 'lucide-react';
import { SLDEdgeData } from '../../types/graph';
import { RouteMiniMap } from './RouteMiniMap';

interface NormalLineContentProps {
  line: SLDEdgeData;
}

export const NormalLineContent: React.FC<NormalLineContentProps> = ({ line }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'risk' | 'assets' | 'history'>('info');

  const rawSource = String(line?.source || (line as any)?.from || (line as any)?.sourceName || 'GI Pangkal');
  const rawTarget = String(line?.target || (line as any)?.to || (line as any)?.targetName || 'GI Ujung');

  const sourceName = rawSource.replace(/^(GI_|GEN_|FEED_)/, '') || 'GI Pangkal';
  const targetName = rawTarget.replace(/^(GI_|GEN_|FEED_)/, '') || 'GI Ujung';

  const circuit1 = line?.loading?.circuit1 ?? (line as any)?.loadingPct ?? (line as any)?.loadingCircuit1 ?? 58;
  const circuit2 = line?.loading?.circuit2 ?? (line as any)?.loadingCircuit2 ?? 52;
  const circuitCount = line?.circuitCount || (line as any)?.circuits || 2;
  const lengthKm = line?.lengthKm || (line as any)?.length || '21.4';

  const voltage = line?.voltage || '500 kV';
  const is500 = String(voltage).includes('500');
  const lineType = is500 ? 'SUTET' : 'SUTT';

  // Risk number & status
  const riskNum = (line as any)?.riskNumber || line?.riskId || (line as any)?.number || 11;
  const rawRisk = String(line?.riskLevel || (line as any)?.riskStatus || (line.status === 'critical' ? 'Sangat Rawan' : 'Sedang'));
  const isRawan = rawRisk !== 'Normal' && rawRisk !== 'Aman';
  const riskLevel = isRawan ? rawRisk : 'Normal';

  const region = (line as any)?.region || 'Jawa Barat - DKI Jakarta';
  const corridor = (line as any)?.corridor || 'Koridor Jakarta Barat - Selatan';

  // Badge color mapping
  const getBadgeStyle = () => {
    if (riskLevel === 'Sangat Rawan' || riskLevel.includes('N-2')) {
      return { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]', border: 'border-[#fca5a5]', dot: '#dc2626', starFill: '#dc2626' };
    }
    if (riskLevel === 'Sedang' || riskLevel.includes('N-1')) {
      return { bg: 'bg-[#fef9c3]', text: 'text-[#ca8a04]', border: 'border-[#fde047]', dot: '#ca8a04', starFill: '#f1c40f' };
    }
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: '#16a34a', starFill: '#10b981' };
  };

  const badge = getBadgeStyle();

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Header (Matching Image 1) */}
      <div className="p-4 border-b border-slate-200 bg-[#f8fafc] flex items-start gap-3">
        {/* Starburst badge icon */}
        <div className="relative shrink-0 flex items-center justify-center w-10 h-10 mt-0.5">
          <svg viewBox="0 0 100 100" className="w-10 h-10 filter drop-shadow-sm">
            <polygon
              points="50,0 63,22 88,12 85,38 100,50 85,62 88,88 63,78 50,100 37,78 12,88 15,62 0,50 15,38 12,12 37,22"
              fill={badge.starFill}
              stroke="#ffffff"
              strokeWidth="4"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-slate-950 font-black text-sm">
            {riskNum}
          </span>
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#b45309] font-bold">
              KERAWANAN #{riskNum}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.bg} ${badge.text} ${badge.border} flex items-center gap-1`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
              {riskLevel}
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-[#1e293b] mt-0.5 leading-snug">
            {line?.name || `${lineType} ${sourceName} - ${targetName}`}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {lineType} • {voltage} • {region}
          </div>
        </div>
      </div>

      {/* 4 Segmented Tabs (Image 1) */}
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

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: INFORMASI (Persis Gambar 1) */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Technical Specifications Table */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">No. Kerawanan</span>
                  <span className="font-extrabold text-[#ea580c] text-sm">#{riskNum}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tegangan Operasi</span>
                  <span className="font-semibold text-[#0046ad]">{voltage}</span>
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
                  <span className="text-slate-500 block text-[10px]">Panjang Saluran</span>
                  <span className="font-mono text-slate-700">{lengthKm} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Jumlah Sirkit</span>
                  <span className="font-semibold text-slate-700">{circuitCount} Sirkit</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Status Operasi</span>
                  <span className="inline-flex items-center gap-1 text-[#16a34a] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                    {line?.operatingStatus || 'Beroperasi'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tingkat Kerawanan</span>
                  <span className={`font-bold ${isRawan ? 'text-[#ca8a04]' : 'text-emerald-600'}`}>{riskLevel}</span>
                </div>
              </div>

              {/* Current Loading Meters (Gambar 1) */}
              <div className="border-t border-slate-200 pt-2.5 mt-2">
                <span className="text-slate-700 block text-[11px] font-bold mb-2">
                  Pembebanan Saat Ini:
                </span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">Sirkit 1:</span>
                      <span className="font-bold text-[#0046ad]">{circuit1}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#ea580c]"
                        style={{ width: `${Math.min(100, circuit1)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">Sirkit 2:</span>
                      <span className="font-bold text-[#0046ad]">{circuit2}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0046ad]"
                        style={{ width: `${Math.min(100, circuit2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peta Lokasi & Jalur Transmisi (Gambar 1) */}
            <div>
              <span className="text-slate-700 text-[11px] font-bold block mb-1.5">
                Peta Lokasi & Jalur Transmisi:
              </span>
              <RouteMiniMap
                sourceName={`GI ${sourceName}`}
                targetName={`GI ${targetName}`}
                middleName="GI Duri Kosambi"
              />
            </div>
          </div>
        )}

        {/* TAB 2: KERAWANAN */}
        {activeTab === 'risk' && (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Analisis Kriteria Kontinjensi (N-1):
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                Jika terjadi gangguan trip pada salah satu sirkit penghantar {sourceName} - {targetName}, sirkit pasangan akan mengalami lonjakan arus pembebanan hingga melebihi 85% kemampuan termal konduktor.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-bold text-slate-800 text-[11px]">Rekomendasi Operasional & Mitigasi:</div>
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-600 text-[11px]">
                <li>Dispatching pembebanan pembangkit pendukung sisi hilir.</li>
                <li>Pemberlakuan skema SPS (Special Protection Scheme) overload tripping.</li>
                <li>Pemantauan suhu sambungan (thermovision inspection) rutin bulanan.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: ASET TERKAIT */}
        {activeTab === 'assets' && (
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono block">GARDU INDUK PANGKAL</span>
              <span className="font-bold text-slate-800 text-sm">{sourceName}</span>
              <div className="text-[11px] text-slate-500 mt-0.5">{voltage} • Bay Penghantar Utama</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono block">GARDU INDUK UJUNG</span>
              <span className="font-bold text-slate-800 text-sm">{targetName}</span>
              <div className="text-[11px] text-slate-500 mt-0.5">{voltage} • Bay Penerima Interkoneksi</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono block">PERALATAN PROTEKSI</span>
              <span className="font-bold text-slate-800 text-sm">Line Current Differential + Distance Relay</span>
              <div className="text-[11px] text-slate-500 mt-0.5">Teleproteksi Serat Optik OPGW</div>
            </div>
          </div>
        )}

        {/* TAB 4: RIWAYAT */}
        {activeTab === 'history' && (
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800 text-[11px]">Inspeksi Thermovision Rutin</div>
                <div className="text-[10px] text-slate-400">14 Agustus 2026 • UP2B Jawa Barat</div>
                <p className="text-[11px] text-slate-600 mt-0.5">Suhu klem jumper dalam batas normal (&lt; 45°C).</p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-900 text-[11px]">Uji Otomasi Recloser Sirkit 1</div>
                <div className="text-[10px] text-slate-400">02 Mei 2026 • ULTG</div>
                <p className="text-[11px] text-slate-600 mt-0.5">Waktu trip & auto-reclose tercatat 300 ms (Normal).</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

