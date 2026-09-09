import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { SLDNodeData } from '../../../types/graph';

export const TransformerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as SLDNodeData;
  const isDimmed = nodeData.dimmed;
  const isHighlighted = nodeData.highlighted || selected;
  const loading = nodeData.loading ?? 50;

  return (
    <div
      className={`relative group flex flex-col items-center cursor-pointer transition-all duration-200 ${
        isDimmed ? 'opacity-25' : 'opacity-100'
      } ${isHighlighted ? 'scale-110 z-30' : 'z-10'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-emerald-400 opacity-0 group-hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="ibt-top"
        className="!w-2 !h-2 !bg-emerald-400 opacity-0 group-hover:opacity-100"
      />

      {/* Label */}
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded mb-0.5 whitespace-nowrap transition-colors ${
          isHighlighted
            ? 'bg-emerald-400 text-slate-950 font-black shadow-[0_0_10px_rgba(52,211,153,0.8)]'
            : 'bg-slate-900/90 text-emerald-300 border border-slate-700/80 group-hover:border-emerald-400'
        }`}
      >
        {nodeData.code || nodeData.name}
      </span>

      {/* Standard Electrical Two Interlocking Circles Transformer Symbol */}
      <div className="relative w-7 h-11 flex flex-col items-center justify-center my-0.5">
        {/* Top coil circle */}
        <div
          className={`w-6 h-6 rounded-full border-2 absolute top-0 transition-colors ${
            isHighlighted
              ? 'border-emerald-300 bg-emerald-950/40 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
              : 'border-emerald-400 bg-slate-900/60 group-hover:border-emerald-300'
          }`}
        />
        {/* Bottom coil circle */}
        <div
          className={`w-6 h-6 rounded-full border-2 absolute bottom-0 transition-colors ${
            isHighlighted
              ? 'border-emerald-300 bg-emerald-950/40 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
              : 'border-emerald-400 bg-slate-900/60 group-hover:border-emerald-300'
          }`}
        />
      </div>

      {/* Secondary & Loading info */}
      <div className="flex flex-col items-center scale-90 -mt-0.5">
        <span className="text-[8px] font-mono text-slate-400">
          {nodeData.voltage || '500/150 kV'}
        </span>
        <span
          className={`text-[8px] font-bold px-1 rounded ${
            loading > 80
              ? 'bg-red-500/30 text-red-300 border border-red-500/50'
              : loading > 60
              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
              : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
          }`}
        >
          {loading}%
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-emerald-400 opacity-0 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="ibt-bottom"
        className="!w-2 !h-2 !bg-emerald-400 opacity-0 group-hover:opacity-100"
      />
    </div>
  );
});

TransformerNode.displayName = 'TransformerNode';
