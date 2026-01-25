import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAllStatistics, type SchemaStatisticsDto } from '../api/api';

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export default function StatisticsPage() {
    const { token } = useContext(AuthContext);
    const [items, setItems] = useState<SchemaStatisticsDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const refresh = async () => {
        if (!token) return;
        setIsLoading(true);
        setMessage('');
        const res = await getAllStatistics(token);
        setIsLoading(false);
        if (!res.ok) {
            setMessage(res.message);
            return;
        }
        setItems(res.data ?? []);
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const totals = useMemo(() => {
        let stationCount = 0;
        let lineCount = 0;
        let connectionCount = 0;
        for (const s of items) {
            stationCount += s.stationCount ?? 0;
            lineCount += s.lineCount ?? 0;
            connectionCount += s.connectionCount ?? 0;
        }
        return { stationCount, lineCount, connectionCount };
    }, [items]);

    const topStations = useMemo(() => {
        return items
            .slice()
            .sort((a, b) => (b.stationCount ?? 0) - (a.stationCount ?? 0))
            .slice(0, 10);
    }, [items]);

    const topConnections = useMemo(() => {
        return items
            .slice()
            .sort((a, b) => (b.connectionCount ?? 0) - (a.connectionCount ?? 0))
            .slice(0, 10);
    }, [items]);

    const maxStations = useMemo(() => Math.max(1, ...topStations.map(x => x.stationCount ?? 0)), [topStations]);
    const maxConnections = useMemo(() => Math.max(1, ...topConnections.map(x => x.connectionCount ?? 0)), [topConnections]);

    if (!token) {
        return (
            <div className="page">
                <div className="alert alert-error">Musisz być zalogowany/a.</div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="toolbar">
                <div>
                    <h1>Statystyki</h1>
                    <div className="muted">Zbiorczy widok z endpointu <span className="mono">GET /statistics</span>.</div>
                </div>
                <button className="btn" onClick={() => void refresh()} disabled={isLoading}>Odśwież</button>
            </div>

            {message && <div className="alert alert-error">{message}</div>}
            {isLoading && <div className="alert">Ładowanie…</div>}

            <div className="grid">
                <div className="card card-span-4"><h3>Łącznie stacji</h3><p style={{ fontSize: 26, fontWeight: 900 }}>{totals.stationCount}</p></div>
                <div className="card card-span-4"><h3>Łącznie linii</h3><p style={{ fontSize: 26, fontWeight: 900 }}>{totals.lineCount}</p></div>
                <div className="card card-span-4"><h3>Łącznie połączeń</h3><p style={{ fontSize: 26, fontWeight: 900 }}>{totals.connectionCount}</p></div>

                <div className="card card-span-6">
                    <h3>Top 10 – liczba stacji</h3>
                    {topStations.length === 0 ? (
                        <p className="muted">Brak danych.</p>
                    ) : (
                        <div className="barlist">
                            {topStations.map(s => {
                                const pct = clamp(((s.stationCount ?? 0) / maxStations) * 100, 0, 100);
                                return (
                                    <div key={s.schemaId} className="barrow">
                                        <div className="barlabel" title={s.schemaName}>{s.schemaName ?? `Schemat #${s.schemaId}`}</div>
                                        <div className="bar"><div className="barfill" style={{ width: `${pct}%` }} /></div>
                                        <div className="barvalue">{s.stationCount}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="card card-span-6">
                    <h3>Top 10 – liczba połączeń</h3>
                    {topConnections.length === 0 ? (
                        <p className="muted">Brak danych.</p>
                    ) : (
                        <div className="barlist">
                            {topConnections.map(s => {
                                const pct = clamp(((s.connectionCount ?? 0) / maxConnections) * 100, 0, 100);
                                return (
                                    <div key={s.schemaId} className="barrow">
                                        <div className="barlabel" title={s.schemaName}>{s.schemaName ?? `Schemat #${s.schemaId}`}</div>
                                        <div className="bar"><div className="barfill" style={{ width: `${pct}%` }} /></div>
                                        <div className="barvalue">{s.connectionCount}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="card card-span-12">
                    <h3>Lista (kliknij, żeby przejść do schematu)</h3>
                    {items.length === 0 ? (
                        <p className="muted">Brak danych.</p>
                    ) : (
                        <div className="list">
                            {items
                                .slice()
                                .sort((a, b) => (b.calculatedAt ?? '').localeCompare(a.calculatedAt ?? ''))
                                .map(s => (
                                    <div key={s.schemaId} className="list-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                            <div>
                                                <div style={{ fontWeight: 900 }}>{s.schemaName ?? `Schemat #${s.schemaId}`}</div>
                                                <div className="muted">Stacji: <b>{s.stationCount}</b> • Linii: <b>{s.lineCount}</b> • Połączeń: <b>{s.connectionCount}</b></div>
                                                <div className="muted">Obliczono: {new Date(s.calculatedAt).toLocaleString()}</div>
                                            </div>
                                            <div className="card-actions" style={{ marginTop: 0 }}>
                                                <Link className="btn btn-primary" to={`/schemas/${s.schemaId}`}>Otwórz</Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
