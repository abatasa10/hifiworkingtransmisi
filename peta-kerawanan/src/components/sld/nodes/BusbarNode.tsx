import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { SLDNodeData } from '../../../types/graph';

export const BusbarNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as SLDNodeData;
  const isDimmed = nodeData.dimmed;
  const isHighlighted = nodeData.highlighted || selected;
  const isSubstation = nodeData.type === 'gitet' || nodeData.type === 'gi';
  const isRawan = Boolean(nodeData.riskStatus && nodeData.riskStatus !== 'Normal');
  const is500kV = String(nodeData.voltage || '').includes('500');

  return (
    <div
      className={`relative group transition-all duration-200 cursor-pointer ${
        isDimmed ? 'opacity-25' : 'opacity-100'
      } ${isHighlighted ? 'scale-105 z-30' : 'z-10'}`}
    >
      {/* Default target handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      {/* Top handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-cyan-400 !border !border-navy-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-src"
        className="!w-2 !h-2 !bg-cyan-400 opacity-0"
      />

      {/* Node label with Starburst Risk Badge if rawan (Gambar 1 & Gambar 2) */}
      <div className="flex flex-col items-center mb-1 relative">
        {isRawan && (
          <div className="absolute -top-3 -right-4 z-30 flex items-center justify-center w-7 h-7 animate-risk-pulse">
            <svg viewBox="0 0 100 100" className="w-7 h-7 filter drop-shadow-md">
              <polygon
                points="50,0 63,22 88,12 85,38 100,50 85,62 88,88 63,78 50,100 37,78 12,88 15,62 0,50 15,38 12,12 37,22"
                fill="#ff4757"
                stroke="#ffffff"
                strokeWidth="4"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-slate-950 font-black text-[8px]">
              {String(nodeData.riskStatus || '!')}
            </span>
          </div>
        )}
        <span
          className={`text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded shadow-sm border whitespace-nowrap transition-colors ${
            isHighlighted
              ? 'bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-[0_0_12px_rgba(0,210,211,0.8)]'
              : isRawan
              ? 'bg-slate-900 text-red-300 border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
              : 'bg-slate-900/90 text-cyan-200 border-slate-700 hover:border-cyan-400'
          }`}
        >
          {nodeData.code || nodeData.name}
        </span>
        {isSubstation && (
          <span className={`text-[9px] font-mono scale-90 ${is500kV ? 'text-cyan-400' : 'text-blue-300'}`}>
            {nodeData.voltage || '500 kV'}
          </span>
        )}
      </div>

      {/* Busbar thick horizontal line (Physical SLD representation matching Gambar 1 & Gambar 2) */}
      <div
        className={`w-36 h-2.5 rounded-full transition-all duration-300 relative ${
          isRawan
            ? 'bg-gradient-to-r from-red-500 via-amber-400 to-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)] ring-2 ring-red-400'
            : isHighlighted
            ? 'bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 shadow-[0_0_16px_rgba(0,210,211,0.9)] ring-2 ring-cyan-200'
            : is500kV
            ? 'bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(0,210,211,0.6)] group-hover:brightness-125'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_8px_rgba(59,130,246,0.6)] group-hover:brightness-125'
        }`}
      >
        {/* Substation connection points dots (Bay ports) */}
        <div className="absolute left-3 top-0.5 w-1.5 h-1.5 rounded-full bg-slate-950" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0.5 w-1.5 h-1.5 rounded-full bg-slate-950" />
        <div className="absolute right-3 top-0.5 w-1.5 h-1.5 rounded-full bg-slate-950" />
      </div>

      {/* Default bottom source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      {/* Bottom handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-cyan-400 !border !border-navy-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-tgt"
        className="!w-2 !h-2 !bg-cyan-400 opacity-0"
      />

      {/* Left/Right handles for horizontal links */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-cyan-400 opacity-0"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-cyan-400 opacity-0"
      />
    </div>
  );
});

BusbarNode.displayName = 'BusbarNode';
