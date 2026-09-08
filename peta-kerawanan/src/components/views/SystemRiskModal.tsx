import React, { useState } from 'react';
import { X, ShieldAlert, ArrowRight, Search } from 'lucide-react';
import { risksData } from '../../data/risks';

interface SystemRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRisk: (riskId: number) => void;
}

export const SystemRiskModal: React.FC<SystemRiskModalProps> = ({
  isOpen,
  onClose,
  onSelectRisk
}) => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('Semua');

  if (!isOpen) return null;

  const filteredRisks = risksData.filter((risk) => {
    const matchesSearch =
      risk.name.toLowerCase().includes(search.toLowerCase()) ||
      risk.number.toString() === search ||
      risk.condition.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === 'Semua' || risk.riskLevel === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#f8fafc] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fee2e2] border border-[#fca5a5] flex items-center justify-center text-[#dc2626]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-800">
                Daftar Peta Kerawanan Sistem Tenaga Listrik 2026
              </h2>
              <div className="text-xs text-slate-500">
                Buku Kerawanan Sistem & Subsistem Jawa, Madura dan Bali — MANTAPS PLN
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor atau nama kerawanan..."
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0046ad]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Tingkat:</span>
            {['Semua', 'Sangat Rawan', 'Rawan', 'Sedang', 'Aman'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg transition-colors font-semibold text-xs ${
                  levelFilter === lvl
                    ? 'bg-[#0046ad] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* List of Risks */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 space-y-2">
          {filteredRisks.map((risk) => {
            const isCritical = risk.riskLevel === 'Sangat Rawan';

            return (
              <div
                key={risk.id}
                className="pt-2 pb-3 hover:bg-[#eff6ff]/40 rounded-xl p-3 transition-colors cursor-pointer group"
                onClick={() => {
                  onSelectRisk(risk.number);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#eff6ff] border border-[#dbeafe] flex items-center justify-center font-black text-[#0046ad] shrink-0 font-mono text-xs shadow-xs">
                      #{risk.number}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-[#0046ad] transition-colors">
                          {risk.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            isCritical
                              ? 'bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]'
                              : 'bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa]'
                          }`}
                        >
                          ● {risk.riskLevel}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5">
                        {risk.assetType} {risk.voltage} • {risk.location}
                      </div>

                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {risk.condition}
                      </p>
                    </div>
                  </div>

                  <button className="shrink-0 text-[#0046ad] font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Lihat di SLD</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
