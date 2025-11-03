import React, { useState } from 'react';
import { login } from '../api/api';

const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await login({email, password});
        setMessage(result.message || 'Zalogowano!');
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit">Zaloguj się</button>
            <p>{message}</p>
        </form>
    );
};

export default LoginForm;
