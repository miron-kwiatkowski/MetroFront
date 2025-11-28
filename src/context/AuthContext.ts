import { createContext } from 'react';

export interface AuthContextType {
    user: string | null;
    token: string | null;
    login: (token: string, user: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => {},
    logout: () => {}
});