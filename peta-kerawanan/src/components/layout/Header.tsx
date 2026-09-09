import React, { useState, useEffect } from 'react';
import {
  Map,
  Compass,
  Layers,
  Network,
  Activity,
  FileText,
  ShieldAlert,
  ChevronRight,
  User,
  UploadCloud
} from 'lucide-react';

export type ActiveView =
  | 'national'
  | 'jamali-system'
  | 'sld-500kv'
  | 'upb-view'
  | 'subsystem-view'
  | 'subsystem-sld'
  | 'ibt-view'
  | 'report-view'
  | 'upload-sld';

interface HeaderProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenSystemRiskSummary?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSystemRiskSummary
}) => {
  const [timeStr, setTimeStr] = useState('30 Juni 2026 10:24 WIB');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }).format(now);
      setTimeStr(`${formatted} WIB`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems: { id: ActiveView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'national', label: 'Peta Nasional', icon: Map },
    { id: 'jamali-system', label: 'Sistem JAMALI', icon: Compass },
    { id: 'sld-500kv', label: 'SLD 500 kV', icon: Network },
    { id: 'upb-view', label: 'UPB / P2B', icon: Layers },
    { id: 'subsystem-view', label: 'Subsistem', icon: Activity },
    { id: 'ibt-view', label: 'Daftar IBT', icon: Layers },
    { id: 'upload-sld', label: 'Upload SLD', icon: UploadCloud },
    { id: 'report-view', label: 'Laporan', icon: FileText }
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between text-xs text-slate-700 select-none z-30 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {/* Left: MANTAPS PLN Brand + Logo */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => onNavigate('national')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          {/* PLN Brand Icon */}
          <div className="w-8 h-8 rounded-lg bg-[#00368a] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-[#ffc61a] fill-current">
              <path d="M13 2L3 14h8l-2 8 12-14h-8l2-6z" />
            </svg>
          </div>

          {/* Brand Logo Text matching MANTAPS Power Inspect */}
          <div className="flex flex-col leading-none">
            <span className="text-[8px] font-extrabold tracking-[1.5px] text-slate-400 uppercase">
              POWER INSPECT
            </span>
            <div className="text-[17px] font-black tracking-tight text-[#00368a]">
              MANTAPS <span className="text-[#009ce0]">PLN</span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200 ml-1 hidden md:block" />

        {/* MANTAPS Nav Menu with exact pill indicator */}
        <nav className="hidden xl:flex items-center gap-1.5 ml-1">
          {navItems.map((item) => {
            const active = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'text-[#0046ad] bg-[#eff6ff] border border-[#dbeafe] shadow-xs'
                    : 'text-slate-600 hover:text-[#0046ad] hover:bg-[#f8fafc] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#0046ad]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Last Update, Kerawanan Button, User Profile */}
      <div className="flex items-center gap-3">
        {/* Live Timestamp */}
        <div className="text-right hidden sm:block">
          <div className="text-[11px] font-medium text-slate-500">
            Terakhir Diperbarui: <strong className="text-slate-700 font-semibold">{timeStr}</strong>
          </div>
          <div className="text-[9px] text-[#00a65a] font-bold flex items-center justify-end gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a65a] animate-pulse" />
            SISTEM NORMAL & MONITORING AKTIF
          </div>
        </div>

        {/* MANTAPS Red/Orange Kerawanan Sistem Badge Button */}
        <button
          onClick={onOpenSystemRiskSummary}
          className="flex items-center gap-1.5 bg-[#fee2e2] hover:bg-[#fecaca] text-[#dc2626] border border-[#fca5a5] font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-all"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Peta Kerawanan</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        {/* Profile Avatar button */}
        <div className="w-8 h-8 rounded-full bg-[#f1f5f9] border border-slate-300 text-[#00368a] flex items-center justify-center font-bold text-xs shadow-xs hover:bg-[#e2e8f0] cursor-pointer transition-colors">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
