import React from 'react';

interface SLDLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SLDLegendModal: React.FC<SLDLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Legend Simbol Single Line Diagram (SLD)
              </h2>
              <p className="text-xs text-slate-400">
                Standar Simbol Peralatan, Switching & Penghubung Sistem Tenaga Listrik PLN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* 1. PERALATAN (5 Item) */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold text-sm flex items-center gap-1.5">
                  <span className="text-xs">▼</span> Peralatan
                </span>
                <span className="text-[11px] text-slate-400">Komponen Utama Penyaluran Tenaga Listrik</span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/60">
                7
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* 1. Generator / Pembangkit */}
              <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/50 transition-colors">
                <div className="h-14 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-1.5 rounded-full border border-emerald-400 bg-slate-900 -mb-0.5 z-10" />
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-xs">
                      <span className="text-emerald-400 font-bold text-base leading-none">~</span>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs font-bold text-emerald-300 block">Generator</span>
                  <span className="text-[9px] text-slate-400">Pembangkit Listrik</span>
                </div>
              </div>

              {/* 2. Trafo Pembangkit (GSUT) */}
              <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/50 transition-colors">
                <div className="h-14 flex items-center justify-center">
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full border border-emerald-400 bg-slate-900 -mb-1 z-10" />
                    <svg viewBox="0 0 36 44" className="w-7 h-9 filter drop-shadow-xs">
                      {/* Atas: Hijau (Sisi Generator) */}
                      <circle cx="18" cy="15" r="11" fill="none" stroke="#22c55e" strokeWidth="2.8" />
                      {/* Bawah: Merah (Sisi GI 150 kV) */}
                      <circle cx="18" cy="29" r="11" fill="none" stroke="#ef4444" strokeWidth="2.8" />
                    </svg>
                    <div className="w-1.5 h-1.5 rounded-full border border-red-400 bg-slate-900 -mt-1 z-10" />
                  </div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs font-bold text-slate-200 block">Trafo Generator</span>
                  <span className="text-[9px] text-slate-400">Pembangkit ke GI</span>
                </div>
              </div>

              {/* 3. IBT (500/150 kV) */}
              <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/50 transition-colors">
                <div className="h-14 flex items-center justify-center">
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full border border-blue-400 bg-slate-900 -mb-1 z-10" />
                    <svg viewBox="0 0 46 44" className="w-9 h-9 filter drop-shadow-xs">
                      {/* Atas: Biru (500 kV) */}
                      <circle cx="23" cy="15" r="10" fill="none" stroke="#2563eb" strokeWidth="2.6" />
                      {/* Bawah Kiri: Merah (150 kV) */}
                      <circle cx="15" cy="28" r="10" fill="none" stroke="#ef4444" strokeWidth="2.6" />
                      {/* Bawah Kanan: Kuning (33 kV) */}
                      <circle cx="31" cy="28" r="10" fill="none" stroke="#f59e0b" strokeWidth="2.6" />
                    </svg>
                    <div className="w-1.5 h-1.5 rounded-full border border-red-400 bg-slate-900 -mt-1 z-10" />
                  </div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs font-bold text-cyan-300 block">IBT</span>
                  <span className="text-[9px] text-slate-400">500/150 kV (3 Belitan)</span>
                </div>
              </div>

              {/* 4. Trafo Distribusi (150/20 kV) */}
              <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/50 transition-colors">
                <div className="h-14 flex items-center justify-center">
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full border border-red-400 bg-slate-900 -mb-1 z-10" />
                    <svg viewBox="0 0 36 44" className="w-7 h-9 filter drop-shadow-xs">
                      {/* Atas: Merah (150 kV) */}
                      <circle cx="18" cy="15" r="11" fill="none" stroke="#ef4444" strokeWidth="2.8" />
                      {/* Bawah: Kuning (20 kV / 70 kV) */}
                      <circle cx="18" cy="29" r="11" fill="none" stroke="#f59e0b" strokeWidth="2.8" />
                    </svg>
                    <div className="w-1.5 h-1.5 rounded-full border border-amber-400 bg-slate-900 -mt-1 z-10" />
                  </div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs font-bold text-slate-200 block">Trafo Distribusi</span>
                  <span className="text-[9px] text-slate-400">150/20 kV atau 70 kV</span>
                </div>
              </div>

              {/* 5. Busbar */}
              <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/50 transition-colors">
                <div className="h-14 flex items-center justify-center w-full px-2">
                  <div className="w-full h-2.5 bg-slate-200 rounded-full shadow-xs" />
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs font-bold text-slate-200 block">Busbar</span>
                  <span className="text-[9px] text-slate-400">Batang Rel GI</span>
                </div>
              </div>

              {/* 6. Beban (Inverted Triangle) */}
              <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/50 transition-colors">
                <div className="h-14 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-1.5 rounded-full border border-amber-400 bg-slate-900 -mb-0.5 z-10" />
                    <svg viewBox="0 0 36 36" className="w-7 h-7">
                      <polygon
                        points="4,8 32,8 18,32"
                        fill="rgba(245, 158, 11, 0.15)"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs font-bold text-amber-300 block">Beban</span>
                  <span className="text-[9px] text-slate-400">Konsumen KTT / Feeder</span>
                </div>
              </div>

              {/* 7. PHT (Penghantar) */}
              <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/50 transition-colors">
                <div className="h-14 flex items-center justify-center">
                  <div className="w-3.5 h-10 rounded-full border-2 border-slate-300 flex flex-col justify-between items-center py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs font-bold text-slate-200 block">PHT</span>
                  <span className="text-[9px] text-slate-400">Saluran Transmisi</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. SWITCHING (2 Item) */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm flex items-center gap-1.5">
                  <span className="text-xs">▼</span> Switching
                </span>
                <span className="text-[11px] text-slate-400">Peralatan Pemutus dan Pemisah Sirkit</span>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
                2
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 max-w-md">
              {/* PMT / CB (Circuit Breaker) */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-red-500/50 transition-colors">
                <div className="w-14 h-14 flex items-center justify-center gap-2 shrink-0">
                  {/* Blok Merah SLD Sesuai Gambar 3 */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-2 bg-red-500" />
                    <div className="w-3.5 h-6 bg-red-600 rounded-[1px] shadow-sm border border-red-400" />
                    <div className="w-0.5 h-2 bg-red-500" />
                  </div>
                  {/* Simbol Skematik Saklar PMT */}
                  <svg viewBox="0 0 32 44" className="w-6 h-10 stroke-slate-200" fill="none" strokeWidth="2" strokeLinecap="round">
                    <circle cx="16" cy="6" r="2" fill="#e2e8f0" />
                    <line x1="16" y1="9" x2="16" y2="15" />
                    <line x1="16" y1="15" x2="8" y2="27" />
                    <line x1="12" y1="30" x2="20" y2="38" />
                    <line x1="20" y1="30" x2="12" y2="38" />
                    <circle cx="16" cy="40" r="2" fill="#e2e8f0" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">CB / PMT (Pemutus Tenaga)</span>
                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                    Circuit Breaker di bay GI pengirim & penerima: memutus arus beban dan gangguan hubung singkat.
                  </span>
                </div>
              </div>

              {/* PMS (Pemisah) */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/50 transition-colors">
                <div className="w-12 h-14 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 32 44" className="w-7 h-11 stroke-slate-200" fill="none" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="16" cy="6" r="2.5" fill="#e2e8f0" />
                    <line x1="16" y1="9" x2="16" y2="15" />
                    {/* Open switch lever */}
                    <line x1="16" y1="15" x2="8" y2="28" />
                    {/* T-bar connector */}
                    <line x1="10" y1="34" x2="22" y2="34" />
                    <line x1="16" y1="34" x2="16" y2="40" />
                    <circle cx="16" cy="40" r="2.5" fill="#e2e8f0" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">PMS (Pemisah)</span>
                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                    Disconnector Switch: memisahkan rangkaian bertegangan saat kondisi tanpa beban untuk isolasi fisik.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PENGHUBUNG (1 Item) & TEGANGAN SISTEM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Penghubung */}
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <span className="text-purple-400 font-bold text-sm flex items-center gap-1.5">
                  <span className="text-xs">▼</span> Penghubung
                </span>
                <span className="text-xs font-mono text-purple-400 font-bold bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/60">
                  1
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">Connection Node</span>
                  <span className="text-[11px] text-slate-400">Titik sambungan percabangan (Junction/Tap)</span>
                </div>
              </div>
            </div>

            {/* Kode Warna Level Tegangan & Status Kerawanan */}
            <div>
              <div className="pb-2 mb-3 border-b border-slate-800">
                <span className="text-emerald-400 font-bold text-sm">Level Tegangan & Status</span>
              </div>
              <div className="space-y-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                    <span>Saluran Ekstra Tinggi 500 kV</span>
                  </div>
                  <span className="font-mono text-cyan-300 font-bold">500 kV</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                    <span>Saluran Tegangan Tinggi 150 kV</span>
                  </div>
                  <span className="font-mono text-blue-300 font-bold">150 kV</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                    <span>Saluran Distribusi / Beban KTT 20 kV</span>
                  </div>
                  <span className="font-mono text-amber-300 font-bold">20 kV</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
                    <span>Kondisi Rawan (N-1 / Overload)</span>
                  </div>
                  <span className="font-bold text-red-400">Rawan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <span>Standar Visual Single Line Diagram PLN • Buku Kerawanan JAMALI</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
