import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Zap, ShieldAlert } from 'lucide-react';
import { initialNodes500kV } from '../../data/nodes500kv';
import { initialEdges500kV } from '../../data/edges500kv';
import { risksData } from '../../data/risks';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'node' | 'edge' | 'risk' | 'ibt';
  riskId?: number;
  riskLevel?: string;
}

interface SLDSearchBarProps {
  onSelectItem: (item: SearchResultItem) => void;
}

export const SLDSearchBar: React.FC<SLDSearchBarProps> = ({ onSelectItem }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const q = query.toLowerCase().trim();
    const list: SearchResultItem[] = [];

    risksData.forEach((risk) => {
      if (
        risk.name.toLowerCase().includes(q) ||
        risk.number.toString() === q ||
        `kerawanan ${risk.number}`.includes(q) ||
        `risk #${risk.number}`.includes(q)
      ) {
        list.push({
          id: risk.edgeId || `RISK_${risk.id}`,
          title: `Kerawanan #${risk.number}: ${risk.name}`,
          subtitle: `${risk.assetType} ${risk.voltage} • Status: ${risk.riskLevel}`,
          category: 'risk',
          riskId: risk.number,
          riskLevel: risk.riskLevel
        });
      }
    });

    initialNodes500kV.forEach((node) => {
      const data = node.data;
      if (
        data.name.toLowerCase().includes(q) ||
        data.code.toLowerCase().includes(q) ||
        data.id.toLowerCase().includes(q)
      ) {
        list.push({
          id: node.id,
          title: data.name,
          subtitle: `${data.code} • ${data.voltage} • Tier ${data.tier}`,
          category: data.type === 'ibt' ? 'ibt' : 'node'
        });
      }
    });

    initialEdges500kV.forEach((edge) => {
      const data = edge.data;
      if (data && (data.name.toLowerCase().includes(q) || data.id.toLowerCase().includes(q))) {
        list.push({
          id: edge.id,
          title: data.name,
          subtitle: `${data.voltage} • ${data.circuitCount} Sirkit • L1: ${data.loading.circuit1}%`,
          category: 'edge',
          riskId: data.riskId,
          riskLevel: data.riskLevel
        });
      }
    });

    return list.slice(0, 8);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    onSelectItem(item);
    setQuery(item.title);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-72 md:w-80">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Cari GI, IBT, Saluran atau No. Kerawanan..."
          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0046ad] focus:ring-2 focus:ring-[#eff6ff] shadow-xs"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50 divide-y divide-slate-100">
          {results.map((item) => (
            <button
              key={`${item.category}-${item.id}`}
              onClick={() => handleSelect(item)}
              className="w-full px-3 py-2 text-left hover:bg-[#eff6ff]/60 flex items-start gap-2.5 transition-colors group"
            >
              <div className="mt-0.5">
                {item.category === 'risk' ? (
                  <ShieldAlert className="w-4 h-4 text-[#ea580c]" />
                ) : item.category === 'edge' ? (
                  <Zap className="w-4 h-4 text-[#0046ad]" />
                ) : item.category === 'ibt' ? (
                  <span className="text-[#16a34a] font-bold text-xs">IBT</span>
                ) : (
                  <span className="text-[#0046ad] font-bold text-xs">GI</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#0046ad] truncate">
                    {item.title}
                  </span>
                  {item.riskId && (
                    <span className="bg-[#ffedd5] text-[#ea580c] text-[10px] font-mono px-1 py-0.2 rounded font-bold border border-[#fed7aa]">
                      #{item.riskId}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {item.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
