import React, { useState } from 'react';
import { Breadcrumb } from '../layout/Breadcrumb';
import { ActiveView } from '../layout/Header';
import { subsystems } from '../../data/subsystems';
import { jamaliUPBs } from '../../data/upbs';
import { Activity, ArrowLeft, ArrowRight, Search } from 'lucide-react';

interface SubsystemViewProps {
  onNavigate: (view: ActiveView) => void;
  onSelectSubsystem: (subsystemId: string) => void;
}

export const SubsystemView: React.FC<SubsystemViewProps> = ({
  onNavigate,
  onSelectSubsystem
}) => {
  const [selectedUpbFilter, setSelectedUpbFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = subsystems.filter((sub) => {
    const matchesUpb = selectedUpbFilter === 'all' || sub.upbId === selectedUpbFilter;
    const matchesSearch =
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.description.toLowerCase().includes(search.toLowerCase());
    return matchesUpb && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#f4f7fa] text-slate-800 overflow-hidden relative select-none">
      {/* Top Banner with Breadcrumb & Back */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div>
          <Breadcrumb
            items={[
              { label: 'Jawa, Madura & Bali', view: 'jamali-system' },
              { label: 'Daftar Subsistem' }
            ]}
            onNavigate={onNavigate}
          />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#0046ad] flex items-center justify-center font-bold text-xs border border-[#dbeafe]">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1e293b] tracking-tight">
                SUBSISTEM TENAGA LISTRIK JAWA, MADURA DAN BALI
              </h1>
              <span className="text-xs text-slate-500">
                Pemetaan Subsistem Berdasarkan Buku Kerawanan Sistem Tahun 2026
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('jamali-system')}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke Sistem</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 shadow-xs">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Subsistem..."
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0046ad]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-500 font-medium">UP2B:</span>
          <button
            onClick={() => setSelectedUpbFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
              selectedUpbFilter === 'all'
                ? 'bg-[#0046ad] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua UP2B
          </button>
          {jamaliUPBs.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUpbFilter(u.id)}
              className={`px-3 py-1 rounded-lg transition-colors font-semibold whitespace-nowrap ${
                selectedUpbFilter === u.id
                  ? 'bg-[#0046ad] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sub) => {
            const upb = jamaliUPBs.find((u) => u.id === sub.upbId);
            return (
              <div
                key={sub.id}
                onClick={() => {
                  onSelectSubsystem(sub.id);
                  onNavigate('subsystem-sld');
                }}
                className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-[#0046ad] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] font-bold px-2 py-0.5 rounded">
                      {upb?.name || 'JAMALI'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        sub.riskLevel === 'Sangat Rawan'
                          ? 'bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]'
                          : sub.riskLevel === 'Rawan'
                          ? 'bg-[#ffedd5] text-[#ea580c] border border-[#fdba74]'
                          : sub.riskLevel === 'Sedang'
                          ? 'bg-[#fef9c3] text-[#ca8a04] border border-[#fde047]'
                          : 'bg-[#dcfce7] text-[#16a34a] border border-[#86efac]'
                      }`}
                    >
                      ● {sub.riskLevel}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-[#1e293b] group-hover:text-[#0046ad] transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {sub.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                    <span>{sub.giCount} GI</span>
                    <span>•</span>
                    <span>{sub.peakLoadMW} MW</span>
                  </div>
                  <span className="text-[#0046ad] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1 text-[11px]">
                    Buka SLD <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
