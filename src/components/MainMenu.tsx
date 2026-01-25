import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

export default function MainMenu() {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="topbar">
            <div className="topbar-inner">
                <div className="brand">
                    <div className="brand-badge" />
                    <Link className="brand-title" to="/" aria-label="MetroFront">
                        MetroFront
                    </Link>
                </div>

                <nav className="nav">
                    <Link className="pill" to="/" style={{ color: location.pathname === '/' ? 'var(--text)' : undefined }}>
                        Schematy
                    </Link>

                    {user ? (
                        <>
                            <Link className="pill" to="/statistics" style={{ color: location.pathname === '/statistics' ? 'var(--text)' : undefined }}>
                                Statystyki
                            </Link>
                            <Link className="pill" to="/line-categories" style={{ color: location.pathname === '/line-categories' ? 'var(--text)' : undefined }}>
                                Kategorie linii
                            </Link>
                            <Link className="pill" to="/admin" style={{ color: location.pathname === '/admin' ? 'var(--text)' : undefined }}>
                                Admin
                            </Link>
                        </>
                    ) : null}

                    {user ? (
                        <>
                            <span className="pill" title={user}>Zalogowano</span>
                            <Link className="pill" to="/profile" style={{ color: location.pathname === '/profile' ? 'var(--text)' : undefined }}>
                                Profil
                            </Link>
                            <button className="btn" onClick={toggleTheme} title="Przełącz motyw">
                                {theme === 'dark' ? '☀️ Jasny' : '🌙 Ciemny'}
                            </button>
                            <button className="btn btn-danger" onClick={handleLogout}>Wyloguj</button>
                        </>
                    ) : (
                        <>
                            <button className="btn" onClick={toggleTheme} title="Przełącz motyw">
                                {theme === 'dark' ? '☀️ Jasny' : '🌙 Ciemny'}
                            </button>
                            <Link className="pill" to="/login" style={{ color: location.pathname === '/login' ? 'var(--text)' : undefined }}>
                                Logowanie
                            </Link>
                            <Link className="pill" to="/register" style={{ color: location.pathname === '/register' ? 'var(--text)' : undefined }}>
                                Rejestracja
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
