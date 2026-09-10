import React from 'react';

interface TierItem {
  tier: number;
  y: number;
  label: string;
  description: string;
}

// Konsep Tier SLD: Dimulai dari Tier 0 (Source / Titik Awal Sistem)
// Semakin besar nomor Tier, semakin downstream posisi asset terhadap source awal
const tiers: TierItem[] = [
  { tier: 0, y: 70, label: 'TIER-0', description: 'Asset / Source Utama (Titik Awal Sistem)' },
  { tier: 1, y: 240, label: 'TIER-1', description: 'Asset Terhubung Langsung dari Tier 0' },
  { tier: 2, y: 410, label: 'TIER-2', description: 'Asset Terhubung dari Tier 1' },
  { tier: 3, y: 570, label: 'TIER-3', description: 'Asset Terhubung dari Tier 2' },
  { tier: 4, y: 720, label: 'TIER-4', description: 'Asset Terhubung dari Tier 3 (Downstream / Beban)' },
  { tier: 5, y: 860, label: 'TIER-5', description: 'Asset Terhubung dari Tier 4' },
];

interface TierGuidesProps {
  theme?: 'blueprint' | 'classic';
}

export const TierGuides: React.FC<TierGuidesProps> = ({ theme = 'blueprint' }) => {
  const isClassic = theme === 'classic';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0">
      {tiers.map((t) => (
        <div
          key={t.tier}
          style={{ top: `${t.y}px` }}
          className={`absolute left-0 right-0 flex items-center border-t border-dashed ${
            isClassic ? 'border-slate-400/70' : 'border-slate-800/80'
          }`}
        >
          {/* Left Tier Badge (Gambar 1 Blueprint / Gambar 2 Skema Klasik) */}
          {isClassic ? (
            <div className="bg-white/95 text-slate-800 text-[11px] font-black tracking-wider px-2.5 py-0.5 ml-2 flex items-center gap-2">
              <span className="text-slate-900 font-extrabold uppercase">{t.label}</span>
              <span className="text-slate-400 text-[10px] font-normal hidden md:inline">|</span>
              <span className="text-slate-600 text-[10px] font-medium hidden lg:inline">{t.description}</span>
            </div>
          ) : (
            <div className="bg-slate-900/95 border border-slate-800/90 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded ml-2 shadow-sm flex items-center gap-1.5 backdrop-blur-sm">
              <span className="text-cyan-400 font-black">{t.label}</span>
              <span className="text-slate-600 hidden md:inline">|</span>
              <span className="text-slate-400 text-[9px] hidden lg:inline">{t.description}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
