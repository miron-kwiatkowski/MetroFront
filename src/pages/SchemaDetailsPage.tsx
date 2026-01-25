import { useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    addLine,
    addStation,
    deleteStation,
    getLinesBySchemaId,
    getSchemas,
    getSharedByMe,
    getStationsBySchemaId,
    getStatisticsBySchemaId,
    getLineCategories,
    recalculateStatistics,
    removeShare,
    shareSchema,
    updateStation,

    // NEW: connections + station-lines
    getStationConnectionsBySchemaId,
    addStationConnection,
    deleteStationConnection,
    getStationLinesByStationId,
    addStationLine,
    deleteStationLine,
} from '../api/api';

import type {
    LineDto,
    LineCategoryDto,
    SchemaDto,
    SchemaStatisticsDto,
    SharedSchemaDto,
    StationDto,
} from '../api/api';

import Modal from '../components/Modal';
import SchemaCanvas, { type CanvasConnection } from '../components/SchemaCanvas';
import AddLineForm from '../components/forms/AddLineForm';
import AddStationForm from '../components/forms/AddStationForm';
import EditStationForm from '../components/forms/EditStationForm';

type Tab = 'editor' | 'lines' | 'stations' | 'share' | 'stats';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button className={`tab ${active ? 'tab-active' : ''}`} onClick={onClick} type="button">
            {children}
        </button>
    );
}

type CatType = 'metro' | 'tram' | 'bus' | 'other';
const TYPE_STORAGE_KEY = 'lineCategoryTypeMap';

function loadTypeMap(): Record<number, CatType> {
    try {
        const raw = localStorage.getItem(TYPE_STORAGE_KEY);
        if (!raw) return {};
        const obj = JSON.parse(raw) as Record<string, unknown>;
        const out: Record<number, CatType> = {};
        for (const [k, v] of Object.entries(obj)) {
            const id = Number(k);
            if (!Number.isFinite(id)) continue;
            if (v === 'metro' || v === 'tram' || v === 'bus' || v === 'other') out[id] = v;
        }
        return out;
    } catch {
        return {};
    }
}

function iconFor(t: CatType) {
    switch (t) {
        case 'metro': return 'Ⓜ';
        case 'tram': return '🚋';
        case 'bus': return '🚌';
        default: return '➖';
    }
}

export default function SchemaDetailsPage() {
    const { id } = useParams();
    const schemaId = useMemo(() => Number(id), [id]);
    const { token } = useContext(AuthContext);

    const [schema, setSchema] = useState<SchemaDto | null>(null);
    const [lines, setLines] = useState<LineDto[]>([]);
    const [lineCategories, setLineCategories] = useState<LineCategoryDto[]>([]);
    const [stations, setStations] = useState<StationDto[]>([]);
    const [stats, setStats] = useState<SchemaStatisticsDto | null>(null);
    const [sharedByMe, setSharedByMe] = useState<SharedSchemaDto[]>([]);

    // NOW: connections are from backend
    const [connections, setConnections] = useState<CanvasConnection[]>([]);
    const [editorMode, setEditorMode] = useState<'move' | 'connect'>('move');
    const [connectFromStationId, setConnectFromStationId] = useState<number | null>(null);
    const [connectLineId, setConnectLineId] = useState<number | null>(null);

    const [tab, setTab] = useState<Tab>('editor');
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
    const selectedStation = useMemo(
        () => stations.find(s => s.id === selectedStationId) ?? null,
        [stations, selectedStationId]
    );

    const stationById = useMemo(() => {
        const m = new Map<number, StationDto>();
        for (const s of stations) m.set(s.id, s);
        return m;
    }, [stations]);

    const lineById = useMemo(() => {
        const m = new Map<number, LineDto>();
        for (const l of lines) m.set(l.id, l);
        return m;
    }, [lines]);

    const catTypeMap = useMemo(() => loadTypeMap(), []);

    // station ↔ line memberships
    const [stationLineIds, setStationLineIds] = useState<number[]>([]);
    const [stationLinesLoading, setStationLinesLoading] = useState(false);

    const [isAddLineOpen, setIsAddLineOpen] = useState(false);
    const [addLineError, setAddLineError] = useState('');
    const [isAddingLine, setIsAddingLine] = useState(false);

    const [isAddStationOpen, setIsAddStationOpen] = useState(false);
    const [addStationError, setAddStationError] = useState('');
    const [isAddingStation, setIsAddingStation] = useState(false);
    const [newStationPos, setNewStationPos] = useState<{ x: number; y: number } | null>(null);

    const [editError, setEditError] = useState('');
    const [editOk, setEditOk] = useState('');
    const [isSavingStation, setIsSavingStation] = useState(false);

    const [shareError, setShareError] = useState('');
    const [shareOk, setShareOk] = useState('');
    const [shareUserId, setShareUserId] = useState('');
    const [shareAccess, setShareAccess] = useState<'Read' | 'Write'>('Read');

    // drag -> debounce API updates
    const pendingTimers = useRef<Record<number, number>>({});
    const latestPos = useRef<Record<number, { x: number; y: number }>>({});

    const refreshAll = async () => {
        if (!token) return;
        if (!schemaId || Number.isNaN(schemaId)) {
            setMessage('Nieprawidłowy identyfikator schematu.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        const [
            schemasRes,
            linesRes,
            stationsRes,
            statsRes,
            sharedRes,
            catsRes,
            conRes,
        ] = await Promise.all([
            getSchemas(token),
            getLinesBySchemaId(token, schemaId),
            getStationsBySchemaId(token, schemaId),
            getStatisticsBySchemaId(token, schemaId),
            getSharedByMe(token),
            getLineCategories(token),
            getStationConnectionsBySchemaId(token, schemaId),
        ]);

        setIsLoading(false);

        if (schemasRes.ok) setSchema((schemasRes.data ?? []).find(s => s.id === schemaId) ?? null);
        if (!schemasRes.ok) setMessage(schemasRes.message);

        if (linesRes.ok) setLines(linesRes.data ?? []);
        if (!linesRes.ok) setMessage(prev => prev || linesRes.message);

        if (catsRes.ok) setLineCategories(catsRes.data ?? []);
        if (!catsRes.ok) setMessage(prev => prev || catsRes.message);

        if (stationsRes.ok) setStations(stationsRes.data ?? []);
        if (!stationsRes.ok) setMessage(prev => prev || stationsRes.message);

        if (statsRes.ok) setStats(statsRes.data ?? null);

        if (sharedRes.ok) setSharedByMe((sharedRes.data ?? []).filter(x => x.schemaId === schemaId));

        if (conRes.ok) {
            setConnections((conRes.data ?? []).map(c => ({
                id: c.id,
                fromStationId: c.fromStationId,
                toStationId: c.toStationId,
                lineId: c.lineId,
            })));
        } else {
            setMessage(prev => prev || conRes.message);
        }

        setSelectedStationId(prev => {
            if (!prev) return prev;
            return (stationsRes.ok && (stationsRes.data ?? []).some(s => s.id === prev)) ? prev : null;
        });
    };

    useEffect(() => {
        void refreshAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, schemaId]);

    // load station↔line memberships for selected station
    useEffect(() => {
        if (!token || !selectedStation) {
            setStationLineIds([]);
            return;
        }

        (async () => {
            setStationLinesLoading(true);
            const res = await getStationLinesByStationId(token, selectedStation.id);
            setStationLinesLoading(false);

            if (!res.ok) {
                setMessage(prev => prev || res.message);
                return;
            }

            setStationLineIds((res.data ?? []).map(x => x.lineId));
        })();
    }, [token, selectedStation?.id]);

    const schedulePositionSave = (stationId: number, x: number, y: number) => {
        latestPos.current[stationId] = { x, y };
        const existing = pendingTimers.current[stationId];
        if (existing) window.clearTimeout(existing);

        pendingTimers.current[stationId] = window.setTimeout(async () => {
            if (!token) return;
            const pos = latestPos.current[stationId];
            if (!pos) return;
            const st = stations.find(s => s.id === stationId);
            if (!st) return;

            await updateStation(token, stationId, {
                name: st.name,
                description: st.description,
                latitude: st.latitude,
                longitude: st.longitude,
                isTransfer: st.isTransfer,
                positionX: pos.x,
                positionY: pos.y,
            });
        }, 500);
    };

    const onMoveStation = (stationId: number, x: number, y: number) => {
        setStations(prev => prev.map(s => (s.id === stationId ? { ...s, positionX: x, positionY: y } : s)));
        schedulePositionSave(stationId, x, y);
    };

    const removeConnectionById = async (connectionId: number) => {
        if (!token) return;
        const res = await deleteStationConnection(token, connectionId);
        if (!res.ok) {
            setMessage(res.message);
            return;
        }
        setConnections(prev => prev.filter(c => c.id !== connectionId));
    };

    const onConnectStationClick = async (stationId: number) => {
        if (!token) return;
        if (editorMode !== 'connect') return;

        if (connectFromStationId === null) {
            setConnectFromStationId(stationId);
            return;
        }

        if (connectFromStationId === stationId) {
            setConnectFromStationId(null);
            return;
        }

        if (!connectLineId) {
            setMessage('W trybie łączenia wybierz linię (pole „Linia”).');
            setConnectFromStationId(null);
            return;
        }

        const a = connectFromStationId;
        const b = stationId;

        const existing = connections.find(c =>
            c.lineId === connectLineId &&
            ((c.fromStationId === a && c.toStationId === b) || (c.fromStationId === b && c.toStationId === a))
        );

        if (existing) {
            await removeConnectionById(existing.id);
            setConnectFromStationId(null);
            return;
        }

        const addRes = await addStationConnection(token, {
            schemaId,
            lineId: connectLineId,
            fromStationId: a,
            toStationId: b,
            path: null,
        });

        if (!addRes.ok) {
            setMessage(addRes.message);
            return;
        }

        setConnections(prev => [
            ...prev,
            {
                id: addRes.data.id,
                fromStationId: addRes.data.fromStationId,
                toStationId: addRes.data.toStationId,
                lineId: addRes.data.lineId,
            },
        ]);

        setConnectFromStationId(null);
    };

    if (!token) {
        return (
            <div className="page">
                <div className="alert alert-error">Musisz być zalogowany/a.</div>
                <Link to="/login" className="btn btn-primary">Przejdź do logowania</Link>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="toolbar">
                <div>
                    <Link to="/" className="pill">← Wróć</Link>
                    <h1 style={{ marginTop: 10 }}>
                        {schema?.name ? schema.name : `Schemat #${schemaId}`}
                    </h1>
                    {schema && (
                        <div className="muted">
                            {schema.city}, {schema.country} • {schema.isPublic ? 'publiczny' : 'prywatny'}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => void refreshAll()} disabled={isLoading}>Odśwież</button>
                    <button className="btn btn-primary" onClick={() => { setAddStationError(''); setNewStationPos(null); setIsAddStationOpen(true); }}>
                        + Stacja
                    </button>
                    <button className="btn" onClick={() => { setAddLineError(''); setIsAddLineOpen(true); }}>
                        + Linia
                    </button>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: 12 }}>
                <TabButton active={tab === 'editor'} onClick={() => setTab('editor')}>Edytor</TabButton>
                <TabButton active={tab === 'stations'} onClick={() => setTab('stations')}>Stacje ({stations.length})</TabButton>
                <TabButton active={tab === 'lines'} onClick={() => setTab('lines')}>Linie ({lines.length})</TabButton>
                <TabButton active={tab === 'share'} onClick={() => setTab('share')}>Udostępnianie</TabButton>
                <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}>Statystyki</TabButton>
            </div>

            {message && <div className="alert alert-error">{message}</div>}
            {isLoading && <div className="alert">Ładowanie…</div>}

            {tab === 'editor' && (
                <div className="grid">
                    <div className="card card-span-8">
                        <h3>Canvas</h3>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                            <span className="pill">Tryb</span>
                            <button
                                className={`btn ${editorMode === 'move' ? 'btn-primary' : ''}`}
                                onClick={() => { setEditorMode('move'); setConnectFromStationId(null); }}
                                type="button"
                            >
                                Przesuwanie
                            </button>
                            <button
                                className={`btn ${editorMode === 'connect' ? 'btn-primary' : ''}`}
                                onClick={() => { setEditorMode('connect'); setConnectFromStationId(null); }}
                                type="button"
                            >
                                Łączenie
                            </button>

                            {editorMode === 'connect' && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    Linia
                                    <select
                                        value={connectLineId ?? ''}
                                        onChange={(e) => setConnectLineId(e.target.value === '' ? null : Number(e.target.value))}
                                    >
                                        <option value="">(wybierz linię)</option>
                                        {lines.map(l => (
                                            <option key={l.id} value={String(l.id)}>
                                                {l.name} (nr {l.lineNumber})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            {editorMode === 'connect' && connectFromStationId !== null && (
                                <span className="pill">Kliknij drugą stację…</span>
                            )}
                        </div>

                        <SchemaCanvas
                            stations={stations}
                            lines={lines}
                            connections={connections}
                            mode={editorMode}
                            connectFromStationId={connectFromStationId}
                            selectedStationId={selectedStationId}
                            onSelectStation={(sid) => setSelectedStationId(sid)}
                            onMoveStation={onMoveStation}
                            onStationClickInConnectMode={(sid) => { void onConnectStationClick(sid); }}
                            onBackgroundClick={() => {
                                if (editorMode === 'connect') setConnectFromStationId(null);
                            }}
                            onRemoveConnection={(connectionId) => {
                                if (editorMode !== 'connect') return;
                                void removeConnectionById(connectionId);
                            }}
                            onRequestCreateStation={(x, y) => {
                                setNewStationPos({ x, y });
                                setAddStationError('');
                                setIsAddStationOpen(true);
                            }}
                        />

                        <div className="hint">
                            {editorMode === 'move'
                                ? 'Kliknij w puste miejsce, żeby dodać stację. Przeciągaj stacje, żeby zmienić pozycję (backend zapisze po ~0.5s od ostatniego ruchu).'
                                : 'Tryb łączenia: kliknij 1) stację A, potem 2) stację B. Kliknięcie istniejącej kreski usuwa połączenie.'}
                        </div>
                    </div>

                    <div className="card card-span-4">
                        <h3>Szczegóły stacji</h3>

                        {!selectedStation ? (
                            <p className="muted">Kliknij stację na canvasie, żeby ją edytować.</p>
                        ) : (
                            <>
                                <EditStationForm
                                    station={selectedStation}
                                    isLoading={isSavingStation}
                                    error={editError}
                                    ok={editOk}
                                    onSave={async (data) => {
                                        setEditError('');
                                        setEditOk('');
                                        setIsSavingStation(true);

                                        const res = await updateStation(token, selectedStation.id, {
                                            name: (data.name ?? selectedStation.name),
                                            description: (data.description ?? selectedStation.description),
                                            latitude: (data.latitude ?? selectedStation.latitude),
                                            longitude: (data.longitude ?? selectedStation.longitude),
                                            positionX: (data.positionX ?? selectedStation.positionX),
                                            positionY: (data.positionY ?? selectedStation.positionY),
                                            isTransfer: (data.isTransfer ?? selectedStation.isTransfer),
                                        });

                                        setIsSavingStation(false);
                                        if (!res.ok) {
                                            setEditError(res.message);
                                            return;
                                        }
                                        setEditOk('Zapisano ✅');
                                        await refreshAll();
                                    }}
                                    onDelete={async () => {
                                        setEditError('');
                                        setEditOk('');
                                        if (!confirm('Na pewno usunąć tę stację?')) return;
                                        setIsSavingStation(true);
                                        const res = await deleteStation(token, selectedStation.id);
                                        setIsSavingStation(false);
                                        if (!res.ok) {
                                            setEditError(res.message);
                                            return;
                                        }
                                        setSelectedStationId(null);
                                        await refreshAll();
                                    }}
                                />

                                <div style={{ marginTop: 14 }}>
                                    <h3>Linie tej stacji</h3>
                                    {stationLinesLoading ? (
                                        <p className="muted">Ładowanie…</p>
                                    ) : (
                                        <div className="list">
                                            {lines.map(l => {
                                                const checked = stationLineIds.includes(l.id);
                                                return (
                                                    <div key={l.id} className="list-item">
                                                        <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => {
                                                                    void (async () => {
                                                                        if (!selectedStation) return;

                                                                        if (!checked) {
                                                                            const cat = lineCategories.find(c => c.id === l.lineCategoryId);
                                                                            if (!cat) {
                                                                                setMessage('Brak kategorii dla tej linii (lineCategoryId nie znaleziony).');
                                                                                return;
                                                                            }

                                                                            const res = await addStationLine(token, selectedStation, l, cat);

                                                                            if (!res.ok) { setMessage(res.message); return; }
                                                                            setStationLineIds(prev => [...prev, l.id]);
                                                                        } else {
                                                                            const res = await deleteStationLine(token, selectedStation.id, l.id);
                                                                            if (!res.ok) { setMessage(res.message); return; }
                                                                            setStationLineIds(prev => prev.filter(x => x !== l.id));
                                                                        }
                                                                    })();
                                                                }}
                                                            />
                                                            <span className="swatch" style={{ background: l.color }} />
                                                            <span style={{ fontWeight: 800 }}>{l.name}</span>
                                                            <span className="muted">(nr {l.lineNumber})</span>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div style={{ marginTop: 14 }}>
                            <h3>Połączenia ({connections.length})</h3>
                            {connections.length === 0 ? (
                                <p className="muted">Brak (dodaj w trybie „Łączenie”).</p>
                            ) : (
                                <div className="list">
                                    {connections.map(c => {
                                        const a = stationById.get(c.fromStationId)?.name ?? `#${c.fromStationId}`;
                                        const b = stationById.get(c.toStationId)?.name ?? `#${c.toStationId}`;
                                        const line = lineById.get(c.lineId) ?? null;

                                        return (
                                            <div key={c.id} className="list-item">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 800 }}>{a} ↔ {b}</div>
                                                        {line ? (
                                                            <div className="muted">
                                                                Linia: <span className="swatch" style={{ background: line.color }} /> {line.name} (nr {line.lineNumber})
                                                            </div>
                                                        ) : (
                                                            <div className="muted">Linia: —</div>
                                                        )}
                                                    </div>
                                                    <button className="btn btn-danger" type="button" onClick={() => void removeConnectionById(c.id)}>
                                                        Usuń
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="hint">Połączenia są zapisywane w backendzie (StationConnections).</div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'stations' && (
                <div className="card">
                    <h3>Stacje</h3>
                    {stations.length === 0 ? (
                        <p className="muted">Brak stacji.</p>
                    ) : (
                        <div className="list">
                            {stations
                                .slice()
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(s => (
                                    <div key={s.id} className="list-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                            <div>
                                                <div style={{ fontWeight: 900 }}>
                                                    {s.name} {s.isTransfer ? <span className="pill">przesiadkowa</span> : null}
                                                </div>
                                                <div className="muted mono">ID: {s.id} • X: {Math.round(s.positionX)} • Y: {Math.round(s.positionY)}</div>
                                            </div>
                                            <div className="card-actions" style={{ marginTop: 0 }}>
                                                <button className="btn" onClick={() => { setSelectedStationId(s.id); setTab('editor'); }}>Edytuj</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'lines' && (
                <div className="card">
                    <h3>Linie</h3>
                    {lines.length === 0 ? (
                        <p className="muted">Brak linii.</p>
                    ) : (
                        <div className="list">
                            {lines
                                .slice()
                                .sort((a, b) => a.lineNumber - b.lineNumber)
                                .map(l => {
                                    const cat = lineCategories.find(c => c.id === l.lineCategoryId) ?? null;
                                    const t = cat ? (catTypeMap[cat.id] ?? 'other') : 'other';
                                    return (
                                        <div key={l.id} className="list-item">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                <div>
                                                    <div style={{ fontWeight: 900 }}>
                                                        <span title={t} style={{ marginRight: 8 }}>{iconFor(t)}</span>
                                                        <span className="swatch" style={{ background: l.color }} />
                                                        {l.name} <span className="muted">(nr {l.lineNumber})</span>
                                                    </div>
                                                    <div className="muted">
                                                        Kategoria: {cat ? (
                                                        <>
                                                            <span className="swatch" style={{ background: cat.color }} /> {cat.name} <span className="mono">(ID {cat.id})</span>
                                                        </>
                                                    ) : (
                                                        <span className="mono">ID {l.lineCategoryId}</span>
                                                    )}
                                                    </div>
                                                    <div className="muted mono">LineId: {l.id} • color: {l.color}</div>
                                                </div>
                                                <div className="card-actions" style={{ marginTop: 0 }}>
                                                    <span className="pill">{l.isCircular ? 'okrężna' : 'zwykła'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                    <div className="card-actions">
                        <button className="btn btn-primary" onClick={() => { setAddLineError(''); setIsAddLineOpen(true); }}>+ Dodaj linię</button>
                    </div>
                </div>
            )}

            {tab === 'share' && (
                <div className="grid">
                    <div className="card card-span-6">
                        <h3>Udostępnij schemat</h3>
                        <div className="hint">
                            Do udostępnienia potrzebujesz <b>UserId</b> drugiej osoby (zobaczy je na swojej stronie Profil).
                        </div>
                        <form
                            className="form"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setShareError('');
                                setShareOk('');
                                const res = await shareSchema(token, { schemaId, sharedWithUserId: shareUserId.trim(), accessLevel: shareAccess });
                                if (!res.ok) {
                                    setShareError(res.message);
                                    return;
                                }
                                setShareOk('Udostępniono ✅');
                                setShareUserId('');
                                await refreshAll();
                            }}
                        >
                            <label>
                                SharedWithUserId
                                <input value={shareUserId} onChange={(e) => setShareUserId(e.target.value)} placeholder="np. 7b1a..." required />
                            </label>
                            <label>
                                Poziom dostępu
                                <select value={shareAccess} onChange={(e) => setShareAccess(e.target.value as 'Read' | 'Write')}>
                                    <option value="Read">Read</option>
                                    <option value="Write">Write</option>
                                </select>
                            </label>

                            {shareError && <div className="alert alert-error">{shareError}</div>}
                            {shareOk && <div className="alert alert-ok">{shareOk}</div>}

                            <div className="card-actions">
                                <button className="btn btn-primary" type="submit">Udostępnij</button>
                            </div>
                        </form>
                    </div>

                    <div className="card card-span-6">
                        <h3>Moje udostępnienia (ten schemat)</h3>
                        {sharedByMe.length === 0 ? (
                            <p className="muted">Brak.</p>
                        ) : (
                            <div className="list">
                                {sharedByMe.map(sh => (
                                    <div key={sh.id} className="list-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                            <div>
                                                <div style={{ fontWeight: 900 }}>{sh.sharedWithEmail || sh.sharedWithUserId}</div>
                                                <div className="muted">{sh.accessLevel} • {new Date(sh.sharedAt).toLocaleString()}</div>
                                                <div className="muted mono">sharedId: {sh.id}</div>
                                            </div>
                                            <div className="card-actions" style={{ marginTop: 0 }}>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={async () => {
                                                        if (!confirm('Usunąć to udostępnienie?')) return;
                                                        const res = await removeShare(token, sh.id);
                                                        if (!res.ok) {
                                                            setShareError(res.message);
                                                            return;
                                                        }
                                                        await refreshAll();
                                                    }}
                                                >
                                                    Usuń
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'stats' && (
                <div className="card">
                    <h3>Statystyki</h3>
                    {!stats ? (
                        <p className="muted">Brak statystyk (albo nie znaleziono wpisu). Spróbuj przeliczyć.</p>
                    ) : (
                        <div className="grid" style={{ marginTop: 10 }}>
                            <div className="card card-span-4"><h3>Stacje</h3><p style={{ fontSize: 26, fontWeight: 900 }}>{stats.stationCount}</p></div>
                            <div className="card card-span-4"><h3>Linie</h3><p style={{ fontSize: 26, fontWeight: 900 }}>{stats.lineCount}</p></div>
                            <div className="card card-span-4"><h3>Połączenia</h3><p style={{ fontSize: 26, fontWeight: 900 }}>{stats.connectionCount}</p></div>

                            <div className="card card-span-6">
                                <h3>Najdłuższa linia</h3>
                                <p className="muted">{stats.longestLineName ?? '—'}</p>
                                <p>Stacji: <b>{stats.longestLineStationCount}</b></p>
                            </div>
                            <div className="card card-span-6">
                                <h3>Najbardziej połączona stacja</h3>
                                <p className="muted">{stats.mostConnectedStationName ?? '—'}</p>
                                <p>Połączeń: <b>{stats.mostConnectedStationConnectionCount}</b></p>
                            </div>

                            <div className="card card-span-12">
                                <h3>Łączna długość sieci</h3>
                                <p style={{ fontSize: 22, fontWeight: 900 }}>{stats.totalNetworkLength}</p>
                                <p className="muted">Obliczono: {new Date(stats.calculatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    <div className="card-actions">
                        <button
                            className="btn btn-ok"
                            onClick={async () => {
                                const res = await recalculateStatistics(token, schemaId);
                                if (!res.ok) {
                                    setMessage(res.message);
                                    return;
                                }
                                await refreshAll();
                            }}
                        >
                            Przelicz ponownie
                        </button>
                    </div>
                </div>
            )}

            <Modal title="Dodaj linię" isOpen={isAddLineOpen} onClose={() => setIsAddLineOpen(false)}>
                <AddLineForm
                    schemaId={schemaId}
                    categories={lineCategories}
                    isLoading={isAddingLine}
                    error={addLineError}
                    onSubmit={async (data) => {
                        setIsAddingLine(true);
                        setAddLineError('');
                        const res = await addLine(token, data);
                        setIsAddingLine(false);
                        if (!res.ok) {
                            setAddLineError(res.message);
                            return;
                        }
                        setIsAddLineOpen(false);
                        await refreshAll();
                    }}
                />
            </Modal>

            <Modal title="Dodaj stację" isOpen={isAddStationOpen} onClose={() => setIsAddStationOpen(false)}>
                <AddStationForm
                    schemaId={schemaId}
                    initialX={newStationPos?.x}
                    initialY={newStationPos?.y}
                    lines={lines}
                    isLoading={isAddingStation}
                    error={addStationError}
                    onSubmit={async (data) => {
                        setIsAddingStation(true);
                        setAddStationError('');
                        const res = await addStation(token, data);
                        setIsAddingStation(false);
                        if (!res.ok) {
                            setAddStationError(res.message);
                            return;
                        }
                        setIsAddStationOpen(false);
                        setNewStationPos(null);
                        await refreshAll();
                    }}
                />
            </Modal>
        </div>
    );
}
