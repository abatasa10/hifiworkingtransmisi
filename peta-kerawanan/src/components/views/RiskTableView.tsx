import React, { useState, useMemo } from 'react';
import { risksData } from '../../data/risks';
import { RiskItem } from '../../types/risk';
import { Search, Filter, Network, ArrowRight, X, Printer, Download, ArrowUpDown } from 'lucide-react';

interface RiskTableViewProps {
  onNavigateToSLD?: (riskNumber?: number) => void;
  onClose?: () => void;
}

export const RiskTableView: React.FC<RiskTableViewProps> = ({
  onNavigateToSLD,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUIT, setSelectedUIT] = useState<string>('Semua');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('Semua');

  const filteredData = useMemo(() => {
    return risksData.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        r.name.toLowerCase().includes(q) ||
        r.number.toString().includes(q) ||
        (r.lineGiSegment && r.lineGiSegment.toLowerCase().includes(q)) ||
        (r.uit && r.uit.toLowerCase().includes(q)) ||
        r.condition.toLowerCase().includes(q) ||
        r.impact.toLowerCase().includes(q) ||
        r.mitigation.toLowerCase().includes(q) ||
        r.solution.shortTerm.some((s) => s.toLowerCase().includes(q));

      const matchUIT = selectedUIT === 'Semua' || r.uit === selectedUIT;
      const matchType = selectedAssetType === 'Semua' || r.assetType === selectedAssetType;

      return matchSearch && matchUIT && matchType;
    });
  }, [searchQuery, selectedUIT, selectedAssetType]);

  const formatList = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return <p className="leading-relaxed">{text}</p>;
    return (
      <div className="space-y-1">
        {lines.map((line, idx) => (
          <div key={idx} className="leading-relaxed">
            {line}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-white text-slate-800 overflow-hidden select-text">
      {/* Top Filter & Toolbar Bar */}
      <div className="p-4 border-b border-slate-200 bg-[#f8fafc] flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-black text-[#1e293b] tracking-tight">
              Tabel Kerawanan Sistem & Subsistem Transmisi
            </h2>
            <p className="text-xs text-slate-500">
              Format Resmi Berdasarkan Buku Kerawanan Sistem & Subsistem Jawa, Madura dan Bali
            </p>
          </div>
          <span className="bg-[#eff6ff] text-[#0046ad] border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {filteredData.length} Kerawanan Terdata
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari segmen GI, masalah, mitigasi..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0046ad] w-56 md:w-64"
            />
          </div>

          {/* Filter UIT */}
          <select
            value={selectedUIT}
            onChange={(e) => setSelectedUIT(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:border-[#0046ad]"
          >
            <option value="Semua">Semua UIT</option>
            <option value="JBB">UIT JBB (Jawa Bagian Barat)</option>
            <option value="JBT">UIT JBT (Jawa Bagian Tengah)</option>
            <option value="JATIM">UIT JATIM (Jawa Timur & Bali)</option>
          </select>

          {/* Filter Tipe Aset */}
          <select
            value={selectedAssetType}
            onChange={(e) => setSelectedAssetType(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:border-[#0046ad]"
          >
            <option value="Semua">Semua Aset</option>
            <option value="SUTET">SUTET 500 kV</option>
            <option value="IBT">IBT 500/150 kV</option>
          </select>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-2"
              title="Tutup Tabel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container with Sticky Header */}
      <div className="flex-1 overflow-auto p-4 bg-slate-50">
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          {/* Document Header Caption */}
          <div className="bg-slate-100/80 px-4 py-2 text-center border-b border-slate-300">
            <span className="font-extrabold text-sm text-[#1e293b]">
              Tabel 2.1: Kerawanan Sistem & Subsistem Transmisi (SLD 500 kV & IBT)
            </span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            {/* Header matching user's reference image with light blue background (#b4c6e7) */}
            <thead>
              <tr className="bg-[#b4c6e7] text-[#1e293b] font-bold border-b border-slate-400">
                <th className="py-3 px-2 text-center border-r border-slate-400 w-12 shrink-0">
                  No
                </th>
                <th className="py-3 px-3 border-r border-slate-400 min-w-[210px] w-64">
                  Line / Segmen GI
                  <div className="text-[10px] font-normal text-slate-700">(Dari GI ke GI mana)</div>
                </th>
                <th className="py-3 px-2 text-center border-r border-slate-400 w-16">
                  UIT
                </th>
                <th className="py-3 px-3 border-r border-slate-400 min-w-[230px]">
                  Kondisi / Permasalahan
                </th>
                <th className="py-3 px-3 border-r border-slate-400 min-w-[210px]">
                  Dampak
                </th>
                <th className="py-3 px-3 border-r border-slate-400 min-w-[230px]">
                  Mitigasi
                </th>
                <th className="py-3 px-3 border-r border-slate-400 min-w-[240px]">
                  Usulan / Solusi
                </th>
                <th className="py-3 px-2 text-center w-20">
                  Aksi
                </th>
              </tr>
            </thead>

            {/* Table Body with alternating rows */}
            <tbody className="divide-y divide-slate-300 text-slate-800">
              {filteredData.length > 0 ? (
                filteredData.map((risk, index) => (
                  <tr
                    key={risk.id}
                    className="hover:bg-[#f0f7ff] transition-colors border-b border-slate-300 align-top"
                  >
                    {/* No */}
                    <td className="py-3 px-2 text-center font-bold text-slate-800 border-r border-slate-300 bg-slate-50/50">
                      {risk.number}
                    </td>

                    {/* Line / Segmen GI (Dari GI apa ke GI apa) */}
                    <td className="py-3 px-3 border-r border-slate-300 bg-white">
                      <div className="font-bold text-[#0046ad] leading-snug">
                        {risk.lineGiSegment || risk.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {risk.voltage}
                        </span>
                        {risk.circuits && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {risk.circuits} Sirkit
                          </span>
                        )}
                        {risk.lengthKm && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {risk.lengthKm} km
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {risk.location}
                      </div>
                    </td>

                    {/* UIT */}
                    <td className="py-3 px-2 text-center font-bold text-slate-700 border-r border-slate-300 bg-slate-50/30">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono border border-slate-300 text-[11px]">
                        {risk.uit || 'JBB'}
                      </span>
                    </td>

                    {/* Kondisi / Permasalahan */}
                    <td className="py-3 px-3 border-r border-slate-300 text-justify leading-relaxed">
                      {risk.condition}
                    </td>

                    {/* Dampak */}
                    <td className="py-3 px-3 border-r border-slate-300 text-justify leading-relaxed">
                      {formatList(risk.impact)}
                    </td>

                    {/* Mitigasi */}
                    <td className="py-3 px-3 border-r border-slate-300 text-justify leading-relaxed">
                      {formatList(risk.mitigation)}
                    </td>

                    {/* Usulan / Solusi */}
                    <td className="py-3 px-3 border-r border-slate-300 text-justify leading-relaxed space-y-2">
                      {risk.solution.shortTerm && risk.solution.shortTerm.length > 0 && (
                        <div>
                          <span className="font-bold underline text-[#1e293b] block mb-0.5">
                            Jangka Pendek :
                          </span>
                          <div className="space-y-1">
                            {risk.solution.shortTerm.map((s, idx) => (
                              <div key={idx}>{s}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {risk.solution.mediumTerm && risk.solution.mediumTerm.length > 0 && (
                        <div>
                          <span className="font-bold underline text-[#1e293b] block mb-0.5">
                            Jangka Menengah / Panjang :
                          </span>
                          <div className="space-y-1 text-slate-600">
                            {risk.solution.mediumTerm.map((s, idx) => (
                              <div key={idx}>{s}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Aksi: Buka di SLD */}
                    <td className="py-3 px-2 text-center border-slate-300">
                      <button
                        onClick={() => onNavigateToSLD && onNavigateToSLD(risk.number)}
                        className="inline-flex items-center gap-1 bg-[#eff6ff] hover:bg-[#0046ad] text-[#0046ad] hover:text-white border border-[#bfdbfe] hover:border-[#0046ad] px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-3xs"
                        title="Buka saluran di SLD 500 kV"
                      >
                        <Network className="w-3 h-3" />
                        <span>SLD</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada kerawanan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
