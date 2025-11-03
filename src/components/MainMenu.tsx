import React from 'react';
import { Link } from 'react-router-dom';

const MainMenu: React.FC = () => {
    return (
        <header>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/login">Logowanie</Link>
                <Link to="/register">Rejestracja</Link>
            </nav>
        </header>
    );
};

export default MainMenu;
