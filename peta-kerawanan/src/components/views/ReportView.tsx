import React from 'react';
import { Breadcrumb } from '../layout/Breadcrumb';
import { ActiveView } from '../layout/Header';
import { FileText, ArrowLeft, Printer, Clock } from 'lucide-react';
import { risksData } from '../../data/risks';

interface ReportViewProps {
  onNavigate: (view: ActiveView) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#f4f7fa] text-slate-800 overflow-hidden relative select-none">
      {/* Top Banner with Breadcrumb & Back */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div>
          <Breadcrumb
            items={[
              { label: 'Jawa, Madura & Bali', view: 'jamali-system' },
              { label: 'Laporan Kerawanan Sistem 2026' }
            ]}
            onNavigate={onNavigate}
          />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#0046ad] flex items-center justify-center font-bold text-xs border border-[#dbeafe]">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1e293b] tracking-tight">
                LAPORAN KAJIAN KERAWANAN SISTEM TENAGA LISTRIK 2026
              </h1>
              <span className="text-xs text-slate-500">
                Unit Induk Pusat Pengatur Beban (UIP2B) Jawa, Madura dan Bali — MANTAPS PLN
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl transition-all shadow-xs font-medium"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak Dokumen</span>
          </button>
          <button
            onClick={() => onNavigate('jamali-system')}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Sistem</span>
          </button>
        </div>
      </div>

      {/* Report Content Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Executive Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-[#0046ad] font-bold uppercase tracking-wider">
                Ringkasan Eksekutif
              </span>
              <h2 className="text-lg font-black text-[#1e293b] mt-1">
                Kajian Keandalan Operasi Sistem & Subsistem JAMALI 2026
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Periode Evaluasi: Semester I - 2026
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Berdasarkan simulasi aliran daya (load flow), kontinjensi N-1 dan N-2, serta uji kestabilan dinamik Sistem Jawa, Madura dan Bali Tahun 2026, telah diidentifikasi sejumlah titik kerawanan kritis pada transmisi 500 kV dan transformator IBT utama. 
            Prioritas penanganan utama mencakup koridor pasokan radial ibukota pada <strong>Kerawanan #7: SUTET Gandul - Durkos - Kembangan</strong> yang memikul pasokan IBT Duri Kosambi dan Muara Karang sebesar 1.700 MW.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-slate-200 text-center">
              <div className="text-[11px] text-slate-500 font-medium">Total Titik Kerawanan</div>
              <div className="text-xl font-black text-[#0046ad] mt-0.5">{risksData.length}</div>
              <div className="text-[10px] text-slate-400">Terdaftar Resmi</div>
            </div>
            <div className="bg-[#fef2f2] p-3.5 rounded-xl border border-[#fecaca] text-center">
              <div className="text-[11px] text-[#dc2626] font-medium">Sangat Rawan</div>
              <div className="text-xl font-black text-[#dc2626] mt-0.5">3</div>
              <div className="text-[10px] text-[#ef4444]">Perlu Defense Scheme</div>
            </div>
            <div className="bg-[#fff7ed] p-3.5 rounded-xl border border-[#fed7aa] text-center">
              <div className="text-[11px] text-[#ea580c] font-medium">Rawan</div>
              <div className="text-xl font-black text-[#ea580c] mt-0.5">4</div>
              <div className="text-[10px] text-[#f97316]">RTTR Monitoring</div>
            </div>
            <div className="bg-[#fefce8] p-3.5 rounded-xl border border-[#fef08a] text-center">
              <div className="text-[11px] text-[#ca8a04] font-medium">Sedang</div>
              <div className="text-xl font-black text-[#ca8a04] mt-0.5">4</div>
              <div className="text-[10px] text-[#eab308]">Termasuk Risk #7</div>
            </div>
          </div>
        </div>

        {/* Priority Action Items: Kerawanan #7 Solution Highlights */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#0046ad] font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>Agenda Percepatan Proyek RUPTL 2025-2034 untuk Mitigasi Kerawanan</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-start gap-3 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-xs">
                  Percepatan Pembangunan SUTET Muara Tawar - Priok 500 kV
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Target COD: Desember 2026 • Mitigasi transfer daya utara DKI Jakarta
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Menyediakan jalur loop alternatif sehingga pasokan ke arah Muara Karang tidak lagi murni radial melalui Duri Kosambi.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-start gap-3 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-xs">
                  Percepatan Pembangunan SUTET Priok - Muara Karang 500 kV
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Target COD: Tahun 2027 • Penguatan ring 500 kV pesisir utara Jakarta
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Menghilangkan kerentanan N-2 sebesar 1.700 MW saat terjadi gangguan pada koridor Gandul-Durkos-Kembangan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
