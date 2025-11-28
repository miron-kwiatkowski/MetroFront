import React, { useState, useContext } from 'react';
import { login as apiLogin } from '../api/api';
import { AuthContext } from '../context/AuthContext';

const LoginForm: React.FC = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const result = await apiLogin({ email, password });

            if (result.token && result.user) {
                login(result.token, result.user);
                setMessage('Zalogowano pomyślnie!');
            } else {
                setMessage(result.message || 'Błąd logowania');
            }
        } catch (err) {
            setMessage('Błąd połączenia z serwerem');
            console.error(err);
        }
    };

    const handleFacebookLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/facebook/redirect`;
    };

    return (
        <form onSubmit={handleSubmit} className="login-form">
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
            <button type="submit">Zaloguj się</button>

            <button
                type="button"
                onClick={handleFacebookLogin}
                className="facebook-login-btn"
            >
                Zaloguj przez Facebook
            </button>

            {message && <p className="login-message">{message}</p>}
        </form>
    );
};

export default LoginForm;
