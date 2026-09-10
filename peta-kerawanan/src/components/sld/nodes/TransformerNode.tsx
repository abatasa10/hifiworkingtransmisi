import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { SLDNodeData } from '../../../types/graph';

export const TransformerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as SLDNodeData;
  const isDimmed = nodeData.dimmed;
  const isHighlighted = nodeData.highlighted || selected;
  const loading = nodeData.loading ?? 50;

  // Detect if this is an IBT (500/150 kV or 275/150 kV) or standard transformer
  const voltageStr = String(nodeData.voltage || '');
  const isIBT =
    nodeData.type === 'ibt' ||
    voltageStr.includes('/') ||
    String(nodeData.name || '').toLowerCase().includes('ibt');

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
          {nodeData.name || `IBT ${ibtNumber}`}
        </span>
        <span className="text-[8px] font-mono text-slate-400 mt-0.5">
          {nodeData.voltage || '500/150 kV'}
        </span>
      </div>

      {/* 2. PMT (Circuit Breaker) Rectangle Block (Gambar 2) */}
      <div
        className="w-2.5 h-4 rounded-xs border shadow-xs my-0.5 transition-colors"
        style={{
          backgroundColor: primaryColor,
          borderColor: isHighlighted ? '#ffffff' : primaryColor
        }}
        title="PMT / Pemutus Tenaga Bay IBT"
      />

      {/* 3. Authentic 3-Winding Interlocking Circles (Gambar 2) with IBT Number */}
      <div className="relative flex items-center justify-center my-0.5">
        {isIBT ? (
          /* 3-WINDING IBT (Auto-Transformer with Tertiary Winding) */
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 60 60" className="w-14 h-14 filter drop-shadow-sm">
              {/* Primary Winding (Top, 500 kV or 275 kV) */}
              <circle
                cx="30"
                cy="19"
                r="13"
                fill="none"
                stroke={primaryColor}
                strokeWidth="2.8"
                className="transition-colors"
              />
              {/* Secondary Winding (Bottom-Left, 150 kV) */}
              <circle
                cx="21"
                cy="35"
                r="13"
                fill="none"
                stroke={secondaryColor}
                strokeWidth="2.8"
                className="transition-colors"
              />
              {/* Tertiary Delta Winding (Bottom-Right, 33 kV) */}
              <circle
                cx="39"
                cy="35"
                r="13"
                fill="none"
                stroke={tertiaryColor}
                strokeWidth="2.8"
                className="transition-colors"
              />
            </svg>

            {/* IBT Number beside circles (Gambar 2) */}
            <span
              className="absolute right-0 top-3 font-black text-xs text-slate-900 bg-white/85 px-1 rounded shadow-xs border border-slate-300 pointer-events-none"
              title={`Nomor IBT: ${ibtNumber}`}
            >
              {ibtNumber}
            </span>
          </div>
        ) : (
          /* STANDARD 2-WINDING TRANSFORMER (Step-Down / KTT) */
          <div className="relative w-8 h-12 flex flex-col items-center justify-center">
            <div
              className="w-6 h-6 rounded-full border-2 absolute top-0"
              style={{ borderColor: secondaryColor, backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
            />
            <div
              className="w-6 h-6 rounded-full border-2 absolute bottom-0"
              style={{ borderColor: tertiaryColor, backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
            />
          </div>
        )}

        {/* Starburst Explosion Risk Badge (Gambar 2: "1&2" or "2" or "3") */}
        {isRawan && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-pulse">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-12 h-12 filter drop-shadow-md">
                <polygon
                  points="50,0 63,22 88,12 85,38 100,50 85,62 88,88 63,78 50,100 37,78 12,88 15,62 0,50 15,38 12,12 37,22"
                  fill="#facc15"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-red-700 font-black text-[11px] tracking-tighter">
                {riskLabel}
              </span>
            </div>
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

