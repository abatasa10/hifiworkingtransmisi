import React from 'react';
import { Network, ArrowRight } from 'lucide-react';
import { SLDNodeData } from '../../types/graph';
import { initialEdges500kV } from '../../data/edges500kv';
import { initialNodes500kV } from '../../data/nodes500kv';

interface SubstationContentProps {
  node: SLDNodeData;
  onSelectConnection: (edgeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

export const SubstationContent: React.FC<SubstationContentProps> = ({
  node,
  onSelectConnection,
  onSelectNode
}) => {
  const connectedEdges = initialEdges500kV.filter(
    (e) => e.source === node.id || e.target === node.id
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
        <div className="flex-1 min-w-0">
          <span className={`text-[11px] font-mono uppercase tracking-wider font-bold ${
            node.type === 'generator' ? 'text-[#16a34a]' : 'text-[#0046ad]'
          }`}>
            {node.type === 'generator' ? 'INFORMASI BAY PEMBANGKIT' : 'INFORMASI GI / GITET'}
          </span>
          <h3 className="font-extrabold text-base text-[#1e293b] mt-0.5 leading-snug">
            {node.name}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {node.code} • {node.type === 'generator' ? 'Bay Pembangkit (1. Gen, 2. Trafo, 3. CB)' : 'Gardu Induk Tegangan Ekstra Tinggi 500 kV'}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Technical Data Card */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
            <div>
              <span className="text-slate-500 block text-[10px]">Nama GI</span>
              <span className="font-semibold text-slate-800">{node.name}</span>
            </div>
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
            {node.capacityMW && (
              <div>
                <span className="text-slate-500 block text-[10px]">Kapasitas Daya</span>
                <span className="font-mono text-slate-700">{node.capacityMW} MW</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block text-[10px]">Total Interkoneksi</span>
              <span className="font-bold text-[#0046ad]">{connectedEdges.length} Saluran</span>
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

        {/* Section: TERHUBUNG KE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-800 text-xs font-bold uppercase tracking-wider">
              TERHUBUNG KE:
            </span>
            <span className="text-[10px] text-slate-400">Klik untuk sorot saluran</span>
          </div>

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
        </div>
      </div>
    </div>
  );
};
