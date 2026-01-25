import { useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import type { LineDto, StationDto } from '../api/api';

export type CanvasConnection = {
    id: number;
    fromStationId: number;
    toStationId: number;
    lineId: number;
};

type Mode = 'move' | 'connect';

type Props = {
    stations: StationDto[];
    lines?: LineDto[];
    connections?: CanvasConnection[];
    mode?: Mode;
    connectFromStationId?: number | null;
    width?: number;
    height?: number;
    selectedStationId?: number | null;
    onSelectStation?: (id: number) => void;
    onMoveStation?: (id: number, x: number, y: number) => void;
    onRequestCreateStation?: (x: number, y: number) => void;
    onStationClickInConnectMode?: (id: number) => void;
    onBackgroundClick?: () => void;
    onRemoveConnection?: (connectionId: number) => void;
};

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

export default function SchemaCanvas({
    stations,
    lines = [],
    connections = [],
    mode = 'move',
    connectFromStationId,
    width = 980,
    height = 560,
    selectedStationId,
    onSelectStation,
    onMoveStation,
    onRequestCreateStation,
    onStationClickInConnectMode,
    onBackgroundClick,
    onRemoveConnection,
}: Props) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [dragId, setDragId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);

    const stationById = useMemo(() => {
        const map = new Map<number, StationDto>();
        for (const s of stations) map.set(s.id, s);
        return map;
    }, [stations]);

    const lineById = useMemo(() => {
        const map = new Map<number, LineDto>();
        for (const l of lines) map.set(l.id, l);
        return map;
    }, [lines]);

    const toLocal = (e: PointerEvent) => {
        const svg = svgRef.current;
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (width / rect.width);
        const y = (e.clientY - rect.top) * (height / rect.height);
        return { x, y };
    };

    const onPointerDownStation = (e: PointerEvent, stationId: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (mode === 'connect') {
            onStationClickInConnectMode?.(stationId);
            onSelectStation?.(stationId);
            return;
        }

        const local = toLocal(e);
        const st = stationById.get(stationId);
        if (!local || !st) return;
        setDragId(stationId);
        setDragOffset({ dx: local.x - st.positionX, dy: local.y - st.positionY });
        onSelectStation?.(stationId);
        (e.target as Element).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
        if (mode !== 'move') return;
        if (!dragId || !dragOffset) return;
        const local = toLocal(e);
        if (!local) return;
        const x = clamp(local.x - dragOffset.dx, 18, width - 18);
        const y = clamp(local.y - dragOffset.dy, 18, height - 18);
        onMoveStation?.(dragId, x, y);
    };

    const onPointerUp = (e: PointerEvent) => {
        if (dragId) {
            e.preventDefault();
        }
        setDragId(null);
        setDragOffset(null);
    };

    const onCanvasClick = (e: MouseEvent) => {
        // background click
        onBackgroundClick?.();

        if (!onRequestCreateStation) return;
        if (mode === 'connect') return; // connect mode = no add-by-click (less accidental)
        const local = toLocal(e as unknown as PointerEvent);
        if (!local) return;
        onRequestCreateStation(clamp(local.x, 18, width - 18), clamp(local.y, 18, height - 18));
    };

    return (
        <div className="canvas-wrap">
            <svg
                ref={svgRef}
                width="100%"
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClick={onCanvasClick}
                style={{ display: 'block', touchAction: 'none' }}
            >
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--grid-stroke)" strokeWidth="1" />
                    </pattern>
                </defs>

                <rect x="0" y="0" width={width} height={height} fill="url(#grid)" />

                {/* Connections (simple lines) */}
                {connections.map(c => {
                    const a = stationById.get(c.fromStationId);
                    const b = stationById.get(c.toStationId);
                    if (!a || !b) return null;
                    const lineColor = (c.lineId ? lineById.get(c.lineId)?.color : null) ?? 'var(--accent)';
                    const key = c.id;
                    return (
                        <g key={key}>
                            {/* hit area */}
                            <line
                                x1={a.positionX}
                                y1={a.positionY}
                                x2={b.positionX}
                                y2={b.positionY}
                                stroke="transparent"
                                strokeWidth={14}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveConnection?.(c.id);
                                }}
                                style={{ cursor: onRemoveConnection ? 'pointer' : 'default' }}
                            />
                            <line
                                x1={a.positionX}
                                y1={a.positionY}
                                x2={b.positionX}
                                y2={b.positionY}
                                stroke={lineColor}
                                strokeOpacity={0.75}
                                strokeWidth={6}
                                strokeLinecap="round"
                            />
                        </g>
                    );
                })}

                {/* Stations */}
                {stations.map(s => {
                    const isSelected = s.id === selectedStationId;
                    const isConnectFrom = mode === 'connect' && s.id === connectFromStationId;

                    return (
                        <g key={s.id} transform={`translate(${s.positionX}, ${s.positionY})`}>
                            <circle
                                r={12}
                                fill={isSelected ? 'rgba(110,168,254,0.85)' : 'rgba(255,255,255,0.75)'}
                                stroke={isConnectFrom ? 'rgba(45,212,191,0.90)' : (isSelected ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.35)')}
                                strokeWidth={isConnectFrom ? 3 : (isSelected ? 2 : 1)}
                                onPointerDown={(e) => onPointerDownStation(e, s.id)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectStation?.(s.id);
                                }}
                                style={{ cursor: mode === 'connect' ? 'crosshair' : 'grab' }}
                            />
                            <text x={16} y={4} fontSize={13} fill="rgba(233,238,252,0.92)">{s.name}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
