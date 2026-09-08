import React, { useState } from 'react';
import { Breadcrumb } from '../layout/Breadcrumb';
import { ActiveView } from '../layout/Header';
import { Layers, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2, Search } from 'lucide-react';

interface IBTListViewProps {
  onNavigate: (view: ActiveView) => void;
  onSelectIBT: (ibtId: string) => void;
}

interface IBTRecord {
  id: string;
  name: string;
  substation: string;
  upb: string;
  capacityMVA: number;
  voltage: string;
  circuits: number;
  loading: number;
  riskId?: number;
  riskLevel: 'Sangat Rawan' | 'Rawan' | 'Sedang' | 'Aman';
  status: 'Beroperasi' | 'Pemeliharaan';
}

const ibtData: IBTRecord[] = [
  {
    id: 'IBT_DKSBI',
    name: 'IBT 1 & 2 Duri Kosambi',
    substation: 'GITET Duri Kosambi',
    upb: 'UP2B Jakarta',
    capacityMVA: 1000,
    voltage: '500/150 kV',
    circuits: 2,
    loading: 55,
    riskId: 7,
    riskLevel: 'Sedang',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_MKRNG',
    name: 'IBT 1 & 2 Muara Karang',
    substation: 'GITET Muara Karang',
    upb: 'UP2B Jakarta',
    capacityMVA: 1000,
    voltage: '500/150 kV',
    circuits: 2,
    loading: 64,
    riskId: 7,
    riskLevel: 'Sedang',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_GNDUL_1',
    name: 'IBT 1, 2, 3 Gandul',
    substation: 'GITET Gandul',
    upb: 'UP2B Jakarta',
    capacityMVA: 1500,
    voltage: '500/150 kV',
    circuits: 3,
    loading: 72,
    riskLevel: 'Rawan',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_KMBNG_1',
    name: 'IBT 1, 2, 3 Kembangan',
    substation: 'GITET Kembangan',
    upb: 'UP2B Jakarta',
    capacityMVA: 1500,
    voltage: '500/150 kV',
    circuits: 3,
    loading: 68,
    riskId: 7,
    riskLevel: 'Sedang',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_CIBNG_1',
    name: 'IBT 1 & 2 Cibinong',
    substation: 'GITET Cibinong',
    upb: 'UP2B Jawa Barat',
    capacityMVA: 1000,
    voltage: '500/150 kV',
    circuits: 2,
    loading: 78,
    riskId: 1,
    riskLevel: 'Sangat Rawan',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_BOGOR_1',
    name: 'IBT 1 & 2 Bogor',
    substation: 'GITET Bogor',
    upb: 'UP2B Jawa Barat',
    capacityMVA: 1000,
    voltage: '500/150 kV',
    circuits: 2,
    loading: 65,
    riskLevel: 'Rawan',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_BDSLN_1',
    name: 'IBT 1, 2 Bandung Selatan',
    substation: 'GITET Bandung Selatan',
    upb: 'UP2B Jawa Barat',
    capacityMVA: 1000,
    voltage: '500/150 kV',
    circuits: 2,
    loading: 61,
    riskLevel: 'Aman',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_UNGRN_1',
    name: 'IBT 1, 2, 3 Ungaran',
    substation: 'GITET Ungaran',
    upb: 'UP2B Jawa Tengah',
    capacityMVA: 1500,
    voltage: '500/150 kV',
    circuits: 3,
    loading: 74,
    riskId: 20,
    riskLevel: 'Sangat Rawan',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_PEDAN_1',
    name: 'IBT 1 & 2 Pedan',
    substation: 'GITET Pedan',
    upb: 'UP2B Jawa Tengah',
    capacityMVA: 1000,
    voltage: '500/150 kV',
    circuits: 2,
    loading: 66,
    riskLevel: 'Sedang',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_KRIAN_1',
    name: 'IBT 1, 2, 3 Krian',
    substation: 'GITET Krian',
    upb: 'UP2B Jawa Timur',
    capacityMVA: 1500,
    voltage: '500/150 kV',
    circuits: 3,
    loading: 70,
    riskLevel: 'Rawan',
    status: 'Beroperasi'
  },
  {
    id: 'IBT_GRATI_1',
    name: 'IBT 1 & 2 Grati',
    substation: 'GITET Grati',
    upb: 'UP2B Jawa Timur',
    capacityMVA: 1000,
    voltage: '500/150 kV',
    circuits: 2,
    loading: 58,
    riskId: 29,
    riskLevel: 'Rawan',
    status: 'Beroperasi'
  }
];

export const IBTListView: React.FC<IBTListViewProps> = ({ onNavigate, onSelectIBT }) => {
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('Semua');

  const filtered = ibtData.filter((ibt) => {
    const matchesSearch =
      ibt.name.toLowerCase().includes(search.toLowerCase()) ||
      ibt.substation.toLowerCase().includes(search.toLowerCase()) ||
      ibt.upb.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === 'Semua' || ibt.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#f4f7fa] text-slate-800 overflow-hidden relative select-none">
      {/* Top Banner with Breadcrumb & Back */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div>
          <Breadcrumb
            items={[
              { label: 'Jawa, Madura & Bali', view: 'jamali-system' },
              { label: 'Daftar IBT (Interbus Transformer)' }
            ]}
            onNavigate={onNavigate}
          />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#0046ad] flex items-center justify-center font-bold text-xs border border-[#dbeafe]">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1e293b] tracking-tight">
                DAFTAR IBT SISTEM JAWA, MADURA DAN BALI
              </h1>
              <span className="text-xs text-slate-500">
                Monitoring Status, Pembebanan, dan Kerawanan 58 Unit IBT 500/150 kV
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('jamali-system')}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke Sistem</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 shadow-xs">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari IBT atau Gardu Induk..."
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0046ad]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Filter Kerawanan:</span>
          {['Semua', 'Sangat Rawan', 'Rawan', 'Sedang', 'Aman'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className={`px-3 py-1 rounded-lg transition-colors font-semibold text-xs ${
                filterRisk === r
                  ? 'bg-[#0046ad] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-slate-500 font-mono text-[11px] border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Nama IBT</th>
                <th className="p-3.5">Lokasi GITET</th>
                <th className="p-3.5">UP2B</th>
                <th className="p-3.5">Tegangan</th>
                <th className="p-3.5">Kapasitas</th>
                <th className="p-3.5">Loading</th>
                <th className="p-3.5">Kerawanan Terkait</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((ibt) => {
                const hasRisk = !!ibt.riskId;
                return (
                  <tr
                    key={ibt.id}
                    className="hover:bg-[#eff6ff]/40 transition-colors group cursor-pointer"
                    onClick={() => {
                      onSelectIBT(ibt.id);
                      onNavigate('sld-500kv');
                    }}
                  >
                    <td className="p-3.5 font-bold text-slate-900 group-hover:text-[#0046ad]">
                      {ibt.name}
                    </td>
                    <td className="p-3.5">{ibt.substation}</td>
                    <td className="p-3.5 text-slate-500">{ibt.upb}</td>
                    <td className="p-3.5 font-mono text-[#0046ad] font-semibold">{ibt.voltage}</td>
                    <td className="p-3.5 font-mono">{ibt.capacityMVA} MVA</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              ibt.loading > 75
                                ? 'bg-[#dc2626]'
                                : ibt.loading > 60
                                ? 'bg-[#ea580c]'
                                : 'bg-[#16a34a]'
                            }`}
                            style={{ width: `${ibt.loading}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800">{ibt.loading}%</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {hasRisk ? (
                        <span className="inline-flex items-center gap-1.5 bg-[#ffedd5] border border-[#fed7aa] text-[#ea580c] px-2 py-0.5 rounded font-bold text-[11px]">
                          <ShieldAlert className="w-3 h-3" />
                          Risk #{ibt.riskId} ({ibt.riskLevel})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#16a34a] text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button className="text-[#0046ad] font-bold hover:underline flex items-center gap-1 ml-auto">
                        <span>Lihat di SLD</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
