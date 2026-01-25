import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';

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

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            const payload = decodeJwt(savedToken);
            const exp = payload?.exp;

            if (exp && Date.now() >= exp * 1000) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
                return;
            }

            setToken(savedToken);
            setUser(savedUser);
        }
    }, []);

    const login = (tokenValue: string, userValue: string) => {
        setToken(tokenValue);
        setUser(userValue);
        localStorage.setItem('token', tokenValue);
        localStorage.setItem('user', userValue);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
