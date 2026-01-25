import { useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext.ts';

type JwtPayload = {
    exp?: number;
    sub?: string;
    [key: string]: unknown;
};

function decodeJwt(token: string): JwtPayload | null {
    try {
        const part = token.split('.')[1];
        if (!part) return null;
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

export default function ProfilePage() {
    const { user, token } = useContext(AuthContext);

    const payload = useMemo(() => (token ? decodeJwt(token) : null), [token]);

    const expText = useMemo(() => {
        const exp = payload?.exp;
        if (!exp) return '—';
        const date = new Date(exp * 1000);
        return date.toLocaleString();
    }, [payload]);

    return (
        <div className="page">
            <div className="card" style={{ maxWidth: 760 }}>
                <h1>Profil</h1>
                <p className="muted">Przy udostępnianiu schematu druga osoba potrzebuje Twojego <b>UserId</b> (poniżej).</p>

                <div className="grid" style={{ marginTop: 10 }}>
                    <div className="card card-span-6">
                        <h3>Email</h3>
                        <div className="mono">{user}</div>
                    </div>
                    <div className="card card-span-6">
                        <h3>UserId (JWT sub)</h3>
                        <div className="mono" style={{ wordBreak: 'break-all' }}>{payload?.sub ?? '—'}</div>
                    </div>
                    <div className="card card-span-12">
                        <h3>Token wygasa</h3>
                        <div className="mono">{expText}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
