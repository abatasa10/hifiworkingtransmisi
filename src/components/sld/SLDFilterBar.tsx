import React from 'react';
import { SLDFilterOptions } from '../../types/graph';

interface SLDFilterBarProps {
  filters: SLDFilterOptions;
  onChange: (updated: Partial<SLDFilterOptions>) => void;
}

export const SLDFilterBar: React.FC<SLDFilterBarProps> = ({ filters, onChange }) => {
  const riskLevels: { label: string; value: SLDFilterOptions['riskLevel']; color: string; bg: string; dot: string }[] = [
    { label: 'Semua', value: 'Semua', color: 'text-slate-600', bg: 'bg-white hover:bg-slate-50 border-slate-200', dot: '' },
    { label: 'Sangat Rawan', value: 'Sangat Rawan', color: 'text-[#dc2626]', bg: 'bg-[#fee2e2] border-[#fca5a5] hover:bg-[#fecaca]', dot: 'bg-[#dc2626]' },
    { label: 'Rawan', value: 'Rawan', color: 'text-[#ea580c]', bg: 'bg-[#ffedd5] border-[#fdba74] hover:bg-[#fed7aa]', dot: 'bg-[#ea580c]' },
    { label: 'Sedang', value: 'Sedang', color: 'text-[#ca8a04]', bg: 'bg-[#fef9c3] border-[#fde047] hover:bg-[#fef08a]', dot: 'bg-[#f1c40f]' },
    { label: 'Aman', value: 'Aman', color: 'text-[#16a34a]', bg: 'bg-[#dcfce7] border-[#86efac] hover:bg-[#bbf7d0]', dot: 'bg-[#2baf75]' }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Operating Status Dropdown */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-xs">
        <span className="text-slate-500 text-[11px] font-medium">Status:</span>
        <select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as SLDFilterOptions['status'] })}
          aria-label="Filter status operasi"
          className="bg-transparent text-[#0046ad] font-bold focus:outline-none cursor-pointer text-xs"
        >
          <option value="Semua">Semua Status</option>
          <option value="Normal">Normal</option>
          <option value="Kerawanan">Kerawanan</option>
          <option value="Planned">Planned / Rencana</option>
        </select>
      </div>

      {/* Risk Level Filter Chips (MANTAPS soft badge style) */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
        {riskLevels.map((lvl) => {
          const active = filters.riskLevel === lvl.value;
          return (
            <button
              key={lvl.value}
              onClick={() => onChange({ riskLevel: lvl.value })}
              className={`px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1.5 border text-xs ${
                active
                  ? `${lvl.bg} ${lvl.color} shadow-xs font-bold`
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {lvl.value !== 'Semua' && (
                <span className={`w-2 h-2 rounded-full ${lvl.dot}`} />
              )}
              {lvl.label}
            </button>
          );
        })}
      </div>

      {/* Voltage Level */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-xs">
        <span className="text-slate-500 text-[11px] font-medium">Tegangan:</span>
        {(['Semua', '500 kV', '150 kV'] as const).map((v) => (
          <button
            key={v}
            onClick={() => onChange({ voltage: v })}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors font-semibold ${
              filters.voltage === v
                ? 'bg-[#0046ad] text-white font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Asset Type Filter */}
      <div className="hidden lg:flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-xs">
        <span className="text-slate-500 text-[11px] font-medium">Jenis:</span>
        {(['Semua', 'GITET', 'IBT', 'SUTET', 'Pembangkit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onChange({ assetType: t })}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors font-semibold ${
              filters.assetType === t
                ? 'bg-[#0046ad] text-white font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};
