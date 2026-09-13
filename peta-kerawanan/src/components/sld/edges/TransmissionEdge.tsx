import React, { useState } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge
} from '@xyflow/react';
import { SLDEdgeData } from '../../../types/graph';

export const TransmissionEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected
}) => {
  const edgeData = data as unknown as SLDEdgeData | undefined;
  const [isHovered, setIsHovered] = useState(false);

  // Safety guard against undefined or NaN coordinates
  if (typeof sourceX !== 'number' || typeof sourceY !== 'number' || typeof targetX !== 'number' || typeof targetY !== 'number') {
    return null;
  }

  // Check for 2-line (double circuit) or offset multi-circuit lines
  const isVertical = Math.abs(targetY - sourceY) >= Math.abs(targetX - sourceX);
  const isDoubleCircuit =
    Boolean(edgeData?.circuitCount === 2 || (edgeData as any)?.isDoubleLine) &&
    !id.includes('_1') &&
    !id.includes('_2');

  const circuitNum =
    (edgeData as any)?.circuitNumber ??
    (id.endsWith('_1') || id.includes('_c1') ? 1 : id.endsWith('_2') || id.includes('_c2') ? 2 : undefined);

  const lineOffset =
    typeof (edgeData as any)?.offset === 'number'
      ? (edgeData as any).offset
      : circuitNum === 1
      ? -14
      : circuitNum === 2
      ? 14
      : 0;

  const effSourceX = isVertical ? sourceX + lineOffset : sourceX;
  const effSourceY = isVertical ? sourceY : sourceY + lineOffset;
  const effTargetX = isVertical ? targetX + lineOffset : targetX;
  const effTargetY = isVertical ? targetY : targetY + lineOffset;

  // Smooth step orthogonal routing for single line diagrams
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: effSourceX,
    sourceY: effSourceY,
    sourcePosition,
    targetX: effTargetX,
    targetY: effTargetY,
    targetPosition,
    borderRadius: 8
  });

  // Parallel paths for 2-line representation
  const [path1] = getSmoothStepPath({
    sourceX: isVertical ? sourceX - 12 : sourceX,
    sourceY: isVertical ? sourceY : sourceY - 12,
    sourcePosition,
    targetX: isVertical ? targetX - 12 : targetX,
    targetY: isVertical ? targetY : targetY - 12,
    targetPosition,
    borderRadius: 8
  });

  const [path2] = getSmoothStepPath({
    sourceX: isVertical ? sourceX + 12 : sourceX,
    sourceY: isVertical ? sourceY : sourceY + 12,
    sourcePosition,
    targetX: isVertical ? targetX + 12 : targetX,
    targetY: isVertical ? targetY : targetY + 12,
    targetPosition,
    borderRadius: 8
  });

  const rLevel = String(edgeData?.riskLevel || '');
  const isCritical = edgeData?.status === 'critical' || rLevel === 'Sangat Rawan' || rLevel === 'N-2' || rLevel === 'N-1-2';
  const isWarning = edgeData?.status === 'warning' || rLevel === 'Rawan' || rLevel === 'Sedang' || rLevel === 'N-1';
  const isPlanned = edgeData?.status === 'planned';
  const isHighlighted = edgeData?.highlighted || selected;
  const isDimmed = edgeData?.dimmed;
  const hasRisk = typeof edgeData?.riskId === 'number' || isCritical || isWarning;
  const riskBadgeText = edgeData?.riskId !== undefined ? String(edgeData.riskId) : (rLevel || '!');

  // Base line color
  let strokeColor = '#00d2d3'; // PLN Cyan
  if (isCritical) strokeColor = '#ff4757'; // Critical red
  else if (isWarning) {
    strokeColor = edgeData?.riskLevel === 'Sedang' ? '#f1c40f' : '#ffa502'; // Yellow/Orange
  } else if (isPlanned) {
    strokeColor = '#64748b'; // Slate dashed
  }

  const strokeWidth = isHighlighted || isHovered ? 4.5 : isPlanned ? 2 : 2.5;

  const isTransformerLink =
    edgeData?.type === 'transformer_link' ||
    (String(edgeData?.name || '').toLowerCase().includes('bay ibt') && !id.includes('EDGE_IBT'));

  const edgeIbtNum =
    String(edgeData?.name || '').match(/ibt\s*([0-9&]+)/i)?.[1] ||
    id.match(/ibt\s*([0-9&]+)/i)?.[1] ||
    '1';

  return (
    <>
      {/* Invisible wider path for easy hover & click detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={28}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Actual electrical transmission line(s) */}
      {isDoubleCircuit ? (
        /* 2-LINE (Double Circuit: 2 Jalur Paralel dengan 4 CB PMT) */
        <g className="transition-all duration-200">
          {/* Jalur Sirkit 1 */}
          <path
            d={path1}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isPlanned ? '6 4' : undefined}
            style={{
              opacity: isDimmed ? 0.2 : 1,
              filter: isHighlighted ? `drop-shadow(0 0 8px ${strokeColor})` : undefined
            }}
          />
          {/* Jalur Sirkit 2 */}
          <path
            d={path2}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isPlanned ? '6 4' : undefined}
            style={{
              opacity: isDimmed ? 0.2 : 1,
              filter: isHighlighted ? `drop-shadow(0 0 8px ${strokeColor})` : undefined
            }}
          />

          {/* PMT CB Breakers Sirkit 1 (Atas & Bawah) */}
          <rect
            x={(isVertical ? sourceX - 12 : sourceX) - 4}
            y={sourceY + (targetY > sourceY ? 6 : -18)}
            width={8}
            height={12}
            rx={1}
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth={0.8}
          >
            <title>PMT Sirkit 1 Sisi Pengirim</title>
          </rect>
          <rect
            x={(isVertical ? targetX - 12 : targetX) - 4}
            y={targetY + (targetY > sourceY ? -18 : 6)}
            width={8}
            height={12}
            rx={1}
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth={0.8}
          >
            <title>PMT Sirkit 1 Sisi Penerima</title>
          </rect>

          {/* PMT CB Breakers Sirkit 2 (Atas & Bawah) */}
          <rect
            x={(isVertical ? sourceX + 12 : sourceX) - 4}
            y={sourceY + (targetY > sourceY ? 6 : -18)}
            width={8}
            height={12}
            rx={1}
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth={0.8}
          >
            <title>PMT Sirkit 2 Sisi Pengirim</title>
          </rect>
          <rect
            x={(isVertical ? targetX + 12 : targetX) - 4}
            y={targetY + (targetY > sourceY ? -18 : 6)}
            width={8}
            height={12}
            rx={1}
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth={0.8}
          >
            <title>PMT Sirkit 2 Sisi Penerima</title>
          </rect>
        </g>
      ) : (
        /* SINGLE LINE ATAU OFFSET SIRKIT DENGAN PMT CB */
        <g className="transition-all duration-200">
          <BaseEdge
            id={id}
            path={edgePath}
            markerEnd={markerEnd}
            style={{
              ...style,
              stroke: strokeColor,
              strokeWidth,
              strokeDasharray: isPlanned ? '6 4' : undefined,
              opacity: isDimmed ? 0.2 : 1,
              filter: isHighlighted
                ? `drop-shadow(0 0 8px ${strokeColor})`
                : isHovered
                ? `drop-shadow(0 0 6px ${strokeColor})`
                : undefined,
              transition: 'stroke-width 0.2s, stroke 0.2s, opacity 0.2s'
            }}
          />

          {/* PMT CB Breakers pada Saluran Transmisi (jika bukan link internal IBT) */}
          {!isTransformerLink && (
            <>
              <rect
                x={effSourceX - 4}
                y={sourceY + (targetY > sourceY ? 6 : -18)}
                width={8}
                height={12}
                rx={1}
                fill="#ef4444"
                stroke="#b91c1c"
                strokeWidth={0.8}
              >
                <title>PMT Bay Penghantar Sisi Sumber</title>
              </rect>
              <rect
                x={effTargetX - 4}
                y={targetY + (targetY > sourceY ? -18 : 6)}
                width={8}
                height={12}
                rx={1}
                fill="#ef4444"
                stroke="#b91c1c"
                strokeWidth={0.8}
              >
                <title>PMT Bay Penghantar Sisi Tujuan</title>
              </rect>
            </>
          )}
        </g>
      )}

      {/* Simbol IBT 3 Lingkaran (Persis Gambar Pengguna) di Tengah Garis jika Jalur IBT */}
      {isTransformerLink && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all'
            }}
            className="z-20 cursor-pointer group"
            title={`Simbol IBT ${edgeIbtNum} (500/150 kV)`}
          >
            <svg
              viewBox="0 0 74 66"
              className="w-13 h-11 filter drop-shadow-md transition-transform group-hover:scale-115"
            >
              <circle cx="37" cy="23" r="16.5" fill="none" stroke="#2563eb" strokeWidth="3.6" />
              <circle cx="26" cy="42" r="16.5" fill="none" stroke="#ef4444" strokeWidth="3.6" />
              <circle cx="48" cy="42" r="16.5" fill="none" stroke="#f59e0b" strokeWidth="3.6" />
              <rect x="47" y="14" width="22" height="22" rx="6" fill="rgba(226, 232, 240, 0.92)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.8" />
              <text x="58" y="26" textAnchor="middle" dominantBaseline="central" fill="#0f172a" fontWeight="900" fontSize="13" fontFamily="system-ui, -apple-system, sans-serif">
                {edgeIbtNum}
              </text>
            </svg>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Starburst Risk Badge & Tooltip Overlay */}
      <EdgeLabelRenderer>
        {hasRisk && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX + (isTransformerLink ? 26 : 0)}px,${labelY + (isTransformerLink ? -18 : 0)}px)`,
              pointerEvents: 'all'
            }}
            className="z-30 group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Starburst Badge (matches Gambar 1 & Gambar 2) */}
            <div
              className={`relative flex items-center justify-center w-8 h-8 transition-transform duration-200 ${
                isCritical ? 'animate-risk-pulse' : 'animate-risk-yellow-pulse'
              } ${isHovered || isHighlighted ? 'scale-125' : 'hover:scale-115'}`}
            >
              {/* Starburst SVG Shape */}
              <svg viewBox="0 0 100 100" className="w-8 h-8 filter drop-shadow-md">
                <polygon
                  points="50,0 63,22 88,12 85,38 100,50 85,62 88,88 63,78 50,100 37,78 12,88 15,62 0,50 15,38 12,12 37,22"
                  fill={isCritical ? '#ff4757' : '#ffa502'}
                  stroke="#ffffff"
                  strokeWidth="4"
                />
              </svg>
              {/* Risk Number / Code inside starburst */}
              <span className="absolute inset-0 flex items-center justify-center text-slate-950 font-black text-[10px]">
                {riskBadgeText}
              </span>
            </div>

            {/* Hover Tooltip Popup (Exact style matching Image 2) */}
            {isHovered && (
              <div className="absolute left-10 top-1/2 -translate-y-1/2 w-64 bg-slate-950/95 border border-slate-700 rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left z-50 pointer-events-none">
                <div className="flex items-center gap-1.5 mb-1 text-amber-400 font-bold text-xs">
                  <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                    No. {edgeData?.riskId}
                  </span>
                  <span className="truncate">{edgeData?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300 border-t border-slate-800 pt-1.5">
                  <div>
                    <span className="text-slate-400">Tegangan:</span> {edgeData?.voltage}
                  </div>
                  <div>
                    <span className="text-slate-400">Sirkit:</span> {edgeData?.circuitCount}
                  </div>
                  {edgeData?.loading && (
                    <>
                      <div>
                        <span className="text-slate-400">Sirkit 1:</span>{' '}
                        <span className="font-semibold text-cyan-300">
                          {edgeData.loading.circuit1}%
                        </span>
                      </div>
                      {typeof edgeData.loading.circuit2 === 'number' && (
                        <div>
                          <span className="text-slate-400">Sirkit 2:</span>{' '}
                          <span className="font-semibold text-cyan-300">
                            {edgeData.loading.circuit2}%
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-1.5 text-[10px] flex items-center justify-between border-t border-slate-800/80 pt-1">
                  <span className="text-slate-400">Status Kerawanan:</span>
                  <span
                    className={`font-semibold ${
                      isCritical
                        ? 'text-red-400'
                        : edgeData?.riskLevel === 'Sedang'
                        ? 'text-amber-300'
                        : 'text-orange-400'
                    }`}
                  >
                    ● {edgeData?.riskLevel || 'Rawan'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regular line hover tooltip if no riskId */}
        {!hasRisk && isHovered && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none'
            }}
            className="z-40 bg-slate-950/90 border border-slate-700 rounded-md px-2.5 py-1.5 shadow-xl backdrop-blur-sm text-left text-xs whitespace-nowrap"
          >
            <div className="font-bold text-cyan-300">{edgeData?.name || id}</div>
            <div className="text-[10px] text-slate-300 mt-0.5 flex gap-2">
              <span>{edgeData?.voltage}</span>
              <span>•</span>
              <span>{edgeData?.circuitCount || 2} Sirkit</span>
              {edgeData?.loading && (
                <>
                  <span>•</span>
                  <span>L1: {edgeData.loading.circuit1}%</span>
                  {edgeData.loading.circuit2 !== undefined && (
                    <span>L2: {edgeData.loading.circuit2}%</span>
                  )}
                </>
              )}
            </div>
            <div className="text-[9px] text-emerald-400 mt-0.5">
              ✓ Operasi Normal
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};
