import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    addUserRole,
    getAdminLogs,
    getSchemas,
    getUsers,
    getUserLogs,
    lockUser,
    removeUserRole,
    unlockUser,
    type AdminUserDto,
    type SchemaDto,
} from '../api/api';

type Tab = 'users' | 'schemas' | 'logs' | 'userLogs';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button className={`tab ${active ? 'tab-active' : ''}`} onClick={onClick} type="button">
            {children}
        </button>
    );
}

function getString(obj: Record<string, unknown>, ...keys: string[]): string {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string' && v.trim() !== '') return v;
    }
    return '';
}

function getBool(obj: Record<string, unknown>, ...keys: string[]): boolean | null {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'boolean') return v;
    }
    return null;
}

export default function AdminPage() {
    const { token } = useContext(AuthContext);
    const [tab, setTab] = useState<Tab>('users');

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [schemas, setSchemas] = useState<SchemaDto[]>([]);

    const [roleUserId, setRoleUserId] = useState('');
    const [roleName, setRoleName] = useState('Admin');

    const [logDate, setLogDate] = useState(() => {
        const d = new Date();
        // yyyy-mm-dd (backend uses string in route)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [logLines, setLogLines] = useState(200);
    const [logText, setLogText] = useState('');

    const [userLogDate, setUserLogDate] = useState('');
    const [userLogLines, setUserLogLines] = useState(200);
    const [userLogText, setUserLogText] = useState('');

    const refreshUsers = async () => {
        if (!token) return;
        setIsLoading(true);
        setMessage('');
        const res = await getUsers(token);
        setIsLoading(false);
        if (!res.ok) {
            setMessage(res.message);
            return;
        }
        setUsers(res.data ?? []);
    };

    const refreshSchemas = async () => {
        if (!token) return;
        setIsLoading(true);
        setMessage('');
        const res = await getSchemas(token);
        setIsLoading(false);
        if (!res.ok) {
            setMessage(res.message);
            return;
        }
        setSchemas(res.data ?? []);
    };

    useEffect(() => {
        if (!token) return;
        void refreshUsers();
        void refreshSchemas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const userIdList = useMemo(() => users.map(u => u.id).filter(Boolean) as string[], [users]);

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
                    <h1>Panel administratora</h1>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => { void refreshUsers(); void refreshSchemas(); }} disabled={isLoading}>
                        Odśwież
                    </button>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: 12 }}>
                <TabButton active={tab === 'users'} onClick={() => setTab('users')}>Użytkownicy ({users.length})</TabButton>
                <TabButton active={tab === 'schemas'} onClick={() => setTab('schemas')}>Schematy ({schemas.length})</TabButton>
                <TabButton active={tab === 'logs'} onClick={() => setTab('logs')}>Logi admin</TabButton>
                <TabButton active={tab === 'userLogs'} onClick={() => setTab('userLogs')}>Moje logi</TabButton>
            </div>

            {message && <div className="alert alert-error">{message}</div>}
            {isLoading && <div className="alert">Ładowanie…</div>}

            {tab === 'users' && (
                <div className="grid">
                    <div className="card card-span-12">
                        <h3>Lista użytkowników</h3>
                        {users.length === 0 ? (
                            <p className="muted">Brak danych albo brak uprawnień.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Email / Nazwa</th>
                                            <th>Blokada</th>
                                            <th>Role</th>
                                            <th>Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => {
                                            const rec = u as Record<string, unknown>;
                                            const id = (u.id ?? getString(rec, 'Id', 'userId')) as string;
                                            const email = getString(rec, 'email', 'Email');
                                            const username = getString(rec, 'username', 'Username', 'name', 'Name');
                                            const locked = getBool(rec, 'isLocked', 'locked', 'IsLocked');
                                            const roles = Array.isArray((rec as any).roles) ? (rec as any).roles.join(', ') : '';
                                            return (
                                                <tr key={id || JSON.stringify(u)}>
                                                    <td className="mono" style={{ wordBreak: 'break-all' }}>{id || '—'}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 800 }}>{email || username || '—'}</div>
                                                        <div className="muted mono">{username && email ? username : ''}</div>
                                                    </td>
                                                    <td>{locked === null ? '—' : (locked ? 'TAK' : 'NIE')}</td>
                                                    <td>{roles || '—'}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                            <button
                                                                className="btn"
                                                                onClick={async () => {
                                                                    if (!id) return;
                                                                    setMessage('');
                                                                    const res = await lockUser(token, id);
                                                                    if (!res.ok) {
                                                                        setMessage(res.message);
                                                                        return;
                                                                    }
                                                                    await refreshUsers();
                                                                }}
                                                            >
                                                                Zablokuj
                                                            </button>
                                                            <button
                                                                className="btn"
                                                                onClick={async () => {
                                                                    if (!id) return;
                                                                    setMessage('');
                                                                    const res = await unlockUser(token, id);
                                                                    if (!res.ok) {
                                                                        setMessage(res.message);
                                                                        return;
                                                                    }
                                                                    await refreshUsers();
                                                                }}
                                                            >
                                                                Odblokuj
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card card-span-12">
                        <h3>Role</h3>
                        <div className="muted">Dodaj lub usuń rolę.</div>
                        <form
                            className="form"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setMessage('');
                                const uid = roleUserId.trim();
                                const rn = roleName.trim();
                                if (!uid || !rn) return;
                                const res = await addUserRole(token, uid, rn);
                                if (!res.ok) {
                                    setMessage(res.message);
                                    return;
                                }
                                await refreshUsers();
                            }}
                        >
                            <div className="form-row">
                                <label>
                                    UserId
                                    <input list="userids" value={roleUserId} onChange={(e) => setRoleUserId(e.target.value)} placeholder="np. 7b1a..." />
                                    <datalist id="userids">
                                        {userIdList.map(id => <option key={id} value={id}>{id}</option>)}
                                    </datalist>
                                </label>
                                <label>
                                    Rola
                                    <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Admin" />
                                </label>
                            </div>
                            <div className="card-actions">
                                <button className="btn btn-primary" type="submit">Dodaj rolę</button>
                                <button
                                    className="btn btn-danger"
                                    type="button"
                                    onClick={async () => {
                                        setMessage('');
                                        const uid = roleUserId.trim();
                                        const rn = roleName.trim();
                                        if (!uid || !rn) return;
                                        const res = await removeUserRole(token, uid, rn);
                                        if (!res.ok) {
                                            setMessage(res.message);
                                            return;
                                        }
                                        await refreshUsers();
                                    }}
                                >
                                    Usuń rolę
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {tab === 'schemas' && (
                <div className="card">
                    <h3>Lista schematów</h3>
                    {schemas.length === 0 ? (
                        <p className="muted">Brak danych.</p>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nazwa</th>
                                        <th>Miasto/Kraj</th>
                                        <th>Widoczność</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schemas.map(s => (
                                        <tr key={s.id}>
                                            <td className="mono">{s.id}</td>
                                            <td>
                                                <div style={{ fontWeight: 900 }}>{s.name}</div>
                                                {s.description ? <div className="muted">{s.description}</div> : null}
                                            </td>
                                            <td className="muted">{s.city}, {s.country}</td>
                                            <td>{s.isPublic ? 'publiczny' : 'prywatny'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'logs' && (
                <div className="grid">
                    <div className="card card-span-5">
                        <h3>Pobierz logi admin</h3>
                        <form
                            className="form"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setMessage('');
                                setLogText('');
                                const res = await getAdminLogs(token, logDate.trim(), logLines);
                                if (!res.ok) {
                                    setMessage(res.message);
                                    return;
                                }
                                setLogText((res.data as unknown as string) ?? '');
                            }}
                        >
                            <label>
                                Data (w URL)
                                <input value={logDate} onChange={(e) => setLogDate(e.target.value)} placeholder="20260124" />
                            </label>
                            <label>
                                Lines
                                <input type="number" min={50} max={5000} value={logLines} onChange={(e) => setLogLines(Number(e.target.value))} />
                            </label>
                            <div className="card-actions">
                                <button className="btn btn-primary" type="submit">Pobierz</button>
                            </div>
                        </form>
                    </div>
                    <div className="card card-span-7">
                        <h3>Wynik</h3>
                        {!logText ? <p className="muted">Brak danych.</p> : (
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }} className="mono">{logText}</pre>
                        )}
                    </div>
                </div>
            )}

            {tab === 'userLogs' && (
                <div className="grid">
                    <div className="card card-span-5">
                        <h3>Pobierz moje logi</h3>
                        <form
                            className="form"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setMessage('');
                                setUserLogText('');
                                const date = userLogDate.trim() === '' ? undefined : userLogDate.trim();
                                const res = await getUserLogs(token, date, userLogLines);
                                if (!res.ok) {
                                    setMessage(res.message);
                                    return;
                                }
                                setUserLogText((res.data as unknown as string) ?? '');
                            }}
                        >
                            <label>
                                Data (query, opcjonalne)
                                <input value={userLogDate} onChange={(e) => setUserLogDate(e.target.value)} placeholder="20260124" />
                            </label>
                            <label>
                                Lines
                                <input type="number" min={50} max={5000} value={userLogLines} onChange={(e) => setUserLogLines(Number(e.target.value))} />
                            </label>
                            <div className="card-actions">
                                <button className="btn btn-primary" type="submit">Pobierz</button>
                            </div>
                        </form>
                    </div>
                    <div className="card card-span-7">
                        <h3>Wynik</h3>
                        {!userLogText ? <p className="muted">Brak danych.</p> : (
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }} className="mono">{userLogText}</pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
