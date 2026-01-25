import { useContext, useState, type FormEvent } from 'react';
import { register } from '../api/api';
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

export default function RegisterForm() {
    const { login } = useContext(AuthContext);

    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '');

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
                try { popup.close(); } catch (err) { void err; }
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
                try { popup.close(); } catch (err) { void err; }

                setMessage(`Zalogowano przez ${provider === 'facebook' ? 'Facebook' : 'Google'}!`);
            } catch {
                // filler comment for waiting
            }
        }, 400);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage('Hasła nie są takie same.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        const result = await register({
            email,
            username,
            firstName,
            lastName,
            password,
            confirmPassword,
        });

        setIsLoading(false);

        if (!result.ok) {
            setMessage(result.message || 'Nie udało się zarejestrować.');
            return;
        }

        setMessage('Zarejestrowano! Możesz się teraz zalogować.');
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
                <label>
                    Nazwa użytkownika
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </label>
            </div>

            <div className="form-row">
                <label>
                    Imię
                    <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Nazwisko
                    <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        required
                    />
                </label>
            </div>

            <div className="form-row">
                <label>
                    Hasło
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Powtórz hasło
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                    />
                </label>
            </div>

            <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Rejestracja…' : 'Zarejestruj'}
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
                <div className="hint">To nie jest osobna rejestracja – po prostu logowanie przez dostawcę.</div>
            </div>

            {message && <div className="alert">{message}</div>}
        </form>
    );
}
