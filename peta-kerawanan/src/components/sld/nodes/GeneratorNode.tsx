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
      title={`${nodeData.name || displayLabel} • Pembangkit Listrik (Generator)`}
    >
      {/* Top connection handle */}
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

      {/* Label Unit on top (Sesuai Gambar 2 Pengguna, contoh: "Unit 3") */}
      <div className="flex flex-col items-center mb-1">
        <span
          className={`text-[11px] font-bold tracking-tight px-2 py-0.5 rounded shadow-xs whitespace-nowrap transition-colors border ${
            isHighlighted
              ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_10px_rgba(251,191,36,0.8)] border-amber-300'
              : 'bg-slate-900/90 text-emerald-300 border-slate-700/80 group-hover:border-emerald-400'
          }`}
        >
          {displayLabel}
        </span>
      </div>

      {/* Authentic Generator Symbol (Gambar 2: Lingkaran Hijau dengan Gelombang AC ~) */}
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 44 44"
            className={`w-11 h-11 transition-all duration-300 filter ${
              isHighlighted
                ? 'drop-shadow-[0_0_10px_rgba(34,197,94,0.9)] scale-105'
                : isRawan
                ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.85)]'
                : 'drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]'
            }`}
          >
            {/* Lingkaran Generator Hijau */}
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="rgba(34, 197, 94, 0.12)"
              stroke="#22c55e"
              strokeWidth="3"
              className="transition-colors"
            />
            {/* Simbol AC Sine Wave ~ di tengah lingkaran (Persis Gambar 2) */}
            <text
              x="22"
              y="22"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#22c55e"
              fontSize="24"
              fontFamily="sans-serif"
              fontWeight="900"
              className="pointer-events-none select-none"
            >
              ~
            </text>
          </svg>

          {/* Warning Indicator jika Rawan */}
          {isRawan && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Sequence: 1. Pembangkit -> 2. Trafo Step-Up (GSUT) -> 3. CB / PMT */}
        <div className="flex flex-col items-center">
          {/* Garis penghubung Generator ke Trafo GSUT */}
          <div className="w-[2px] h-1.5 bg-emerald-500" />
          
          {/* 2. Trafo GSUT (2 Interlocking Circles: Atas Hijau Pembangkit, Bawah Merah GI) */}
          <div className="relative flex flex-col items-center justify-center my-0.5" title="2. Trafo Step-Up Generator (GSUT)">
            <svg viewBox="0 0 32 38" className="w-6 h-7 filter drop-shadow-sm">
              <circle cx="16" cy="13" r="9.5" fill="none" stroke="#22c55e" strokeWidth="2.4" />
              <circle cx="16" cy="25" r="9.5" fill="none" stroke="#ef4444" strokeWidth="2.4" />
            </svg>
          </div>

          {/* Garis penghubung Trafo ke PMT */}
          <div className="w-[2px] h-1 bg-red-500" />

          {/* 3. PMT Circuit Breaker (Kotak Solid Merah) */}
          <div
            className="w-2.5 h-3.5 bg-red-600 rounded-[1px] border border-red-800 shadow-xs transition-colors"
            title="3. PMT / Pemutus Tenaga Bay Generator"
          />
          {/* Garis penghubung bawah PMT ke busbar */}
          <div className="w-[2px] h-2 bg-red-500" />
        </div>
      </div>

      {/* Kapasitas MW / Tegangan jika tersedia */}
      <span className="text-[8.5px] font-mono font-semibold text-emerald-400 mt-0.5 whitespace-nowrap bg-slate-900/80 px-1.5 py-0.2 rounded border border-slate-800">
        {nodeData.capacityMW ? `${nodeData.capacityMW} MW` : (nodeData.voltage || '500 kV')}
      </span>

      {/* Default bottom source handle (berada tepat di ujung garis penghantar bawah) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-red-500 !border !border-navy-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />
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
