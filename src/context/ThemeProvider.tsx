import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './ThemeContext';

type Props = {
    children: ReactNode;
};

const STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
    const saved = (localStorage.getItem(STORAGE_KEY) ?? '').toLowerCase();
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
}

export function ThemeProvider({ children }: Props) {
    const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem(STORAGE_KEY, t);
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        // CSS reads variables from this attribute
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
