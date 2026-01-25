import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    addLineCategory,
    deleteLineCategory,
    getLineCategories,
    updateLineCategory,
    type LineCategoryDto,
} from '../api/api';

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

function saveTypeMap(map: Record<number, CatType>) {
    localStorage.setItem(TYPE_STORAGE_KEY, JSON.stringify(map));
}

function iconFor(t: CatType): string {
    switch (t) {
        case 'metro':
            return 'Ⓜ';
        case 'tram':
            return '🚋';
        case 'bus':
            return '🚌';
        default:
            return '➖';
    }
}

export default function LineCategoriesPage() {
    const { token } = useContext(AuthContext);
    const [items, setItems] = useState<LineCategoryDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [name, setName] = useState('');
    const [color, setColor] = useState('#6ea8fe');
    const [typeMap, setTypeMap] = useState<Record<number, CatType>>(() => loadTypeMap());

    const [editingId, setEditingId] = useState<number | null>(null);
    const editingItem = useMemo(() => items.find(x => x.id === editingId) ?? null, [items, editingId]);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const refresh = async () => {
        if (!token) return;
        setIsLoading(true);
        setMessage('');
        const res = await getLineCategories(token);
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

    useEffect(() => {
        saveTypeMap(typeMap);
    }, [typeMap]);

    useEffect(() => {
        if (!editingItem) return;
        setEditName(editingItem.name ?? '');
        setEditColor(editingItem.color ?? '#6ea8fe');
    }, [editingItem]);

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
                    <h1>Kategorie linii</h1>
                    <div className="muted">Wersja "najprościej jak się da": typ (metro/tram/bus) zapisujemy lokalnie w przeglądarce.</div>
                </div>
                <button className="btn" onClick={() => void refresh()} disabled={isLoading}>Odśwież</button>
            </div>

            {message && <div className="alert alert-error">{message}</div>}
            {isLoading && <div className="alert">Ładowanie…</div>}

            <div className="grid">
                <div className="card card-span-5">
                    <h3>Dodaj kategorię</h3>
                    <form
                        className="form"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setMessage('');
                            const res = await addLineCategory(token, { name, color });
                            if (!res.ok) {
                                setMessage(res.message);
                                return;
                            }
                            setName('');
                            setColor('#6ea8fe');
                            await refresh();
                        }}
                    >
                        <label>
                            Nazwa
                            <input value={name} onChange={(e) => setName(e.target.value)} required />
                        </label>
                        <label>
                            Kolor (hex)
                            <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#RRGGBB" />
                        </label>
                        <div className="card-actions">
                            <button className="btn btn-primary" type="submit">Dodaj</button>
                        </div>
                    </form>
                </div>

                <div className="card card-span-7">
                    <h3>Lista</h3>
                    {items.length === 0 ? (
                        <p className="muted">Brak kategorii w bazie.</p>
                    ) : (
                        <div className="list">
                            {items
                                .slice()
                                .sort((a, b) => a.id - b.id)
                                .map(cat => {
                                    const t = typeMap[cat.id] ?? 'other';
                                    const isEditing = editingId === cat.id;
                                    return (
                                        <div key={cat.id} className="list-item">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                <div>
                                                    <div style={{ fontWeight: 900, fontSize: 16 }}>
                                                        <span title={t} style={{ marginRight: 8 }}>{iconFor(t)}</span>
                                                        <span className="swatch" style={{ background: cat.color }} />
                                                        {cat.name} <span className="muted">(ID {cat.id})</span>
                                                    </div>
                                                    <div className="muted mono">color: {cat.color}</div>
                                                </div>

                                                <div className="card-actions" style={{ marginTop: 0 }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        Typ
                                                        <select
                                                            value={t}
                                                            onChange={(e) => setTypeMap(prev => ({ ...prev, [cat.id]: e.target.value as CatType }))}
                                                        >
                                                            <option value="metro">metro</option>
                                                            <option value="tram">tram</option>
                                                            <option value="bus">bus</option>
                                                            <option value="other">other</option>
                                                        </select>
                                                    </label>
                                                    <button
                                                        className="btn"
                                                        onClick={() => {
                                                            setEditingId(isEditing ? null : cat.id);
                                                        }}
                                                    >
                                                        {isEditing ? 'Zamknij' : 'Edytuj'}
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={async () => {
                                                            if (!confirm('Usunąć kategorię?')) return;
                                                            setMessage('');
                                                            const res = await deleteLineCategory(token, cat.id);
                                                            if (!res.ok) {
                                                                setMessage(res.message);
                                                                return;
                                                            }
                                                            setTypeMap(prev => {
                                                                const next = { ...prev };
                                                                delete next[cat.id];
                                                                return next;
                                                            });
                                                            await refresh();
                                                        }}
                                                    >
                                                        Usuń
                                                    </button>
                                                </div>
                                            </div>

                                            {isEditing && (
                                                <div style={{ marginTop: 12 }}>
                                                    <form
                                                        className="form"
                                                        onSubmit={async (e) => {
                                                            e.preventDefault();
                                                            setMessage('');
                                                            const res = await updateLineCategory(token, cat.id, { name: editName, color: editColor });
                                                            if (!res.ok) {
                                                                setMessage(res.message);
                                                                return;
                                                            }
                                                            setEditingId(null);
                                                            await refresh();
                                                        }}
                                                    >
                                                        <div className="form-row">
                                                            <label>
                                                                Nazwa
                                                                <input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                                                            </label>
                                                            <label>
                                                                Kolor
                                                                <input value={editColor} onChange={(e) => setEditColor(e.target.value)} placeholder="#RRGGBB" />
                                                            </label>
                                                        </div>
                                                        <div className="card-actions">
                                                            <button className="btn btn-primary" type="submit">Zapisz</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
