import React, { useState } from 'react';
import { Network, ArrowRight, Info, ShieldAlert, Layers, History, CheckCircle2, Zap } from 'lucide-react';
import { SLDNodeData } from '../../types/graph';
import { initialEdges500kV } from '../../data/edges500kv';
import { initialNodes500kV } from '../../data/nodes500kv';
import type { EngineRisk } from '../../lib/sld/types';

interface SubstationContentProps {
  node: SLDNodeData;
  onSelectConnection: (edgeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  risks?: EngineRisk[];
}

export const SubstationContent: React.FC<SubstationContentProps> = ({
  node,
  onSelectConnection,
  onSelectNode,
  risks
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'risk' | 'assets' | 'history'>('info');

  const connectedEdges = initialEdges500kV.filter(
    (e) => e.source === node.id || e.target === node.id
  );
  // Data-driven related assets (uploaded template): explicit `Terhubung ke`
  // / `GI Terdampak` columns plus topology derivation. Falls back to the
  // static backbone edges when the node carries no enriched data.
  const dynConnectedNames = ((node as any)?.connectedNames || []) as string[];
  const dynConnectedKeys = ((node as any)?.connectedKeys || []) as string[];
  const dynImpactedNames = ((node as any)?.impactedNames || []) as string[];
  const useDynamic = dynConnectedNames.length > 0 || dynImpactedNames.length > 0;

  const rawRisk = String((node as any)?.riskStatus || 'Normal');
  const isRawan = rawRisk !== 'Normal' && rawRisk !== 'Aman';
  const riskNumRaw = (node as any)?.riskNumber ?? null;
  const riskNum =
    typeof riskNumRaw === 'number' || (typeof riskNumRaw === 'string' && riskNumRaw.trim() !== '')
      ? riskNumRaw
      : null;
  const hasRisk = isRawan;
  const riskDetail = risks?.find((r) => r.seq_no === Number(riskNumRaw));
  const condText =
    riskDetail?.condition || (node as any)?.condition || '';
  const impactText =
    riskDetail?.impact || (node as any)?.impact || '';
  const mitigText =
    riskDetail?.mitigation || (node as any)?.mitigation || '';
  const solutionText =
    riskDetail?.follow_up || (node as any)?.solution || '';

  const tabBtn = (key: typeof activeTab, label: string, Icon: any, activeCls: string) => (
    <button
      onClick={() => setActiveTab(key)}
      className={`flex items-center gap-1.5 px-3 py-2.5 font-semibold border-b-2 transition-colors ${
        activeTab === key ? activeCls : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-[#f8fafc] flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          node.type === 'generator'
            ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
            : 'bg-[#eff6ff] border-[#dbeafe] text-[#0046ad]'
        }`}>
          <Network className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-mono uppercase tracking-wider font-bold ${
              node.type === 'generator' ? 'text-[#16a34a]' : 'text-[#0046ad]'
            }`}>
              {node.type === 'generator' ? 'INFORMASI BAY PEMBANGKIT' : 'INFORMASI GI / GITET'}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                isRawan
                  ? 'bg-[#fee2e2] text-[#dc2626] border-[#fca5a5]'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isRawan ? 'bg-[#dc2626]' : 'bg-emerald-600'}`} />
              {isRawan ? rawRisk : 'Normal'}
            </span>
          </div>
          <h3 className="font-extrabold text-base text-[#1e293b] mt-0.5 leading-snug">
            {node.name}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {node.code} • {node.type === 'generator' ? 'Bay Pembangkit (1. Gen, 2. Trafo, 3. CB)' : 'Gardu Induk Tegangan Ekstra Tinggi 500 kV'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-2 text-xs">
        {tabBtn('info', 'Informasi', Info, 'border-[#0046ad] text-[#0046ad] font-bold bg-[#eff6ff]/60')}
        {hasRisk && tabBtn('risk', 'Kerawanan', ShieldAlert, 'border-[#ea580c] text-[#ea580c] font-bold bg-[#ffedd5]/40')}
        {tabBtn('assets', 'Aset Terkait', Layers, 'border-[#0046ad] text-[#0046ad] font-bold bg-[#eff6ff]/60')}
        {tabBtn('history', 'Riwayat', History, 'border-[#7c3aed] text-[#7c3aed] font-bold bg-[#f5f3ff]')}
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Nama GI</span>
                  <span className="font-semibold text-slate-800">{node.name}</span>
                </div>
                {(node as any)?.functLoc && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">ID FunctLoc</span>
                    <span className="font-mono font-semibold text-slate-800">{(node as any).functLoc}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block text-[10px]">Tegangan</span>
                  <span className="font-semibold text-[#0046ad]">{node.voltage}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tier Penempatan</span>
                  <span className="font-mono font-bold text-[#ea580c]">Tier {node.tier}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Status Operasi</span>
                  <span className="inline-flex items-center gap-1 text-[#16a34a] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                    {node.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tingkat Kerawanan</span>
                  <span className={`font-bold ${isRawan ? 'text-[#dc2626]' : 'text-emerald-600'}`}>
                    {isRawan ? `${rawRisk}${riskNum !== null ? ` (#${riskNum})` : ''}` : 'Normal'}
                  </span>
                </div>
                {node.capacityMW && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kapasitas Daya</span>
                    <span className="font-mono text-slate-700">{node.capacityMW} MW</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Interkoneksi</span>
                  <span className="font-bold text-[#0046ad]">
                    {useDynamic ? dynConnectedNames.length : connectedEdges.length} Saluran
                  </span>
                </div>
              </div>
            </div>

            {/* Skema Urutan Bay Pembangkit jika tipe generator */}
            {node.type === 'generator' && (
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-[#16a34a] uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡</span> Skema Urutan Bay Pembangkit
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-white p-2 rounded-lg border border-[#86efac] shadow-xs">
                    <div className="font-extrabold text-[#15803d]">1. Pembangkit</div>
                    <div className="text-slate-500 text-[9px] mt-0.5">Unit Gen (~)</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#86efac] shadow-xs">
                    <div className="font-extrabold text-[#15803d]">2. Trafo</div>
                    <div className="text-slate-500 text-[9px] mt-0.5">Step-Up GSUT</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#86efac] shadow-xs">
                    <div className="font-extrabold text-[#dc2626]">3. CB (PMT)</div>
                    <div className="text-slate-500 text-[9px] mt-0.5">Pemutus Tenaga</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'risk' && hasRisk && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl shadow-xs">
              <div className="font-extrabold text-amber-800 text-[11px] flex items-center gap-1.5 uppercase tracking-wider mb-1.5">
                <span className="text-amber-600 text-sm">⚠️</span>
                KONDISI / PERMASALAHAN{riskNum !== null ? ` (#${riskNum})` : ''}
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px] whitespace-pre-line font-medium">
                {condText || `GI ${node.name} terindikasi kerawanan tingkat ${rawRisk}. Lihat Tabel Kerawanan untuk rincian kondisi-ID ${riskNum ?? 'terkait'}.`}
              </p>
            </div>
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl shadow-xs">
              <div className="font-extrabold text-rose-700 text-[11px] uppercase tracking-wider mb-1.5">
                DAMPAK
              </div>
              <div className="text-slate-700 leading-relaxed text-[11px] whitespace-pre-line font-medium">
                {impactText || 'Dampak pemadaman dan pembebanan berlebih pada penyulang terkait bila gangguan tidak tertangani.'}
              </div>
            </div>
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl shadow-xs">
              <div className="font-extrabold text-blue-700 text-[11px] uppercase tracking-wider mb-1.5">
                MITIGASI
              </div>
              <div className="text-slate-700 leading-relaxed text-[11px] whitespace-pre-line font-medium">
                {mitigText || 'Defense Scheme OLS/SPS terpasang; monitoring dispatching beban saat kondisi beban tinggi.'}
              </div>
            </div>
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-300 rounded-xl shadow-xs">
              <div className="font-extrabold text-emerald-800 text-[11px] uppercase tracking-wider mb-1.5">
                USULAN / SOLUSI
              </div>
              <div className="bg-white/90 border border-emerald-200/80 rounded-lg p-2.5 text-slate-700 leading-relaxed text-[11px] whitespace-pre-line font-medium shadow-2xs">
                {solutionText || 'Tindak lanjut sesuai RUPTL dan hasil kajian kerawanan berjalan.'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-800 text-xs font-bold uppercase tracking-wider">
                TERHUBUNG KE{dynConnectedNames.length > 0 ? ` (${dynConnectedNames.length})` : ''}:
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk sorot saluran</span>
            </div>

            {useDynamic ? (
              <div className="space-y-1.5">
                {dynConnectedNames.map((nm, i) => {
                  const key = dynConnectedKeys[i];
                  return key ? (
                    <button
                      key={`${key}-${i}`}
                      onClick={() => onSelectNode(key)}
                      className="w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all group shadow-2xs bg-[#f8fafc] border-slate-200 hover:border-[#0046ad] hover:bg-[#eff6ff]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#0046ad] font-bold group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                        <div className="font-bold text-slate-800 group-hover:text-[#0046ad]">{nm}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0046ad] transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <div
                      key={`${nm}-${i}`}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] flex items-center gap-2"
                    >
                      <span className="text-slate-400 font-bold">→</span>
                      <div className="font-bold text-slate-800">{nm}</div>
                    </div>
                  );
                })}
                {dynImpactedNames.length > 0 && (
                  <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60">
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      GI Terdampak bila gangguan ({dynImpactedNames.length})
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {dynImpactedNames.map((nm, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          {nm}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {connectedEdges.map((edge) => {
                  const otherNodeId = edge.source === node.id ? edge.target : edge.source;
                  const otherNode = initialNodes500kV.find((n) => n.id === otherNodeId);
                  const otherName = otherNode?.data.name || otherNodeId;
                  const edgeData = edge.data;
                  const hasRisk = typeof edgeData?.riskId === 'number';

                  return (
                    <button
                      key={edge.id}
                      onClick={() => onSelectConnection(edge.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all group shadow-2xs ${
                        hasRisk
                          ? 'bg-[#fffbeb] border-[#fde68a] hover:border-[#ea580c] hover:bg-[#ffedd5]'
                          : 'bg-[#f8fafc] border-slate-200 hover:border-[#0046ad] hover:bg-[#eff6ff]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#0046ad] font-bold group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-[#0046ad] flex items-center gap-1.5">
                            <span>{otherName}</span>
                            {hasRisk && (
                              <span className="bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa] text-[10px] font-bold px-1 rounded">
                                Risk #{edgeData.riskId}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {edgeData?.name} • {edgeData?.circuitCount} Sirkit
                          </div>
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0046ad] transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2 text-xs">
            {condText && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="font-bold text-amber-900 text-[11px]">Catatan Kondisi Terakhir</div>
                <p className="text-[11px] text-slate-600 mt-0.5 whitespace-pre-line">{condText}</p>
              </div>
            )}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800 text-[11px]">Inspeksi Visual & Thermovision Rutin</div>
                <div className="text-[10px] text-slate-400">Jadwal berkala • UP2B terkait</div>
                <p className="text-[11px] text-slate-600 mt-0.5">Pemeriksaan visual peralatan, kekencangan baut, dan suhu hotspot dalam batas normal.</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800 text-[11px]">Uji Tahanan Pentanahan</div>
                <div className="text-[10px] text-slate-400">Jadwal berkala • ULTG</div>
                <p className="text-[11px] text-slate-600 mt-0.5">Hasil uji tercatat dalam batas standar operasi.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
