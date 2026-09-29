import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { powerSystems } from '../../data/systems';
import { PowerSystem } from '../../types/system';
import { ActiveView } from '../layout/Header';
import { Breadcrumb } from '../layout/Breadcrumb';
import { ListFilter, MapPin } from 'lucide-react';

interface NationalMapViewProps {
  onSelectSystem: (systemId: string) => void;
  onNavigate: (view: ActiveView) => void;
}

const SYSTEM_COORDS: Record<string, [number, number]> = {
  sumatera: [-0.4, 101.5],
  jamali: [-7.2, 110.5],
  kalimantan: [-1.4, 114.7],
  sulawesi: [-1.9, 120.6],
  'nusa-tenggara': [-8.6, 119.2],
  maluku: [-3.0, 128.0],
  papua: [-4.3, 138.6]
};

const INDONESIA_BOUNDS: L.LatLngBoundsLiteral = [
  [-11, 92],
  [7, 146]
];

/** Fit the map to the whole Indonesian archipelago once on mount */
const IndonesiaExtent: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(INDONESIA_BOUNDS, { padding: [28, 28] });
    map.setMaxBounds(L.latLngBounds(INDONESIA_BOUNDS).pad(0.4));
  }, [map]);
  return null;
};

interface MarkerPoints {
  [systemId: string]: L.Point;
}

/** Repositions the HTML system cards following the Leaflet map pan/zoom */
const PositionedSystemMarkers: React.FC<{
  systems: PowerSystem[];
  coords: Record<string, [number, number]>;
  onOpen: (sys: PowerSystem) => void;
}> = ({ systems, coords, onOpen }) => {
  const map = useMap();
  const [points, setPoints] = useState<MarkerPoints>(() => {
    const next: MarkerPoints = {};
    for (const [id, ll] of Object.entries(coords)) next[id] = map.latLngToContainerPoint(L.latLng(ll));
    return next;
  });
  const [hoveredSystem, setHoveredSystem] = useState<PowerSystem | null>(null);

  useEffect(() => {
    const update = () => {
      const next: MarkerPoints = {};
      for (const [id, ll] of Object.entries(coords)) next[id] = map.latLngToContainerPoint(L.latLng(ll));
      setPoints(next);
    };
    update();
    map.on('move zoom', update);
    return () => {
      map.off('move zoom', update);
    };
  }, [map, coords]);

  return (
    <>
      {systems.map((sys) => {
        const pt = points[sys.id];
        if (!pt) return null;
        const isJamali = sys.id === 'jamali';

        return (
          <div
            key={sys.id}
            style={{ left: pt.x, top: pt.y, transform: 'translate(-50%, -50%)' }}
            className="absolute z-[900] group cursor-pointer"
            onMouseEnter={() => setHoveredSystem(sys)}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onOpen(sys)}
          >
            {isJamali && (
              <div className="absolute -inset-1.5 rounded-2xl bg-[#0046ad]/15 animate-ping pointer-events-none" />
            )}

            {/* Pin Card Box */}
            <div
              className={`transition-all duration-200 rounded-xl p-2.5 border flex flex-col shadow-md bg-white ${
                isJamali
                  ? 'border-[#0046ad] shadow-[0_4px_16px_rgba(0,70,173,0.2)] scale-105 ring-2 ring-[#0046ad]/30'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
              }`}
            >
              {/* Header: Pin Point Icon + System Name + Active Tag */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isJamali
                      ? 'bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe]'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 fill-current" />
                </div>

                <div className="text-left whitespace-nowrap">
                  <div className="font-bold text-xs text-slate-800 group-hover:text-[#0046ad] transition-colors flex items-center gap-1.5">
                    <span>{sys.name}</span>
                    {isJamali && (
                      <span className="text-[9px] bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe] px-1.5 py-0.2 rounded font-bold">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                    <span>{sys.upbCount} UP2B</span>
                    <span>•</span>
                    <span>{sys.subsystemCount} Subsistem</span>
                  </div>
                </div>
              </div>

              {/* Risk Breakdown: Merah (N-1), Kuning (N-2), Abu-Abu (N-1-2) */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px]">
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#fee2e2] text-[#dc2626] font-bold border border-[#fecaca]"
                  title="Merah (N-1): Kerawanan Tunggal"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                  <span>N-1: {sys.risksN1}</span>
                </div>
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#fef9c3] text-[#a16207] font-bold border border-[#fef08a]"
                  title="Kuning (N-2): Kerawanan Ganda"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                  <span>N-2: {sys.risksN2}</span>
                </div>
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#475569] font-bold border border-[#cbd5e1]"
                  title="Abu-Abu (N-1-2): Kerawanan Kombinasi"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
                  <span>N-1-2: {sys.risksN12}</span>
                </div>
              </div>
            </div>

            {/* Tooltip Card on Hover */}
            {hoveredSystem?.id === sys.id && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl p-3 shadow-xl z-50 text-left pointer-events-none">
                <div className="text-xs font-bold text-slate-800 flex justify-between items-center mb-1">
                  <span>{sys.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#eff6ff] text-[#0046ad] border border-[#dbeafe]">
                    {sys.upbCount} UP2B • {sys.subsystemCount} Sub
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                  {sys.description}
                </p>

                <div className="grid grid-cols-3 gap-1 text-[10px] text-center border-t border-slate-100 pt-1.5 mb-2 font-mono">
                  <div className="bg-[#fee2e2]/60 p-1 rounded border border-[#fecaca]">
                    <div className="text-[9px] text-[#dc2626] font-bold">Merah (N-1)</div>
                    <div className="font-extrabold text-xs text-[#991b1b]">{sys.risksN1}</div>
                  </div>
                  <div className="bg-[#fef9c3]/60 p-1 rounded border border-[#fef08a]">
                    <div className="text-[9px] text-[#a16207] font-bold">Kuning (N-2)</div>
                    <div className="font-extrabold text-xs text-[#854d0e]">{sys.risksN2}</div>
                  </div>
                  <div className="bg-[#f1f5f9] p-1 rounded border border-[#cbd5e1]">
                    <div className="text-[9px] text-[#475569] font-bold">Abu-Abu</div>
                    <div className="font-extrabold text-xs text-[#334155]">{sys.risksN12}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] border-t border-slate-100 pt-1.5 text-slate-500 font-mono">
                  <div>
                    GI / GITET: <span className="text-slate-800 font-bold">{sys.giCount}</span>
                  </div>
                  <div>
                    IBT: <span className="text-slate-800 font-bold">{sys.ibtCount}</span>
                  </div>
                </div>
                {isJamali && (
                  <div className="mt-2 text-[10px] text-[#0046ad] font-bold text-center bg-[#eff6ff] py-1 rounded border border-[#dbeafe]">
                    Klik pin untuk membuka Sistem JAMALI →
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export const NationalMapView: React.FC<NationalMapViewProps> = ({
  onSelectSystem,
  onNavigate
}) => {
  const [selectedSystemModal, setSelectedSystemModal] = useState<PowerSystem | null>(null);

  const openSystem = (sys: PowerSystem) => {
    if (sys.id === 'jamali') {
      onSelectSystem(sys.id);
    } else {
      setSelectedSystemModal(sys);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f4f7fa] text-slate-800 overflow-hidden relative select-none">
      {/* Top Banner with Breadcrumb & Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div>
          <Breadcrumb items={[{ label: 'Peta Nasional' }]} onNavigate={onNavigate} />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#0046ad] flex items-center justify-center font-bold text-xs border border-[#dbeafe]">
              1
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1e293b] tracking-tight">
                PETA NASIONAL SEBARAN SISTEM TENAGA LISTRIK
              </h1>
              <span className="text-xs text-slate-500">
                Peta Risiko & Sebaran Sistem Transmisi Tenaga Listrik Indonesia Tahun 2026
              </span>
            </div>
          </div>
        </div>

        {/* Legend Box at top right (Merah N-1, Kuning N-2, Abu-Abu N-1-2) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs text-xs space-y-1.5">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Legenda Tingkat Kerawanan
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#dc2626] shrink-0 shadow-xs" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-800 font-bold text-xs">Merah (N-1)</span>
                <span className="text-slate-500 text-[10px]">— Kerawanan Tunggal</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#eab308] shrink-0 shadow-xs" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-800 font-bold text-xs">Kuning (N-2)</span>
                <span className="text-slate-500 text-[10px]">— Kerawanan Ganda</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#64748b] shrink-0 shadow-xs" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-800 font-bold text-xs">Abu-Abu (N-1-2)</span>
                <span className="text-slate-500 text-[10px]">— Kerawanan Kombinasi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Leaflet Map */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer
          className="absolute inset-0 z-0"
          center={[-2, 116]}
          zoom={4}
          minZoom={3}
          maxZoom={12}
          scrollWheelZoom
          attributionControl
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <IndonesiaExtent />
          <PositionedSystemMarkers
            systems={powerSystems}
            coords={SYSTEM_COORDS}
            onOpen={openSystem}
          />
        </MapContainer>

        {/* Center Instruction Tag */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-600 shadow-sm flex items-center gap-2 z-[950]">
          <span className="w-2 h-2 rounded-full bg-[#0046ad] animate-pulse" />
          <span>Klik pada pin <strong>"Jawa, Madura dan Bali"</strong> untuk melihat detail sistem</span>
        </div>

        {/* Bottom Left Button: Lihat Daftar Sistem */}
        <button
          onClick={() => onSelectSystem('jamali')}
          className="absolute bottom-6 left-6 bg-white hover:bg-slate-50 border border-slate-200 text-[#0046ad] font-bold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-all hover:scale-105 z-[950]"
        >
          <ListFilter className="w-4 h-4" />
          <span>Lihat Daftar Sistem</span>
        </button>
      </div>

      {/* Modal for other systems */}
      {selectedSystemModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0046ad]" />
                <h3 className="font-bold text-base text-slate-800">Sistem {selectedSystemModal.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSystemModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedSystemModal.description}
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500">UP2B</div>
                <div className="text-sm font-bold text-[#0046ad]">{selectedSystemModal.upbCount}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500">Subsistem</div>
                <div className="text-sm font-bold text-slate-800">{selectedSystemModal.subsystemCount}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500">GI / GITET</div>
                <div className="text-sm font-bold text-[#16a34a]">{selectedSystemModal.giCount}</div>
              </div>
            </div>

            {/* Kerawanan Summary in Modal */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Ringkasan Kerawanan Sistem:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#fee2e2] p-2 rounded-lg border border-[#fecaca]">
                  <div className="text-[10px] text-[#dc2626] font-bold">Merah (N-1)</div>
                  <div className="text-sm font-black text-[#991b1b]">{selectedSystemModal.risksN1}</div>
                </div>
                <div className="bg-[#fef9c3] p-2 rounded-lg border border-[#fef08a]">
                  <div className="text-[10px] text-[#a16207] font-bold">Kuning (N-2)</div>
                  <div className="text-sm font-black text-[#854d0e]">{selectedSystemModal.risksN2}</div>
                </div>
                <div className="bg-[#f1f5f9] p-2 rounded-lg border border-[#cbd5e1]">
                  <div className="text-[10px] text-[#475569] font-bold">Abu-Abu (N-1-2)</div>
                  <div className="text-sm font-black text-[#334155]">{selectedSystemModal.risksN12}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedSystemModal(null);
                  onSelectSystem('jamali');
                }}
                className="flex-1 bg-[#0046ad] hover:bg-[#00368a] text-white font-bold text-xs py-2 rounded-xl transition-colors"
              >
                Buka Sistem JAMALI
              </button>
              <button
                onClick={() => setSelectedSystemModal(null)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};