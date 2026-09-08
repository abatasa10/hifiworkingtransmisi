import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { SLDNodeData } from '../../../types/graph';

export const GeneratorNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as SLDNodeData;
  const isDimmed = nodeData.dimmed;
  const isHighlighted = nodeData.highlighted || selected;

  return (
    <div
      className={`relative group flex flex-col items-center cursor-pointer transition-all duration-200 ${
        isDimmed ? 'opacity-25' : 'opacity-100'
      } ${isHighlighted ? 'scale-110 z-30' : 'z-10'}`}
    >
      {/* Code label above generator */}
      <span
        className={`text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded mb-1 whitespace-nowrap transition-colors ${
          isHighlighted
            ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_10px_rgba(251,191,36,0.8)]'
            : 'bg-slate-900/80 text-amber-300/90 border border-slate-700/80 group-hover:border-amber-400'
        }`}
      >
        {nodeData.code || nodeData.name}
      </span>

      {/* Circular Generator Electrical Symbol with AC sine wave */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
          isHighlighted
            ? 'bg-amber-500/20 border-2 border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.9)]'
            : 'bg-slate-900/90 border-2 border-cyan-400 shadow-[0_0_8px_rgba(0,210,211,0.5)] group-hover:border-amber-400'
        }`}
      >
        {/* AC sine wave symbol ~ */}
        <span className="text-base font-serif font-black text-cyan-300 group-hover:text-amber-300 leading-none">
          ~
        </span>
        {nodeData.capacityMW && (
          <span className="absolute -bottom-3.5 text-[8px] font-mono text-slate-400 whitespace-nowrap">
            {nodeData.capacityMW} MW
          </span>
        )}
      </div>

      {/* Bottom handle to connect to busbars */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="gen-out"
        className="!w-2 !h-2 !bg-amber-400 !border !border-navy-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="gen-in"
        className="!w-2 !h-2 !bg-amber-400 opacity-0"
      />
    </div>
  );
});

GeneratorNode.displayName = 'GeneratorNode';
