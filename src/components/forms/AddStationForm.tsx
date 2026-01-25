import { useMemo, useState } from 'react';
import type { AddStationRequest, LineDto } from '../../api/api';

type Props = {
    schemaId: number;
    initialX?: number;
    initialY?: number;
    lines: LineDto[];
    onSubmit: (data: AddStationRequest) => Promise<void> | void;
    isLoading?: boolean;
    error?: string;
};

export default function AddStationForm({ schemaId, initialX, initialY, lines, onSubmit, isLoading, error }: Props) {
    const [name, setName] = useState('');
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [positionX, setPositionX] = useState<number>(typeof initialX === 'number' ? Math.round(initialX) : 100);
    const [positionY, setPositionY] = useState<number>(typeof initialY === 'number' ? Math.round(initialY) : 100);
    const [isTransfer, setIsTransfer] = useState(false);
    const [description, setDescription] = useState('');
    const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);

    const toggleLine = (id: number) => {
        setSelectedLineIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const parsedLat = useMemo(() => {
        const v = latitude.trim();
        return v === '' ? 0 : Number(v);
    }, [latitude]);

    const parsedLon = useMemo(() => {
        const v = longitude.trim();
        return v === '' ? 0 : Number(v);
    }, [longitude]);

    return (
        <form
            className="form"
            onSubmit={async (e) => {
                e.preventDefault();
                await onSubmit({
                    schemaId,
                    name,
                    latitude: Number.isFinite(parsedLat) ? parsedLat : 0,
                    longitude: Number.isFinite(parsedLon) ? parsedLon : 0,
                    positionX,
                    positionY,
                    isTransfer,
                    description,
                    lineIds: selectedLineIds,
                });
            }}
        >
            <div className="form-row">
                <label>
                    Nazwa stacji
                    <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                    Przesiadkowa
                    <select value={isTransfer ? 'yes' : 'no'} onChange={(e) => setIsTransfer(e.target.value === 'yes')}>
                        <option value="no">Nie</option>
                        <option value="yes">Tak</option>
                    </select>
                </label>
            </div>

            <div className="form-row">
                <label>
                    Pozycja X
                    <input type="number" value={positionX} onChange={(e) => setPositionX(Number(e.target.value))} />
                </label>
                <label>
                    Pozycja Y
                    <input type="number" value={positionY} onChange={(e) => setPositionY(Number(e.target.value))} />
                </label>
            </div>

            <div className="form-row">
                <label>
                    Latitude (opcjonalne)
                    <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="np. 51.204" />
                </label>
                <label>
                    Longitude (opcjonalne)
                    <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="np. 16.161" />
                </label>
            </div>

            <label>
                Opis
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>

            <div className="card">
                <h3>Przypisz do linii (opcjonalne)</h3>
                {lines.length === 0 ? (
                    <p className="muted">Brak linii w tym schemacie.</p>
                ) : (
                    <div className="list">
                        {lines.map(l => (
                            <label key={l.id} className="list-item" style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                    <div>
                                        <div style={{ fontWeight: 800 }}>{l.name} <span className="muted">(nr {l.lineNumber})</span></div>
                                        <div className="muted mono">ID linii: {l.id}</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedLineIds.includes(l.id)}
                                        onChange={() => toggleLine(l.id)}
                                    />
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                <div className="hint">
                    Uwaga: backend zapisuje powiązania tylko przy tworzeniu stacji. Jeśli chcesz zmienić przypisanie, najprościej usuń stację i dodaj ją ponownie.
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card-actions">
                <button className="btn btn-primary" type="submit" disabled={isLoading}>
                    {isLoading ? 'Dodawanie…' : 'Dodaj stację'}
                </button>
            </div>
        </form>
    );
}
