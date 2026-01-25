import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    addSchema,
    getSchemas,
    getSharedByMe,
    getSharedWithMe,
} from '../api/api';
import type { SchemaDto, SharedSchemaDto } from '../api/api';
import Modal from '../components/Modal';
import AddSchemaForm from '../components/forms/AddSchemaForm';

export default function HomePage() {
    const { token, user } = useContext(AuthContext);

    const [schemas, setSchemas] = useState<SchemaDto[]>([]);
    const [sharedWithMe, setSharedWithMe] = useState<SharedSchemaDto[]>([]);
    const [sharedByMe, setSharedByMe] = useState<SharedSchemaDto[]>([]);

    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createError, setCreateError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const apiUrl = useMemo(() => (import.meta.env.VITE_API_URL as string | undefined) ?? '', []);

    const refresh = async () => {
        if (!token) return;
        setIsLoading(true);
        setMessage('');

        const [schemasRes, swmRes, sbmRes] = await Promise.all([
            getSchemas(token),
            getSharedWithMe(token),
            getSharedByMe(token),
        ]);

        setIsLoading(false);

        if (schemasRes.ok) setSchemas(schemasRes.data ?? []);
        else setMessage(schemasRes.message);

        if (swmRes.ok) setSharedWithMe(swmRes.data ?? []);
        if (sbmRes.ok) setSharedByMe(sbmRes.data ?? []);
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    if (!token) {
        return (
            <div className="page">
                <h1>MetroFront</h1>
                <p className="muted">
                    Zaloguj się, żeby zarządzać schematami. Frontend oczekuje zmiennej <span className="mono">VITE_API_URL</span> w pliku <span className="mono">.env</span>.
                </p>
                <div className="card">
                    <h3>Szybki start</h3>
                    <p className="muted">Przykład (lokalnie):</p>
                    <div className="alert">
                        <div className="mono">VITE_API_URL=https://localhost:7098</div>
                        <div className="mono">npm install</div>
                        <div className="mono">npm run dev</div>
                    </div>
                    <p className="muted">Aktualnie u Ciebie: <span className="mono">{apiUrl || 'brak'}</span></p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="toolbar">
                <div>
                    <h1>Schematy</h1>
                    <div className="muted">Zalogowano jako: <b>{user}</b></div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => void refresh()} disabled={isLoading}>Odśwież</button>
                    <button className="btn btn-primary" onClick={() => { setCreateError(''); setIsCreateOpen(true); }}>+ Nowy schemat</button>
                </div>
            </div>

            {message && <div className="alert alert-error">{message}</div>}
            {isLoading && <div className="alert">Ładowanie…</div>}

            <div className="grid">
                <div className="card card-span-8">
                    <h3>Moje schematy</h3>
                    {schemas.length === 0 ? (
                        <p className="muted">Brak schematów. Utwórz pierwszy 🙂</p>
                    ) : (
                        <div className="list">
                            {schemas.map(s => (
                                <div key={s.id} className="list-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: 16 }}>{s.name}</div>
                                            <div className="muted">{s.city}, {s.country} • {s.isPublic ? 'publiczny' : 'prywatny'}</div>
                                            {s.description && <div className="muted" style={{ marginTop: 6 }}>{s.description}</div>}
                                        </div>
                                        <div className="card-actions" style={{ marginTop: 0 }}>
                                            <Link className="btn btn-primary" to={`/schemas/${s.id}`}>Otwórz</Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card card-span-4">
                    <h3>Udostępnione mi</h3>
                    {sharedWithMe.length === 0 ? (
                        <p className="muted">Na razie nic.</p>
                    ) : (
                        <div className="list">
                            {sharedWithMe.map(sh => (
                                <div key={sh.id} className="list-item">
                                    <div style={{ fontWeight: 800 }}>{sh.schemaName}</div>
                                    <div className="muted">Dostęp: {sh.accessLevel}</div>
                                    <div className="card-actions" style={{ marginTop: 10 }}>
                                        <Link className="btn" to={`/schemas/${sh.schemaId}`}>Otwórz</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card card-span-12">
                    <h3>Udostępnione przeze mnie</h3>
                    {sharedByMe.length === 0 ? (
                        <p className="muted">Na razie nic.</p>
                    ) : (
                        <div className="list">
                            {sharedByMe.map(sh => (
                                <div key={sh.id} className="list-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontWeight: 800 }}>{sh.schemaName}</div>
                                            <div className="muted">Do: <span className="mono">{sh.sharedWithEmail || sh.sharedWithUserId}</span> • {sh.accessLevel}</div>
                                        </div>
                                        <div className="card-actions" style={{ marginTop: 0 }}>
                                            <Link className="btn" to={`/schemas/${sh.schemaId}`}>Otwórz schemat</Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal title="Nowy schemat" isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
                <AddSchemaForm
                    isLoading={isCreating}
                    error={createError}
                    onSubmit={async (data) => {
                        if (!token) return;
                        setIsCreating(true);
                        setCreateError('');
                        const res = await addSchema(token, data);
                        setIsCreating(false);
                        if (!res.ok) {
                            setCreateError(res.message);
                            return;
                        }
                        setIsCreateOpen(false);
                        await refresh();
                    }}
                />
            </Modal>
        </div>
    );
}
