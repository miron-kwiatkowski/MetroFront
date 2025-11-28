import React, { useState } from 'react';
import { register } from '../api/api';

const RegisterForm: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await register({ name, email, password });
        setMessage(result.message || 'Zarejestrowano!');
    };

    const handleFacebookLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/facebook/redirect`;
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text" placeholder="Imię"
                value={name} onChange={e => setName(e.target.value)}
            />
            <input
                type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Hasło"
                value={password} onChange={e => setPassword(e.target.value)}
            />
            <button
                type="submit">Zarejestruj się
            </button>
            <p>{message}</p>

            <button type="button" onClick={handleFacebookLogin} style={{backgroundColor: '#1877f2', color: 'white', marginTop: '10px'}}>Zaloguj przez Facebook</button>

            <p>{message}</p>
        </form>
    );
};

export default RegisterForm;
