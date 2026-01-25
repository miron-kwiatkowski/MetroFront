import { useEffect, useMemo, useState } from 'react';
import type { AddLineRequest, LineCategoryDto } from '../../api/api';

type Props = {
    schemaId: number;
    categories?: LineCategoryDto[];
    onSubmit: (data: AddLineRequest) => Promise<void> | void;
    isLoading?: boolean;
    error?: string;
};

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

export default function AddLineForm({ schemaId, categories, onSubmit, isLoading, error }: Props) {
    const [name, setName] = useState('');
    const [lineNumber, setLineNumber] = useState(1);
    const [color, setColor] = useState('#6ea8fe');
    const [isCircular, setIsCircular] = useState(false);
    const [lineCategoryId, setLineCategoryId] = useState<number>(() => (categories?.[0]?.id ?? 1));

    const typeMap = useMemo(() => loadTypeMap(), []);

    useEffect(() => {
        if (!categories || categories.length === 0) return;
        if (categories.some(c => c.id === lineCategoryId)) return;
        setLineCategoryId(categories[0].id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories]);

    const hasCategories = (categories?.length ?? 0) > 0;

    return (
        <form
            className="form"
            onSubmit={async (e) => {
                e.preventDefault();
                await onSubmit({ schemaId, name, lineNumber, color, isCircular, lineCategoryId });
            }}
        >
            <div className="form-row">
                <label>
                    Nazwa linii
                    <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                    Numer
                    <input
                        type="number"
                        min={1}
                        value={lineNumber}
                        onChange={(e) => setLineNumber(Number(e.target.value))}
                        required
                    />
                </label>
            </div>

            <div className="form-row">
                <label>
                    Kolor (hex)
                    <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#RRGGBB" />
                </label>
                <label>
                    Okrężna
                    <select value={isCircular ? 'yes' : 'no'} onChange={(e) => setIsCircular(e.target.value === 'yes')}>
                        <option value="no">Nie</option>
                        <option value="yes">Tak</option>
                    </select>
                </label>
            </div>

            {hasCategories ? (
                <label>
                    Kategoria linii
                    <select value={String(lineCategoryId)} onChange={(e) => setLineCategoryId(Number(e.target.value))}>
                        {categories!.map(c => {
                            const t = typeMap[c.id] ?? 'other';
                            return (
                                <option key={c.id} value={String(c.id)}>
                                    {iconFor(t)} {c.name} (ID {c.id})
                                </option>
                            );
                        })}
                    </select>
                </label>
            ) : (
                <>
                    <label>
                        Kategoria linii (LineCategoryId)
                        <input
                            type="number"
                            min={1}
                            value={lineCategoryId}
                            onChange={(e) => setLineCategoryId(Number(e.target.value))}
                        />
                    </label>
                    <div className="hint">
                        Nie udało się pobrać kategorii z API. Możesz wpisać ID ręcznie.
                    </div>
                </>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card-actions">
                <button className="btn btn-primary" type="submit" disabled={isLoading}>
                    {isLoading ? 'Dodawanie…' : 'Dodaj linię'}
                </button>
            </div>
        </form>
    );
}
