import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { SLDNodeData } from '../../../types/graph';

export const GeneratorNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as SLDNodeData;
  const isDimmed = nodeData.dimmed;
  const isHighlighted = nodeData.highlighted || selected;
  const isRawan =
    Boolean(nodeData.riskLevel && nodeData.riskLevel !== 'Aman') ||
    Boolean(nodeData.riskStatus && nodeData.riskStatus !== 'Normal');

  // Extract clean unit name or code (e.g., "Unit 3", "PLTU Suralaya Unit 3", or "SRLYA")
  const rawName = String(nodeData.name || '');
  const rawCode = String(nodeData.code || '');
  const unitMatch = rawName.match(/unit\s*([0-9A-Za-z\-]+)/i) || rawCode.match(/unit\s*([0-9A-Za-z\-]+)/i);
  const displayLabel = unitMatch ? `Unit ${unitMatch[1]}` : (rawCode || rawName || 'Unit Gen');

  return (
    <div
      className={`relative group flex flex-col items-center cursor-pointer transition-all duration-200 select-none ${
        isDimmed ? 'opacity-25' : 'opacity-100'
      } ${isHighlighted ? 'scale-110 z-30' : 'z-10'}`}
      title={`${nodeData.name || displayLabel} • Bay Pembangkit (1. Pembangkit, 2. Trafo, 3. CB)`}
    >
      {/* Top connection handle for flexible routing */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="gen-in"
        className="!w-2 !h-2 !bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Label Unit on top (Sesuai Gambar Pengguna, contoh: "Unit 3") */}
      <div className="flex flex-col items-center mb-0.5">
        <span
          className={`text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap transition-colors border ${
            isHighlighted
              ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_10px_rgba(251,191,36,0.8)] border-amber-300'
              : 'bg-slate-900/90 text-emerald-300 border-slate-700/80 group-hover:border-emerald-400'
          }`}
        >
          {displayLabel}
        </span>
      </div>

      {/* Authentic Bay Generator Assembly (1. Pembangkit -> 2. Trafo -> 3. CB) */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 44 98"
          className={`w-11 h-[98px] transition-all duration-300 filter ${
            isHighlighted
              ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.85)]'
              : isRawan
              ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.75)]'
              : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
          }`}
        >
          {/* 1. PEMBANGKIT (Green Generator Circle with AC Sine Wave ~) */}
          <circle
            cx="22"
            cy="14"
            r="11"
            fill="rgba(34, 197, 94, 0.1)"
            stroke="#22c55e"
            strokeWidth="2.6"
            className="transition-colors"
          />
          <text
            x="22"
            y="14"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#22c55e"
            fontSize="16"
            fontFamily="serif"
            fontWeight="900"
            className="pointer-events-none select-none"
          >
            ~
          </text>

          {/* Penghubung 1: Pembangkit ke Trafo (Kabel / Bus generator - Biru) */}
          <line
            x1="22"
            y1="25"
            x2="22"
            y2="34"
            stroke="#2563eb"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          {/* 2. TRAFO (Step-up Transformer: 2 Interlocking Circles - Lingkaran Atas Hijau, Lingkaran Bawah Merah) */}
          {/* Lingkaran Atas (Green - Sisi Generator) */}
          <circle
            cx="22"
            cy="42"
            r="8.5"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.6"
            className="transition-colors"
          />
          {/* Lingkaran Bawah (Red - Sisi Tegangan Tinggi) */}
          <circle
            cx="22"
            cy="52"
            r="8.5"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.6"
            className="transition-colors"
          />

          {/* Penghubung 2: Trafo ke CB (Sisi Tegangan Tinggi - Merah) */}
          <line
            x1="22"
            y1="60.5"
            x2="22"
            y2="69"
            stroke="#ef4444"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          {/* 3. CB (Circuit Breaker / PMT Bay: Kotak Solid Merah Persegi Panjang) */}
          <rect
            x="17"
            y="69"
            width="10"
            height="14"
            rx="1"
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth="0.8"
            className="transition-colors"
          />

          {/* Penghubung 3: CB ke Busbar / Handle Bawah (Merah) */}
          <line
            x1="22"
            y1="83"
            x2="22"
            y2="96"
            stroke="#ef4444"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>

        {/* Warning Indicator jika Rawan */}
        {isRawan && (
          <div className="absolute top-1 right-0 w-2 h-2 rounded-full bg-red-500 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Kapasitas MW jika tersedia */}
      {nodeData.capacityMW && (
        <span className="text-[8px] font-mono font-semibold text-slate-400 mt-0.5 whitespace-nowrap bg-slate-900/80 px-1 rounded">
          {nodeData.capacityMW} MW
        </span>
      )}

      {/* Default bottom source handle (berada tepat di ujung garis merah bawah CB) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-red-500 !border !border-navy-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      {/* Bottom handle to connect to busbars */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="gen-out"
        className="!w-2.5 !h-2.5 !bg-red-500 !border !border-navy-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
});

GeneratorNode.displayName = 'GeneratorNode';
