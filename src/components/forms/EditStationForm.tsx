import { useEffect, useMemo, useState } from 'react';
import type { EditStationRequest, StationDto } from '../../api/api';

type Props = {
    station: StationDto;
    onSave: (data: EditStationRequest) => Promise<void> | void;
    onDelete?: () => Promise<void> | void;
    isLoading?: boolean;
    error?: string;
    ok?: string;
};

export default function EditStationForm({ station, onSave, onDelete, isLoading, error, ok }: Props) {
    const [name, setName] = useState(station.name);
    const [positionX, setPositionX] = useState<number>(Math.round(station.positionX));
    const [positionY, setPositionY] = useState<number>(Math.round(station.positionY));
    const [latitude, setLatitude] = useState<string>(String(station.latitude ?? 0));
    const [longitude, setLongitude] = useState<string>(String(station.longitude ?? 0));
    const [isTransfer, setIsTransfer] = useState<boolean>(station.isTransfer);
    const [description, setDescription] = useState(station.description ?? '');

    useEffect(() => {
        setName(station.name);
        setPositionX(Math.round(station.positionX));
        setPositionY(Math.round(station.positionY));
        setLatitude(String(station.latitude ?? 0));
        setLongitude(String(station.longitude ?? 0));
        setIsTransfer(station.isTransfer);
        setDescription(station.description ?? '');
    }, [station]);

    const parsedLat = useMemo(() => {
        const v = latitude.trim();
        return v === '' ? undefined : Number(v);
    }, [latitude]);

    const parsedLon = useMemo(() => {
        const v = longitude.trim();
        return v === '' ? undefined : Number(v);
    }, [longitude]);

    return (
        <form
            className="form"
            onSubmit={async (e) => {
                e.preventDefault();
                await onSave({
                    name: name.trim() === station.name ? undefined : name.trim(),
                    positionX: positionX !== Math.round(station.positionX) ? positionX : undefined,
                    positionY: positionY !== Math.round(station.positionY) ? positionY : undefined,
                    latitude: typeof parsedLat === 'number' && Number.isFinite(parsedLat) && parsedLat !== station.latitude ? parsedLat : undefined,
                    longitude: typeof parsedLon === 'number' && Number.isFinite(parsedLon) && parsedLon !== station.longitude ? parsedLon : undefined,
                    isTransfer: isTransfer !== station.isTransfer ? isTransfer : undefined,
                    description: description.trim() !== (station.description ?? '').trim() ? description.trim() : undefined,
                });
            }}
        >
            <div className="form-row">
                <label>
                    Nazwa
                    <input value={name} onChange={(e) => setName(e.target.value)} />
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
                    Latitude
                    <input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                </label>
                <label>
                    Longitude
                    <input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                </label>
            </div>

            <label>
                Opis
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>

            {error && <div className="alert alert-error">{error}</div>}
            {ok && <div className="alert alert-ok">{ok}</div>}

            <div className="card-actions">
                <button className="btn btn-primary" type="submit" disabled={isLoading}>
                    {isLoading ? 'Zapisywanie…' : 'Zapisz zmiany'}
                </button>
                {onDelete && (
                    <button className="btn btn-danger" type="button" onClick={() => onDelete()} disabled={isLoading}>
                        Usuń stację
                    </button>
                )}
            </div>
        </form>
    );
}
