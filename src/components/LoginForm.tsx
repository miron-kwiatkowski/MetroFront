import { useContext, useState, type FormEvent } from 'react';
import { login as apiLogin } from '../api/api';
import { AuthContext } from '../context/AuthContext';

type JwtPayload = {
    sub?: string;
    exp?: number;
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

export default function LoginForm() {
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? '';

    const startExternalLogin = (provider: 'facebook' | 'google') => {
        setMessage('');
        setIsLoading(true);


        const authUrl = `${API_URL}/external-auth/${provider}`;

        const width = 520;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            authUrl,
            `${provider}-login`,
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        if (!popup) {
            setIsLoading(false);
            setMessage('Popup został zablokowany. Zezwól na wyskakujące okna dla tej strony.');
            return;
        }

        const startedAt = Date.now();
        const timeoutMs = 2 * 60 * 1000; // 2 min

        const timer = window.setInterval(() => {
            if (popup.closed) {
                window.clearInterval(timer);
                setIsLoading(false);
                setMessage('Logowanie przerwane.');
                return;
            }

            if (Date.now() - startedAt > timeoutMs) {
                window.clearInterval(timer);
                setIsLoading(false);
                try { popup.close(); } catch {
                    // filler comment for waiting
                }
                setMessage('Przekroczono czas logowania.');
                return;
            }

            try {
                const raw = popup.document.body?.innerText?.trim();
                if (!raw) return;

                const parsed = JSON.parse(raw) as { access_token?: string };
                if (!parsed.access_token) return;

                const token = parsed.access_token;
                const payload = decodeJwt(token);
                const userValue = payload?.sub ?? email ?? 'external-user';

                login(token, userValue);

                window.clearInterval(timer);
                setIsLoading(false);
                try { popup.close(); } catch {
                    // filler comment for waiting
                }

                setMessage(`Zalogowano przez ${provider === 'facebook' ? 'Facebook' : 'Google'}!`);
            } catch {
                // filler comment for waiting
            }
        }, 400);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setMessage('');
        setIsLoading(true);
        const result = await apiLogin({ email, password });
        setIsLoading(false);

        if (!result.ok) {
            setMessage(result.message || 'Nie udało się zalogować.');
            return;
        }

        if (!result.data?.access_token) {
            setMessage('Brak access_token w odpowiedzi API.');
            return;
        }

        login(result.data.access_token, email);
        setMessage('Zalogowano!');
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <label>
                Email
                <input
                    type="email"
                    placeholder="np. user@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
            </label>

            <label>
                Hasło
                <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
            </label>

            <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Logowanie…' : 'Zaloguj się'}
            </button>

            <div className="card" style={{ marginTop: 6 }}>
                <h3>Logowanie zewnętrzne</h3>
                <div className="card-actions">
                    <button
                        type="button"
                        onClick={() => startExternalLogin('facebook')}
                        disabled={isLoading}
                        className="btn"
                        style={{ borderColor: 'rgba(24,119,242,0.55)', background: 'rgba(24,119,242,0.16)' }}
                    >
                        Facebook
                    </button>
                    <button
                        type="button"
                        onClick={() => startExternalLogin('google')}
                        disabled={isLoading}
                        className="btn"
                    >
                        Google
                    </button>
                </div>
                <div className="hint">Jeśli popup się nie otwiera, sprawdź blokadę wyskakujących okien.</div>
            </div>

            {message && <div className="alert">{message}</div>}
        </form>
    );
}
