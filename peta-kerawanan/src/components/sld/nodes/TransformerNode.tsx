import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { SLDNodeData } from '../../../types/graph';

export const TransformerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as SLDNodeData;
  const isDimmed = nodeData.dimmed;
  const isHighlighted = nodeData.highlighted || selected;
  const loading = nodeData.loading ?? 50;

  // Detect asset type: IBT (500/150 kV) vs Trafo (150/20 kV) vs Beban
  const voltageStr = String(nodeData.voltage || '');
  const nameL = String(nodeData.name || '').toLowerCase();
  const typeL = String(nodeData.assetType || nodeData.type || '').toLowerCase();

  const isBeban = typeL.includes('beban') || typeL.includes('ktt') || nameL.includes('ktt') || nameL.includes('konsumen');
  const isTrafoExplicit = typeL === 'trafo';
  const isIBT =
    !isBeban &&
    !isTrafoExplicit &&
    (typeL === 'ibt' ||
      (nameL.includes('ibt') && !nameL.includes('ktt')) ||
      (voltageStr.includes('500/150') && !nameL.includes('trafo')) ||
      (voltageStr.includes('275/150') && !nameL.includes('trafo')));
  const isTrafo = isTrafoExplicit || (!isBeban && !isIBT);

  const is500to150 = voltageStr.includes('500') || !voltageStr.includes('275');
  const primaryColor = is500to150 ? '#2563eb' : '#9333ea'; // Blue for 500 kV, Purple for 275 kV
  const secondaryColor = '#dc2626'; // Red for 150 kV
  const tertiaryColor = '#eab308'; // Amber for 33 kV tertiary winding

  // Extract IBT number (e.g. "2", "1", "4", "1&2")
  const ibtNumber: string = String(
    nodeData.ibtNumber ||
    (nodeData.name || '').match(/ibt\s*([0-9&]+)/i)?.[1] ||
    (nodeData.code || '').match(/([0-9&]+)/)?.[1] ||
    '1'
  );

  // Check if there is a risk on this IBT
  const isRawan =
    Boolean(nodeData.riskLevel && nodeData.riskLevel !== 'Aman') ||
    Boolean(nodeData.riskStatus && nodeData.riskStatus !== 'Normal');
  const riskLabel: string = String(nodeData.riskNumber || (nodeData.riskLevel === 'Sangat Rawan' ? '1&2' : ibtNumber));

  return (
    <div
      className={`relative group flex flex-col items-center cursor-pointer transition-all duration-200 ${
        isDimmed ? 'opacity-25' : 'opacity-100'
      } ${isHighlighted ? 'scale-110 z-30' : 'z-10'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="ibt-top"
        className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100"
      />

      {/* 1. Header Label */}
      <div className="flex flex-col items-center mb-0.5">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border whitespace-nowrap transition-colors ${
            isHighlighted
              ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_10px_rgba(251,191,36,0.8)]'
              : 'bg-slate-900/90 text-cyan-300 border-slate-700/80 group-hover:border-cyan-400'
          }`}
        >
          {nodeData.name || (isIBT ? `IBT ${ibtNumber}` : isBeban ? 'Konsumen KTT' : 'Trafo Distribusi')}
        </span>
        <span className="text-[8px] font-mono text-slate-400 mt-0.5">
          {nodeData.voltage || (isIBT ? '500/150 kV' : isBeban ? '20 kV' : '150/20 kV')}
        </span>
      </div>

      {/* 2. PMT (Circuit Breaker) Rectangle Block (jika IBT atau Trafo) */}
      {!isBeban && (
        <div
          className="w-2.5 h-3.5 rounded-[1px] border shadow-xs my-0.5 transition-colors"
          style={{
            backgroundColor: primaryColor,
            borderColor: isHighlighted ? '#ffffff' : primaryColor
          }}
          title="PMT / Pemutus Tenaga Bay Trafo"
        />
      )}

      {/* 3. Authentic Symbols */}
      <div className="relative flex items-center justify-center my-0.5">
        {isIBT ? (
          /* A. 3-WINDING IBT (Lingkaran Interlocking Biru, Merah, Kuning + Badge Nomor IBT) */
          <div className="relative w-18 h-16 flex items-center justify-center">
            <svg
              viewBox="0 0 74 66"
              className={`w-18 h-16 transition-all duration-300 ${
                isHighlighted ? 'scale-105' : ''
              }`}
              style={{
                filter: isRawan
                  ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.75))'
                  : 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.45))'
              }}
            >
              {/* Lingkaran 1: Atas (Biru - 500 kV / 275 kV) */}
              <circle
                cx="37"
                cy="23"
                r="16.5"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.6"
                className="transition-colors"
              />

              {/* Lingkaran 2: Bawah Kiri (Merah - 150 kV) */}
              <circle
                cx="26"
                cy="42"
                r="16.5"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3.6"
                className="transition-colors"
              />

              {/* Lingkaran 3: Bawah Kanan (Kuning / Golden Amber - 33 kV) */}
              <circle
                cx="48"
                cy="42"
                r="16.5"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.6"
                className="transition-colors"
              />

              {/* Badge Nomor IBT */}
              <rect
                x="47"
                y="14"
                width="22"
                height="22"
                rx="6"
                fill="rgba(226, 232, 240, 0.92)"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="0.8"
                className="filter drop-shadow-sm"
              />
              <text
                x="58"
                y="26"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#0f172a"
                fontWeight="900"
                fontSize={ibtNumber.length > 2 ? '10' : '13'}
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {ibtNumber}
              </text>
            </svg>

            {/* Status Kerawanan Pill */}
            {isRawan && (
              <div className="absolute -top-1.5 -left-3 z-20 animate-pulse pointer-events-none">
                <span className="px-1.5 py-0.5 rounded-full bg-red-600/95 text-white font-black text-[9px] border border-red-300 shadow-md flex items-center gap-0.5">
                  <span className="text-[8px]">⚠️</span>
                  {riskLabel || String(nodeData.riskStatus || 'N-1')}
                </span>
              </div>
            )}
          </div>
        ) : isBeban ? (
          /* B. BEBAN / KONSUMEN INDUSTRI KTT (Standar PLN: Segitiga Terbalik dengan bulatan koneksi di atas) */
          <div className="flex flex-col items-center justify-center my-0.5">
            <div className="w-2 h-2 rounded-full border border-amber-400 bg-slate-950 -mb-1 z-10 shadow-xs" />
            <svg viewBox="0 0 36 36" className="w-8 h-8 filter drop-shadow-sm">
              <polygon
                points="4,8 32,8 18,32"
                fill="rgba(245, 158, 11, 0.15)"
                stroke="#f59e0b"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/90 border border-amber-500/40 shadow-xs mt-1">
              <span className="text-[9px] font-bold text-amber-300 font-mono">{nodeData.capacityMVA || 60} MVA</span>
            </div>
          </div>
        ) : (
          /* C. STANDARD 2-WINDING TRANSFORMER (Trafo Distribusi 150/20 kV dengan terminal bulatan) */
          <div className="relative flex flex-col items-center justify-center my-0.5">
            <div className="w-1.5 h-1.5 rounded-full border border-red-400 bg-slate-900 -mb-1 z-10" />
            <svg viewBox="0 0 40 50" className="w-10 h-12 filter drop-shadow-md">
              {/* Lingkaran Atas: Sisi Primer 150 kV (Merah) */}
              <circle cx="20" cy="18" r="13" fill="none" stroke="#ef4444" strokeWidth="3" />
              {/* Lingkaran Bawah: Sisi Sekunder 20 kV (Hijau) */}
              <circle cx="20" cy="32" r="13" fill="none" stroke="#22c55e" strokeWidth="3" />
            </svg>
            <div className="w-1.5 h-1.5 rounded-full border border-emerald-400 bg-slate-900 -mt-1 z-10" />
          </div>
        )}
      </div>

      {/* 4. Capacity & Loading Gauge Badge */}
      <div className="flex flex-col items-center scale-90 mt-0.5">
        <span
          className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
            loading > 80
              ? 'bg-red-500/20 text-red-400 border-red-500/60'
              : loading > 65
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
          }`}
        >
          {nodeData.capacityMVA ? `${nodeData.capacityMVA} MVA • ` : ''}{loading}%
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="ibt-bottom"
        className="!w-2.5 !h-2.5 !bg-cyan-400 opacity-0 group-hover:opacity-100"
      />
    </div>
  );
});

TransformerNode.displayName = 'TransformerNode';

