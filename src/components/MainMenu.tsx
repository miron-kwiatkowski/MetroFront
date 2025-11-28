import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const MainMenu: React.FC = () => {
    const { user, logout } = useContext(AuthContext); // pobieramy stan zalogowania i funkcję wyloguj

    return (
        <header>
            <nav>
                <Link to="/">Home</Link>

                {user ? (
                    <>
                        <span>Witaj, {user}</span>
                        <button onClick={logout}>Wyloguj</button>
                        <Link to="/profile">Profil</Link>
                    </>
                ) : (
                    <>
                        <Link to="/login">Logowanie</Link>
                        <Link to="/register">Rejestracja</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

export default MainMenu;
