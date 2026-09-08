import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { ActiveView } from './Header';

export interface BreadcrumbItem {
  label: string;
  view?: ActiveView;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (view: ActiveView) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 select-none">
      {/* Home / Indonesia */}
      <button
        onClick={() => onNavigate('national')}
        className="flex items-center gap-1 text-slate-500 hover:text-[#0046ad] transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>Indonesia</span>
      </button>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            {isLast ? (
              <span className="font-bold text-[#00368a] truncate max-w-xs">{item.label}</span>
            ) : (
              <button
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else if (item.view) onNavigate(item.view);
                }}
                className="text-slate-500 hover:text-[#0046ad] transition-colors truncate max-w-xs font-medium"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
