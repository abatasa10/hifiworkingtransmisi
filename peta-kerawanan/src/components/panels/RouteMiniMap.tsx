import React from 'react';
import { MapPin } from 'lucide-react';

interface RouteMiniMapProps {
  sourceName: string;
  targetName: string;
  middleName?: string;
}

export const RouteMiniMap: React.FC<RouteMiniMapProps> = ({
  sourceName,
  targetName,
  middleName = 'GI Duri Kosambi'
}) => {
  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-[#f8fafc] shadow-xs group">
      {/* Soft map background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #eff6ff 0%, #e2e8f0 100%)`
        }}
      />

      {/* Grid coordinate overlay */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `linear-gradient(#0046ad 1px, transparent 1px), linear-gradient(to right, #0046ad 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Vector Line Connecting Source -> Middle -> Target */}
      <svg className="absolute inset-0 w-full h-full p-4 pointer-events-none">
        {/* Shadow path */}
        <path
          d="M 50,95 Q 140,55 240,28"
          fill="none"
          stroke="#0046ad"
          strokeWidth="6"
          strokeOpacity="0.15"
        />
        {/* Active transmission line */}
        <path
          d="M 50,95 Q 140,55 240,28"
          fill="none"
          stroke="url(#gradient-route-mantaps)"
          strokeWidth="3.5"
          className="filter drop-shadow-xs"
        />
        <defs>
          <linearGradient id="gradient-route-mantaps" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0046ad" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Midpoint marker */}
        <circle cx="140" cy="55" r="4.5" fill="#ea580c" className="animate-ping opacity-75" />
        <circle cx="140" cy="55" r="3.5" fill="#ea580c" />
      </svg>

      {/* Node pin 1: Source */}
      <div className="absolute left-4 bottom-2.5 flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-xs">
        <div className="w-2 h-2 rounded-full bg-[#0046ad]" />
        <span className="text-[10px] font-bold text-slate-700">{sourceName}</span>
      </div>

      {/* Node pin middle */}
      <div className="absolute left-1/2 -translate-x-1/2 top-3 flex items-center gap-1 bg-white border border-[#fed7aa] px-2 py-0.5 rounded-md shadow-xs">
        <div className="w-2 h-2 rounded-full bg-[#ea580c]" />
        <span className="text-[10px] font-bold text-[#b45309]">{middleName}</span>
      </div>

      {/* Node pin 2: Target */}
      <div className="absolute right-4 top-2 flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-xs">
        <div className="w-2 h-2 rounded-full bg-[#dc2626]" />
        <span className="text-[10px] font-bold text-slate-700">{targetName}</span>
      </div>

      {/* Map location badge tag */}
      <div className="absolute bottom-1.5 right-2 text-[9px] text-slate-500 font-mono flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded border border-slate-200">
        <MapPin className="w-2.5 h-2.5 text-[#0046ad]" />
        <span>Koridor Jakarta Barat - Selatan</span>
      </div>
    </div>
  );
};
