import React from 'react';
import {
  Map,
  Zap,
  Network,
  Layers,
  Activity,
  Server,
  UploadCloud,
  FileText,
  Bell,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { ActiveView } from './Header';

interface SidebarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenSystemRiskSummary?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenSystemRiskSummary
}) => {
  const menuItems = [
    {
      id: 'national' as ActiveView,
      title: 'Peta Kerawanan Nasional',
      icon: Map
    },
    {
      id: 'jamali-system' as ActiveView,
      title: 'Peta Sistem JAMALI',
      icon: Zap
    },
    {
      id: 'sld-500kv' as ActiveView,
      title: 'Single Line Diagram (SLD) 500 kV',
      icon: Network
    },
    {
      id: 'upb-view' as ActiveView,
      title: 'Unit Pengatur Beban (UP2B / P2B)',
      icon: Layers
    },
    {
      id: 'subsystem-view' as ActiveView,
      title: 'Subsistem & Gardu Induk',
      icon: Activity
    },
    {
      id: 'ibt-view' as ActiveView,
      title: 'Daftar Interbus Transformer (IBT)',
      icon: Server
    },
    {
      id: 'upload-sld' as ActiveView,
      title: 'Upload & Kelola SLD',
      icon: UploadCloud
    },
    {
      id: 'report-view' as ActiveView,
      title: 'Laporan & Rekapitulasi',
      icon: FileText
    }
  ];

  return (
    <aside className="w-16 h-screen bg-white border-r border-slate-200 flex flex-col items-center justify-between py-3 select-none z-40 shrink-0 shadow-[1px_0_4px_rgba(0,0,0,0.04)]">
      {/* Top Section: Official PLN Logo & Brand */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Official PLN Shield Emblem */}
        <button
          onClick={() => onNavigate('national')}
          className="group relative flex flex-col items-center p-1.5 focus:outline-none"
          title="Power Inspect - PT PLN (Persero)"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FCD303] border border-[#EAB308] p-1 shadow-sm flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
            {/* SVG Logo PLN: Petir Merah + Gelombang Biru */}
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
              {/* Petir Merah */}
              <polygon
                points="56,6 18,65 52,65 42,114 84,52 52,52"
                fill="#EF4444"
                stroke="#DC2626"
                strokeWidth="2"
              />
              {/* Gelombang Biru khas PLN */}
              <path
                d="M16,92 Q34,84 52,92 T88,92"
                fill="none"
                stroke="#00529C"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M16,102 Q34,94 52,102 T88,102"
                fill="none"
                stroke="#00529C"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M16,112 Q34,104 52,112 T88,112"
                fill="none"
                stroke="#00529C"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-[9px] font-extrabold text-[#00529C] tracking-tighter mt-1">PLN</span>
        </button>

        {/* Separator */}
        <div className="w-8 h-px bg-slate-200" />

        {/* Navigation Icons list */}
        <nav className="flex flex-col items-center gap-1.5 w-full px-2">
          {menuItems.map((item) => {
            const isActive =
              currentView === item.id ||
              (item.id === 'subsystem-view' && currentView === 'subsystem-sld');
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group flex items-center justify-center w-full">
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 relative ${
                    isActive
                      ? 'bg-[#E3F2FD] text-[#00529C] shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-[#00529C] hover:bg-slate-100'
                  }`}
                  aria-label={item.title}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                  {/* Left active line indicator */}
                  {isActive && (
                    <span className="absolute -left-2 top-2 bottom-2 w-1 bg-[#00529C] rounded-r-md" />
                  )}
                </button>

                {/* Tooltip on hover */}
                <div className="absolute left-14 ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5">
                  <span>{item.title}</span>
                  <div className="w-1.5 h-1.5 bg-slate-800 absolute -left-0.5 top-1/2 -translate-y-1/2 rotate-45" />
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Utility Buttons (Help, Notification, Profile, Logout) */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {/* Help Center */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => window.open('http://10.1.48.26:7759/', '_blank')}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Pusat Bantuan"
          >
            <HelpCircle className="w-4.5 h-4.5 stroke-[1.8]" />
          </button>
          <div className="absolute left-14 ml-2 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded shadow opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Portal Power Inspect
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenSystemRiskSummary}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors relative"
            title="Notifikasi Anomali & Risiko"
          >
            <Bell className="w-4.5 h-4.5 stroke-[1.8]" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
          </button>
          <div className="absolute left-14 ml-2 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded shadow opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Notifikasi Kerawanan (3 Kritis)
          </div>
        </div>

        {/* Separator */}
        <div className="w-8 h-px bg-slate-200 my-0.5" />

        {/* User Profile Avatar */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="w-9 h-9 rounded-full bg-[#00529C] text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-100 cursor-pointer shadow-xs">
            SR
          </div>
          <div className="absolute left-14 ml-2 px-2.5 py-1.5 bg-white text-slate-800 border border-slate-200 text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity whitespace-nowrap z-50 flex flex-col">
            <span className="font-bold text-slate-900">super_admin_ridwan</span>
            <span className="text-[10px] text-slate-500">Super Administrator (FASOP)</span>
            <span className="text-[10px] text-blue-600 mt-1 font-semibold">Unit Pusat & Transmisi</span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => alert('Sesi aktif: super_admin_ridwan')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-4 h-4 stroke-[1.8]" />
          </button>
          <div className="absolute left-14 ml-2 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded shadow opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Keluar
          </div>
        </div>
      </div>
    </aside>
  );
};
