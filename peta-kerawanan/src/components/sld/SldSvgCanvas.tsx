import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ENG_SLD,
  EngSldGraph,
  engBayGeoms,
  engCircuitGeoms,
  engGraphBounds,
  engTierGuides,
  engIbtGeoms,
  engNodeGeoms,
  engPinGeoms
} from '../../lib/sld/engineSld';

export type SldSvgSelection =
  | { kind: 'node'; code: string }
  | { kind: 'circuit'; id: string }
  | { kind: 'ibt'; id: string }
  | { kind: 'bay'; id: string }
  | { kind: 'risk'; seq: number }
  | null;

interface SldSvgCanvasProps {
  graph: EngSldGraph;
  selection: SldSvgSelection;
  /** light = putih ala engine, dark = blueprint gelap */
  theme?: 'light' | 'dark';
  /** riskStatus-style dimming helpers driven by the host filter */
  dimNode?: (code: string) => boolean;
  dimCircuit?: (id: string) => boolean;
  dimRisk?: (seq: number) => boolean;
  onSelectNode: (code: string) => void;
  onSelectCircuit: (id: string) => void;
  onSelectIbt: (id: string) => void;
  onSelectRisk: (seq: number) => void;
  onBackgroundClick: () => void;
}

/**
 * Engine-style SLD canvas (SVG port of opsys-ui SldCanvas): busbar per Tier,
 * P2B voltage colors, IBT 3-circle wheels, bay stubs, PMT boxes, numbered
 * risk pins, tier guide lines, pan & zoom.
 */
export const SldSvgCanvas: React.FC<SldSvgCanvasProps> = ({
  graph,
  selection,
  theme = 'light',
  dimNode,
  dimCircuit,
  dimRisk,
  onSelectNode,
  onSelectCircuit,
  onSelectIbt,
  onSelectRisk,
  onBackgroundClick
}) => {
  const dark = theme === 'dark';
  const pal = {
    bg: dark ? '#060c18' : '#ffffff',
    title: dark ? '#e2e8f0' : '#0f274a',
    tierLine: dark ? '#1e4a6b' : '#b9c6d8',
    tierBadgeFill: dark ? '#0f274a' : '#eef2f7',
    tierBadgeStroke: dark ? '#2a5a7f' : '#c9d4e2',
    tierBadgeText: dark ? '#7dd3fc' : '#5a6b80',
    halo: dark ? '#060c18' : '#ffffff',
    label: dark ? '#e2e8f0' : '#0f274a',
    labelStroke: dark ? '#060c18' : '#ffffff',
    bayLabel: dark ? '#cbd5e1' : '#334155',
    subText: dark ? '#94a3b8' : '#64748b',
    bebanBoxFill: dark ? '#0f172a' : '#ffffff',
    bebanBoxStroke: dark ? '#475569' : '#94a3b8'
  };
  const wrapRef = useRef<HTMLDivElement>(null);
  const [vb, setVb] = useState({ x: 0, y: 0, w: 1200, h: 800 });
  const [layers, setLayers] = useState({ tier: true, risk: true, labels: true });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const moved = useRef(false);
  // hovered element key (node code, or `bay:<id>`) → label enlarges in place
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const hoverIn = (key: string) => () => {
    if (!drag.current) setHoverKey(key);
  };
  const hoverOut = () => setHoverKey(null);

  const nodeGeoms = useMemo(() => engNodeGeoms(graph), [graph]);
  const circuitGeoms = useMemo(() => engCircuitGeoms(graph), [graph]);
  const ibtGeoms = useMemo(() => engIbtGeoms(graph), [graph]);
  const bayGeoms = useMemo(() => engBayGeoms(graph), [graph]);
  const pinGeoms = useMemo(
    () => engPinGeoms(graph, nodeGeoms, circuitGeoms, ibtGeoms, bayGeoms),
    [graph, nodeGeoms, circuitGeoms, ibtGeoms, bayGeoms]
  );
  const tiers = useMemo(() => engTierGuides(graph), [graph]);
  const bounds = useMemo(() => engGraphBounds(graph), [graph]);

  const fit = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const { width, height } = bounds;
    const aspect = el.clientWidth / Math.max(el.clientHeight, 1);
    let w = width;
    let h = width / aspect;
    if (h < height) {
      h = height;
      w = height * aspect;
    }
    setVb({ x: (width - w) / 2, y: (height - h) / 2, w, h });
  }, [bounds]);

  useEffect(() => {
    fit();
  }, [fit, graph.id]);

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const px = cx ?? el.clientWidth / 2;
    const py = cy ?? el.clientHeight / 2;
    setVb((prev) => {
      const sx = prev.x + (px / el.clientWidth) * prev.w;
      const sy = prev.y + (py / el.clientHeight) * prev.h;
      const w = prev.w * factor;
      const h = prev.h * factor;
      return { x: sx - (px / el.clientWidth) * w, y: sy - (py / el.clientHeight) * h, w, h };
    });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      setVb((prev) => {
        const sx = prev.x + (px / el.clientWidth) * prev.w;
        const sy = prev.y + (py / el.clientHeight) * prev.h;
        const w = prev.w * factor;
        const h = prev.h * factor;
        return { x: sx - (px / el.clientWidth) * w, y: sy - (py / el.clientHeight) * h, w, h };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onDown = (e: React.MouseEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y };
    moved.current = false;
    setHoverKey(null);
  };
  const onMove = (e: React.MouseEvent) => {
    const d = drag.current;
    const el = wrapRef.current;
    if (!d || !el) return;
    const k = vb.w / el.clientWidth;
    const dx = (e.clientX - d.x) * k;
    const dy = (e.clientY - d.y) * k;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
    setVb((prev) => ({ ...prev, x: d.vx - dx, y: d.vy - dy }));
  };
  const onUp = () => {
    drag.current = null;
  };

  const isSelNode = (code: string) => selection?.kind === 'node' && selection.code === code;
  const isSelCircuit = (id: string) => selection?.kind === 'circuit' && selection.id === id;
  const isSelIbt = (id: string) => selection?.kind === 'ibt' && selection.id === id;
  const isSelBay = (id: string) => selection?.kind === 'bay' && selection.id === id;
  const isSelRisk = (seq: number) => selection?.kind === 'risk' && selection.seq === seq;

  const clickWrap = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!moved.current) fn();
  };

  // Solid backdrop behind a label so no wire can ever show through the text.
  // Width is estimated from the string (Arial bold ≈ 0.62em per char).
  const labelBox = (x: number, y: number, text: string, fontSize: number, anchor: 'start' | 'middle') => {
    const w = text.length * fontSize * 0.62 + 14;
    const bx = anchor === 'middle' ? x - w / 2 : x - 7;
    return <rect x={bx} y={y - fontSize * 0.95} width={w} height={fontSize * 1.3} fill={pal.halo} rx={3} />;
  };

  const zoomPct = wrapRef.current ? Math.round((wrapRef.current.clientWidth / vb.w) * 100) : 100;

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor: 'grab', background: pal.bg }}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={() => {
        onUp();
        setHoverKey(null);
      }}
    >
      <style>{`@keyframes sld-ping { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(1.8); opacity: 0; } } .sld-ping { animation: sld-ping 1.2s ease-out infinite; transform-box: fill-box; transform-origin: center; } .sld-hit { cursor: pointer; }`}</style>
      <svg
        className="w-full h-full block"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        fontFamily="Arial, Helvetica, sans-serif"
        onClick={() => {
          if (!moved.current) onBackgroundClick();
        }}
      >
        <text x={vb.x + 18} y={26} fontSize={14} fontWeight={700} fill={pal.title}>
          {graph.title} — {graph.viewName}
        </text>

        {layers.tier && (
          <g id="overlay-tier">
            {tiers.map((g) => {
              // frozen gutter: badge always at the visible left corner,
              // guide line always spans the viewport
              const badgeX = vb.x + 10;
              return (
                <g key={g.tier}>
                  <line x1={vb.x - 100} y1={g.y} x2={vb.x + vb.w + 100} y2={g.y} stroke={pal.tierLine} strokeWidth={1.2} strokeDasharray="6 5" />
                  <rect x={badgeX} y={g.y - 9} width={54} height={17} rx={3} fill={pal.tierBadgeFill} stroke={pal.tierBadgeStroke} strokeWidth={0.8} />
                  <text x={badgeX + 27} y={g.y + 3} fontSize={10.5} fill={pal.tierBadgeText} fontWeight={700} textAnchor="middle">
                    {g.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        <g id="circuits">
          {circuitGeoms.map((c) => (
            <g
              key={c.circuit.id}
              className="sld-hit"
              opacity={dimCircuit?.(c.circuit.id) ? 0.2 : 1}
              onClick={clickWrap(() => onSelectCircuit(c.circuit.id))}
            >
              {c.wires.map((w, i) => (
                <g key={i}>
                  <path d={w.d} fill="none" stroke="transparent" strokeWidth={16} strokeLinejoin="round" />
                  <path d={w.d} fill="none" stroke={pal.halo} strokeWidth={7} strokeLinejoin="round" />
                  {isSelCircuit(c.circuit.id) && (
                    <path d={w.d} fill="none" stroke="#0046ad" strokeOpacity={0.35} strokeWidth={10} strokeLinejoin="round" />
                  )}
                  <path d={w.d} fill="none" stroke={c.color} strokeWidth={ENG_SLD.wireStroke} strokeDasharray={c.dash}>
                    <title>
                      {c.circuit.name} - {c.circuit.type}, {c.circuit.status}
                    </title>
                  </path>
                  {w.pmts.map((p, j) => (
                    <rect key={j} x={p.x} y={p.y} width={ENG_SLD.pmt} height={ENG_SLD.pmt} fill={c.color} />
                  ))}
                </g>
              ))}
            </g>
          ))}
        </g>

        <g id="ibt-links">
          {ibtGeoms.map((g) => (
            <g key={g.ibt.id} className="sld-hit" onClick={clickWrap(() => onSelectIbt(g.ibt.id))}>
              {isSelIbt(g.ibt.id) && (
                <rect x={g.ibt.x - 18} y={g.y1 + 6} width={36} height={g.y2 - g.y1 - 12} rx={4} fill="#0046ad" fillOpacity={0.08} stroke="#0046ad" strokeWidth={1.5} strokeDasharray="4 3" />
              )}
              <rect x={g.ibt.x - 14} y={g.y1 + 4} width={28} height={g.y2 - g.y1 - 8} fill="transparent" />
              <path d={`M${g.ibt.x},${g.y1} V${g.y2}`} fill="none" stroke="#8a6a3a" strokeWidth={1.6}>
                <title>
                  {g.ibt.name} - {g.ibt.status}
                </title>
              </path>
              <rect x={g.ibt.x - 5} y={g.y1 + 7} width={10} height={10} fill="#0047AB" />
              <g fill="#ffffff" strokeWidth={1.7}>
                <circle cx={g.ibt.x} cy={g.y1 + (g.y2 - g.y1) * 0.47} r={7.5} stroke="#0047AB" />
                <circle cx={g.ibt.x - 4.5} cy={g.y1 + (g.y2 - g.y1) * 0.47 + 8} r={7.5} stroke="#C00000" />
                <circle cx={g.ibt.x + 4.5} cy={g.y1 + (g.y2 - g.y1) * 0.47 + 8} r={7.5} stroke="#E0A400" />
              </g>
              <rect x={g.ibt.x - 5} y={g.y2 - 17} width={10} height={10} fill="#C00000" />
              <text x={g.ibt.x} y={g.y1 + (g.y2 - g.y1) * 0.47 + 24} fontSize={8.5} fill="#8a6a3a" fontWeight={700} textAnchor="middle">
                {g.ibt.name.split(' ').slice(0, 2).join(' ')}
              </text>
            </g>
          ))}
        </g>

        <g id="busbars">
          {nodeGeoms.map((g) => (
            <g
              key={g.node.code}
              className="sld-hit"
              opacity={dimNode?.(g.node.code) ? 0.2 : 1}
              onClick={clickWrap(() => onSelectNode(g.node.code))}
              onMouseEnter={hoverIn(g.node.code)}
              onMouseLeave={hoverOut}
            >
              {g.node.type === 'GENERATING_UNIT' ? (
                g.node.stackedAbove ? (
                  <g>
                    <title>{g.node.name}</title>
                    <line x1={g.node.x} y1={g.y - 20} x2={g.node.x} y2={g.y} stroke="#16a34a" strokeWidth={2} />
                    <circle cx={g.node.x} cy={g.y - 37} r={7.5} fill="#ffffff" stroke="#16a34a" strokeWidth={1.7} />
                    <circle cx={g.node.x - 4.5} cy={g.y - 29} r={7.5} fill="#ffffff" stroke="#C00000" strokeWidth={1.7} />
                    <circle cx={g.node.x + 4.5} cy={g.y - 29} r={7.5} fill="#ffffff" stroke="#E0A400" strokeWidth={1.7} />
                    <circle cx={g.node.x} cy={g.y - 54} r={9} fill="#ffffff" stroke="#16a34a" strokeWidth={1.7} />
                    <text x={g.node.x} y={g.y - 50.5} fontSize={10} fontWeight={700} textAnchor="middle" fill="#16a34a">
                      ~
                    </text>
                    <rect x={g.node.x - 5} y={g.y - 71} width={10} height={10} fill="#C00000" />
                  </g>
                ) : (
                <g>
                  <line x1={g.node.x} y1={g.y} x2={g.node.x} y2={g.y + 8} stroke="#16a34a" strokeWidth={2} />
                  <circle cx={g.node.x} cy={g.y + 17} r={9} fill="#ffffff" stroke="#16a34a" strokeWidth={1.7} />
                  <text x={g.node.x} y={g.y + 20.5} fontSize={10} fontWeight={700} textAnchor="middle" fill="#16a34a">
                    ~
                  </text>
                  <circle cx={g.node.x} cy={g.y + 33} r={7.5} fill="#ffffff" stroke="#16a34a" strokeWidth={1.7} />
                  <circle cx={g.node.x - 4.5} cy={g.y + 41} r={7.5} fill="#ffffff" stroke="#C00000" strokeWidth={1.7} />
                  <circle cx={g.node.x + 4.5} cy={g.y + 41} r={7.5} fill="#ffffff" stroke="#E0A400" strokeWidth={1.7} />
                  <rect x={g.node.x - 5} y={g.y + 50} width={10} height={10} fill="#C00000" />
                  {layers.labels && g.node.label && (
                    <>
                      {labelBox(g.node.x, g.y - 12, g.node.label, hoverKey === g.node.code ? 26 : 12.5, 'middle')}
                      <text x={g.node.x} y={g.y - 12} fontSize={hoverKey === g.node.code ? 26 : 12.5} fontWeight={700} textAnchor="middle" fill={pal.label} paintOrder="stroke" stroke={pal.labelStroke} strokeWidth={hoverKey === g.node.code ? 6 : 3} strokeLinejoin="round">
                        {g.node.label}
                      </text>
                    </>
                  )}
                </g>
                )
              ) : g.node.type === 'BEBAN' ? (
                <g>
                  <circle cx={g.node.x} cy={g.y + 19} r={9} fill="#ffffff" stroke={g.color} strokeWidth={1.7} />
                  <circle cx={g.node.x} cy={g.y + 27} r={9} fill="#ffffff" stroke="#E67300" strokeWidth={1.7} />
                  {layers.labels && (
                    <g>
                      <rect
                        x={g.node.x - (hoverKey === g.node.code ? 95 : 52)}
                        y={g.y + 38}
                        width={hoverKey === g.node.code ? 190 : 104}
                        height={26}
                        fill={pal.bebanBoxFill}
                        stroke={pal.bebanBoxStroke}
                        strokeWidth={1}
                        strokeDasharray="4 3"
                        rx={2}
                      />
                      <text x={g.node.x} y={g.y + 50} fontSize={hoverKey === g.node.code ? 19 : 9.5} fontWeight={700} textAnchor="middle" fill={pal.label}>
                        {g.node.label}
                      </text>
                      <text x={g.node.x} y={g.y + 60} fontSize={hoverKey === g.node.code ? 11 : 8} textAnchor="middle" fill={pal.subText}>
                        {g.node.voltageKv} kV
                      </text>
                    </g>
                  )}
                </g>
              ) : (
                <g>
                  {isSelNode(g.node.code) && (
                    <rect x={g.x1 - 8} y={g.y - 14} width={g.x2 - g.x1 + 16} height={28} rx={5} fill="#0046ad" fillOpacity={0.07} stroke="#0046ad" strokeWidth={1.5} strokeDasharray="4 3" />
                  )}
                  <rect x={g.x1 - 6} y={g.y - 12} width={g.x2 - g.x1 + 12} height={24} fill="transparent" />
                  {layers.labels && (
                    <>
                      {labelBox(g.labelX, g.labelY, g.node.label, hoverKey === g.node.code ? 26 : 12.5, g.labelAnchor)}
                      <text x={g.labelX} y={g.labelY} fontSize={hoverKey === g.node.code ? 26 : 12.5} fontWeight={700} paintOrder="stroke" stroke={pal.labelStroke} strokeWidth={hoverKey === g.node.code ? 6 : 3} strokeLinejoin="round" textAnchor={g.labelAnchor} fill={pal.label}>
                        {g.node.label}
                      </text>
                    </>
                  )}
                  <line x1={g.x1} x2={g.x2} y1={g.y} y2={g.y} stroke={g.node.status === 'ENERGIZED' ? g.color : '#9AA0A6'} strokeWidth={ENG_SLD.busStroke} />
                  {g.node.role === 'BOUNDARY' && (
                    <text x={g.x1} y={g.y + 15} fontSize={7.5} fill="#b06a00" fontWeight={700}>
                      BOUNDARY
                    </text>
                  )}
                </g>
              )}
            </g>
          ))}
        </g>

        <g id="bays">
          {bayGeoms.map((b) => (
            <g key={b.bay.id} className="sld-hit" onClick={clickWrap(() => onSelectNode(b.bay.busCode))} onMouseEnter={hoverIn(`bay:${b.bay.id}`)} onMouseLeave={hoverOut}>
              {isSelBay(b.bay.id) && (
                <rect x={b.bay.x - 20} y={b.y + 4} width={40} height={ENG_SLD.bayLen + 20} rx={4} fill="#0046ad" fillOpacity={0.08} stroke="#0046ad" strokeWidth={1.5} strokeDasharray="4 3" />
              )}
              <rect x={b.bay.x - 16} y={b.y + 3} width={32} height={ENG_SLD.bayLen + 18} fill="transparent" />
              {b.xs.map((x) => (
                <g key={x}>
                  <path d={`M${x},${b.y} V${b.y + ENG_SLD.bayLen}`} fill="none" stroke={b.color} strokeWidth={2.1} strokeDasharray={b.bay.status === 'PLANNED' ? '2 4' : undefined} />
                  <rect x={x - 5} y={b.y + 7} width={10} height={10} fill={b.color} />
                  <circle cx={x} cy={b.y + ENG_SLD.bayLen} r={3} fill={b.color} />
                </g>
              ))}
              {layers.labels && (
                <>
                  {labelBox(b.bay.x, b.y + ENG_SLD.bayLen + 15, b.bay.code, hoverKey === `bay:${b.bay.id}` ? 20 : 10, 'middle')}
                  <text x={b.bay.x} y={b.y + ENG_SLD.bayLen + 15} fontSize={hoverKey === `bay:${b.bay.id}` ? 20 : 10} fontWeight={700} paintOrder="stroke" stroke={pal.labelStroke} strokeWidth={3} textAnchor="middle" fill={pal.bayLabel}>
                    {b.bay.code}
                  </text>
                </>
              )}
            </g>
          ))}
        </g>

        {layers.risk && (
          <g id="overlay-risk">
            {pinGeoms.map((p) => (
              <g
                key={p.pin.seq}
                className="sld-hit"
                opacity={dimRisk?.(p.pin.seq) ? 0.2 : 1}
                onClick={clickWrap(() => onSelectRisk(p.pin.seq))}
              >
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" />
                {isSelRisk(p.pin.seq) && <circle cx={p.x} cy={p.y} r={15} fill="#F6C000" fillOpacity={0.25} className="sld-ping" />}
                <circle cx={p.x} cy={p.y} r={9} fill="#F6C000" stroke={isSelRisk(p.pin.seq) ? '#7c2d12' : '#B8860B'} strokeWidth={isSelRisk(p.pin.seq) ? 2.5 : 1.5} />
                <text x={p.x} y={p.y + 3} fontSize={9} fontWeight={700} textAnchor="middle" fill="#5a4500">
                  {p.pin.seq}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>

      <div className="absolute flex items-center gap-1" style={{ right: 12, bottom: 12 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomAt(1.25);
          }}
          className={`w-7 h-7 rounded-md border font-bold shadow-sm ${
            dark ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title="Perkecil"
        >
          −
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fit();
          }}
          className={`h-7 px-2 rounded-md border font-bold text-[11px] shadow-sm ${
            dark ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title="Pas ke layar"
        >
          FIT
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomAt(1 / 1.25);
          }}
          className={`w-7 h-7 rounded-md border font-bold shadow-sm ${
            dark ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title="Perbesar"
        >
          +
        </button>
      </div>
      <div
        className={`absolute font-mono font-bold text-[11px] px-2 py-0.5 rounded-md border ${
          dark ? 'border-slate-700 bg-slate-900 text-slate-400' : 'border-slate-300 bg-white text-slate-600'
        }`}
        style={{ left: 12, bottom: 12 }}
      >
        {zoomPct}%
      </div>
      <div className="absolute flex items-center gap-1" style={{ left: 12, top: 12 }}>
        {(
          [
            ['tier', 'TIER'],
            ['risk', 'RISIKO'],
            ['labels', 'LABEL']
          ] as const
        ).map(([key, text]) => (
          <button
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
            }}
            className={`h-6 px-2 rounded-md border font-bold text-[10px] shadow-sm ${
              layers[key]
                ? 'border-[#0046ad] bg-[#0046ad] text-white'
                : dark
                  ? 'border-slate-700 bg-slate-900 text-slate-400'
                  : 'border-slate-300 bg-white text-slate-500'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};
