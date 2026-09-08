import React from 'react';

interface TierItem {
  tier: number;
  y: number;
  label: string;
  description: string;
}

const tiers: TierItem[] = [
  { tier: 1, y: 70, label: 'TIER 1', description: 'Pembangkit / Evakuasi Daya' },
  { tier: 2, y: 240, label: 'TIER 2', description: 'GITET Backbone Utara / Tengah' },
  { tier: 3, y: 410, label: 'TIER 3', description: 'GITET Interkoneksi Penghubung' },
  { tier: 4, y: 570, label: 'TIER 4', description: 'GITET Ring Selatan / Konsentrasi Beban' },
  { tier: 5, y: 700, label: 'TIER 5', description: 'Duri Kosambi Sub-ring 500 kV' },
  { tier: 6, y: 820, label: 'TIER 6', description: 'Muara Karang Radial Feeder' },
];

export const TierGuides: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0">
      {tiers.map((t) => (
        <div
          key={t.tier}
          style={{ top: `${t.y}px` }}
          className="absolute left-0 right-0 flex items-center border-t border-dashed border-slate-800/60"
        >
          {/* Left Tier Badge */}
          <div className="bg-slate-900/90 border border-slate-800 text-slate-500 text-[10px] font-mono font-bold px-2 py-0.5 rounded ml-2 shadow-sm flex items-center gap-1.5 backdrop-blur-sm">
            <span className="text-cyan-400 font-black">{t.label}</span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-400 hidden lg:inline">{t.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
