import { useState } from 'react';
import type { AddSchemaRequest } from '../../api/api';

type Props = {
    onSubmit: (data: AddSchemaRequest) => Promise<void> | void;
    isLoading?: boolean;
    error?: string;
};

export default function AddSchemaForm({ onSubmit, isLoading, error }: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    return (
        <form
            className="form"
            onSubmit={async (e) => {
                e.preventDefault();
                await onSubmit({ name, description, city, country, isPublic });
            }}
        >
            <div className="form-row">
                <label>
                    Nazwa
                    <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                    Widoczność
                    <select value={isPublic ? 'public' : 'private'} onChange={(e) => setIsPublic(e.target.value === 'public')}>
                        <option value="private">Prywatny</option>
                        <option value="public">Publiczny</option>
                    </select>
                </label>
            </div>

            <div className="form-row">
                <label>
                    Miasto
                    <input value={city} onChange={(e) => setCity(e.target.value)} required />
                </label>
                <label>
                    Kraj
                    <input value={country} onChange={(e) => setCountry(e.target.value)} required />
                </label>
            </div>

            <label>
                Opis
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card-actions">
                <button className="btn btn-primary" type="submit" disabled={isLoading}>
                    {isLoading ? 'Zapisywanie…' : 'Utwórz schemat'}
                </button>
            </div>
        </form>
    );
}
