import React from 'react';
import { X } from 'lucide-react';
import { SLDNodeData, SLDEdgeData } from '../../types/graph';
import { RiskItem } from '../../types/risk';
import { RiskDetailContent } from './RiskDetailContent';
import { NormalLineContent } from './NormalLineContent';
import { SubstationContent } from './SubstationContent';
import { IBTContent } from './IBTContent';

export type SelectedItem =
  | { type: 'risk'; data: RiskItem }
  | { type: 'line'; data: SLDEdgeData }
  | { type: 'node'; data: SLDNodeData }
  | { type: 'ibt'; data: SLDNodeData }
  | null;

interface RightDetailPanelProps {
  selectedItem: SelectedItem;
  onClose: () => void;
  onSelectConnection: (edgeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onOpenRisk: (riskId: number) => void;
}

export const RightDetailPanel: React.FC<RightDetailPanelProps> = ({
  selectedItem,
  onClose,
  onSelectConnection,
  onSelectNode,
  onOpenRisk
}) => {
  if (!selectedItem) return null;

  return (
    <aside
      aria-label="Detail Panel Aset dan Kerawanan"
      className="w-96 md:w-[410px] h-full bg-white border-l border-slate-200 shadow-xl flex flex-col z-40 transition-transform duration-300 relative text-slate-800"
    >
      {/* Top Close Button */}
      <button
        onClick={onClose}
        aria-label="Tutup panel detail"
        className="absolute right-3.5 top-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-50"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Dynamic Content based on selection type */}
      {selectedItem.type === 'risk' && (
        <RiskDetailContent risk={selectedItem.data} onSelectAsset={onSelectNode} />
      )}

      {selectedItem.type === 'line' && (
        <NormalLineContent line={selectedItem.data} />
      )}

      {selectedItem.type === 'node' && (
        <SubstationContent
          node={selectedItem.data}
          onSelectConnection={onSelectConnection}
          onSelectNode={onSelectNode}
        />
      )}

      {selectedItem.type === 'ibt' && (
        <IBTContent node={selectedItem.data} onOpenRisk={onOpenRisk} />
      )}
    </aside>
  );
};
