import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { SLDNodeData } from '../../../types/graph';

export const BusbarNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as SLDNodeData;
  const isDimmed = nodeData.dimmed;
  const isHighlighted = nodeData.highlighted || selected;
  const isSubstation = nodeData.type === 'gitet' || nodeData.type === 'gi';

  return (
    <div
      className={`relative group transition-all duration-200 cursor-pointer ${
        isDimmed ? 'opacity-25' : 'opacity-100'
      } ${isHighlighted ? 'scale-105 z-30' : 'z-10'}`}
    >
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

      {/* Node label */}
      <div className="flex flex-col items-center mb-1">
        <span
          className={`text-[11px] font-bold tracking-wider px-2 py-0.5 rounded shadow-sm border whitespace-nowrap transition-colors ${
            isHighlighted
              ? 'bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-[0_0_12px_rgba(0,210,211,0.8)]'
              : 'bg-slate-900/90 text-cyan-200 border-slate-700 hover:border-cyan-400'
          }`}
        >
          {nodeData.code || nodeData.name}
        </span>
        {isSubstation && (
          <span className="text-[9px] text-slate-400 font-mono scale-90">
            {nodeData.voltage}
          </span>
        )}
      </div>

      {/* Busbar thick horizontal line (Physical SLD representation) */}
      <div
        className={`w-28 h-2 rounded-full transition-all duration-300 relative ${
          isHighlighted
            ? 'bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 shadow-[0_0_16px_rgba(0,210,211,0.9)] ring-2 ring-cyan-200'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_8px_rgba(0,129,201,0.6)] group-hover:brightness-125'
        }`}
      >
        {/* Substation connection points dots */}
        <div className="absolute left-3 top-0.5 w-1 h-1 rounded-full bg-slate-950" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0.5 w-1 h-1 rounded-full bg-slate-950" />
        <div className="absolute right-3 top-0.5 w-1 h-1 rounded-full bg-slate-950" />
      </div>

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
