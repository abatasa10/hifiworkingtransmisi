import React, { useState, useEffect } from 'react';
import {
  Server,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Mail,
  ShieldCheck
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
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
      }).format(now);
      setTimeStr(`${formatted} WIB`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Title and breadcrumb mapping according to Power Inspect standards
  const getViewMeta = () => {
    switch (currentView) {
      case 'national':
        return {
          title: 'Dashboard Peta Kerawanan Nasional',
          crumbs: ['Dashboard', 'Transmisi', 'Peta Kerawanan Nasional']
        };
      case 'jamali-system':
        return {
          title: 'Sistem Kelistrikan Jawa-Madura-Bali (JAMALI)',
          crumbs: ['Dashboard', 'Sistem JAMALI', 'Peta Kerawanan']
        };
      case 'sld-500kv':
        return {
          title: 'Single Line Diagram (SLD) 500 kV',
          crumbs: ['Dashboard', 'SLD Transmisi', 'Grid 500 kV & Interkoneksi']
        };
      case 'upb-view':
        return {
          title: 'Unit Pengatur Beban (UP2B / P2B)',
          crumbs: ['Dashboard', 'Hierarki Wilayah', 'Unit Pengatur Beban']
        };
      case 'subsystem-view':
      case 'subsystem-sld':
        return {
          title: 'Subsistem & Gardu Induk',
          crumbs: ['Dashboard', 'Sistem Transmisi', 'Subsistem & Bay Aset']
        };
      case 'ibt-view':
        return {
          title: 'Daftar Interbus Transformer (IBT)',
          crumbs: ['Dashboard', 'Aset Kritis', 'Trafo & IBT']
        };
      case 'upload-sld':
        return {
          title: 'Kelola & Konfigurasi SLD',
          crumbs: ['Pengaturan', 'Manajemen Aset', 'Upload SLD']
        };
      case 'report-view':
        return {
          title: 'Laporan & Analisis Kerawanan',
          crumbs: ['Laporan', 'Rekapitulasi Kerawanan Sistem']
        };
      default:
        return {
          title: 'Power Inspect - Peta Kerawanan',
          crumbs: ['Dashboard', 'Peta Kerawanan']
        };
    }
  };

  const meta = getViewMeta();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between text-xs text-slate-700 select-none z-30 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left: Server Badge + Page Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Environment Badge: Matches Power Inspect 'Server Training' */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px] shadow-2xs">
          <Server className="w-3.5 h-3.5 text-emerald-600" />
          <span>Server Training</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200" />

        {/* Title & Breadcrumb */}
        <div className="flex flex-col justify-center">
          <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">
            {meta.title}
          </h1>
          <nav className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5" aria-label="Breadcrumb">
            {meta.crumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
                <span className={idx === meta.crumbs.length - 1 ? 'font-semibold text-[#00529C]' : 'hover:text-slate-700'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      {/* Right: Contact Support Notice + Time + Risk Action Button */}
      <div className="flex items-center gap-4">
        {/* Power Inspect Official Contact Helpdesk */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 font-medium">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Contact us : <strong className="text-[#00529C] font-semibold">helpdesk.pi@iconpln.co.id</strong>
          </span>
          <span className="text-slate-300">|</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            Security Issue : <strong className="text-slate-700 font-semibold">soc@pln.co.id</strong>
          </span>
        </div>

        {/* Timestamp */}
        <div className="hidden sm:flex flex-col text-right">
          <div className="text-[11px] font-medium text-slate-600">{timeStr}</div>
          <div className="text-[9px] font-bold text-emerald-600 flex items-center justify-end gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            LIVE TELEMETRI AKTIF
          </div>
        </div>

        {/* Power Inspect Matriks Kerawanan Button */}
        <button
          onClick={onOpenSystemRiskSummary}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
          title="Buka Ringkasan Kerawanan Sistem & Subsistem"
        >
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span className="hidden md:inline">Matriks Kerawanan</span>
          <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
            7
          </span>
        </button>
      </div>
    </header>
  );
};
